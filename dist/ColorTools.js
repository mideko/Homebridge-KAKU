"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ColorTools = void 0;
const convertColor = require("color-convert"); //npm module

class ColorTools {

    /**
     * Encrypt a string data with AES 128 CBC with a 16-bit IV of only zeros and a given key. Returns the data in a HEX string
     * @param data The data you want to encrypt
     * @param aesKey The used for the encryption
     */
    cvrt(r,g,b) {
        const cv = convert.rgb.hex(r, g, b);
        return cv.toString;
    }

    deserialize_yxy_to_hsl(v) {
        
        const MAX_UINT_16 = Math.pow(2,16)-1;
       
        let buffer = new Uint32Array(1).buffer;
        let dataView = new DataView(buffer);
        dataView.setUint32(0,v); //load value onto array
        let x = dataView.getUint16(0)/MAX_UINT_16;
        let y = dataView.getUint16(2)/MAX_UINT_16;
        const Y = 100;  //default 100, but how to get correct value?

        let myX = (x * Y) / y;
        let myY = Y;
        let myZ = ((1.0-x-y)*Y) / y;
        let stepRGB = convertColor.xyz.rgb(myX,myY,myZ);
        //console.log(stepRGB[0],stepRGB[1],stepRGB[2]);
        return convertColor.rgb.hsl(stepRGB[0],stepRGB[1],stepRGB[2]);
    }
    
    serialize_hsl_to_yxy(hsl) {
        //transform hsl from homekit to KAKU device specific code Yxy based code
        const MAX_UINT_16 = Math.pow(2,16)-1;
        let buffer = new Uint32Array(1).buffer;
        let dataView = new DataView(buffer);
        
        let stepRGB = convertColor.hsl.rgb(hsl[0],hsl[1],hsl[2]);
        //console.log('RGB:' + stepRGB);
        let xyz = convertColor.rgb.xyz(stepRGB[0],stepRGB[1],stepRGB[2]);
        //console.log('xyz:' + xyz);
        let myX = xyz[0];
        let myY = xyz[1];
        let myZ = xyz[2];
        
        let y = myY / (myZ+myY+myZ);
        let x = myX / (myX+myY+myZ);
        let Y = myY;
        
        let p1 = Math.trunc(x * MAX_UINT_16);
        let p2 = Math.trunc(y * MAX_UINT_16);
        
        //console.log (p1,p2);
        
        dataView.setUint16(0,p1*100);
        dataView.setUint16(2,p2*100);
        
        let deviceValue = dataView.getUint32(0)
        //console.log(deviceValue);
        return deviceValue;

    }
    
}
exports.ColorTools = ColorTools;
//# sourceMappingURL=Cryptographer.js.map
