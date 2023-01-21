"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Shutter = void 0;
/**
 * This class is a simple KAKU or other zigbee switch connected to your ics 2000. This switch is for opening / closing
 */
class Shutter {
    constructor(platform, accessory) {
        this.platform = platform;
        this.accessory = accessory;
        // The index the status for on/off is stored and the function to use when you turn a device on/off
        this.openCloseCharacteristicFunction = 0;
        this.deviceData = accessory.context.device;
        this.deviceName = accessory.context.name;
        this.deviceId = Number(this.deviceData.id);
        this.hub = platform.hub;
        this.logger = platform.logger;
        this.accessory.getService(this.platform.Service.AccessoryInformation)
            .setCharacteristic(this.platform.Characteristic.Manufacturer, 'Klik Aan Klik Uit')
            .setCharacteristic(this.platform.Characteristic.SerialNumber, this.deviceId.toString());
        this.service = this.accessory.getService(this.platform.Service.GarageDoorOpener) || this.accessory.addService(this.platform.Service.GarageDoorOpener);
        // create handlers for required characteristics
        this.service.getCharacteristic(this.platform.Characteristic.CurrentDoorState)
          .onGet(this.handleCurrentDoorStateGet.bind(this));

        this.service.getCharacteristic(this.platform.Characteristic.TargetDoorState)
          .onSet(this.handleTargetDoorStateSet.bind(this));
    }

    /**
     * Handle requests to get the current value of the "Current Position" characteristic
     *Error discovering devices: TypeError: Cannot read properties of undefined (reading 'CurrentDoorState')
     */
   async handleCurrentDoorStateGet() {
       this.logger.debug('Triggered GET Current Door State');
       const status = (await this.hub.getDeviceStatus(this.deviceId))[this.openCloseCharacteristicFunction];
       this.logger.debug(`Current state for ${this.deviceName}: ${status}`);
       // set this to a valid value for CurrentPosition
       const currentValue = 1 - status;
       return currentValue;
    }

    async handleTargetDoorStateGet() {
        this.logger.debug('Triggered GET Target Door State');
        const status = (await this.hub.getDeviceStatus(this.deviceId))[this.openCloseCharacteristicFunction];
        this.logger.debug(`Current state for ${this.deviceName}: ${status}`);
        // set this to a valid value for CurrentPosition
        const targetValue = status;
        return targetValue;
     }

    /**
     * Handle requests to set the "Target Position" characteristic
     */
    async handleTargetDoorStateSet(value) {
        this.logger.debug('Triggered SET TargetPosition:' + value);
        const targetValue = 1 - parseInt(value);
        await this.hub.turnDeviceOnOff(this.deviceId, targetValue, this.openCloseCharacteristicFunction);
    }
}
exports.Shutter = Shutter;
//
