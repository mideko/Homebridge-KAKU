"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TempSensor = void 0;
/**
 * This class is a simple KAKU or other zigbee sensor connected to your ics 2000. This sensor can only give status
 */
class TempSensor {
    constructor(platform, accessory) {
        this.platform = platform;
        this.accessory = accessory;
        // The index the status for on/off is stored and the function to use when you turn a device on/off
        this.tempCharacteristicFunction = 4; // temperature
        //this.humCharacteristicFunction = 5; // humidity?
        this.batteryCharacteristicFunction = 3; //1-200 scale
        this.deviceData = accessory.context.device;
        this.deviceName = accessory.context.name;
        this.deviceId = Number(this.deviceData.id);
        this.hub = platform.hub;
        this.logger = platform.logger;
        this.accessory.getService(this.platform.Service.AccessoryInformation)
            .setCharacteristic(this.platform.Characteristic.Manufacturer, 'Klik Aan Klik Uit')
            .setCharacteristic(this.platform.Characteristic.SerialNumber, this.deviceId.toString());
        this.service = this.accessory.getService(this.platform.Service.TemperatureSensor) || this.accessory.addService(this.platform.Service.TemperatureSensor);
        this.service.getCharacteristic(this.platform.Characteristic.CurrentTemperature)
            .onGet(this.getSensorTemp.bind(this));
        this.service.getCharacteristic(this.platform.Characteristic.StatusLowBattery)
            .onGet(this.handleBatteryStatusGet.bind(this));
    }

    async getSensorTemp() {
        try {
            // Get status for this device
            const status = (await this.hub.getDeviceStatus(this.deviceId))[this.tempCharacteristicFunction]/100;
            this.platform.logger.debug(`Current temperature for ${this.deviceName}: ${status}`);
            return status;
        }
        catch (e) {
            this.platform.logger.error(`Error getting state for ${this.deviceName}: ${e}`);
            throw new this.platform.api.hap.HapStatusError(-70402 /* SERVICE_COMMUNICATION_FAILURE */);
        }
    }
    
    async handleBatteryStatusGet() {
        try {
            // Get status for this device
            var batteryValue = (await this.hub.getDeviceStatus(this.deviceId))[this.batteryCharacteristicFunction];
            this.platform.logger.debug(`Current battery level for ${this.deviceName}: ${batteryValue}`);
            const returnState = (batteryValue < 20) ? this.platform.Characteristic.StatusLowBattery.BATTERY_LEVEL_LOW : this.platform.Characteristic.StatusLowBattery.BATTERY_LEVEL_NORMAL
            return returnState;
        }
        catch (e) {
            this.platform.logger.error(`Error getting battery state for ${this.deviceName}: ${e}`);
            throw new this.platform.api.hap.HapStatusError(-70402 /* SERVICE_COMMUNICATION_FAILURE */);
        }
    }
}
exports.TempSensor = TempSensor;
//# sourceMappingURL=LightBulb.js.map
