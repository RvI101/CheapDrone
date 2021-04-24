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
  public async getSteamIdRecord(plain: string): Promise<SteamIdRecord> {
    const valString = await this.client.hget(this.KEY, plain);
    if (!valString) {
      return new SteamIdRecord();
    }
    const ids = valString.split(',');

    const appReg = new RegExp(/app\/(\d+)/, 'i');
    const bundleReg = new RegExp(/bundle\/(\d+)/, 'i');
    const subReg = new RegExp(/sub\/(\d+)/, 'i');
    let result: string[] = [];
    let i = 0;
    let k = 0;
    const rules = [appReg, bundleReg, subReg];
    while (i < ids.length && k < rules.length) {
      let tmp;
      if ((tmp = rules[k].exec(ids[i])) !== null) {
        result[k] = tmp[1];
        i++;
        k++;
      } else {
        k++;
      }
    }

    return new SteamIdRecord(...result);
  }

  /**
   * loadKeys
   */
  public async loadKeys(map: { [key: string]: string[] }): Promise<number> {
    let steamIdMap: { [key: string]: string } = {};
    let cntr = 0;
    for (let [key, val] of Object.entries(map)) {
      steamIdMap[key] = val.toString();
      cntr++;
    }
    await this.client.pipeline().hset(this.KEY, steamIdMap).exec();
    return cntr;
  }
}
