"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Command = void 0;
const buffer_1 = require("buffer");
const Cryptographer_1 = require("./Cryptographer");
const dgram_1 = __importDefault(require("dgram"));
class Command {
    /**
     * Create a command for the ics-2000
     * @param hubMac The mac-address of your ics-2000 without colons
     * @param deviceId The id of the device your command is about
     * @param deviceFunction The function you want to call for the specified device
     * @param value The value for the specified function
     * @param aesKey The AES-key what you want to encrypt the message with, this key is stored on your KAKU account
     */
    constructor(hubMac, deviceId, deviceFunction, value, aesKey) {
        this.hubMac = hubMac;
        this.deviceId = deviceId;
        this.deviceFunction = deviceFunction;
        this.value = value;
        this.aesKey = aesKey;
        this.client = dgram_1.default.createSocket('udp4');
        const dataObject = {
            module: {
                id: deviceId,
                function: deviceFunction,
                value: value,
            },
        };
        const encryptedData = Cryptographer_1.Cryptographer.encrypt(JSON.stringify(dataObject), aesKey);
        const data = buffer_1.Buffer.from(encryptedData, 'hex');
        const header = buffer_1.Buffer.alloc(43);
        header.writeUInt8(1); // set frame
        header.writeUInt32LE(653213, 9); // set magic
        header.writeUInt8(128, 2); // set type
        header.writeUInt16LE(data.length, 41); // set data length
        header.writeUInt32LE(deviceId, 29); // set entityId
        // set mac
        const macBuffer = buffer_1.Buffer.from(hubMac, 'hex');
        for (let i = 0; i < macBuffer.length; i++) {
            header[3 + i] = macBuffer[i];
        }
        this.totalMessage = buffer_1.Buffer.concat([header, data]);
    }
    /**
     * Sends this command to a device with specified host and port
     * @param host The host you want to send the command to, this is the ip-address of your ics-2000
     * @param port The port you want to send the command to, this 2012 for the ics-2000
     * @param sendTimeout The number of millisecond you want to wait before the message times out and the promise rejected
     */
    sendTo(host, port, sendTimeout = 10000) {
        return new Promise((resolve, reject) => {
            const timeout = setTimeout(() => {
                reject('Message timed out');
            }, sendTimeout);
            // ICS-2000 sends message back on succes
            this.client.on('message', () => {
                clearTimeout(timeout);
                resolve();
            });
            this.client.bind();
            this.client.send(this.totalMessage, port, host, ((error) => {
                if (error) {
                    reject(error);
                }
            }));
        });
    }
}
exports.Command = Command;
//# sourceMappingURL=Command.js.map