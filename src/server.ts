import { Context, Telegraf } from 'telegraf';
import Fastify from 'fastify';

import telegrafPlugin from 'fastify-telegraf';
import { accessSecretVersion } from './clients/secret-manager.client';
import {
  gameToArticle,
  getSteamId,
  loadSteamIdRepo,
} from './services/bot.service';
import { searchGames } from './fetchers/itad-api.fetcher';
import {
  getSteamAppPrice,
  getSteamPackagePrice,
} from './fetchers/steam-api.fetcher';
import { callbackQueryHandler, inlineQueryHandler } from './handlers';

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
  return await loadSteamIdRepo();
});

app.get('/plain/:plain', async (request: any, reply: any) => {
  return await getSteamId(request.params.plain);
});

app.get('/steam/app/:appId', async (request: any, reply: any) => {
  return await getSteamAppPrice(request.params.appId, 'IN');
});

app.get('/steam/sub/:appId', async (request: any, reply: any) => {
  return await getSteamPackagePrice(request.params.subId, 'IN');
});

app.get('/search', async (request: any, reply: any) => {
  return (await searchGames(request.query.q)).map(gameToArticle);
});

app.register(telegrafPlugin, { bot, path: SECRET_PATH });

// Bot Listeners
bot.hears('hi', async (ctx: Context) => {
  return await ctx.reply('OK.');
});
bot.hears('Hi', async (ctx: Context) => {
  return await ctx.reply('OK.');
});

bot.on('inline_query', inlineQueryHandler);

bot.on('callback_query', callbackQueryHandler);

// bot.telegram.setWebhook(WEBHOOK_URL).then(() => {
//   console.log('Webhook is set on', WEBHOOK_URL);
// });

app.listen(PORT, '0.0.0.0').then(() => {
  console.log('Listening on port', PORT);
});
