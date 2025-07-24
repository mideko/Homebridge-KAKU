"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Dimmer = void 0;
/**
 * This class is a simple KAKU dimmer / switch connected to your ics 2000. This accessory can only turn of and on, and dim
 */
class Dimmer {
    constructor(platform, accessory) {
        this.platform = platform;
        this.accessory = accessory;
        // The index the status for on/off is stored and the function to use when you turn a device on/off
        this.onOffCharacteristicFunction = 0;
        this.dimCharacteristicFunction = 1;
        this.deviceData = accessory.context.device;
        this.deviceName = accessory.context.name;
        this.deviceId = Number(this.deviceData.id);
        this.hub = platform.hub;
        this.logger = platform.logger;
        this.accessory.getService(this.platform.Service.AccessoryInformation)
            .setCharacteristic(this.platform.Characteristic.Manufacturer, 'Klik Aan Klik Uit')
            .setCharacteristic(this.platform.Characteristic.SerialNumber, this.deviceId.toString());
        this.service = this.accessory.getService(this.platform.Service.Lightbulb) || this.accessory.addService(this.platform.Service.Lightbulb);
        this.service.getCharacteristic(this.platform.Characteristic.On)
            .onSet(this.setOn.bind(this))
            .onGet(this.getOn.bind(this));
        this.service.getCharacteristic(this.platform.Characteristic.Brightness)
            .onGet(this.getBrightness.bind(this))
            .onSet(this.changeBrightness.bind(this))
            // KAKU uses a value from 0 to 15 for the dim value, but we set 0-100 as min en max values, because it looks better
            .setProps({
            minValue: 0,
            maxValue: 100,
        });
    }
    async setOn(newValue) {
        try {
            let newState = newValue ? 1 : 0;
            let currentValue = this.service.getCharacteristic(this.platform.Characteristic.On).value;
            this.logger.debug(`${this.deviceName} - current state is ${currentValue}`);
            // Only send a command to the ics-2000 if the state is changed
            // The is necessary, otherwise dimming a light doesn't work because HomeKit sends an on command and a dim command at the same time
            // And the ics-2000 can't handle multiple messages received at the same time
            if (newValue !== currentValue) {
                await this.hub.turnDeviceOnOff(this.deviceId, newState, this.onOffCharacteristicFunction);
                this.accessory.context.switchState= newValue ? "ON": "OFF";
                this.platform.logger.debug(`${this.deviceName} - Changed state to ${this.accessory.context.switchState}`);
            }
        }
        catch (e) {
            this.platform.logger.error(`Error changing state for ${this.deviceName}: ${e}`);
            throw new this.platform.api.hap.HapStatusError(-70402 /* SERVICE_COMMUNICATION_FAILURE */);
        }
    }
    async getOn() {
        try {
            // Get status for this device
            let status = (await this.hub.getDeviceStatus(this.deviceId))[this.onOffCharacteristicFunction];
            this.accessory.context.switchState= status == 1 ? "ON": "OFF";
            this.platform.logger.debug(`${this.deviceName} - Current state: ${this.accessory.context.switchState}`);
            let currentState = status == 1 ? true: false;
            return currentState;
        }
        catch (e) {
            this.platform.logger.error(`Error getting state for ${this.deviceName}: ${e}`);
            throw new this.platform.api.hap.HapStatusError(-70402 /* SERVICE_COMMUNICATION_FAILURE */);
        }
    }
    
    async getBrightness() {
        try {
            let status = (await this.hub.getDeviceStatus(this.deviceId))[this.dimCharacteristicFunction];
            //this.logger.debug(`Current brighness for ${this.deviceName}: ${status}`);
            let nice_status = Math.round(status / 15)*100; //transform to scale 1-100
            this.logger.debug(`${this.deviceName} - Current Dimmer brightness: ${status}`);
            return Math.min(nice_status,100);
        }
        catch (e) {
            this.logger.error(`Error getting brightness for ${this.deviceName}: ${e}`);
            throw new this.platform.api.hap.HapStatusError(-70402 /* SERVICE_COMMUNICATION_FAILURE */);
        }
    }
    async changeBrightness(newValue) { //usr/local/homebridge/node_modules/hap-nodejs/dist/lib/definitions/ServiceDefinitions.js
        try {
            this.logger(` ${this.deviceName} - Dimmer Brightness changed to: ${newValue}`);
            let currentDimValue = (await this.hub.getDeviceStatus(this.deviceId))[this.dimCharacteristicFunction];
            let deviceValue = Math.round(newValue * 0.15); //convert to scale of device
            //if (deviceValue !== currentDimValue) {
            await this.hub.dimDevice(this.deviceId, this.dimCharacteristicFunction, deviceValue);
            //}
        }
        catch (e) {
            this.logger(`Error changing brightness for ${this.deviceName}: ${e}`);
            throw new this.platform.api.hap.HapStatusError(-70402 /* SERVICE_COMMUNICATION_FAILURE */);
        }
    }
}
exports.Dimmer = Dimmer;
//# sourceMappingURL=LightBulb.js.map
