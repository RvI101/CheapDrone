import { createRequire } from 'module';
const require = createRequire(import.meta.url);

const tracer = require('@google-cloud/trace-agent').start({
  samplingRate: 5, // sample 5 traces per second, or at most 1 every 200 milliseconds.
  ignoreMethods: ['options'], // ignore requests with OPTIONS method (case-insensitive).
});
import { Context, Telegraf } from 'telegraf';
import { InlineQueryResultArticle } from 'typegram';
import Fastify from 'fastify';
import { CallbackQuery } from 'telegraf/typings/telegram-types';

import telegrafPlugin from 'fastify-telegraf';
import { accessSecretVersion } from './clients/secret-manager.client';
import { generateUpdatedMsg, loadSteamIdRepo } from './services/bot.service';
import { gameToArticle, searchGames } from './fetchers/itad-api.fetcher';
import { GameSearchResult } from './types/itad.types';

// Fetch token from Secret Manager
const BOT_TOKEN = await accessSecretVersion();
const PORT = process.env.PORT || 8443;
const SECRET_PATH = `/${BOT_TOKEN}`;

// if (!WEBHOOK_URL) throw new Error('"WEBHOOK_URL" env var is required!');
if (!BOT_TOKEN) throw new Error('"BOT_TOKEN" env var is required!');

const bot = new Telegraf(BOT_TOKEN);
const app = Fastify();

app.get('/', async (request: any, reply: any) => {
  return { hello: 'world' };
});

app.post('/loadSteamIdRepo', async (request: any, reply: any) => {
  await loadSteamIdRepo();
});

app.register(telegrafPlugin, { bot, path: SECRET_PATH });

// Bot Listeners
bot.hears('hi', async (ctx: Context) => {
  return await ctx.reply('OK.');
});
bot.hears('Hi', async (ctx: Context) => {
  return await ctx.reply('OK.');
});

bot.command('refresh', async (ctx: Context) => {
  const ok = true;
  if (ok) {
    ctx.reply('Refreshed.');
  } else {
    ctx.reply('Refresh failed!');
  }
});

bot.on('inline_query', async (ctx: Context) => {
  const inlineQuerySpan = tracer.createChildSpan({ name: 'inline-query-span' });
  let gameArticles: InlineQueryResultArticle[] = [];
  let games: GameSearchResult[] = [];
  try {
    const title = ctx.inlineQuery?.query;
    const searchTitleSpan = inlineQuerySpan.createChildSpan({
      name: 'search-title-span',
    });
    games = await searchGames(title ?? '');
    gameArticles = games.map(gameToArticle);
    searchTitleSpan.endSpan();
  } catch (error) {
    console.error('Error' + error);
  } finally {
    inlineQuerySpan.endSpan();
    ctx.answerInlineQuery(gameArticles);
  }
});

bot.on('callback_query', async (ctx: Context) => {
  const cbQuery = ctx.callbackQuery as CallbackQuery.DataCallbackQuery;
  try {
    let text = await generateUpdatedMsg(cbQuery.data);
    ctx.editMessageText(text, {
      parse_mode: 'Markdown',
      reply_markup: undefined,
    });
  } catch (error) {
    console.error(error);
  } finally {
    ctx.answerCbQuery();
  }
});

// bot.telegram.setWebhook(WEBHOOK_URL).then(() => {
//   console.log('Webhook is set on', WEBHOOK_URL);
// });

app.listen(PORT, '0.0.0.0').then(() => {
  console.log('Listening on port', PORT);
});
