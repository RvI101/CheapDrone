import { Redis } from 'ioredis';

export interface ITADRepo {
  getTitle: (plain: string) => Promise<string | null>;
  setKey: (title: string, plain: string) => Promise<boolean>;
  setKeys: (obj: { [key: string]: string }) => Promise<boolean>;
}

export class ITADRepo implements ITADRepo {
  readonly KEY: string = 'itad_title';
  client: Redis;
  constructor(client: Redis) {
    this.client = client;
  }

  getTitle = async (plain: string) => {
    return await this.client.hget(this.KEY, plain);
  };

  setKey = async (title: string, plain: string) => {
    const num = await this.client.hset(this.KEY, plain, title);
    return num > 0 ? true : false;
  };

  setKeys = async (obj: { [key: string]: string }) => {
    const res = await this.client.pipeline().hset(this.KEY, obj).exec();
    return !res.some((value) => value[0] !== null);
  };
}
