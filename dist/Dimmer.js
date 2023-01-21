"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Dimmer = void 0;
/**
 * This class is a simple KAKU dimmer / switch connected to your ics 2000. This lightbulb can only turn of and on, and dim
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
            const newState = newValue;
            const currentState = this.service.getCharacteristic(this.platform.Characteristic.On).value;
            this.logger.debug('Current state is ' + currentState);
            // Only send a command to the ics-2000 if the state is changed
            // The is necessary, otherwise dimming a light doesn't work because HomeKit sends an on command and a dim command at the same time
            // And the ics-2000 can't handle multiple messages received at the same time
            if (newState !== currentState) {
                await this.hub.turnDeviceOnOff(this.deviceId, newValue, this.onOffCharacteristicFunction);
                this.platform.logger.debug(`Changed state to ${newValue} on ${this.deviceName}`);
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
            const status = (await this.hub.getDeviceStatus(this.deviceId))[this.onOffCharacteristicFunction];
            this.platform.logger.debug(`Current state for ${this.deviceName}: ${status}`);
            return status;
        }
        catch (e) {
            this.platform.logger.error(`Error getting state for ${this.deviceName}: ${e}`);
            throw new this.platform.api.hap.HapStatusError(-70402 /* SERVICE_COMMUNICATION_FAILURE */);
        }
    }
    
    async getBrightness() {
        try {
            const status = (await this.hub.getDeviceStatus(this.deviceId))[this.dimCharacteristicFunction];
            //this.logger.debug(`Current brighness for ${this.deviceName}: ${status}`);
            var nice_status = Math.round(status / 15)*100; //transform to scale 1-100
            this.logger.debug(`Current Dimmer brightness for ${this.deviceName}: ${status}`);
            return Math.min(nice_status,100);
        }
        catch (e) {
            this.logger.error(`Error getting brightness for ${this.deviceName}: ${e}`);
            throw new this.platform.api.hap.HapStatusError(-70402 /* SERVICE_COMMUNICATION_FAILURE */);
        }
    }
    async changeBrightness(newValue) { //usr/local/homebridge/node_modules/hap-nodejs/dist/lib/definitions/ServiceDefinitions.js
        try {
            this.logger(`Dimmer Brightness for ${this.deviceName} changed: ${newValue}`);
            const currentDimValue = (await this.hub.getDeviceStatus(this.deviceId))[this.dimCharacteristicFunction];
            var deviceValue = Math.round(newValue * 0.15); //convert to scale of device
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
