"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.KAKUPlatform = void 0;
const Hub = require("./Hub");
const {LightBulb} = require("./LightBulb");
const {Switch} = require("./Switch");
const {Shutter} = require("./Shutter");
const {TempSensor} = require("./TempSensor");
const {HumSensor} = require("./HumSensor");
const {MotionSensor} = require("./MotionSensor");
const {SmokeSensor} = require("./SmokeSensor");
const settings = require("./settings");
const {DimmableLightBulb} = require("./DimmableLightBulb");
const {DimmableLightBulbTemp} = require("./DimmableLightBulbTemp");
const {DimmableLightBulbRGB} = require("./DimmableLightBulbRGB");
const {Dimmer} = require("./Dimmer");
const ReloadSwitch = require("./ReloadSwitch");
const node_schedule = __importDefault(require("node-schedule"));
const KAKU_devices = require("./types.json");


class KAKUPlatform {
    constructor(logger, config, api) {
        var _a;
        this.logger = logger;
        this.config = config;
        this.api = api;
        this.Service = this.api.hap.Service;
        this.Characteristic = this.api.hap.Characteristic;
        this.cachedAccessories = [];
        this.logger.debug('Finished initializing platform:', this.config.name);
        const { email, password } = config;
        if (!email || !password) {
            throw new Error('Email and/ or password missing');
        }
        const deviceBlacklist = (_a = config.deviceBlacklist) !== null && _a !== void 0 ? _a : [];
        if (deviceBlacklist.length > 0) {
            this.logger.debug('Blacklist contains ${deviceBlacklist.length} devices: ${deviceBlacklist}');
        }
        const { localBackupAddress } = config;
        if (localBackupAddress) {
            this.logger.debug('Using ${localBackupAddress} as backup ip');
        }
        // Create a new Hub that's used in all accessories
        this.hub = new Hub.Hub(email, password, deviceBlacklist, localBackupAddress,logger);
        // When this event is fired it means Homebridge has restored all cached accessories from disk.
        // Dynamic Platform plugins should only register new accessories after this event was fired,
        // in order to ensure they weren't added to homebridge already. This event can also be used
        // to start discovery of new accessories.
        this.api.on('didFinishLaunching', () => {
            this.setup();
            this.createReloadSwitch();
            
            // Rerun the setup every day so that the devices listed in HomeKit are up-to-date, the AES key for the command is up-to-date and
            // The local ip-address of your ics-2000 is up-to-date
            node_schedule.default.scheduleJob('0 0 * * *', () => {
                this.logger.info('Rerunning setup as scheduled');
                this.setup();
            });
        });
        
    }
    setup() {
        this.logger.info('Setup called!');
        this.hub.login()
            .catch(error => this.logger.error('Error logging in: ${error}'))
            .then(() => this.discoverDevices())
            .catch((error) => this.logger.error('Error discovering devices: ${error}'));
    }
    configureAccessory(accessory) {
        this.logger.debug('Loading accessory from cache:', accessory.displayName);
        this.cachedAccessories.push(accessory);
    }
    /**
     * Create a new instance of a device
     * @param accessory The accessory object you want to create a new Device with
     * @param deviceType The device type, this is stored in device json as followed: data->module->device
     * but also stored as device key in the device object itself (see Hub.ts)
     * @private
     * ignoring anything that is not a receiver
     */
    createDevice(accessory, deviceType) {
        switch (deviceType) {
          case 48: // 48 is dimmable group
            break;
          case 1: // 1 is on/off switch
            new LightBulb(this, accessory);
            //to do: create settings to choose display as swtich or as lightbulb per item
            break;
          case 2: // 2 is dimmer switch
            new Dimmer(this, accessory);
            break;
          case 3: // 3 is shutter switch (up/down)
            new Shutter(this, accessory);
            break;
          case 4: // 4 is motion sensor
            new MotionSensor(this, accessory);
            break;
          case 7: // 7 is fysical switch (sender)
            //ignore
            break;
          case 12: // 12 is remote
            //ignore
            break;
          case 15: // 15 is dusk sensor
            //ignore
            break;
          case 16: // 16 is remote with dimmer
            //ignore
            break;
          case 34: // is zigbee dimmable  bulb
            new DimmableLightBulb(this, accessory);
            break;
          case 35: // is zigbee dimmable colour bulb (hue)
            new DimmableLightBulbRGB(this, accessory);
            break;
          case 36: // is zigbee dimmable bulb with white color temp
            new DimmableLightBulbTemp(this, accessory);
            break;
          case 40: // 40 is a zigbee lightbulb
            new LightBulb(this, accessory);
            break;
          case 41: // 41 is a zigbee switched wall plug
            new Switch(this, accessory);
            break;
          case 43: // 43 is zigbee smoke sensor
            new SmokeSensor(this, accessory);
            break;
          case 46: // 46 is zigbee temperature / humidity sensor
            new TempSensor(this, accessory);
            new HumSensor(this, accessory);
            break;
          default: // 1 is switch
            new LightBulb(this, accessory);
        }
    }
    async discoverDevices() {
        // Search hub and pull devices from the server
        this.logger.info('Searching hub');
        const hubIp = await this.hub.discoverHubLocal(10000, this.logger);
        this.logger.info(`Found hub: ${hubIp}`);
        this.logger.info('Pulling devices from the server');
        const foundDevices = await this.hub.pullDevices();
        this.logger.info(`Found ${foundDevices.length} devices`);
        
        for (const device of foundDevices) {
            const uuid = this.api.hap.uuid.generate(device['id']);
            const existingAccessory = this.cachedAccessories.find(accessory => accessory.UUID === uuid);
            // Create the accessory
            if (existingAccessory) {
                this.createDevice(existingAccessory, device['device']);
                if (KAKU_devices.types[device.device].supported) {
                    this.logger.info(`Loaded device from cache: ${existingAccessory.context.name}, type: ${device['device']} - `+ KAKU_devices.types[device.device].type);
                }
                else {
                    this.logger.warn(`Loaded device from cache: ${existingAccessory.context.name}, type: ${device['device']} - `+ KAKU_devices.types[device.device].type + " -[not supported]");
                }
                
            }
            else {
                const deviceName = device['name'];
                const accessory = new this.api.platformAccessory(deviceName, uuid);
                // store a copy of the device object in the `accessory.context`
                accessory.context.device = device;
                accessory.context.name = deviceName;
                this.createDevice(accessory, device['device']);
                if (KAKU_devices.types[device.device].supported) {
                    this.logger.info(`Loaded new device: ${deviceName}, type: ${device['device']} - ` + KAKU_devices.types[device.device].type);}
                else {
                    this.logger.warn(`Loaded new device: ${deviceName}, type: ${device['device']} - ` + KAKU_devices.types[device.device].type+ " -[not supported]");}
                //this.logger.info(KAKU_devices[device].type);
                this.api.registerPlatformAccessories(settings.PLUGIN_NAME, settings.PLATFORM_NAME, [accessory]);
            }
            //this.logger.info(KAKU_devices.types[device.device].type);
        }
    }
    /**
     * Create a reload switch, so you can rerun the setup without touching homebridge
     * @private
     */
    createReloadSwitch() {
        const uuid = this.api.hap.uuid.generate(settings.RELOAD_SWITCH_NAME);
        const existingAccessory = this.cachedAccessories.find(accessory => accessory.UUID === uuid);
        if (existingAccessory) {
            new ReloadSwitch.ReloadSwitch(this, existingAccessory);
        }
        else {
            const reloadSwitchAccessory = new this.api.platformAccessory(settings.RELOAD_SWITCH_NAME, uuid);
            new ReloadSwitch.ReloadSwitch(this, reloadSwitchAccessory);
            this.api.registerPlatformAccessories(settings.PLUGIN_NAME, settings.PLATFORM_NAME, [reloadSwitchAccessory]);
        }
        this.logger.info('Created reload switch');
    }
    
}
exports.KAKUPlatform = KAKUPlatform;



