const { createClient } = require('redis');
require("dotenv").config();

const client = createClient({
    username:"default",
    password: process.env.REDIS_PASSWORD,
    socket: {
        host: 'redis-13398.c264.ap-south-1-1.ec2.redns.redis-cloud.com',
        port: 13398
    }
});

client.on('error', (err) => {
    console.log('Redis Client Error', err);
});

client.connect().then(() => {
    console.log('Redis client connected');
}).catch((err) => {
    console.error('Error connecting to Redis', err);
});

module.exports = client;