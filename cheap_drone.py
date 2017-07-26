import sys
import asyncio
import time
import aiohttp
from aiohttp import web
import telepot
from pprint import pprint
from telepot.aio.loop import MessageLoop, OrderedWebhook
from telepot.aio.helper import UserHandler, AnswererMixin
from telepot.aio.delegate import per_inline_from_id, per_from_id, create_open, pave_event_space
from telepot.namedtuple import InlineQueryResultArticle, InputTextMessageContent


class GameDealer(UserHandler, AnswererMixin):
	def __init__(self, *args, **kwargs):
		super().__init__(*args, **kwargs)
		self._stores = {
			'1': 'Steam',
			'2': 'GamersGate',
			'3': 'GreenManGaming',
			'4': 'Amazon',
			'5': 'GameStop',
			'6': 'Direct2Drive',
			'7': 'GoG',
			'8': 'Origin',
			'9': 'GetGames',
			'10': 'ShinyLoot',
			'11': 'HumbleStore',
			'12': 'Desura',
			'13': 'Uplay',
			'14': 'IndieGameStand',
			'15': 'BundleStars',
			'16': 'Gamesrocket',
			'17': 'GamesRepublic',
			'18': 'SilaGames',
			'19': 'Playfield',
			'20': 'ImperialGames',
			'21': 'WinGameStore',
			'22': 'FunStockDigital',
			'23': 'GameBillet'
		}
		self._chat_id = None

	async def fetch(self, session, url, params=None):
		with aiohttp.Timeout(10):
			try:
				async with session.get(url, params=params) as response:
					print(response.url)
					return await response.json()
			except Exception as e:
				print(response.url, str(e))

	async def on_inline_query(self, msg):
		async def compute_answer():
			start_time = time.time()
			query_id, from_id, title_string = telepot.glance(msg, flavor='inline_query')
			print (title_string)
			if title_string == None or title_string == '':
				return [InlineQueryResultArticle(
							id='0',
							title='No results',
							input_message_content=InputTextMessageContent(
								message_text='No results'
							)
					   )]
			params = {'title': title_string, 'limit': 12}
			url = "http://www.cheapshark.com/api/1.0/games" #CheapShark Games Search
			games = []
			print('{} seconds have passed'.format(time.time() - start_time))
			for g in await self.fetch(session, url, params=params):
				game = {
					'id' : g.get('cheapestDealID'),
					'type': 'article',
					'title': g.get('external'),
					'thumb_url': g.get('thumb'),
					'input_message_content': {
						'message_text': g.get('external')
					},
					'thumb_width': 75,
					'thumb_height': 75
				}
				games.append(game)
			print('{} seconds have passed'.format(time.time() - start_time))
			return games

		self.answerer.answer(msg, compute_answer)

	async def on_chosen_inline_result(self, msg):
		print('CHOSEN INLINE RESULT')
		pprint(msg)
		while self._chat_id is None:
			await asyncio.sleep(0.1)
		result_id, from_id, title_string = telepot.glance(msg, flavor='chosen_inline_result')
		url = "http://www.cheapshark.com/api/1.0/deals" #CheapShark Deal Lookup
		params = 'id={}'.format(result_id)
		r = await self.fetch(session, url, params=params)
		deal = '*{title}*\n_${sale}_ on {store}'.format(title=r['gameInfo']['name'], sale=r['gameInfo']['salePrice'], store=self._stores[r['gameInfo']['storeID']])
		await bot.sendMessage(self._chat_id, deal, parse_mode='Markdown')

	async def on_chat_message(self, msg):
		print('CHAT')
		pprint(msg)
		content_type, chat_type, chat_id = telepot.glance(msg, flavor='chat')
		if content_type != 'text':
			return
		self._chat_id = chat_id

# async def feeder(request):
# 	data = await request.text()
# 	webhook.feed(data)
# 	return web.Response(body='OK'.encode('utf-8'))

# async def init(app, bot):
# 	app.router.add_route('GET', '/webhook', feeder)
# 	app.router.add_route('POST', '/webhook', feeder)
# 	app.router.add_route('GET', '/status', check)
# 	# await bot.setWebhook('http://103.16.69.56:8080/webhook')

# async def check(request):
# 	return web.Response(text='Working OK!')


TOKEN = '395957386:AAHQ16wP9TrZokvZ5pZ62GLFTs4Psn3ZOWM'  # BotToken
# PORT = 8080
loop = asyncio.get_event_loop()
# app = web.Application(loop=loop)
with aiohttp.ClientSession(loop=loop) as session:
	bot = telepot.aio.DelegatorBot(TOKEN, [
		pave_event_space()(
			per_from_id(), create_open, GameDealer, timeout=10),
	])
	# webhook = OrderedWebhook(bot)

	loop.create_task(MessageLoop(bot).run_forever())
	print('#Listening...')
	loop.run_forever()

	# try:
	# 	web.run_app(app, host='127.0.0.1', port=PORT)
	# except KeyboardInterrupt:
	# 	pass