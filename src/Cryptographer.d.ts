export declare class Cryptographer {
    /**
     * Encrypt a string data with AES 128 CBC with a 16-bit IV of only zeros and a given key. Returns the data in a HEX string
     * @param data The data you want to encrypt
     * @param aesKey The used for the encryption
     */
    static encrypt(data: string, aesKey: string): string;
    /**
     * Decrypt a hex string with a given key
     * @param encodedData The encoded data in HEX format
     * @param aesKey The key used for decryption
     */
    static decryptHex(encodedData: string, aesKey: string): string;
    /**
     * Decrypt a base64 string with a given key
     * @param encodedData The encoded data in base64 format
     * @param aesKey The key used for decryption
     */
    static decryptBase64(encodedData: string, aesKey: string): string;
}
//# sourceMappingURL=Cryptographer.d.ts.map