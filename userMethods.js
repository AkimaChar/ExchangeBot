import axios from "axios";

export function setAmountToExchange(bot, prev_msg, menuStates) {
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
export function chooseCryptoToBuy(bot, prev_msg, menuStates) {
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
export function chooseCryptoToSell(bot, prev_msg, menuStates) {
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
export function sendConsultRequest(bot, prev_msg, menuStates) {
	//TODO: Add manager notification functionality (request text, sender id, time)
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
