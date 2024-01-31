"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Hub = void 0;
const node_fetch = __importDefault(require("node-fetch"));
const url = require("url");
const Cryptographer = require("./Cryptographer");
const dgram = __importDefault(require("dgram"));
const Command = require("./Command");
const convertColor = require("color-convert"); //npm module
class Hub {
    /**
     * Creates a Hub for easy communication with the ics-2000
     * @param email Your e-mail of your KAKU account
     * @param password Your password of your KAKU account
     * @param deviceBlacklist A list of device ID's you don't want to appear in HomeKit
     * @param localBackupAddress Optionally, you can pass the ip address of your ics-2000
     * in case it can't be automatically found in the network
     */
    constructor(email, password, deviceBlacklist = [], localBackupAddress) {
        this.email = email;
        this.password = password;
        this.deviceBlacklist = deviceBlacklist;
        this.localBackupAddress = localBackupAddress;
        this.baseUrl = 'https://trustsmartcloud2.com/ics2000_api';
        this.devices = [];
        this.localAddress = localBackupAddress;
    }
    /**
     * Login on the KAKU server and fetch the AES key and ics-2000 mac address stored on your account
     */
    async login() {
        const params = new url.URLSearchParams({
            action: 'login',
            email: this.email,
            password_hash: this.password,
            device_unique_id: 'android',
            platform: '',
            mac: '',
        });
        const request = await (0, node_fetch.default)(`${this.baseUrl}/account.php`, {
            method: 'POST',
            body: params,
        });
        if (request.status === 401) {
            throw new Error('Username/ password combination incorrect');
        }
        const responseJson = await request.json();
        if (request.ok && responseJson['homes'].length > 0) {
            const home = responseJson['homes'][0];
            this.aesKey = home['aes_key'];
            this.hubMac = home['mac'];
        }
        else {
            throw new Error(responseJson[0]);
        }
    }
    /**
     * Pulls the list of devices connected to your ics-2000 from the serer
     * Stores the list of devices in this class and returns it
     */
    async pullDevices() {
        if (!this.aesKey || !this.hubMac) {
            throw new Error('Hub mac address or aes key undefined');
        }
        const params = new url.URLSearchParams({
            action: 'sync',
            email: this.email,
            mac: this.hubMac,
            password_hash: this.password,
            home_id: '',
        });
        const response = await (0, node_fetch.default)(`${this.baseUrl}/gateway.php`, {
            method: 'POST',
            body: params,
        });
        const responseJson = await response.json();
        if (response.ok) {
            // Decrypt the data for every object in the data (scenes, rooms, groups and devices are all in this list)
            responseJson.map(device => {
                const decryptedData = Cryptographer.Cryptographer.decryptBase64(device['data'], this.aesKey);
                device['data'] = JSON.parse(decryptedData);
            });
            this.devices = responseJson.filter(device => {
                const deviceId = Number(device['id']);
                const data = device['data'];
                if (this.deviceBlacklist.includes(deviceId)) {
                    return false;
                }
                // Check if entry is a device or a group
                if ('module' in data && 'info' in data['module'] && data['module']['device'] !== 26) {
                    // In my case, there are some devices in this list that are deleted and not shown in the app
                    // So we need to filter this out
                    // The sum of all values in the info array is always greater than 0 if device exist
                    const functionSum = data['module']['info'].reduce((a, b) => a + b, 0);
                    return functionSum > 0;
                }
                else if ('group' in data) {
                    // change group key name to module so a group is treated as a device
                    device['data']['module'] = device['data']['group'];
                    delete device['data']['group'];
                    return true;
                }
                return false;
            });
            this.devices.map(device => {
                const decryptedStatus = Cryptographer.Cryptographer.decryptBase64(device['status'], this.aesKey);
                device['status'] = JSON.parse(decryptedStatus);
                device['name'] = device['data']['module']['name'];
                device['device'] = device['data']['module']['device'];
            });
            return this.devices;
        }
        else {
            throw new Error(responseJson[0].toString());
        }
    }
    /**
     * Searh in you local network for the ics-2000. The ics-2000 listens to a broadcast message, so that's the way we find it out
     * @param searchTimeout The amount of milliseconds you want to wait for an answer on the sent message, before the promise is rejected
     * @param logger The logger you want to use to warn if search timed out and backup IP is specified
     */
    async discoverHubLocal(searchTimeout = 10000, logger) {
        return new Promise((resolve, reject) => {
            const message = Buffer.from('010003ffffffffffffca000000010400044795000401040004000400040000000000000000020000003000', 'hex');
            const client = dgram.default.createSocket('udp4');
            const timeout = setTimeout(() => {
                client.close();
                if (this.localBackupAddress) {
                    if (logger) {
                        logger.warn('Searching hub timed out! Using backup address for communication');
                    }
                    resolve(this.localBackupAddress);
                }
                else {
                    reject('Searching hub timed out and no backup IP-address specified!');
                }
            }, searchTimeout);
            client.on('message', (msg, peer) => {
                client.close();
                clearTimeout(timeout);
                this.localAddress = peer.address;
                resolve(peer.address);
            });
            client.bind(() => {
                client.setBroadcast(true);
            });
            client.send(message, 2012, '255.255.255.255');
        });
    }
    /**
     * Creates a command using the hub mac address and AES-key stored in this hub. Example for turning on a switch: function: 0, value: 1
     * @param deviceId The id of the device you want to run a function on
     * @param deviceFunction The function you want to run on the device
     * @param value The value for the function
     */
    createCommand(deviceId, deviceFunction, value) {
        return new Command.Command(this.hubMac, deviceId, deviceFunction, value, this.aesKey);
    }
    /**
     * Creates a command to turn a device on or off and sends it to the ics-2000 ip address stored in this class
     * @param deviceId The id of the device you want to turn on or off
     * @param on Whether you want to turn the device on or off
     * @param onFunction The function used to turn the device on or off
     */
    turnDeviceOnOff(deviceId, on, onFunction) {
        if (!this.localAddress) {
            throw new Error('Local address is undefined');
        }
        const command = this.createCommand(deviceId, onFunction, on ? 1 : 0);
        return command.sendTo(this.localAddress, 2012);
    }

