"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Outlet = void 0;
/**
 * This class is a  KAKU or other zigbee outlet connected to your ics 2000. This outlet can only turn off and on
 */
const {Light} = require("./Light");
class Outlet extends Light {
    constructor(platform, accessory) {
        super(platform, accessory);
        // The Function for turning a dimmable zigbee lightbulb on or off is 3
        this.onOffCharacteristicFunction = 3;
        this.accessory.removeService(this.platform.Service.Lightbulb);
        this.service = this.accessory.getService(this.platform.Service.Outlet) || this.accessory.addService(this.platform.Service.Outlet);
    }
    
}
exports.Outlet = Outlet;


/*
public static final int INDEX COLOR HUE_TRANSITION = 12;
public static final int INDEX COLOR_ LOOP = 11;
public static final int INDEX COLOR POINTER = 10;
public static final int INDEX_COLOR_TEMPERATURE = 9;
public static final int INDEX COLOR XY = 5;
public static final int INDEX DIM = 4;
public static final int INDEX_ GROUP = 2;
public static final int INDEX HUE = 6;
public static final int INDEX HUE SATURATION = 8;
public static final int INDEX LIGHTNESS = 7;
public static final int INDEX ON OFF = 3;
*/
