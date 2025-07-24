"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DimmableLightBulb = void 0;
const {LightBulb} = require("./LightBulb");
class DimmableLightBulb extends LightBulb {
    constructor(platform, accessory) {
        super(platform, accessory);
        // The Function for turning a dimmable zigbee lightbulb on or off is 3
        this.onOffCharacteristicFunction = 3;
        this.dimCharacteristicFunction = 4; //4
        //this.colorCharacteristicFunction = 5; //not implemented here
        //this.lighttempCharacteristicFunction = 6; //not implemented here
        // KAKU uses a value from 0 to 255 for the dim value, but we set 0-100 as min en max values, because it looks better
        this.service.getCharacteristic(this.platform.Characteristic.Brightness)
            .onGet(this.getBrightness.bind(this))
            .onSet(this.changeBrightness.bind(this))
            .setProps({
                minValue: 0,
                maxValue: 100,
                });

    }1
    async getBrightness() {
        try {
            let device_value = (await this.hub.getDeviceStatus(this.deviceId))[this.dimCharacteristicFunction];
            this.logger.debug(`${this.deviceName} - current brightness from device: ${device_value}`);
            let nice_status = Math.round((device_value / 255)*100); //transform to scale 1-100
            this.logger.debug(`${this.deviceName} - current brightness: ${nice_status} %`);
            return Math.min(nice_status,100);
        }
        catch (e) {
            this.logger.error(`Error getting brightness for ${this.deviceName}: ${e}`);
            throw new this.platform.api.hap.HapStatusError(-70402 /* SERVICE_COMMUNICATION_FAILURE */);
        }
    }
    async changeBrightness(newValue) { //usr/local/homebridge/node_modules/hap-nodejs/dist/lib/definitions/ServiceDefinitions.js
        try {
            this.logger.debug(`${this.deviceName} - Brightness changed to ` + newValue + ` %`);
            await this.hub.dimDevice(this.deviceId, 4, Math.round(newValue*2.55));
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


