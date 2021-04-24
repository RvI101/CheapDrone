import { client as redisClient } from './clients/redis.client';
import { ITADRepo } from './repository/itad.repo';
import { SteamIdRepo } from './repository/steam-id.repo';

export let DI = {
  storeMap: new Map() as Map<number, string>,
  steamIdRepo: new SteamIdRepo(redisClient),
  ITADRepo: new ITADRepo(redisClient),
};