    /**
     * Creates a command to dim a device and sends it to the ics-2000 ip address stored in this class
     * @param deviceId The id of the device tou want tot dim
     * @param dimFunction The function you want to use to dim the device
     * @param dimLevel The new dim value (0 = off, 255 = 100% brightness)
     */
    dimDevice(deviceId, dimFunction, dimLevel) {
        if (!this.localAddress) {
            throw new Error('Local address is undefined');
        }
        if (dimLevel < 0 || dimLevel > 255) {
            throw new Error(`Dim level ${dimLevel} is negative or greater than 255`);
        }
        const command = this.createCommand(deviceId, dimFunction, dimLevel);
        return command.sendTo(this.localAddress, 2012);
    }
    updateDevice(deviceId, whichFunction, newLevel) {
        if (!this.localAddress) {
            throw new Error('Local address is undefined');
        }
        if (newLevel < 0 ) {
            throw new Error(` level ${newLevel} is negative`);
        }
        const command = this.createCommand(deviceId, whichFunction, newLevel);
        return command.sendTo(this.localAddress, 2012);
    }
    /**
     * Get the current status of a device
     * @param deviceId The id of the device you want to get the status of
     * @returns A list of numbers that represents the current status of the device.
     * index 0 is on/off status, index 4 is current dim level
     */
    async getDeviceStatus(deviceId) {
        if (!this.aesKey || !this.hubMac) {
            throw new Error('Hub mac address or aes key undefined');
        }
        const params = new url.URLSearchParams({
            'action': 'get-multiple',
            'email': this.email,
            'mac': this.hubMac,
            'password_hash': this.password,
            'home_id': '',
            'entity_id': `[${deviceId}]`,
        });
        const response = await (0, node_fetch.default)(`${this.baseUrl}/entity.php`, {
            method: 'POST',
            body: params,
        });
        const responseJson = await response.json();
        if (responseJson.length === 0 || response.status === 404) {
            throw new Error(`Device with id ${deviceId} not found`);
        }
        if (response.ok) {
            if (!responseJson[0]['status']) {
                return [0];
            }
            // Get first item of the list and grep the status of it
            const status = Cryptographer.Cryptographer.decryptBase64(responseJson[0]['status'], this.aesKey);
            const jsonStatus = JSON.parse(status);
            // Functions array is stored with different keys for groups and devices (modules)
            if ('module' in jsonStatus) {
                return jsonStatus['module']['functions'];
            }
            else if ('group' in jsonStatus) {
                return jsonStatus['group']['functions'];
            }
            else {
                throw new Error('Module or group data not found');
            }
        }
        else {
            throw new Error(responseJson[0].toString());
        }
    }
    
    cvrt(r,g,b) {
        const cv = convert.rgb.hex(r, g, b);
        return cv.toString;
    }

    deserialize_yxy_to_hsl(v) {
        
        const MAX_UINT_16 = Math.pow(2,16)-1;
       
        let buffer = new Uint32Array(1).buffer;
        let dataView = new DataView(buffer);
        dataView.setUint32(0,v); //load value onto array
        let x = dataView.getUint16(0)/MAX_UINT_16;
        let y = dataView.getUint16(2)/MAX_UINT_16;
        const Y = 100;  //default 100, but how to get correct value?

        let myX = (x * Y) / y;
        let myY = Y;
        let myZ = ((1.0-x-y)*Y) / y;
        let stepRGB = convertColor.xyz.rgb(myX,myY,myZ);
        //console.log(stepRGB[0],stepRGB[1],stepRGB[2]);
        return convertColor.rgb.hsl(stepRGB[0],stepRGB[1],stepRGB[2]);
    }
    
    serialize_hsl_to_yxy(hsl) {
        //transform hsl from homekit to KAKU device specific code Yxy based code
        const MAX_UINT_16 = Math.pow(2,16)-1;
        let buffer = new Uint32Array(1).buffer;
        let dataView = new DataView(buffer);
        console.log(hsl);
        let stepRGB = convertColor.hsl.rgb(hsl[0],hsl[1],hsl[2]);
        //console.log('RGB:' + stepRGB);
        let xyz = convertColor.rgb.xyz.raw(stepRGB[0],stepRGB[1],stepRGB[2]);
        console.log('xyz:' + xyz);
        var myX = xyz[0];
        var myY = xyz[1];
        var myZ = xyz[2];
        
        let Y = myY / (myZ+myY+myZ);
        let x = myX / (myX+myY+myZ);
        let y = myY;
        
        console.log (y,x, Y);
        
        let p1 = Math.trunc(x * MAX_UINT_16);
        let p2 = Math.trunc(Y * MAX_UINT_16);
        
        //console.log (p1,p2);
        
        //dataView.setUint16(0,p1*100);
        //dataView.setUint16(2,p2*100);
        dataView.setUint16(0,p1);
        dataView.setUint16(2,p2);
        let deviceValue = dataView.getUint32(0)
        console.log('sending to device: ' +  deviceValue);
        return deviceValue;

    }
    
    
}
exports.Hub = Hub;
//# sourceMappingURL=Hub.js.map
