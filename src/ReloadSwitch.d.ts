import { KAKUPlatform } from './KAKUPlatform';
import { PlatformAccessory } from 'homebridge';
export declare class ReloadSwitch {
    private readonly platform;
    private readonly accessory;
    private readonly service;
    constructor(platform: KAKUPlatform, accessory: PlatformAccessory);
    /**
     * Get current state of this switch. This is always false, so reload is always possible
     * @private
     */
    private getState;
    /**
     * Rerun the setup on the platform
     * @private
     */
    private reload;
}
//# sourceMappingURL=ReloadSwitch.d.ts.map