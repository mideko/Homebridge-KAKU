import { Command } from './Command';
import { Logger } from 'homebridge';
export declare class Hub {
    private readonly email;
    private readonly password;
    private readonly deviceBlacklist;
    private readonly localBackupAddress?;
    private readonly baseUrl;
    private aesKey?;
    private hubMac?;
    devices: object[];
    private localAddress?;
    /**
     * Creates a Hub for easy communication with the ics-2000
     * @param email Your e-mail of your KAKU account
     * @param password Your password of your KAKU account
     * @param deviceBlacklist A list of device ID's you don't want to appear in HomeKit
     * @param localBackupAddress Optionally, you can pass the ip address of your ics-2000
     * in case it can't be automatically found in the network
     */
    constructor(email: string, password: string, deviceBlacklist?: number[], localBackupAddress?: string | undefined);
    /**
     * Login on the KAKU server and fetch the AES key and ics-2000 mac address stored on you account
     */
    login(): Promise<void>;
    /**
     * Pulls the list of devices connected to your ics-2000 from the serer
     * Stores the list of devices in this class and returns it
     */
    pullDevices(): Promise<object[]>;
    /**
     * Searh in you local network for the ics-2000. The ics-2000 listens to a broadcast message, so that's the way we find it out
     * @param searchTimeout The amount of milliseconds you want to wait for an answer on the sent message, before the promise is rejected
     * @param logger The logger you want to use to warn if search timed out and backup IP is specified
     */
    discoverHubLocal(searchTimeout?: number, logger?: Logger): Promise<string>;
    /**
     * Creates a command using the hub mac address and AES-key stored in this hub. Example for turning on a switch: function: 0, value: 1
     * @param deviceId The id of the device you want to run a function on
     * @param deviceFunction The function you want to run on the device
     * @param value The value for the function
     */
    createCommand(deviceId: number, deviceFunction: number, value: number): Command;
    /**
     * Creates a command to turn a device on or off and sends it to the ics-2000 ip address stored in this class
     * @param deviceId The id of the device you want to turn on or off
     * @param on Whether you want to turn the device on or off
     * @param onFunction The function used to turn the device on or off
     */
    turnDeviceOnOff(deviceId: number, on: boolean, onFunction?: number): Promise<void>;
    /**
     * Creates a command to dim a device and sends it to the ics-2000 ip address stored in this class
     * @param deviceId The id of the device tou want tot dim
     * @param dimFunction The function you want to use to dim the device
     * @param dimLevel The new dim value (0 = off, 255 = 100% brightness)
     */
    dimDevice(deviceId: number, dimFunction: number | undefined, dimLevel: any): Promise<void>;
    /**
     * Get the current status of a device
     * @param deviceId The id of the device you want to get the status of
     * @returns A list of numbers that represents the current status of the device.
     * index 0 is on/off status, index 4 is current dim level
     */
    getDeviceStatus(deviceId: number): Promise<number[]>;
}
//# sourceMappingURL=Hub.d.ts.map