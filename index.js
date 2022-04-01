import axios from "axios";
import dotenv from "dotenv";
import TelegramBot from "node-telegram-bot-api";

dotenv.config();

const token = process.env.DEV_BOT_TOKEN;
const bot = new TelegramBot(token, { polling: true });
const serviceFee = 0.002;

let menuStates = [];

//* Main checking message method *//
bot.on("message", (msg) => {
	switch (msg.text) {
		case "/start":
			showMainBotMenu(msg.from.id);
			break;
	}
});

//* Functionality description *//
function showMainBotMenu(userID) {
	//TODO: Make checking id for admin access when DB will be ready
	//TODO: Change welcome message
	if (userID) {
	}
	bot.sendMessage(userID, "Выберите действие", {
		reply_markup: {
			inline_keyboard: [
				[
					{
						text: "Курсы обмена",
						callback_data: "/exchangerates",
					},
					{
						text: "Заказать обмен",
						callback_data: "/orderexchange",
					},
				],
				[
					{
						text: "Получить консультацию",
						callback_data: "/getconsult",
					},
					{
						text: "Отзывы",
						url: "https://vk.com/nikchm",
					},
				],
			],
		},
	}).then((mainMenuMessage) => {
		menuStates = [mainMenuMessage];
	});
}

bot.on("callback_query", (callback) => {
	switch (callback.data) {
		case "/exchangerates":
			showExchangeRates(callback.message);
			break;
		case "/orderexchange":
			orderExchange(callback.message);
			break;
		case "/requestconsult":
			sendConsultRequest(callback.message);
			break;
		case "/sellcrypto":
			chooseCryptoToSell(callback.message);
			break;
		case "/buycrypto":
			chooseCryptoToBuy(callback.message);
			break;
		case "/setamount":
			setAmountToExchange(callback.message);
			break;
		case "/mainmenu":
			showMainBotMenu(callback.from.id);
			break;
		case "/back":
			returnMenuState();
			break;
	}
});

function setAmountToExchange(prev_msg) {
	const regexp = /(\d+\.\d+)|(\d+)/g;
	menuStates.push(prev_msg);
	bot.editMessageText(
		"Укажите количество, которое хотите обменять, например, 100",
		{
			chat_id: prev_msg.chat.id,
			message_id: prev_msg.message_id,
			reply_markup: {
				inline_keyboard: [
					[
						{
							text: "Назад",
							callback_data: "/back",
						},
					],
				],
			},
		}
	);
	bot.onText(regexp, (msg, match) => {
		//TODO: Add calculating exchange rate
		bot.editMessageText("Вы заплатите ", {
			chat_id: menuStates[menuStates.length - 1].chat.id,
			message_id: menuStates[menuStates.length - 1].message_id,
			reply_markup: {
				inline_keyboard: [
					[
						{
							text: "Оставить заявку",
							callback_data: "/requestconsult",
						},
					],
					[
						{
							text: "Назад",
							callback_data: "/back",
						},
					],
				],
			},
		});
		bot.removeTextListener(regexp);
	});
}

function chooseCryptoToBuy(prev_msg) {
	//TODO: Add creating request body
	menuStates.push(prev_msg);
	bot.editMessageText("Выберите действие", {
		chat_id: prev_msg.chat.id,
		message_id: prev_msg.message_id,
		reply_markup: {
			inline_keyboard: [
				[
					{
						text: "Купить USDt",
						callback_data: "/setamount",
					},
					{
						text: "Купить Bitcoin",
						callback_data: "/setamount",
					},
					{
						text: "Купить Ethereum",
						callback_data: "/setamount",
					},
				],
				[
					{
						text: "Назад",
						callback_data: "/back",
					},
				],
			],
		},
	});
}

function chooseCryptoToSell(prev_msg) {
	//TODO: Add creating request body
	menuStates.push(prev_msg);
	bot.editMessageText("Выберите действие", {
		chat_id: prev_msg.chat.id,
		message_id: prev_msg.message_id,
		reply_markup: {
			inline_keyboard: [
				[
					{
						text: "Продать USDt",
						callback_data: "/setamount",
					},
					{
						text: "Продать Bitcoin",
						callback_data: "/setamount",
					},
					{
						text: "Продать Ethereum",
						callback_data: "/setamount",
					},
				],
				[
					{
						text: "Назад",
						callback_data: "/back",
					},
				],
			],
		},
	});
}

