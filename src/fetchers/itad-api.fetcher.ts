import got from 'got';
import {
  InlineQueryResultArticle,
  InputTextMessageContent,
  InlineKeyboardButton,
  InlineKeyboardMarkup,
} from 'telegraf/typings/telegram-types';
import { GamePriceResult, GameSearchResult } from '../types/itad.types';
const API_KEY = '2c44d314984649a0de535806f9e9dc9af202d6d9';

export const searchGames = async (
  title: string
): Promise<Array<GameSearchResult>> => {
  const url = 'https://api.isthereanydeal.com/v02/search/search';
  var config = {
    searchParams: {
      key: API_KEY,
      q: title,
      limit: 20,
      strict: 0,
    },
    headers: {},
  };

  try {
    const response = await got
      .get(url, config)
      .json<{ data: { results: GameSearchResult[] } }>();
    return response.data?.results;
  } catch (error) {
    console.error(error);
    return [];
  }
};

export const gameToArticle = (
  game: GameSearchResult
): InlineQueryResultArticle => ({
  id: game.id,
  /** Title of the result */
  title: game.title,
  /** Content of the message to be sent */
  input_message_content: {
    message_text: `*${game.title}*`,
    parse_mode: 'Markdown',
  } as InputTextMessageContent,
  /** Inline keyboard attached for region preference */
  reply_markup: {
    inline_keyboard: [
      [
        {
          text: 'IN',
          callback_data: `${game.title}|IN|${game.plain}`,
        },
        {
          text: 'US',
          callback_data: `${game.title}|US|${game.plain}`,
        },
        {
          text: 'EU',
          callback_data: `${game.title}|EU|${game.plain}`,
        },
      ],
    ] as InlineKeyboardButton.CallbackButton[][],
  } as InlineKeyboardMarkup,
  type: 'article',
});

export const getLowestPrice = async (
  plain: string,
  region: string,
  country: string
): Promise<GamePriceResult | null> => {
  const url = 'https://api.isthereanydeal.com/v01/game/storelow';
  var config = {
    searchParams: {
      key: API_KEY,
      plains: plain,
      limit: 20,
      strict: 0,
      region: region,
      country: country,
    },
    headers: {},
  };
  try {
    const response = await got.get(url, config).json<any>();
    return (response.data[plain]?.list?.[0] as GamePriceResult) ?? null;
  } catch (error) {
    console.error(error);
    return null;
  }
};

export const getPlainIdMap = async (
  store: string
): Promise<{ [key: string]: string[] }> => {
  const url = 'https://api.isthereanydeal.com/v01/game/map';
  var config = {
    searchParams: {
      key: API_KEY,
      shop: store,
      type: 'plain:id',
    },
    headers: {},
  };
  try {
    const response = await got
      .get(url, config)
      .json<{ data: { [key: string]: string[] } }>();
    return response.data;
  } catch (error) {
    console.error(error);
    return {};
  }
};
