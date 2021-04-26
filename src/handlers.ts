import { Context } from 'telegraf';
import {
  CallbackQuery,
  InlineQueryResultArticle,
} from 'telegraf/typings/telegram-types';
import {
  getInlineErrorArticle,
  searchGames,
} from './fetchers/itad-api.fetcher';
import {
  gameToArticle,
  generateUpdatedMsg,
  persistTitles,
} from './services/bot.service';
import { GameSearchResult } from './types/itad.types';
// import { createRequire } from 'module';
// const require = createRequire(import.meta.url);

// const tracer = require('@google-cloud/trace-agent').start({
//   samplingRate: 5, // sample 5 traces per second, or at most 1 every 200 milliseconds.
//   ignoreMethods: ['options'], // ignore requests with OPTIONS method (case-insensitive).
// });

export const inlineQueryHandler = async (ctx: Context) => {
  // const inlineQuerySpan = tracer.createChildSpan({ name: 'inline-query-span' });
  let gameArticles: InlineQueryResultArticle[] = [];
  let games: GameSearchResult[] = [];
  try {
    const title = ctx.inlineQuery?.query;
    // const searchTitleSpan = inlineQuerySpan.createChildSpan({
    //   name: 'search-title-span',
    // });
    if (!title || title === '') {
      return await ctx.answerInlineQuery([
        getInlineErrorArticle('Blank query!'),
      ]);
    }
    games = await searchGames(title ?? '');
    if (games.length > 0) {
      const ok = persistTitles(games);
      gameArticles = games.map(gameToArticle);
      await ok;
    } else {
      gameArticles = [getInlineErrorArticle('No results found!')];
    }
    // searchTitleSpan.endSpan();
  } catch (error) {
    console.error('Error' + error);
    gameArticles = [getInlineErrorArticle('Error fetching results!')];
  } finally {
    // inlineQuerySpan.endSpan();
    // console.log(gameArticles);
    ctx.answerInlineQuery(gameArticles);
  }
};

export const callbackQueryHandler = async (ctx: Context) => {
  const cbQuery = ctx.callbackQuery as CallbackQuery.DataCallbackQuery;
  try {
    let text = await generateUpdatedMsg(cbQuery.data);
    ctx.editMessageText(text, {
      parse_mode: 'MarkdownV2',
      reply_markup: undefined,
    });
  } catch (error) {
    console.error(error);
  } finally {
    ctx.answerCbQuery();
  }
};
