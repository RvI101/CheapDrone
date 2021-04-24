import Redis from 'ioredis';
import { readFileSync } from 'fs';

const REDISHOST = process.env.REDIS_IP || 'host.docker.internal';
const REDISPORT = process.env.REDIS_PORT || 6379;

export const client = new Redis(Number(REDISPORT), REDISHOST, {
  enableAutoPipelining: true,
  lazyConnect: true,
});
client.on('error', (err) => {
  console.error('ERR:REDIS:', err);
});
