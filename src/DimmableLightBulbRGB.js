"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DimmableLightBulbRGB = void 0;

const {DimmableLightBulbTemp} = require("./DimmableLightBulbTemp");

class DimmableLightBulbRGB extends DimmableLightBulbTemp {
    constructor(platform, accessory) {
        super(platform, accessory);
        this.accessory = accessory;
        this.accessory.context.latestSatValue=100;
        this.accessory.context.latestLightValue=10;
        this.accessory.context.latestColorValue = 1;
        // The Functions for an RGB led lightbulb
        //this.onOffCharacteristicFunction = 3;
        //this.dimCharacteristicFunction = 4;
        this.colorCharacteristicFunction = 5;
        //this.hueCharacteristicFunction = 6; //does not return any value?
        //this.lightnessCharacteristicFunction = 7;
        this.saturationCharacteristicFunction = 8;
        //this.lighttempCharacteristicFunction = 9;
        
        this.service.getCharacteristic(this.platform.Characteristic.Hue)
            .onGet(this.getColor.bind(this))
            .onSet(this.setColor.bind(this));
        this.service.getCharacteristic(this.platform.Characteristic.Saturation)
            .onGet(this.getSaturation.bind(this))
            .onSet(this.setSaturation.bind(this));
        
        //get current color
        const deviceStatus = this.hub.getDeviceStatus(this.deviceId)[this.colorCharacteristicFunction];
        if (deviceStatus > 0) {
            let hsl = this.hub.deserialize_yxy_to_hsl(deviceStatus);
            this.accessory.context.latestColorValue = hsl[0];
            this.accessory.context.latestSatValue = hsl[1];
            this.accessory.context.latestLightValue = hsl[2];
        }
        this.service.getCharacteristic(this.platform.Characteristic.Hue).updateValue(this.accessory.context.latestColorValue);
        this.service.getCharacteristic(this.platform.Characteristic.Saturation).updateValue(this.accessory.context.latestSatValue);

    }
    //handle lightness
        //- does not exist in definitions
    
    //handle saturation
    async getSaturation() {
        try {
            let xyStatus = (await this.hub.getDeviceStatus(this.deviceId))[this.colorCharacteristicFunction];

            this.platform.logger.debug(`${this.deviceName} - Get - current xy value (from device): ${xyStatus}`); //debug

            if (xyStatus > 0) {
                let hsl = this.hub.deserialize_yxy_to_hsl(xyStatus);
                this.platform.logger.debug(`${this.deviceName} - Get - Current HSL values: ${hsl}`);
                this.accessory.context.latestSatValue = hsl[1];
                this.accessory.context.latestLightValue = hsl[2];
                this.platform.logger.debug(`${this.deviceName} - Get - current Saturation value: ${this.accessory.context.latestSatValue}`);
            }
            else {
                this.accessory.context.latestSatValue = 100;
            }
            return this.accessory.context.latestSatValue;
        }
        catch (e) {
            this.platform.logger.error(`Error getting saturation for ${this.deviceName}: ${e}`);
            throw new this.platform.api.hap.HapStatusError(-70402); /* SERVICE_COMMUNICATION_FAILURE */
        }
    }
    async setSaturation(newSatValue) {
        try {
            await this.hub.updateDevice(this.deviceId, this.saturationCharacteristicFunction, newSatValue);
            this.platform.logger.debug(`${this.deviceName} - value for saturation changed from ${this.accessory.context.latestSatValue} to ${newSatValue}`);
            this.accessory.context.latestSatValue = newSatValue;
        }
        catch (e) {
            this.platform.logger.error(`Error setting saturation for ${this.deviceName}: ${e}`);
            throw new this.platform.api.hap.HapStatusError(-70402); /* SERVICE_COMMUNICATION_FAILURE */
        }
    }
    
    //handle color / hue
    async getColor() {
        try {
            let xyStatus = (await this.hub.getDeviceStatus(this.deviceId))[this.colorCharacteristicFunction];

            this.platform.logger.debug(`${this.deviceName} - Get - current xy value (from device): ${xyStatus}`); //debug

            if (xyStatus > 0) {
                let hsl = this.hub.deserialize_yxy_to_hsl(xyStatus);
                this.platform.logger.debug(`${this.deviceName} - Get - Current HSL values: ${hsl}`);
                this.accessory.context.latestColorValue = hsl[0];
                this.accessory.context.latestLightValue = hsl[2];
                this.platform.logger.debug(`${this.deviceName} - Get - current Hue value: ${this.accessory.context.latestColorValue}`);
            }
            else {
                this.accessory.context.latestColorValue = 1;
            }
            return this.accessory.context.latestColorValue;
        }
        catch (e) {
            this.platform.logger.error(`Error getting hue for ${this.deviceName}: ${e}`);
            throw new this.platform.api.hap.HapStatusError(-70402); /* SERVICE_COMMUNICATION_FAILURE */
        }
    }
    async setColor(newValue) {
        try {

            //see usr/local/homebridge/node_modules/hap-nodejs/dist/lib/definitions/ServiceDefinitions.js
            let hsl = [newValue,this.accessory.context.latestSatValue,
                       this.accessory.context.latestLightValue];
            let deviceValue = this.hub.serialize_hsl_to_yxy(hsl);
            
            await this.hub.updateDevice(this.deviceId, this.colorCharacteristicFunction, deviceValue);
            this.platform.logger.debug(`${this.deviceName} - value for Hue color changed from ${this.accessory.context.latestColorValue} to ${newValue}`);
            this.accessory.context.latestColorValue = newValue;

        }
        catch (e) {
            this.platform.logger(`Error changing hue for ${this.deviceName}: ${e}`);
            throw new this.platform.api.hap.HapStatusError(-70402); /* SERVICE_COMMUNICATION_FAILURE */
        }
    }
} //class

exports.DimmableLightBulbRGB = DimmableLightBulbRGB;
