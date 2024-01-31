"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DimmableLightBulbRGB = void 0;

const {DimmableLightBulbTemp} = require("./DimmableLightBulbTemp");
//const {ColorTools} = require("./ColorTools.js");
//const myColorTools = new ColorTools();

class DimmableLightBulbRGB extends DimmableLightBulbTemp {
    constructor(platform, accessory) {
        super(platform, accessory);
        this.latestHueValue=1;
        this.latestSatValue=100;
        this.latestLightValue=50;
        // The Functions for an RGB led lightbulb
        //this.onOffCharacteristicFunction = 3;
        //this.dimCharacteristicFunction = 4;
        this.colorCharacteristicFunction = 5;
        this.hueCharacteristicFunction = 6; //does not return any value?
        this.lightnessCharacteristicFunction = 7;
        this.saturationCharacteristicFunction = 8;
        this.lighttempCharacteristicFunction = 9;
        
        this.service.getCharacteristic(this.platform.Characteristic.Hue)
            .onGet(this.getHue.bind(this))
            .onSet(this.setHue.bind(this));
        this.service.getCharacteristic(this.platform.Characteristic.Saturation)
            .onGet(this.getSat.bind(this))
            .onSet(this.setSat.bind(this));

    }
    //handle lightness
        //- does not exist in definitions

    
    //handle saturation
    async getSat() {
        try {
            const satStatus = (await this.hub.getDeviceStatus(this.deviceId))[this.saturationCharacteristicFunction];
            this.logger.debug(`${this.deviceName} - current Hue Saturation value (from device): ${satStatus}`); //debug
            this.latestSatValue = satStatus;
            return(this.latestSatValue);
        }
        catch (e) {
            this.platform.logger.error(`Error getting saturation for ${this.deviceName}: ${e}`);
            throw new this.platform.api.hap.HapStatusError(-70402); /* SERVICE_COMMUNICATION_FAILURE */
        }
    }
    async setSat(newSatValue) {
        try {
            const deviceValue = newSatValue;
            this.latestSatValue = newSatValue;
            this.logger(`${this.deviceName} - value for saturation changed: ${newSatValue}`);
            await this.hub.updateDevice(this.deviceId, this.saturationCharacteristicFunction, this.latestSatValue);
        }
        catch (e) {
            this.platform.logger.error(`Error setting saturation for ${this.deviceName}: ${e}`);
            throw new this.platform.api.hap.HapStatusError(-70402); /* SERVICE_COMMUNICATION_FAILURE */
        }
    }
    async getHue() {
        try {
            //const isOn = (await this.hub.getDeviceStatus(this.deviceId))[this.onOffCharacteristicFunction];
            
            const xyStatus = (await this.hub.getDeviceStatus(this.deviceId))[this.colorCharacteristicFunction];
            const hueStatus = (await this.hub.getDeviceStatus(this.deviceId))[this.hueCharacteristicFunction];
            this.logger(`${this.deviceName} - Get - current xy value (from device): ${xyStatus}`); //debug
            //this.logger(`${this.deviceName} - current Hue value (from device): ${hueStatus}`); //debug
            if (xyStatus > 0) {
                let hsl = this.hub.deserialize_yxy_to_hsl(xyStatus);
                this.logger(`${this.deviceName} - Get - Current HSL values: ${hsl}`);
                this.latestHueValue = hsl[0];
                this.logger(`${this.deviceName} - Get - current Hue value: ${this.latestHueValue}`);
            }
            else {
                this.latestHueValue = 1;
            }
            return this.latestHueValue;
        }
        catch (e) {
            this.platform.logger.error(`Error getting hue for ${this.deviceName}: ${e}`);
            throw new this.platform.api.hap.HapStatusError(-70402); /* SERVICE_COMMUNICATION_FAILURE */
        }
    }
    async setHue(newValue) {
        try {
            
            this.logger(`${this.deviceName} - previous value for hue: ${this.latestHueValue}`);
            this.logger(`${this.deviceName} - new value for hue changed: ${newValue}`);
            //see usr/local/homebridge/node_modules/hap-nodejs/dist/lib/definitions/ServiceDefinitions.js
            let hsl = [newValue,this.latestSatValue,this.latestLightValue];
            let deviceValue = this.hub.serialize_hsl_to_yxy(hsl);
            this.latestHueValue = newValue;
            await this.hub.updateDevice(this.deviceId, this.colorCharacteristicFunction, deviceValue);
            //await this.hub.updateDevice(this.deviceId, this.hueCharacteristicFunction, deviceValue);
        }
        catch (e) {
            this.platform.logger(`Error changing hue for ${this.deviceName}: ${e}`);
            throw new this.platform.api.hap.HapStatusError(-70402); /* SERVICE_COMMUNICATION_FAILURE */
        }
    }
}

exports.DimmableLightBulbRGB = DimmableLightBulbRGB;
