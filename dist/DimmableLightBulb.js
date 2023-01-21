"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DimmableLightBulb = void 0;
const {LightBulb} = require("./LightBulb");
class DimmableLightBulb extends LightBulb {
    constructor(platform, accessory) {
        super(platform, accessory);
        // The Function for turning a dimmable lightbulb on or off is 3
        this.onOffCharacteristicFunction = 3;
        this.dimCharacteristicFunction = 4; //4
        this.colorCharacteristicFunction = 5; //not implemented
        this.lighttempCharacteristicFunction = 6; //not implemented
        this.service.getCharacteristic(this.platform.Characteristic.Brightness)
            .onGet(this.getBrightness.bind(this))
            .onSet(this.changeBrightness.bind(this))
            // KAKU uses a value from 0 to 255 for the dim value, so we set 0-100 as min en max values, because it looks better
            .setProps({
                minValue: 0,
                maxValue: 255,
                });

    }
    async getBrightness() {
        try {
            const status = (await this.hub.getDeviceStatus(this.deviceId))[this.dimCharacteristicFunction];
            this.logger.debug(`${this.deviceName} - current Brightness for : ${status}`);
            var nice_status = Math.round(status / 255)*100; //transform to scale 1-100
            //this.logger(`Current brightness for ${this.deviceName}: ${nice_status}`);
            return Math.min(status,255);
        }
        catch (e) {
            this.logger.error(`Error getting brightness for ${this.deviceName}: ${e}`);
            throw new this.platform.api.hap.HapStatusError(-70402 /* SERVICE_COMMUNICATION_FAILURE */);
        }
    }
    async changeBrightness(newValue) { //usr/local/homebridge/node_modules/hap-nodejs/dist/lib/definitions/ServiceDefinitions.js
        try {
            this.logger.debug(`${this.deviceName} - Brightness changed: ${newValue}`);
            //const currentDimValue = (await this.hub.getDeviceStatus(this.deviceId))[this.dimCharacteristicFunction];
            var displayValue = Math.min(100,Math.round(newValue / 2.55)); //convert to scale of device
            //if (deviceValue !== currentDimValue) {
            this.logger(`${this.deviceName}- Brightness changed to ` + displayValue + ` %`);
            await this.hub.dimDevice(this.deviceId, 4, newValue);
            //}
        }
        catch (e) {
            this.logger(`Error changing brightness for ${this.deviceName}: ${e}`);
            throw new this.platform.api.hap.HapStatusError(-70402 /* SERVICE_COMMUNICATION_FAILURE */);
        }
    }

}
exports.DimmableLightBulb = DimmableLightBulb;
//# sourceMappingURL=DimmableLightBulb.js.map


