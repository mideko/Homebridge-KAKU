# Homebridge-KAKU-ICS2000-PLUS
homebridge module for KlikAanKlikUit / CoCo / Trust ICS-2000

Building on the great work of Youri Dijk.
I've mainly extended some of the KaKu device types, in particular for RGB/Hue Lightbulbs. Works nicely now.

All in JS, not TypeScript.




## Description

This plugin exposes the KAKU lights and switches to homekit. It does not handle any scenes or rules.

### Platform
Tested on IOS 14.

## Installation

1. Install [homebridge](https://github.com/homebridge/homebridge#installation)
2. Install this plugin: `npm install -g homebridge-kaku-ics2000-plus`
3. Update your `config.json` file (see below)

## Dependencies
Requires the NPM module color-convert


## Configuration
Add the following entries to the platforms section:

```json
"platforms": [
    {
        "name": "ICS2000",
        "email": "your_email@adres",
        "password": "_____",
        "platform": "KAKU-ICS2000-PLUS"
    }
]
```

### Core
| Key | Description | Default |
| --- | --- | --- |
| `name` | Must be `ICS2000` | N/A |
| `email` | Your email adress used to login to the ICS unit | N/A |
| `password` | Password to log on to the ICS unit | N/A |
| `platform` | Must be "KAKU-ICS2000-PLUS" | N/A |

 
 ### Configuration in Homekit
 After setting this up in Homebridge, you may want to assign the new KAKU items to rooms

 ## Known Issues
- Color wheels are notiously tricky (due to different color mappings) so still needs some work
