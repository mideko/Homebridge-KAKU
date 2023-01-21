"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReloadSwitch = void 0;
class ReloadSwitch {
    constructor(platform, accessory) {
        this.platform = platform;
        this.accessory = accessory;
        /**
         * Get current state of this switch. This is always false, so reload is always possible
         * @private
         */
        this.getState = () => false;
        this.service = this.accessory.getService(this.platform.Service.Lightbulb) || this.accessory.addService(this.platform.Service.Lightbulb);
        this.service.getCharacteristic(this.platform.Characteristic.On)
            .onGet(this.getState.bind(this))
            .onSet(this.reload.bind(this));
    }
    /**
     * Rerun the setup on the platform
     * @private
     */
    async reload() {
        this.platform.logger.info('Reload switch pressed');
        await this.platform.setup();
    }
}
exports.ReloadSwitch = ReloadSwitch;
//# sourceMappingURL=ReloadSwitch.js.map