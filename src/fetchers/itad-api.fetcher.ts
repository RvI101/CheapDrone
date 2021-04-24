import got from 'got';
import {
  InlineQueryResultArticle,
  InputTextMessageContent,
  InlineKeyboardButton,
  InlineKeyboardMarkup,
} from 'telegraf/typings/telegram-types';
import { itadURLs } from '../constants/itad.constants';
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
      limit: 10,
      strict: 0,
    },
    headers: {},
  };

  const response = await got
    .get(url, config)
    .json<{ data: { results: GameSearchResult[] } }>();
  return response.data?.results;
};

export const getInlineErrorArticle = (message: string) =>
  ({
    id: '-1',
    title: message,
    type: 'article',
    input_message_content: {
      message_text: `*${message}*`,
      parse_mode: 'Markdown',
    } as InputTextMessageContent,
    thumb_height: 0,
    thumb_width: 0,
  } as InlineQueryResultArticle);

export const getLowestPrice = async (
  plain: string,
  region: string,
  country: string
): Promise<GamePriceResult | null> => {
  const url = 'https://api.isthereanydeal.com/v01/game/prices';
  var config = {
    searchParams: {
      key: API_KEY,
      plains: plain,
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
