import { createRequire } from 'module';
const require = createRequire(import.meta.url);

require('@google-cloud/trace-agent').start({
  samplingRate: 5, // sample 5 traces per second, or at most 1 every 200 milliseconds.
  ignoreMethods: ['options'], // ignore requests with OPTIONS method (case-insensitive).
});
import { Context, Telegraf } from 'telegraf';
import { InlineQueryResultArticle } from 'typegram';
import Fastify from 'fastify';
import { CallbackQuery } from 'telegraf/typings/telegram-types';
import { GameSearchResult } from './types';
import {
  searchTitle,
  gameToArticle,
  generateUpdatedMsg,
  refreshCache,
} from './client';

import telegrafPlugin from 'fastify-telegraf';
import { accessSecretVersion } from './secretClient';

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

// TODO: Remove this
app.get('/token', async (request, reply) => {
  return await accessSecretVersion();
});

app.addHook('onReady', async () => {
  // setup logic
  await refreshCache();
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
  const ok = await refreshCache();
  if (ok) {
    ctx.reply('Refreshed.');
  } else {
    ctx.reply('Refresh failed!');
  }
});

bot.on('inline_query', async (ctx: Context) => {
  let gameArticles: InlineQueryResultArticle[] = [];
  let games: GameSearchResult[] = [];
  try {
    const title = ctx.inlineQuery?.query;
    games = await searchTitle(title ?? '');
    gameArticles = games.map(gameToArticle);
  } catch (error) {
    console.error('Error' + error);
  } finally {
    ctx.answerInlineQuery(gameArticles);
  }
});

bot.on('callback_query', async (ctx: Context) => {
  // console.log('Got callback query');
  // console.log(ctx.callbackQuery);
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
