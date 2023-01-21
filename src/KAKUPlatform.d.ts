import { API, DynamicPlatformPlugin, Logger, PlatformAccessory, PlatformConfig, Service, Characteristic } from 'homebridge';
import { Hub } from './Hub';
export declare class KAKUPlatform implements DynamicPlatformPlugin {
    readonly logger: Logger;
    readonly config: PlatformConfig;
    readonly api: API;
    readonly Service: typeof Service;
    readonly Characteristic: typeof Characteristic;
    private readonly cachedAccessories;
    readonly hub: Hub;
    constructor(logger: Logger, config: PlatformConfig, api: API);
    setup(): void;
    configureAccessory(accessory: PlatformAccessory): void;
    /**
     * Create a new instance of a Lightbulb
     * Currently, device types is limited to on/off switches (LightBulbs in this library)
     * and dimmable lights (DimmableLightBulb in this library)
     * I don't have other types of devices
     * @param accessory The accessory object you want to create a new Device with
     * @param deviceType The device type, this is stored in device json as followed: data->module->device
     * but also stored as device key in the device object itself (see Hub.ts)
     * @private
     */
    private createDevice;
    private discoverDevices;
    /**
     * Create a reload switch, so you can rerun the setup without touching homebridge
     * @private
     */
    private createReloadSwitch;
}
//# sourceMappingURL=KAKUPlatform.d.ts.map