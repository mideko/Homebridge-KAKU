"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Dimmer = void 0;
/**
 * This class is a simple KAKU dimmer / switch connected to your ics 2000. This accessory can only turn of and on, and dim
 */

const {Light} = require("./Light");
class Dimmer extends Light {
    constructor(platform, accessory) {
        super(platform, accessory);
        this.dimCharacteristicFunction = 1;
        this.service.getCharacteristic(this.platform.Characteristic.Brightness)
            .onGet(this.getBrightness.bind(this))
            .onSet(this.changeBrightness.bind(this))
            // KAKU uses a value from 0 to 15 for the dim value, but we set 0-100 as min en max values, because it looks better
            .setProps({
            minValue: 0,
            maxValue: 100,
        });
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
            this.logger.info(`${this.deviceName} - Dimmer Brightness changed to: ${newValue}`);
            let currentDimValue = (await this.hub.getDeviceStatus(this.deviceId))[this.dimCharacteristicFunction];
            let deviceValue = Math.round(newValue * 0.15); //convert to scale of device
            //if (deviceValue !== currentDimValue) {
            await this.hub.dimDevice(this.deviceId, this.dimCharacteristicFunction, deviceValue);
            //}
        }
        catch (e) {
            this.logger.error(`Error changing brightness for ${this.deviceName}: ${e}`);
            throw new this.platform.api.hap.HapStatusError(-70402 /* SERVICE_COMMUNICATION_FAILURE */);
        }
    }
}
exports.Dimmer = Dimmer;
//# sourceMappingURL=LightBulb.js.map
