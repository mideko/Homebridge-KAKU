"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Pushbutton = void 0;
/**
 * This class is a button linked to two scenes, one for On and one for OFF
 */
class Pushbutton {
    constructor(platform, accessory) {
        this.platform = platform;
        this.accessory = accessory;
        // The index the status for on/off is stored and the function to use when you turn a device on/off
        this.runCharacteristicFunction = 0;
        this.deviceData = accessory.context.device;
        this.deviceName = accessory.context.name;
        this.deviceId = Number(this.deviceData.id);
        this.hub = platform.hub;
        this.sceneON = accessory.context.sceneON;
        this.sceneOFF = accessory.context.sceneOFF;
        this.accessory.context.lastValue = false;
    
        this.logger = platform.logger;
        
        this.accessory.getService(this.platform.Service.AccessoryInformation)
            .setCharacteristic(this.platform.Characteristic.Manufacturer, 'Klik Aan Klik Uit')
            .setCharacteristic(this.platform.Characteristic.SerialNumber, this.deviceId.toString());
        this.service = this.accessory.getService(this.platform.Service.Switch) || this.accessory.addService(this.platform.Service.Switch);
        this.service.getCharacteristic(this.platform.Characteristic.On)
            .onSet(this.doSet.bind(this))
            .onGet(this.doGet.bind(this));
        
        //subscribe to MQTT topic for state updates
        this.subscribe(this.deviceName);

        
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
            //update device state based on MGTT trigger 
            thisDevice.service.getCharacteristic(thisDevice.platform.Characteristic.On).updateValue(payload.state);
            thisDevice.deviceId = payload.state ? Number(thisDevice.sceneON) : Number(thisDevice.sceneOFF);
            await thisDevice.hub.turnDeviceOnOff(thisDevice.deviceId, 1, thisDevice.runCharacteristicFunction);
            thisDevice.accessory.context.lastValue = payload.state;
            thisDevice.logger.info(`${topic} is set to ${payload.state}`);
        }
        catch (e) {
            thisDevice.logger.error(`Error in messenger of ${topic}: ${e}`);
            //throw new this.platform.api.hap.HapStatusError(-70402); /* SERVICE_COMMUNICATION_FAILURE */
        }
    }
    
    async doSet(newValue) {
        try {
            // run scene
            //this.platform.logger(newValue);
            this.deviceId = newValue ? Number(this.sceneON) : Number(this.sceneOFF);
            await this.hub.turnDeviceOnOff(this.deviceId, 1, this.runCharacteristicFunction);
            //publish into MQ
            this.platform.publisher.publishJSON(this.deviceName, { state: newValue});
            this.accessory.context.lastValue = newValue; //use this state for Get later
            this.platform.logger.info(`Started scene ${this.deviceName} - ${newValue}`);
            }

        catch (e) {
            this.platform.logger.error(`Error changing state for ${this.deviceName}: ${e}`);
            throw new this.platform.api.hap.HapStatusError(-70402); /* SERVICE_COMMUNICATION_FAILURE */
        }
    }
    
    async doGet() {
        try {
            //because this is a scene based device, we cannot retrieve a real state, so...
            return this.accessory.context.lastValue; //return state of last set
        }
        catch (e) {
            this.platform.logger.error(`Error getting state for ${this.deviceName}: ${e}`);
            throw new this.platform.api.hap.HapStatusError(-70402); /* SERVICE_COMMUNICATION_FAILURE */
        }
    }

}
exports.Pushbutton = Pushbutton;


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
