import got from 'got';
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
  DummyTodo,
  GameLookupResult,
  GameSearchResult,
} from './types';

// API functions
export const searchTitle = async (
  title: string
): Promise<Array<GameSearchResult>> => {
  const url = 'http://www.cheapshark.com/api/1.0/games';
  const config = {
    searchParams: {
      title: title,
      limit: 10,
    },
    headers: {},
  };
  if (title === '') {
    return [];
  }

  try {
    const response = got.get(url, config).json<Array<GameSearchResult>>();
    return response;
  } catch (error) {
    console.log(error);
    return [];
  }
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

export const getSteamPrice = async (appId: string, cc: string) => {
  const url = 'http://store.steampowered.com/api/appdetails/';
  const config = {
    headers: {},
    searchParams: {
      appids: appId,
      filters: 'price_overview',
      cc: cc,
    },
  };

  try {
    return got.get(url, config).json<any>();
  } catch (error) {
    console.error();
    return {};
  }
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

export const getCheapestDeal = async (
  gameId: string
): Promise<DealStubResult> => {
  const url = 'https://www.cheapshark.com/api/1.0/games';
  var config = {
    searchParams: {
      id: gameId,
    },
    headers: {},
  };

  try {
    const response = await got.get(url, config).json<GameLookupResult>();
    const cheapestDeal: DealStubResult = response?.deals?.reduce((prev, curr) =>
      Number(prev.price) < Number(curr.price) ? prev : curr
    );
    return cheapestDeal;
  } catch (error) {
    console.error(error);
    return {} as DealStubResult;
  }
};

export const refreshCache = async () => {
  const url = 'http://www.cheapshark.com/api/1.0/stores';
  let config = {
    headers: {},
  };

  cache.storeMap = await got
    .get(url, config)
    .json<any>()
    .then(function (response: {
      map: (arg0: (store: any) => any[]) => Iterable<readonly [number, string]>;
    }) {
      return new Map<number, string>(
        response.map((store: any) => [store.storeID, store.storeName])
      );
    })
    .catch(function (error: any) {
      console.log(error);
      return new Map<number, string>();
    });
  if (cache.storeMap.size == 0) {
    return false;
  } else {
    return true;
  }
};
