import Redis from 'ioredis';

const REDISHOST = process.env.REDIS_HOST || 'localhost';
const REDISPORT = process.env.REDIS_PORT || 6379;

export const client = new Redis(Number(REDISPORT), REDISHOST);
client.on('error', (err) => console.error('ERR:REDIS:', err));
