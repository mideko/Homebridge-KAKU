"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SmokeSensor = void 0;
/**
 * This class is a simple KAKU or other zigbee motion sensor connected to your ics 2000.
 todo: create switch to signal motion detected instead of motion sensor?
 
 */
class SmokeSensor {
    constructor(platform, accessory) {
        this.platform = platform;
        this.accessory = accessory;
        // The index the status for on/off is stored and the function to use when you turn a device on/off
        this.smokeCharacteristicFunction = 0;
        this.batteryCharacteristicFunction = 3; //1-200 scale
        this.deviceData = accessory.context.device;
        this.deviceName = accessory.context.name;
        this.deviceId = Number(this.deviceData.id);
        this.hub = platform.hub;
        this.logger = platform.logger;
        this.accessory.getService(this.platform.Service.AccessoryInformation)
            .setCharacteristic(this.platform.Characteristic.Manufacturer, 'Klik Aan Klik Uit')
            .setCharacteristic(this.platform.Characteristic.SerialNumber, this.deviceId.toString());
        this.service = this.accessory.getService(this.platform.Service.SmokeSensor) || this.accessory.addService(this.platform.Service.SmokeSensor);
        this.service.getCharacteristic(this.platform.Characteristic.SmokeDetected)
            .onGet(this.handleSmokeDetectedGet.bind(this));
        this.service.getCharacteristic(this.platform.Characteristic.StatusLowBattery)
            .onGet(this.handleBatteryStatusGet.bind(this));
    }
    /**
     * Handle requests to get the current value of the "Smoke Detected" characteristic
     */
    async handleSmokeDetectedGet() {
        try {
            // Get status for this device
            var detectionValue = (await this.hub.getDeviceStatus(this.deviceId))[this.smokeCharacteristicFunction];
            this.platform.logger.debug(`Current state for ${this.deviceName}: ${detectionValue}`);
            const returnState = 1 - parseInt(detectionValue);
            return returnState;
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
exports.SmokeSensor = SmokeSensor;

