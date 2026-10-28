"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Publisher = void 0;
const mqtt = require("mqtt");
class Publisher {
    constructor(config, devicetypes, logger) {
        this.config = config;
        this.devicetypes = devicetypes;
        this.logger = logger;
        this.callBack = null;
        this.callbacks = [];
        const options = {
            will: {
                topic: `${config.baseTopic}/bridge/availability`,
                payload: 'offline',
                retain: true,
            },
            username: config.username,
            password: config.password,
            clientId: "MQTT4HB_KAKU"
        };
        this.mqttClient = mqtt.connect(config.brokerUrl, options);
        
        this.mqttClient.on("connect", () => {
            this.logger.info(`${Date().toLocaleString()} Connected to MQTT broker`);
            this.publishOnline();
        });
        this.mqttClient.on("reconnect", () => {
            this.logger.warn(`${Date().toLocaleString()} Reconnecting to MQTT broker`);
        });
        this.mqttClient.on("disconnect", () => {
            this.logger.warn(`${Date().toLocaleString()} Disconnected from MQTT broker`);
        });
        
        this.mqttClient.on("message", (topic, payload, packet) => {
          // Payload is Buffer
            this.logger.debug(`Received Topic: ${topic}, Message: ${payload.toString()}, QoS: ${packet.qos}`);
            let topic_idx = this.callbacks.findIndex(item => item.topic === topic);
            this.callBack = this.callbacks[topic_idx].callback;
            this.callBack(this.callbacks[topic_idx].device,topic, JSON.parse(payload));
        });
        
    }
    publishOnline() {
        return __awaiter(this, void 0, void 0, function* () {
            const availability = [
                {
                    topic: `${this.config.baseTopic}/bridge/availability`
                }
            ];

            // These are the standard entities: set_status, alarm_status, comms_test and event
            // all which will appear in HA under $baseTopic and will have JSON formatted messages
            // published to them.


            try {
                // Set our bridge availability to online
                yield this.publish("bridge/availability", "online", true);
                // Advertise the presence of all standard entities so they can be discovered

                // Set initial statuses for standard entities
                //yield this.publishJSON("Alarmering", { state: false });
            }
            catch (ex) {
                this.logger.error(`${Date().toLocaleString()} publishOnline() error: ${ex}`);
            }
        });
    }
    subscribe(subTopic,myDevice, myCallback) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                yield this.mqttClient.subscribe(`${this.config.baseTopic}/${subTopic}`);
                //save callback for messages received
                this.callbacks.push({topic: `${this.config.baseTopic}/${subTopic}`, device: myDevice, callback: myCallback });
                //this.logger.info(this.callbacks);
            }
            catch (error) {
                throw `subscribe() error ${error}`;
            }
        });
    }
    publish(subTopic, data, retain) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                yield this.mqttClient.publish(`${this.config.baseTopic}/${subTopic}`, data, { retain: retain || false });
            }
            catch (error) {
                throw `publish() error ${error}`;
            }
        });
    }
    publishJSON(subTopic, data, retain) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                yield this.mqttClient.publish(`${this.config.baseTopic}/${subTopic}`, JSON.stringify(data), { retain: retain || false });
            }
            catch (error) {
                throw `publishJSON() error ${error}`;
            }
        });
    }
    publishJSONdiscovery(discoveryTopic, data, retain) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                yield this.mqttClient.publish(`${discoveryTopic}`, JSON.stringify(data), { retain: retain || false });
            }
            catch (error) {
                throw `publishJSONdiscovery() error ${error}`;
            }
        });
    }
}
exports.Publisher = Publisher;

