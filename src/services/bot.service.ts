// import { createRequire } from 'module';
// const require = createRequire(import.meta.url);
// var escape = require('markdown-escape');
import {
  InlineQueryResultArticle,
  InputTextMessageContent,
  InlineKeyboardButton,
  InlineKeyboardMarkup,
} from 'telegraf/typings/telegram-types';
import { itadURLs } from '../constants/itad.constants';
import { currencySymbols } from '../constants/price.constants';
import { DI } from '../DI';
import { getLowestPrice, getPlainIdMap } from '../fetchers/itad-api.fetcher';
import { getSteamPrice } from '../fetchers/steam-api.fetcher';
import { GameSearchResult } from '../types/itad.types';

export const generateUpdatedMsg = async (
  queryString: string
): Promise<string> => {
  const [cc, plain] = queryString.split('|');
  if (!cc || !plain) {
    throw new Error(`Error parsing callback_data: ${queryString}`);
  }
  const title$ = DI.ITADRepo.getTitle(plain);
  const record$ = DI.steamIdRepo.getSteamIdRecord(plain);
  const [title, record] = await Promise.all([title$, record$]);
  console.log(record);
  switch (cc) {
    case 'EU':
      const euPrice = (await getLowestPrice(plain, 'eu1', 'DE'))?.price_new;
      return `\`${title}\`\n\`${currencySymbols.EU}${euPrice}\` on Steam`;
    case 'IN':
      if (record && !record?.isBundle()) {
        const indiaPrice = await getSteamPrice(record, cc);
        console.log(indiaPrice);
        return `\`${title}\`\n\`${currencySymbols.IN}${indiaPrice}\` on Steam`;
      }
    case 'US':
    default:
      const usPrice = (await getLowestPrice(plain, 'us', 'US'))?.price_new;
      return `\`${title}\`\n\`${currencySymbols.US}${usPrice}\` on Steam`;
  }
};

export const loadSteamIdRepo = async (): Promise<number> => {
  const map = await getPlainIdMap('steam');
  return await DI.steamIdRepo.loadKeys(map);
};

export const getSteamId = async (plain: string) => {
  return DI.steamIdRepo.getSteamIdRecord(plain);
};

export const persistTitles = async (games: GameSearchResult[]) => {
  const obj = games.reduce((obj, cur, _i) => {
    return { ...obj, [cur.plain]: cur.title };
  }, {});
  return DI.ITADRepo.setKeys(obj);
};

export const gameToArticle = (
  game: GameSearchResult
): InlineQueryResultArticle => ({
  id: game.id,
  /** Title of the result */
  title: game.title,
  /** Content of the message to be sent */
  input_message_content: {
    message_text: `\`${game.title}\``,
    parse_mode: 'MarkdownV2',
  } as InputTextMessageContent,
  /** Inline keyboard attached for region preference */
  reply_markup: {
    inline_keyboard: [
      [
        {
          text: 'IN',
          callback_data: `IN|${game.plain}`,
        },
        {
          text: 'US',
          callback_data: `US|${game.plain}`,
        },
        {
          text: 'EU',
          callback_data: `EU|${game.plain}`,
        },
      ],
    ] as InlineKeyboardButton.CallbackButton[][],
  } as InlineKeyboardMarkup,
  url: itadURLs.info(game.plain),
  thumb_height: 0,
  thumb_width: 0,
  type: 'article',
});
