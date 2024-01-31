"use strict";
const settings = require("./settings");
const KAKUPlatform = require("./KAKUPlatform");
module.exports = (api) => {
    api.registerPlatform(settings.PLATFORM_NAME, KAKUPlatform.KAKUPlatform);
};

