import { LightBulb } from './LightBulb';
import { KAKUPlatform } from './KAKUPlatform';
import { PlatformAccessory } from 'homebridge';
export declare class DimmableLightBulb extends LightBulb {
    constructor(platform: KAKUPlatform, accessory: PlatformAccessory);
    private getBrightness;
    private changeBrightness;
}
//# sourceMappingURL=DimmableLightBulb.d.ts.map