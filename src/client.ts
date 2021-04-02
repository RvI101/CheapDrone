import axios from 'axios';
import {
  InlineQueryResultArticle,
  InputTextMessageContent,
  InlineKeyboardButton,
  InlineKeyboardMarkup,
} from 'telegraf/typings/telegram-types';
import { cache } from './cache';
import {
  DealLookupResult,
  DealStubResult,
  GameLookupResult,
  GameSearchResult,
} from './types';

// Helper functions
export const searchTitle = async (
  title: string
): Promise<Array<GameSearchResult>> => {
  const config = {
    method: 'get' as const,
    // TODO: Increase limit
    url: `http://www.cheapshark.com/api/1.0/games?title=${title}&limit=10`,
    headers: {},
  };
  if (title === '') {
    return [];
  }

  return axios(config)
    .then(
      (response: { data: GameSearchResult[] }): Array<GameSearchResult> => {
        return response.data;
      }
    )
    .catch((error: any) => {
      console.log(error);
      return [];
    });
};

export const gameToArticle = (
  game: GameSearchResult
): InlineQueryResultArticle => ({
  id: game.gameID,
  /** Title of the result */
  title: game.external,
  /** Content of the message to be sent */
  input_message_content: {
    message_text: `*${game.external}*`,
    parse_mode: 'Markdown',
  } as InputTextMessageContent,
  /** Inline keyboard attached for region preference */
  reply_markup: {
    inline_keyboard: [
      [
        {
          text: 'IN',
          callback_data: `${game.external}|${game.steamAppID}|IN|${game.gameID}`,
        },
        {
          text: 'US',
          callback_data: `${game.external}|${game.steamAppID}|US|${game.gameID}`,
        },
        {
          text: 'EU',
          callback_data: `${game.external}|${game.steamAppID}|DE|${game.gameID}`,
        },
      ],
    ] as InlineKeyboardButton.CallbackButton[][],
  } as InlineKeyboardMarkup,
  thumb_url: game.thumb,
  /** Thumbnail width */
  thumb_width: 20,
  /** Thumbnail height */
  thumb_height: 15,
  type: 'article',
});

export const getSteamPrices = async (appIds: string[]) => {
  const config = {
    method: 'get' as const,
    url: `http://store.steampowered.com/api/appdetails/?appids=${appIds.join(
      ','
    )}&filters=price_overview`,
    headers: {},
  };

  return axios(config)
    .then((res) => res.data)
    .catch((error) => {
      console.log(error);
      return {};
    });
};

export const getSteamPrice = async (appId: string, cc: string) => {
  const config = {
    method: 'get' as const,
    url: `http://store.steampowered.com/api/appdetails/?appids=${appId}&filters=price_overview&cc=${cc}`,
    headers: {},
  };
  return axios(config)
    .then((res) => res.data)
    .catch((error) => {
      console.error(error);
      return {};
    });
};

export const generateUpdatedMsg = async (
  queryString: string
): Promise<string> => {
  const [title, appId, cc, gameId] = queryString.split('|');
  if (!title || !appId || !cc) {
    throw new Error(`Error parsing callback_data: ${queryString}`);
  }
  switch (cc) {
    case 'IN':
    case 'DE':
      const priceResponse = await getSteamPrice(appId, cc);
      const localPrice =
        priceResponse[appId]?.data?.price_overview?.final_formatted ?? 'N/A';
      return `*${title}*\n_${localPrice}_ on Steam`;
    case 'US':
    default:
      const dealPriceResponse: DealStubResult = await getCheapestDeal(gameId);
      const dealPrice = dealPriceResponse?.price;
      const storeId = dealPriceResponse?.storeID;
      // console.log(cache.storeMap);
      // console.log(storeId);
      // console.log(cache.storeMap.get(storeId));
      return `*${title}*\n_\$ ${dealPrice}_ on ${cache.storeMap.get(storeId)}`;
  }
};

export const getDeal = async (dealId: string): Promise<DealLookupResult> => {
  var config = {
    method: 'get' as const,
    url:
      'https://www.cheapshark.com/api/1.0/deals?id=X8sebHhbc1Ga0dTkgg59WgyM506af9oNZZJLU9uSrX8%3D',
    headers: {},
  };

  return axios(config)
    .then((response) => response?.data)
    .catch(function (error) {
      console.error(error);
      return {};
    });
};

export const getCheapestDeal = async (
  gameId: string
): Promise<DealStubResult> => {
  var config = {
    method: 'get' as const,
    url: `https://www.cheapshark.com/api/1.0/games?id=${gameId}`,
    headers: {},
  };

  return axios(config)
    .then((response) => {
      const res: GameLookupResult = response?.data;
      const cheapestDeal: DealStubResult = res?.deals?.reduce((prev, curr) =>
        Number(prev.price) < Number(curr.price) ? prev : curr
      );
      return cheapestDeal;
    })
    .catch(function (error) {
      console.error(error);
      return {} as DealStubResult;
    });
};

export const refreshCache = async () => {
  let config = {
    method: 'GET' as const,
    url: 'http://www.cheapshark.com/api/1.0/stores',
    headers: {},
  };

  cache.storeMap = await axios(config)
    .then(function (response: {
      data: {
        map: (
          arg0: (store: any) => any[]
        ) => Iterable<readonly [number, string]>;
      };
    }) {
      // console.log(response.data);
      return new Map<
        number,
        string
      >(response.data.map((store: any) => [store.storeID, store.storeName]));
    })
    .catch(function (error: any) {
      console.log(error);
      return new Map<number, string>();
    });
  // console.log(cache.storeMap);
  if (cache.storeMap.size == 0) {
    return false;
  } else {
    return true;
  }
};
