import got from 'got';
import {
  InlineQueryResultArticle,
  InputTextMessageContent,
  InlineKeyboardButton,
  InlineKeyboardMarkup,
} from 'telegraf/typings/telegram-types';
import {
  DealLookupResult,
  DealStubResult,
  GameLookupResult,
  GameSearchResult,
} from '../types/cheapshark.types';

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
