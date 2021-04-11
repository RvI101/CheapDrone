import { client as redisClient } from './clients/redis.client';
import { SteamIdRepo } from './repository/steam-id.repo';

export let DI = {
  storeMap: new Map() as Map<number, string>,
  steamIdRepo: new SteamIdRepo(redisClient),
};
