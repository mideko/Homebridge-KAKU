"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Outlet = void 0;
/**
 * This class is a  KAKU or other zigbee outlet connected to your ics 2000. This outlet can only turn off and on
 */
class Outlet {
    constructor(platform, accessory) {
        this.platform = platform;
        this.accessory = accessory;
        // The index of the function to use when you turn a device on/off
        this.onOffCharacteristicFunction = 3;
        this.deviceData = accessory.context.device;
        this.deviceName = accessory.context.name;
        this.deviceId = Number(this.deviceData.id);
        this.hub = platform.hub;
        this.logger = platform.logger;
        this.accessory.getService(this.platform.Service.AccessoryInformation)
            .setCharacteristic(this.platform.Characteristic.Manufacturer, 'Klik Aan Klik Uit')
            .setCharacteristic(this.platform.Characteristic.SerialNumber, this.deviceId.toString());
        this.service = this.accessory.getService(this.platform.Service.Outlet) || this.accessory.addService(this.platform.Service.Outlet);
        this.service.getCharacteristic(this.platform.Characteristic.On)
            .onSet(this.setOnOff.bind(this))
            .onGet(this.getOnOff.bind(this));
        //subscribe to MQTT topic for state updates
        const { mqtt } = this.platform.config;
        if (mqtt) {
            this.subscribe(this.deviceName);
        }
    }
    
    async subscribe(subTopic) {
        try {
            //subscribe to topic in MQTT and pass callback for when new message is received in Q
            this.platform.publisher.subscribe(subTopic, this, this.messenger);
        }
        catch (e) {
            this.logger.error(`Error subscribing to ${subTopic}: ${e}`);
            //throw new this.platform.api.hap.HapStatusError(-70402); /* SERVICE_COMMUNICATION_FAILURE */
        }
    }
    
    //handle message from MQTT (callback)
    async messenger(thisDevice,topic,payload) {
        try {
            thisDevice.logger.debug(`MQTT: ${topic} was set to ${payload}`);
            if (payload != thisDevice.accessory.context.lastValue ) {
                //update device state to homekit based on MGTT trigger
                thisDevice.service.getCharacteristic(thisDevice.platform.Characteristic.On).updateValue(payload);
                //change ICS device state based on MGTT trigger
                await thisDevice.hub.turnDeviceOnOff(thisDevice.deviceId, Number(payload), thisDevice.onOffCharacteristicFunction);
                thisDevice.accessory.context.lastValue = payload;
                thisDevice.logger.info(`${thisDevice.accessory.context.name} - MQTT message received: ${payload}`);
            }
        }
        catch (e) {
            thisDevice.logger.error(`Error in messenger of ${topic}: ${e}`);
            //throw new this.platform.api.hap.HapStatusError(-70402); /* SERVICE_COMMUNICATION_FAILURE */
        }
    }
    

    
    async setOnOff(newState) {
        try {
            let newValue = newState ? 1: 0;
            this.accessory.context.switchState = newState ? "ON": "OFF";
            let currentValue = this.service.getCharacteristic(this.platform.Characteristic.On).value;
            this.platform.logger.debug(`${this.deviceName} - Current ON/OFF value is ${currentValue}`);
 
            if (newValue !== currentValue) {
                await this.hub.turnDeviceOnOff(this.deviceId, newValue, this.onOffCharacteristicFunction);
                this.platform.logger.info(`${this.deviceName} - Changed state to ${this.accessory.context.switchState}`);
                this.accessory.context.lastValue = newValue;
            }
        }
        catch (e) {
            this.platform.logger.error(`Error changing state for ${this.deviceName}: ${e}`);
            throw new this.platform.api.hap.HapStatusError(-70402); /* SERVICE_COMMUNICATION_FAILURE */
        }
    }
    async getOnOff() {
        try {
            // Get status for this device
            let status = (await this.hub.getDeviceStatus(this.deviceId))[this.onOffCharacteristicFunction];
            this.accessory.context.switchState = status == 1 ? "ON": "OFF";
            this.platform.logger.debug(`${this.deviceName} - Current state: ${this.accessory.context.switchState}`);
            let currentState = status == 1 ? true: false;
            return currentState;
        }
        catch (e) {
            this.platform.logger.error(`Error getting state for ${this.deviceName}: ${e}`);
            throw new this.platform.api.hap.HapStatusError(-70402); /* SERVICE_COMMUNICATION_FAILURE */
        }
    }
}
exports.Outlet = Outlet;


/*
public static final int INDEX COLOR HUE_TRANSITION = 12;
public static final int INDEX COLOR_ LOOP = 11;
public static final int INDEX COLOR POINTER = 10;
public static final int INDEX_COLOR_TEMPERATURE = 9;
public static final int INDEX COLOR XY = 5;
public static final int INDEX DIM = 4;
public static final int INDEX_ GROUP = 2;
public static final int INDEX HUE = 6;
public static final int INDEX HUE SATURATION = 8;
public static final int INDEX LIGHTNESS = 7;
public static final int INDEX ON OFF = 3;
*/
