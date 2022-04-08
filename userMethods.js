import axios from "axios";
import User from "./User_Model.js";
import UserModel from "./User_Model.js";

export function menu(bot, userid, username) {
	bot.sendMessage(userid, "Меню клиента, выберите действие", {
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
	}).then((response) => {
		let unix_timestamp = response.date;
		let date = new Date(unix_timestamp * 1000);
		const hours = date.getHours();
		// Minutes part from the timestamp
		const minutes = "0" + date.getMinutes();
		// Seconds part from the timestamp
		const seconds = "0" + date.getSeconds();
		// Will display time in 10:30:23 format
		UserOrder.date = hours + ":" + minutes.substr(-2) + ":" + seconds.substr(-2);
	});
	UserOrder.username = username;
}

export const UserOrder = {
	username: 0,
	type: 0,
	currency: 0,
	amount: 0,
	status: 0,
	manager: 0,
	priceRUB: 0,
	priceUSD: 0,
	date: 0,
};

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
		priceRUB: UserOrder.priceRUB ? UserOrder.priceRUB : "null",
		priceUSD: UserOrder.priceUSD ? UserOrder.priceRUB : "null",
		date: UserOrder.date,
	});

	bot.getChatAdministrators(process.env.DEV_CHANNEL_ID).then((response) => {
		response.forEach((element) => {
			console.log(element);
			if (!element.user.is_bot) {
				bot.sendMessage(
					element.user.id,
					`Новая заявка от ${UserOrder.username}, проверьте соотвествующий раздел!`
				);
			}
		});
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

export async function setAmountToExchange(bot, prev_msg, menuStates, data) {
	const regexp = /(\d+[.,]\d+)|(\d+)/g;
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
	UserOrder.currency = data.slice(1);

	bot.onText(regexp, (msg, match) => {
		UserOrder.amount = parseFloat(match[0].replace(/,/g, "."));
		//TODO: Add calculating exchange rate
		(async () => {
			bot.editMessageText(
				await calculateValueToPay(UserOrder.type, UserOrder.currency, UserOrder.amount),
				{
					chat_id: menuStates[menuStates.length - 1].chat.id,
					message_id: menuStates[menuStates.length - 1].message_id,
					reply_markup: {
						inline_keyboard: [
							[
								{
									text: "Отправить",
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
				}
			);
		})();
		bot.removeTextListener(regexp);
	});
}
async function calculateValueToPay(type, currency, volume) {
	let valueRUB = 0;
	let valueUSD = 0;
	let iterator = 0;
	let temp = 0;
	console.log(type);
	console.log(currency);
	console.log(volume);
	if (type === "покупка") {
		switch (currency) {
			case "btc":
				try {
					await axios
						.get(`https://garantex.io/api/v2/depth?market=${currency}rub`)
						.then((response) => {
							Object.values(response.data.asks).some((el) => {
								if (temp <= volume) {
									temp += parseFloat(el.volume);
									valueRUB += parseFloat(el.price);
									++iterator;
								} else return true;
							});
						});
					temp = 0;
					await axios
						.get(`https://garantex.io/api/v2/depth?market=${currency}usd`)
						.then((response) => {
							Object.values(response.data.asks).some((el) => {
								if (temp <= volume) {
									temp += parseFloat(el.volume);
									valueUSD += parseFloat(el.price);
								} else return true;
							});
						});
				} catch (error) {
					console.log(error);
				}
				break;
			case "eth":
				try {
					await axios
						.get(`https://garantex.io/api/v2/depth?market=${currency}rub`)
						.then((response) => {
							Object.values(response.data.asks).some((el) => {
								if (temp <= volume) {
									temp += parseFloat(el.volume);
									valueRUB += parseFloat(el.price);
								} else return true;
							});
						});
					temp = 0;
					await axios
						.get(`https://garantex.io/api/v2/depth?market=${currency}usd`)
						.then((response) => {
							Object.values(response.data.asks).some((el) => {
								if (temp <= volume) {
									temp += parseFloat(el.volume);
									valueUSD += parseFloat(el.price);
								} else return true;
							});
						});
				} catch (error) {
					console.log(error);
				}
				break;
			case "usdt":
				try {
					await axios
						.get(`https://garantex.io/api/v2/depth?market=${currency}rub`)
						.then((response) => {
							Object.values(response.data.asks).some((el) => {
								if (temp <= volume) {
									temp += parseFloat(el.volume);
									valueRUB += parseFloat(el.price);
								} else return true;
							});
						});
					temp = 0;
					await axios
						.get(`https://garantex.io/api/v2/depth?market=${currency}usd`)
						.then((response) => {
							Object.values(response.data.asks).some((el) => {
								if (temp <= volume) {
									temp += parseFloat(el.volume);
									valueUSD += parseFloat(el.price);
								} else return true;
							});
						});
				} catch (error) {
					console.log(error);
				}
				break;
		}
	} else {
		switch (currency) {
			case "btc":
				try {
					await axios
						.get(`https://garantex.io/api/v2/depth?market=${currency}rub`)
						.then((response) => {
							Object.values(response.data.bids).some((el) => {
								if (temp <= volume) {
									temp += parseFloat(el.volume);
									valueRUB += parseFloat(el.price);
								} else return true;
							});
						});
					temp = 0;
					await axios
						.get(`https://garantex.io/api/v2/depth?market=${currency}usd`)
						.then((response) => {
							Object.values(response.data.bids).some((el) => {
								if (temp <= volume) {
									temp += parseFloat(el.volume);
									valueUSD += parseFloat(el.price);
								} else return true;
							});
						});
				} catch (error) {
					console.log(error);
				}
				break;
			case "eth":
				try {
					await axios
						.get(`https://garantex.io/api/v2/depth?market=${currency}rub`)
						.then((response) => {
							Object.values(response.data.bids).some((el) => {
								if (temp <= volume) {
									temp += parseFloat(el.volume);
									valueRUB += parseFloat(el.price);
								} else return true;
							});
						});
					temp = 0;
					await axios
						.get(`https://garantex.io/api/v2/depth?market=${currency}usd`)
						.then((response) => {
							Object.values(response.data.bids).some((el) => {
								if (temp <= volume) {
									temp += parseFloat(el.volume);
									valueUSD += parseFloat(el.price);
								} else return true;
							});
						});
				} catch (error) {
					console.log(error);
				}
				break;
			case "usdt":
				try {
					await axios
						.get(`https://garantex.io/api/v2/depth?market=${currency}rub`)
						.then((response) => {
							Object.values(response.data.bids).some((el) => {
								if (temp <= volume) {
									temp += parseFloat(el.volume);
									valueRUB += parseFloat(el.price);
								} else return true;
							});
						});
					temp = 0;
					await axios
						.get(`https://garantex.io/api/v2/depth?market=${currency}usd`)
						.then((response) => {
							Object.values(response.data.bids).some((el) => {
								if (temp <= volume) {
									temp += parseFloat(el.volume);
									valueUSD += parseFloat(el.price);
								} else return true;
							});
						});
				} catch (error) {
					console.log(error);
				}
				break;
		}
	}
	valueRUB = (parseFloat(valueRUB) + parseFloat(valueRUB * 0.027)).toFixed(4);
	valueUSD = (parseFloat(valueUSD) + parseFloat(valueUSD * 0.027)).toFixed(4);
	UserOrder.priceUSD = valueUSD * volume;
	UserOrder.priceRUB = valueRUB * volume;
	return `
	Ваша заявка: ${type} ${volume} ${currency.toUpperCase()},
	в USD: ${UserOrder.priceUSD.toFixed(2)}
	в RUB: ${UserOrder.priceRUB.toFixed(2)}
	`;
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
	let sellUSDt_USD = 0;
	let buyUSDt_USD = 0;
	let sellUSDt_RUB = 0;
	let buyUSDt_RUB = 0;

	let sellBTC_USD = 0;
	let buyBTC_USD = 0;
	let sellBTC_RUB = 0;
	let buyBTC_RUB = 0;

	let sellETH_USD = 0;
	let buyETH_USD = 0;
	let sellETH_RUB = 0;
	let buyETH_RUB = 0;

	const floatRound = 2;
	const serviceFee = 1.027;

	try {
		//* USDt *//
		await axios.get("https://garantex.io/api/v2/depth?market=usdtrub").then((response) => {
			Object.values(response.data.asks).map((el, i) => {
				if (i < 5) sellUSDt_RUB += parseFloat(el.price);
			});
			Object.values(response.data.bids).map((el, i) => {
				if (i < 5) buyUSDt_RUB += parseFloat(el.price);
			});
			sellUSDt_RUB = ((sellUSDt_RUB / 5) * serviceFee).toFixed(floatRound);
			buyUSDt_RUB = ((buyUSDt_RUB / 5) * serviceFee).toFixed(floatRound);
		});
		await axios.get("https://garantex.io/api/v2/depth?market=usdtusd").then((response) => {
			Object.values(response.data.asks).map((el, i) => {
				if (i < 5) sellUSDt_USD += parseFloat(el.price);
			});
			Object.values(response.data.bids).map((el, i) => {
				if (i < 5) buyUSDt_USD += parseFloat(el.price);
			});
			sellUSDt_USD = ((sellUSDt_USD / 5) * serviceFee).toFixed(floatRound);
			buyUSDt_USD = ((buyUSDt_USD / 5) * serviceFee).toFixed(floatRound);
		});
		//* /USDt *//

		//* /BTC *//
		await axios.get("https://garantex.io/api/v2/depth?market=btcrub").then((response) => {
			Object.values(response.data.asks).map((el, i) => {
				if (i < 5) sellBTC_RUB += parseFloat(el.price);
			});
			Object.values(response.data.bids).map((el, i) => {
				if (i < 5) buyBTC_RUB += parseFloat(el.price);
			});
			sellBTC_RUB = (sellBTC_RUB / 5 - (1.0 / (sellBTC_RUB / 5)) * serviceFee).toFixed(
				floatRound
			);
			buyBTC_RUB = (buyBTC_RUB / 5 - (1.0 / (buyBTC_RUB / 5)) * serviceFee).toFixed(
				floatRound
			);
		});
		await axios.get("https://garantex.io/api/v2/depth?market=btcusd").then((response) => {
			Object.values(response.data.asks).map((el, i) => {
				if (i < 5) sellBTC_USD += parseFloat(el.price);
			});
			Object.values(response.data.bids).map((el, i) => {
				if (i < 5) buyBTC_USD += parseFloat(el.price);
			});
			sellBTC_USD = (sellBTC_USD / 5 - (1.0 / (sellBTC_USD / 5)) * serviceFee).toFixed(
				floatRound
			);
			buyBTC_USD = (buyBTC_USD / 5 - (1.0 / (buyBTC_USD / 5)) * serviceFee).toFixed(
				floatRound
			);
		});
		//* /BTC *//

		//* ETH *//
		await axios.get("https://garantex.io/api/v2/depth?market=ethrub").then((response) => {
			Object.values(response.data.asks).map((el, i) => {
				if (i < 5) sellETH_RUB += parseFloat(el.price);
			});
			Object.values(response.data.bids).map((el, i) => {
				if (i < 5) buyETH_RUB += parseFloat(el.price);
			});
			sellETH_RUB = (sellETH_RUB / 5 - (1.0 / (sellETH_RUB / 5)) * serviceFee).toFixed(
				floatRound
			);
			buyETH_RUB = (buyETH_RUB / 5 - (1.0 / (buyETH_RUB / 5)) * serviceFee).toFixed(
				floatRound
			);
		});
		await axios.get("https://garantex.io/api/v2/depth?market=ethusd").then((response) => {
			Object.values(response.data.asks).map((el, i) => {
				if (i < 5) sellETH_USD += parseFloat(el.price);
			});
			Object.values(response.data.bids).map((el, i) => {
				if (i < 5) buyETH_USD += parseFloat(el.price);
			});
			sellETH_USD = (sellETH_USD / 5 - (1.0 / (sellETH_USD / 5)) * serviceFee).toFixed(
				floatRound
			);
			buyETH_USD = (buyETH_USD / 5 - (1.0 / (buyETH_USD / 5)) * serviceFee).toFixed(
				floatRound
			);
		});
		//* /ETH *//
	} catch (err) {
		console.log(err);
	}
	return `
    Актуальный курс\n
	<b><u>USDt/RUB</u></b>
	Покупка: <b>${buyUSDt_RUB}₽</b>
	Продажа: <b>${sellUSDt_RUB}₽</b>\n
	<b><u>USDt/USD</u></b>
	Покупка: <b>${buyUSDt_USD}$</b>
	Продажа: <b>${sellUSDt_USD}$</b>\n
	<b><u>BTC/RUB</u></b>
	Покупка: <b>${buyBTC_RUB}₽</b>
	Продажа: <b>${sellBTC_RUB}₽</b>\n
	<b><u>BTC/USD</u></b>
	Покупка: <b>${buyBTC_USD}$</b>
	Продажа: <b>${sellBTC_USD}$</b>\n
	<b><u>ETH/RUB</u></b>
	Покупка: <b>${buyETH_RUB}₽</b>
	Продажа: <b>${sellETH_RUB}₽</b>\n
	<b><u>ETH/USD</u></b>
	Покупка: <b>${buyETH_USD}$</b>
	Продажа: <b>${sellETH_USD}$</b>\n
    `;
}
