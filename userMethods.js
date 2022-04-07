import axios from "axios";
import UserModel from "./User_Model.js";

export function menu(bot, userid, username) {
	bot.sendMessage(userid, "Меню клиента, выберите действие", {
		reply_markup: {
			inline_keyboard: [
				[
					{
						text: "Курсы обмена",
						callback_data: "/showrequests",
					},
					{
						text: "Заказать обмен",
						callback_data: "/orderexchange",
					},
				],
				[
					{
						text: "Отзывы",
						url: "vk.com/nikchm",
					},
					{
						text: "Получить консультацию",
						callback_data: "/requestconsult",
					},
				],
			],
		},
	});
	UserOrder.username = username;
}

const UserOrder = {
	username: 0,
	type: 0,
	currency: 0,
	amount: 0,
	status: 0,
	manager: 0,
};

export function setAmountToExchange(bot, prev_msg, menuStates, data) {
	const regexp = /(\d+\.\d+)|(\d+)/g;
	menuStates.push(prev_msg);
	bot.editMessageText("Укажите количество, которое хотите обменять, например, 100", {
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
	});

	bot.onText(regexp, (msg, match) => {
		UserOrder.amount = parseInt(match);
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
	UserOrder.currency = data.slice(1);
}

export function chooseCryptoToBuy(bot, prev_msg, menuStates) {
	menuStates.push(prev_msg);
	bot.editMessageText("Выберите действие", {
		chat_id: prev_msg.chat.id,
		message_id: prev_msg.message_id,
		reply_markup: {
			inline_keyboard: [
				[
					{
						text: "Купить USDt",
						callback_data: "/usdt",
					},
					{
						text: "Купить Bitcoin",
						callback_data: "/btc",
					},
					{
						text: "Купить Ethereum",
						callback_data: "/eth",
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
	UserOrder.type = "покупка";
}

export function chooseCryptoToSell(bot, prev_msg, menuStates) {
	menuStates.push(prev_msg);
	UserOrder.type = "продажа";
	bot.editMessageText("Выберите действие", {
		chat_id: prev_msg.chat.id,
		message_id: prev_msg.message_id,
		reply_markup: {
			inline_keyboard: [
				[
					{
						text: "Продать USDt",
						callback_data: "/usdt",
					},
					{
						text: "Продать Bitcoin",
						callback_data: "/btc",
					},
					{
						text: "Продать Ethereum",
						callback_data: "/eth",
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
export async function sendConsultRequest(bot, prev_msg, menuStates) {
	const newUser = await UserModel.create({
		username: UserOrder.username,
		type: UserOrder.type ? UserOrder.type : "консультация",
		currency: UserOrder.currency ? UserOrder.currency : "null",
		amount: UserOrder.amount ? UserOrder.amount : 0,
		status: "new",
	}).then(() => {
		sendNotification(bot);
	});

	// console.log(await UserModel.findAll({ raw: true }));
	menuStates.push(prev_msg);
	bot.editMessageText("Менеджер скоро свяжется с вами 😉", {
		chat_id: prev_msg.chat.id,
		message_id: prev_msg.message_id,
		reply_markup: {
			inline_keyboard: [
				//TODO: Ask about button functionality
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

export async function sendNotification(bot) {
	const rqcount = Object.values(await UserModel.findAll({ where: { status: "new" } }));
	bot.getChatAdministrators(process.env.DEV_CHANNEL_ID).then((el) => {
		if (el.custom_title === "Manager") bot.sendMessage(el.id, "Новая заявка на консультацию!");
		bot.sendMessage(
			process.env.DEVELOPER,
			rqcount.length !== 0
				? `${rqcount.length} необработанных заявок на консультацию`
				: "Новых заявок нет!"
		).then((response) => {
			updateNotification(bot, response);
		});
	});
}

export async function updateNotification(bot, notification) {
	setInterval(async () => {
		const rqcount = Object.values(await UserModel.findAll({ where: { status: "new" } }));
		bot.editMessageText(`${rqcount.length} необработанных заявок на консультацию`, {
			chat_id: notification.chat.id,
			message_id: notification.message_id,
		}).catch((e) => {});
	}, 1000);
}

export function orderExchange(bot, prev_msg, menuStates) {
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

export async function showExchangeRates(bot, prev_msg, menuStates) {
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
		await axios.get("https://garantex.io/api/v2/depth?market=usdtusd").then((response) => {
			Object.values(response.data.asks).map((el, i) => {
				if (i < 5) sellUSDt_USD += +el.price;
			});
			Object.values(response.data.bids).map((el, i) => {
				if (i < 5) buyUSDt_USD += +el.price;
			});
			sellUSDt_USD = (
				(sellUSDt_USD / 5 - (1.0 / (sellUSDt_USD / 5)) * serviceFee) *
				1.02
			).toFixed(floatRound);
			buyUSDt_USD = (buyUSDt_USD / 5 - (1.0 / (buyUSDt_USD / 5)) * serviceFee).toFixed(
				floatRound
			);
		});
		await axios.get("https://garantex.io/api/v2/depth?market=usdtrub").then((response) => {
			Object.values(response.data.asks).map((el, i) => {
				if (i < 5) sellUSDt_RUB += +el.price;
			});
			Object.values(response.data.bids).map((el, i) => {
				if (i < 5) buyUSDt_RUB += +el.price;
			});
			sellUSDt_RUB = (
				(sellUSDt_RUB / 5 - (10 / (sellUSDt_RUB / 5)) * serviceFee) *
				1.02
			).toFixed(floatRound);
			buyUSDt_RUB = (buyUSDt_RUB / 5 - (10 / (buyUSDt_RUB / 5)) * serviceFee).toFixed(
				floatRound
			);
		});
	} catch (err) {
		console.log(err);
	}
	return `
    Актуальный курс\n(обновляется каждые 30 секунд пока активно)\n\n<b><u>USDt/RUB</u></b>\n\nПокупка: <b>${buyUSDt_RUB}₽</b>\nПродажа: <b>${sellUSDt_RUB}₽</b>\n\n<b><u>USDt/USD</u></b>\n\nПокупка: <b>${buyUSDt_USD}$</b>\nПродажа: <b>${sellUSDt_USD}$</b>\n\n
    `;
}
