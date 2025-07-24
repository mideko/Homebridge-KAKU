"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HumSensor = void 0;
/**
 * This class is a simple KAKU or other zigbee sensor connected to your ics 2000. This sensor can only give status
 */
class HumSensor {
    constructor(platform, accessory) {
        this.platform = platform;
        this.accessory = accessory;
        // The index the status for on/off is stored and the function to use when you turn a device on/off
        //this.tempCharacteristicFunction = 4; // temperature
        this.humCharacteristicFunction = 11; // humidity
        this.deviceData = accessory.context.device;
        this.deviceName = accessory.context.name;
        this.deviceId = Number(this.deviceData.id);
        this.hub = platform.hub;
        this.logger = platform.logger;
        this.accessory.getService(this.platform.Service.AccessoryInformation)
            .setCharacteristic(this.platform.Characteristic.Manufacturer, 'Klik Aan Klik Uit')
            .setCharacteristic(this.platform.Characteristic.SerialNumber, this.deviceId.toString());
        this.service = this.accessory.getService(this.platform.Service.HumiditySensor) || this.accessory.addService(this.platform.Service.HumiditySensor);
        this.service.getCharacteristic(this.platform.Characteristic.CurrentRelativeHumidity)
            .onGet(this.getSensorHumidity.bind(this));
    }

    async getSensorHumidity() {
        try {
            // Get status for this device
            let status = (await this.hub.getDeviceStatus(this.deviceId))[this.humCharacteristicFunction]/100;
            this.platform.logger.debug(`Current humidity for ${this.deviceName}: ${status}`);
            return status;
        }
        catch (e) {
            this.platform.logger.error(`Error getting state for ${this.deviceName}: ${e}`);
            throw new this.platform.api.hap.HapStatusError(-70402 /* SERVICE_COMMUNICATION_FAILURE */);
        }
    }
}
exports.HumSensor = HumSensor;
//
