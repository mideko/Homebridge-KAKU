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
            .onGet(this.handleTargetDoorStateGet.bind(this))
            .onSet(this.handleTargetDoorStateSet.bind(this));
        //subscribe to MQTT topic for state updates
        const { mqtt } = this.platform.config;
        if (mqtt) {
            this.subscribe(this.deviceName);
        }
    }
    
    async subscribe(subTopic) {
        try {
            //subscribe to topic in MQTT and pass callback for when new message is received in Q
            this.platform.publisher.subscribe(subTopic, this, this.messenger);
        }
        catch (e) {
            this.logger.error(`Error subscribing to ${subTopic}: ${e}`);
            //throw new this.platform.api.hap.HapStatusError(-70402); /* SERVICE_COMMUNICATION_FAILURE */
        }
    }
    
    //handle message from MQTT (callback)
    async messenger(thisDevice,topic,payload) {
        try {
            thisDevice.logger.debug(`[MQTT] ${topic} was set to ${payload}`);
            if (payload != thisDevice.accessory.context.lastValue ) {
                //update device state to homekit based on MGTT trigger
                thisDevice.service.getCharacteristic(thisDevice.platform.Characteristic.On).updateValue(payload);
                //change ICS device state based on MGTT trigger
                await thisDevice.hub.turnDeviceOnOff(thisDevice.deviceId, Number(payload), thisDevice.onOffCharacteristicFunction);
                thisDevice.accessory.context.lastValue = payload;
                thisDevice.logger.info(`${thisDevice.accessory.context.name} - MQTT message received: ${payload}`);
            }
        }
        catch (e) {
            thisDevice.logger.error(`Error in messenger of ${topic}: ${e}`);
            //throw new this.platform.api.hap.HapStatusError(-70402); /* SERVICE_COMMUNICATION_FAILURE */
        }
    }

    /**
     * Handle requests to get the current value of the "Current Position" characteristic
     */
   async handleCurrentDoorStateGet() {
       let status = (await this.hub.getDeviceStatus(this.deviceId))[this.openCloseCharacteristicFunction];
       this.accessory.context.lastValue = status;
       const { mqtt } = this.platform.config;
       if (mqtt) {
           this.platform.publisher.publish(this.deviceName, String(status));
       }
       this.logger.debug(`${this.deviceName} - Current state from device: ${status}`);
       let strCurrentValue = status=0 ? "Closed" : "Open";
       this.logger.info(this.deviceName + " - Current state: " + strCurrentValue);
       // flip this to get a valid value for CurrentPosition
       let currentValue = status=1 ? this.platform.Characteristic.CurrentDoorState.OPEN : this.platform.Characteristic.CurrentDoorState.CLOSED;
       return currentValue;
    }

    async handleTargetDoorStateGet() {
        let status = (await this.hub.getDeviceStatus(this.deviceId))[this.openCloseCharacteristicFunction];
        let strCurrentValue = status=0 ? "Closed" : "Open";
        this.logger.debug(`${this.deviceName} - Target state: ${strCurrentValue}`);
        // flip  this to get a valid value for CurrentPosition in homekit
        let targetValue = status=1 ? this.platform.Characteristic.CurrentDoorState.OPEN : this.platform.Characteristic.CurrentDoorState.CLOSED;
        return targetValue;
     }

    /**
     * Handle requests to set the "Target Position" characteristic
     */
    async handleTargetDoorStateSet(value) {
        this.logger.debug(this.deviceName + ' - Triggered SET TargetPosition:' + value);
        let targetValue = 1 - value;
        await this.hub.turnDeviceOnOff(this.deviceId, targetValue, this.openCloseCharacteristicFunction);
        //this.service.getCharacteristic(this.platform.Characteristic.CurrentDoorState).updateValue(targetValue);
        this.accessory.context.lastValue = targetValue;
        const { mqtt } = this.platform.config;
        if (mqtt) {
            this.platform.publisher.publish(this.deviceName, String(targetValue));
        }
        let strTargetValue = targetValue=0 ? "Closing" : "Opening";
        this.logger.info(`${this.deviceName} - ${strTargetValue}`);
    }
}
exports.Shutter = Shutter;
//
