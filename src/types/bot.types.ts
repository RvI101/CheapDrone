import { Context } from 'telegraf';
import { SteamIdRepo } from '../repository/steam-id.repo';

export interface CheapDroneContext extends Context {
  steamIdRepo: SteamIdRepo;
}
