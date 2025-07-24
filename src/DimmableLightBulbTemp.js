"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DimmableLightBulbTemp = void 0;
const {DimmableLightBulb} = require("./DimmableLightBulb");
class DimmableLightBulbTemp extends DimmableLightBulb {
    constructor(platform, accessory) {
        super(platform, accessory);
        // The Function for turning a dimmable lightbulb on or off is 3
        //this.onOffCharacteristicFunction = 3;
        //this.dimCharacteristicFunction = 4; //4
        //this.colorCharacteristicFunction = 5; //not implemented
        this.lightTempCharacteristicFunction = 9; //yes
        this.service.getCharacteristic(this.platform.Characteristic.ColorTemperature)
            .onGet(this.getColorTemp.bind(this))
            .onSet(this.changeColorTemp.bind(this))
            // KAKU uses a value from 0 to 600 for the temp value,
            .setProps({
                minValue: 0,
                maxValue: 600,
                });

    }
    async getColorTemp() {
        try {
            let status = (await this.hub.getDeviceStatus(this.deviceId))[this.lightTempCharacteristicFunction];
            this.logger.debug(`${this.deviceName} - Current light temperature: ${status}`);
            let nice_status = Math.round(status / 6); //transform to scale 1-100
            //this.logger(`Current brightness for ${this.deviceName}: ${nice_status}`);
            return Math.min(status,600);
        }
        catch (e) {
            this.logger.error(`Error getting brightness for ${this.deviceName}: ${e}`);
            throw new this.platform.api.hap.HapStatusError(-70402 /* SERVICE_COMMUNICATION_FAILURE */);
        }
    }
    async changeColorTemp(newValue) { //usr/local/homebridge/node_modules/hap-nodejs/dist/lib/definitions/ServiceDefinitions.js
        try {
            this.logger.debug(`${this.deviceName} - Light Temperature (input): ${newValue}`);
            //const currentDimValue = (await this.hub.getDeviceStatus(this.deviceId))[this.dimCharacteristicFunction];
            let displayValue = Math.min(100,Math.round(newValue / 6)); //convert to scale of device
            //if (deviceValue !== currentDimValue) {
            this.logger.debug(`${this.deviceName} - Light Temperature changed to ` + displayValue + ` %`);
            await this.hub.updateDevice(this.deviceId, 9, newValue);
            //}
        }
        catch (e) {
            this.logger(`Error changing brightness for ${this.deviceName}: ${e}`);
            throw new this.platform.api.hap.HapStatusError(-70402 /* SERVICE_COMMUNICATION_FAILURE */);
        }
    }

}
exports.DimmableLightBulbTemp = DimmableLightBulbTemp;
//# sourceMappingURL=DimmableLightBulb.js.map


