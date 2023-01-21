/// <reference types="node" />
import { Buffer } from 'buffer';
export declare class Command {
    private readonly hubMac;
    private readonly deviceId;
    private readonly deviceFunction;
    private readonly value;
    private readonly aesKey;
    readonly totalMessage: Buffer;
    private readonly client;
    /**
     * Create a command for the ics-2000
     * @param hubMac The mac-address of your ics-2000 without colons
     * @param deviceId The id of the device your command is about
     * @param deviceFunction The function you want to call for the specified device
     * @param value The value for the specified function
     * @param aesKey The AES-key what you want to encrypt the message with, this key is stored on your KAKU account
     */
    constructor(hubMac: string, deviceId: number, deviceFunction: number, value: number, aesKey: string);
    /**
     * Sends this command to a device with specified host and port
     * @param host The host you want to send the command to, this is the ip-address of your ics-2000
     * @param port The port you want to send the command to, this 2012 for the ics-2000
     * @param sendTimeout The number of millisecond you want to wait before the message times out and the promise rejected
     */
    sendTo(host: string, port: number, sendTimeout?: number): Promise<void>;
}
//# sourceMappingURL=Command.d.ts.map