function sendConsultRequest(prev_msg) {
	//TODO: Add manager notification functionality (request text, sender id, time)
	menuStates.push(prev_msg);
	bot.editMessageText("Менеджер скоро свяжется с вами 😉", {
		chat_id: prev_msg.chat.id,
		message_id: prev_msg.message_id,
		reply_markup: {
			inline_keyboard: [
				//TODO: Ask about button functionality
				// [
				// 	{
				// 		text: "Продать Ethereum",
				// 		callback_data: "/selleth",
				// 	},
				// ],
				[
					{
						text: "В главное меню",
						callback_data: "/mainmenu",
					},
				],
			],
		},
	});
}

function orderExchange(prev_msg) {
	menuStates.push(prev_msg);
	bot.editMessageText("Выберите действие", {
		chat_id: prev_msg.chat.id,
		message_id: prev_msg.message_id,
		reply_markup: {
			inline_keyboard: [
				[
					{
						text: "Я хочу купить криптовалюту",
						callback_data: "/buycrypto",
					},
				],
				[
					{
						text: "Я хочу продать криптовалюту",
						callback_data: "/sellcrypto",
					},
				],
				[
					{
						text: "Назад",
						callback_data: "/back",
					},
				],
			],
		},
	});
}

async function showExchangeRates(prev_msg) {
	menuStates.push(prev_msg);
	bot.editMessageText(await _Rate_Values(), {
		chat_id: prev_msg.chat.id,
		message_id: prev_msg.message_id,
		parse_mode: "HTML",
		reply_markup: {
			inline_keyboard: [
				[
					{
						text: "Рассчитать обмен",
						callback_data: "/orderexchange",
					},
				],
				[
					{
						text: "Назад",
						callback_data: "/back",
					},
				],
			],
		},
	});
}

async function _Rate_Values() {
	//! Problem with getting usdt/rub rate
	//TODO: Add rounding to values
	//TODO: Add new currencies to show
	//TODO: Add update interval
	let sellUSDt_USD = 0;
	let buyUSDt_USD = 0;
	let sellUSDt_RUB = 0;
	let buyUSDt_RUB = 0;
	try {
		await axios
			.get("https://garantex.io/api/v2/depth?market=usdtusd")
			.then((response) => {
				Object.values(response.data.asks).map((el, i) => {
					if (i < 5) sellUSDt_USD += +el.price;
				});
				Object.values(response.data.bids).map((el, i) => {
					if (i < 5) buyUSDt_USD += +el.price;
				});
				sellUSDt_USD = (
					(sellUSDt_USD / 5 -
						(1.0 / (sellUSDt_USD / 5)) * serviceFee) *
					1.02
				).toFixed(floatRound);
				buyUSDt_USD = (
					buyUSDt_USD / 5 -
					(1.0 / (buyUSDt_USD / 5)) * serviceFee
				).toFixed(floatRound);
			});
		await axios
			.get("https://garantex.io/api/v2/depth?market=usdtrub")
			.then((response) => {
				Object.values(response.data.asks).map((el, i) => {
					if (i < 5) sellUSDt_RUB += +el.price;
				});
				Object.values(response.data.bids).map((el, i) => {
					if (i < 5) buyUSDt_RUB += +el.price;
				});
				sellUSDt_RUB = (
					(sellUSDt_RUB / 5 -
						(10 / (sellUSDt_RUB / 5)) * serviceFee) *
					1.02
				).toFixed(floatRound);
				buyUSDt_RUB = (
					buyUSDt_RUB / 5 -
					(10 / (buyUSDt_RUB / 5)) * serviceFee
				).toFixed(floatRound);
			});
	} catch (err) {
		console.log(err);
	}
	return `
    Актуальный курс\n(обновляется каждые 30 секунд пока активно)\n\n<b><u>USDt/RUB</u></b>\n\nПокупка: <b>${buyUSDt_RUB}₽</b>\nПродажа: <b>${sellUSDt_RUB}₽</b>\n\n<b><u>USDt/USD</u></b>\n\nПокупка: <b>${buyUSDt_USD}$</b>\nПродажа: <b>${sellUSDt_USD}$</b>\n\n
    `;
}

function returnMenuState() {
	let menuToReturn = menuStates.length - 1;
	bot.editMessageText(menuStates[menuToReturn].text, {
		chat_id: menuStates[menuToReturn].chat.id,
		message_id: menuStates[menuToReturn].message_id,
		reply_markup: menuStates[menuToReturn].reply_markup,
	});
	menuStates.splice(menuToReturn, 1);
}

//* Adds timestamp to log line *//
console.logCopy = console.log.bind(console);
console.log = function (data) {
	var currentDate =
		"[" +
		new Date().toLocaleString("en-US", { timeZone: "Europe/Moscow" }) +
		"] ";
	this.logCopy(currentDate, data);
};
