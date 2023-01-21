"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Cryptographer = void 0;
const buffer_1 = require("buffer");
const crypto_1 = __importDefault(require("crypto"));
class Cryptographer {
    /**
     * Encrypt a string data with AES 128 CBC with a 16-bit IV of only zeros and a given key. Returns the data in a HEX string
     * @param data The data you want to encrypt
     * @param aesKey The used for the encryption
     */
    static encrypt(data, aesKey) {
        const iv = crypto_1.default.randomBytes(16);
        // const iv = Buffer.alloc(16);
        const cipher = crypto_1.default.createCipheriv('aes-128-cbc', buffer_1.Buffer.from(aesKey, 'hex'), iv);
        const encrypted = cipher.update(data, 'utf8', 'hex');
        return iv.toString('hex') + encrypted + cipher.final('hex');
    }
    /**
     * Decrypt a hex string with a given key
     * @param encodedData The encoded data in HEX format
     * @param aesKey The key used for decryption
     */
    static decryptHex(encodedData, aesKey) {
        // First 16 bytes of a hex string returned by the ics-2000 opr the server is the IV
        const iv = buffer_1.Buffer.from(encodedData.substring(0, 32), 'hex');
        const data = encodedData.substring(32);
        const cipher = crypto_1.default.createDecipheriv('aes-128-cbc', buffer_1.Buffer.from(aesKey, 'hex'), iv);
        const decrypted = cipher.update(data, 'hex', 'utf8');
        return decrypted + cipher.final('utf8');
    }
    /**
     * Decrypt a base64 string with a given key
     * @param encodedData The encoded data in base64 format
     * @param aesKey The key used for decryption
     */
    static decryptBase64(encodedData, aesKey) {
        return this.decryptHex(buffer_1.Buffer.from(encodedData, 'base64').toString('hex'), aesKey);
    }
}
exports.Cryptographer = Cryptographer;
//# sourceMappingURL=Cryptographer.js.map