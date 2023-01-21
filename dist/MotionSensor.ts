import {CharacteristicValue, HAPStatus, Logger, PlatformAccessory, Service} from 'homebridge';
import {Hub} from './Hub';
import {KAKUPlatform} from './KAKUPlatform';

/**
 * This class is a simple KAKU or other zigbee motion sensor connected to your ics 2000. This motion sensor can only signal motion detected 
 */
export class MotionSensor {
  protected readonly service: Service;
  protected readonly deviceData: Record<string, never>;
  protected readonly deviceId: number;
  protected readonly deviceName: string;
  protected readonly hub: Hub;
  protected readonly logger: Logger;

  // The index the status for motion detected is stored and the function to use when you turn a device on/off
  protected motionCharacteristicFunction = 0;

  constructor(
    protected readonly platform: KAKUPlatform,
    protected readonly accessory: PlatformAccessory,
  ) {
    this.deviceData = accessory.context.device;
    this.deviceName = accessory.context.name;
    this.deviceId = Number(this.deviceData.id);
    this.hub = platform.hub;
    this.logger = platform.logger;

    this.accessory.getService(this.platform.Service.AccessoryInformation)!
      .setCharacteristic(this.platform.Characteristic.Manufacturer, 'Klik Aan Klik Uit')
      .setCharacteristic(this.platform.Characteristic.SerialNumber, this.deviceId.toString());

    this.service = this.accessory.getService(this.platform.Service.MotionSensor) || this.accessory.addService(this.platform.Service.MotionSensor);

    this.service.getCharacteristic(this.platform.Characteristic.MotionDetected)
      .onSet(this.setOn.bind(this))
      .onGet(this.getOn.bind(this));
  }

  public async setOn(newValue: CharacteristicValue) {
    try {
      const newState = newValue as boolean;
      const currentState = this.service.getCharacteristic(this.platform.Characteristic.MotionDetected).value;
	//log message than value cannot be set for a motion sensor
      this.logger.debug('Current state is ' + currentState +'; you cannot SET this value');

    } catch (e) {
      this.platform.logger.error(`Error changing state for ${this.deviceName}: ${e}`);
      throw new this.platform.api.hap.HapStatusError(HAPStatus.SERVICE_COMMUNICATION_FAILURE);
    }
  }

  public async getOn() {
    try {
      // Get status for this device
      const status = (await this.hub.getDeviceStatus(this.deviceId))[this.motionCharacteristicFunction];
      this.platform.logger.debug(`Current state for ${this.deviceName}: ${status}`);

      return status === 1;
    } catch (e) {
      this.platform.logger.error(`Error getting state for ${this.deviceName}: ${e}`);
      throw new this.platform.api.hap.HapStatusError(HAPStatus.SERVICE_COMMUNICATION_FAILURE);
    }
  }
}