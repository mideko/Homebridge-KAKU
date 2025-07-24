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
const {Pushbutton} = require("./Pushbutton");
const ReloadSwitch = require("./ReloadSwitch");
const node_schedule = __importDefault(require("node-schedule"));
const KAKU_devices = require("./types.json");
//publish to MQTT
const publisher_1 = require("./publisher");



class KAKUPlatform {
    constructor(logger, config, api) {
        var _a;
        this.logger = logger;
        this.config = config;
        this.scenes = config.scenes;
        this.api = api;
        this.Service = this.api.hap.Service;
        this.Characteristic = this.api.hap.Characteristic;
        this.cachedAccessories = [];
        this.logger.debug('Finished initializing platform:', this.config.name);
        this.publisher = new publisher_1.Publisher(config.mqtt, KAKU_devices, this.logger);
        
        //this.logger.info(KAKU_devices);
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
        this.hub = new Hub.Hub(email, password, deviceBlacklist, localBackupAddress,logger,config);
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
            .catch((error) => this.logger.error('Error discovering devices: ', error));
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
          case 0: //0 = ignore
            break;
          case 1: // 1 is on/off switch
            new LightBulb(this, accessory);
            //to do: create settings to choose display as switch or as lightbulb per item
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
          case 5: //5 = scene
            new Pushbutton(this, accessory);
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
          default: // assume it is a lightbulb
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
        //refresh scenes from config
        this.scenes = this.config.scenes;
        //this.logger.info(this.scenes);
        for (const device of foundDevices) {

            //prepare data for scenes to be paired to one switch
            const data = device['data'];
            //this.logger.info(device);
            if ('scene' in data) {
                device['device'] = 0; //ignore unless....
                const sceneName = device['data']['scene']['name'];
                const scene_idx = this.scenes.findIndex(item => item.valueON === sceneName || item.valueOFF === sceneName);
                //this.logger.info(sceneName, scene_idx);
                if (scene_idx != -1) {
                    // match found
                    if (this.scenes[scene_idx].valueON === sceneName) {
                        this.scenes[scene_idx].idON = device['id'];
                    }
                    if (this.scenes[scene_idx].valueOFF === sceneName) {
                        this.scenes[scene_idx].idOFF = device['id'];
                    }
                    if (this.scenes[scene_idx].idON != "" && this.scenes[scene_idx].idOFF != "") {
                        //both id's present, use this device as accessory
                        device['device'] = 5;
                        device['name'] = this.scenes[scene_idx].name;
                        //this.logger.info(this.scenes[scene_idx].idON + " - " + this.scenes[scene_idx].idOFF);
                    }
                }
            } // end of scene in data
            let uuid = this.api.hap.uuid.generate(device['id']);
            const existingAccessory = this.cachedAccessories.find(accessory => accessory.UUID === uuid);
            //find the device type reference info
          
            let type_idx = KAKU_devices.types.findIndex(item => item.id == device.device);
            //this.logger.info(type_idx);
            // Create the accessory
            if (existingAccessory) {
                if (KAKU_devices.types[type_idx].supported) {
                    this.createDevice(existingAccessory, device['device']);
                    this.logger.info(`Loaded device from cache: ${existingAccessory.context.name}, type: ${device['device']} - `+ KAKU_devices.types[device.device].type);
                }
                else {
                    this.logger.warn(`Ignored: ${existingAccessory.context.name}, type: ${device['device']} - `+ KAKU_devices.types[device.device].type + " -[not supported]");
                }
                
            }
            else {
                
                let deviceName = device['name'];
                if (device['device'] > 0) {
                    const accessory = new this.api.platformAccessory(deviceName, uuid);
                    // store a copy of the device object in the `accessory.context`
                    accessory.context.device = device;
                    accessory.context.name = deviceName;
                
                    if (device['device'] == 5 ) {
                        const scene_idx = this.scenes.findIndex((item) => item.name === deviceName);
                        //save id's of scenes to use for switch
                        accessory.context.sceneON = this.scenes[scene_idx].idON;
                        accessory.context.sceneOFF = this.scenes[scene_idx].idOFF;
                    }
                    //this.logger.info(accessory.context);
                    if (KAKU_devices.types[type_idx].supported) {
                        this.createDevice(accessory, device['device']);
                        this.logger.info(`Loaded new device: ${deviceName}, type: ${device['device']} - ` + KAKU_devices.types[device.device].type);
                        this.api.registerPlatformAccessories(settings.PLUGIN_NAME, settings.PLATFORM_NAME, [accessory]);
                    }
                    else {
                        this.logger.warn(`Ignored: ${deviceName}, type: ${device['device']} - ` + KAKU_devices.types[device.device].type+ " -[not supported]");
                    }
                }
                else {
                    this.logger.debug(`Ignored new device: ${deviceName}, type: ${device['device']}`);
                }
            }
            //this.logger.info(KAKU_devices.types[device.device].type);
        }
    }
    /**
     * Create a reload switch, so you can rerun the setup without touching homebridge
     * @private
     */
    createReloadSwitch() {
        let uuid = this.api.hap.uuid.generate(settings.RELOAD_SWITCH_NAME);
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



