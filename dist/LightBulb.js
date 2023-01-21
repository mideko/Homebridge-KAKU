"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LightBulb = void 0;
/**
 * This class is a simple KAKU or other zigbee lightbulb / switch connected to your ics 2000. This lightbulb can only turn of and on
 */
class LightBulb {
    constructor(platform, accessory) {
        this.platform = platform;
        this.accessory = accessory;
        // The index the status for on/off is stored and the function to use when you turn a device on/off
        this.onOffCharacteristicFunction = 0;
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
                this.platform.logger(`Changed state to ${newValue} on ${this.deviceName}`);
            }
        }
        catch (e) {
            this.platform.logger.error(`Error changing state for ${this.deviceName}: ${e}`);
            throw new this.platform.api.hap.HapStatusError(-70402); /* SERVICE_COMMUNICATION_FAILURE */
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
            throw new this.platform.api.hap.HapStatusError(-70402); /* SERVICE_COMMUNICATION_FAILURE */
        }
    }
}
exports.LightBulb = LightBulb;
//# sourceMappingURL=LightBulb.js.map

/*
public static final int INDEX COLOR HUE_TRANSITION = 12;
public static final int INDEX COLOR_ LOOP = 11;
public static final int INDEX COLOR POINTER = 10;
public static final int INDEX_COLOR_TEMPERATURE = 9;
public static final int INDEX COLOR XY = 5;
public static final int INDEX DIM = 4;
public static final int INDEX_ GROUP = 2;
public static final int INDEX HUE = 6;
public static final int INDEX HUE SATURATION = 8;
public static final int INDEX LIGHTNESS = 7;
public static final int INDEX ON OFF = 3;
*/
