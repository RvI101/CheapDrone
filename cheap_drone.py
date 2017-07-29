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
					return await response.json()
			except Exception as e:
				print(str(e))
				if 'games' in url:
					return []
				else:
					return None

	async def on_inline_query(self, msg):
		async def compute_answer():
			start_time = time.time()
			query_id, from_id, title_string = telepot.glance(msg, flavor='inline_query')
			print('INLINE QUERY')
			print (title_string)
			if title_string == None or title_string == '':
				return [InlineQueryResultArticle(
							id='0',
							title='No results',
							input_message_content=InputTextMessageContent(
								message_text='No results'
							)
					   )]
			params = {'title': title_string, 'limit': 8}
			url = "http://www.cheapshark.com/api/1.0/games" #CheapShark Games Search
			games = []
			with aiohttp.ClientSession(loop=loop) as session:
				for g in await self.fetch(session, url, params=params):
					game = {
						'id' : g.get('cheapestDealID'),
						'type': 'article',
						'title': g.get('external'),
						'thumb_url': g.get('thumb'),
						'input_message_content': {
							'message_text': g.get('external')
						},
						'thumb_width': 25,
						'thumb_height': 25
					}
					games.append(game)
				deal_url = "http://www.cheapshark.com/api/1.0/deals"
				deal_params = ['id={}'.format(g.get('id')) for g in games]
				deal_tasks = []
				for p in deal_params:
					task = asyncio.ensure_future(self.fetch(session, deal_url, params=p))
					deal_tasks.append(task)
				print('Gathering deals')
				responses = await asyncio.gather(*deal_tasks)
				if not responses:
					return games
				for g in games:
					r = next((r for r in responses if r != None and r['gameInfo']['name'] == g['title']), None)
					if not r:
						break
					g['input_message_content'] = {
						'message_text': '*{title}*\n_${sale}_ on {store}'.format(title=r['gameInfo']['name'], sale=r['gameInfo']['salePrice'], store=self._stores[r['gameInfo']['storeID']]),
						'parse_mode': 'Markdown'
					}
			return games

		self.answerer.answer(msg, compute_answer)

	async def on_chosen_inline_result(self, msg):
		# print('CHOSEN INLINE RESULT')
		# pprint(msg)
		pass

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


TOKEN = sys.argv[1] # BotToken
# PORT = 8080
loop = asyncio.get_event_loop()
# app = web.Application(loop=loop)

bot = telepot.aio.DelegatorBot(TOKEN, [
	pave_event_space()(
		per_inline_from_id(), create_open, GameDealer, timeout=15),
])
# webhook = OrderedWebhook(bot)

loop.create_task(MessageLoop(bot).run_forever())
print('#Listening...')
loop.run_forever()

	# try:
	# 	web.run_app(app, host='127.0.0.1', port=PORT)
	# except KeyboardInterrupt:
	# 	pass