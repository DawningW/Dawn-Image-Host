import Redis from "ioredis";

import config from "../config.js";

const redisOption = {
    host: config.redis.host,
    port: config.redis.port,
    password: config.redis.password
};

export const imageCache = new Redis({
    ...redisOption,
    db: 4,
    lazyConnect: true
});

export const imageTimer = new Redis({
    ...redisOption,
    db: 5,
    lazyConnect: true
});

export function subExpired(db, callback) {
    const sub = db.duplicate();
    sub.subscribe(`__keyevent@${sub.options.db}__:expired`, (err, count) => {
        if (err) {
            console.error(`Failed to subscribe: ${err.message}`);
            return;
        }
        console.log(`Subscribed successfully! Currently subscribe to ${count} channels`);
    });
    sub.on("message", (channel, message) => {
        if (channel?.includes("expired")) {
            callback(message);
        }
    });
}

if (config.debug) {
    imageCache.monitor((err, monitor) => {
        monitor.on("monitor", console.log);
    });
}
