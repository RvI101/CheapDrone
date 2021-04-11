import { Redis } from 'ioredis';
import { SteamIdRecord } from '../types/steam-id.types';

export class SteamIdRepo {
  readonly KEY: string = 'steam_id';
  client!: Redis;
  constructor(client: Redis) {
    this.client = client;
  }

  /**
   * getSteamId
   */
  public async getSteamIdRecord(plain: string): Promise<SteamIdRecord | null> {
    const valString = await this.client.hget(this.KEY, plain);
    if (!valString) {
      return null;
    }
    const ids = valString.split(',');
    if (ids.length == 1) {
      return { appId: ids[0].split('/')[1] } as SteamIdRecord;
    } else {
      return {
        appId: ids[0].split('/')[1],
        subId: ids[1].split('/')[1],
      } as SteamIdRecord;
    }
  }

  /**
   * loadKeys
   */
  public async loadKeys(map: { [key: string]: string[] }) {
    let steamIdMap: { [key: string]: string } = {};
    for (let [key, val] of Object.entries(map)) {
      steamIdMap[key] = val.toString();
    }
    await this.client.hset(this.KEY, steamIdMap);
  }
}
