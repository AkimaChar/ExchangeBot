import TelegramBot from "node-telegram-bot-api";
import * as Admin from "./adminMethods.js";
import * as User from "./userMethods.js";
import dotenv from "dotenv";

dotenv.config();

const token = process.env.DEV_BOT_TOKEN;
const bot = new TelegramBot(token, { polling: true });

let menuStates = [];

bot.on("message", (msg) => {
	switch (msg.text) {
		case "/start":
			showBotMenu(msg.from.id);
			break;
	}
});

bot.on("callback_query", (callback) => {
	switch (callback.data) {
		case "/exchangerates":
			User.showExchangeRates(bot, callback.message, menuStates);
			break;
		case "/orderexchange":
			User.orderExchange(bot, callback.message, menuStates);
			break;
		case "/requestconsult":
			User.sendConsultRequest(bot, callback.message, menuStates);
			break;
		case "/sellcrypto":
			User.chooseCryptoToSell(bot, callback.message, menuStates);
			break;
		case "/buycrypto":
			User.chooseCryptoToBuy(bot, callback.message, menuStates);
			break;
		case "/setamount":
			User.setAmountToExchange(bot, callback.message, menuStates);
			break;
		case "/mainmenu":
			showBotMenu(bot, callback.from.id, menuStates);
			break;
		case "/back":
			() => {
				bot.editMessageText(menuStates[menuStates.length - 1].text, {
					chat_id: menuStates[menuStates.length - 1].chat.id,
					message_id: menuStates[menuStates.length - 1].message_id,
					reply_markup: menuStates[menuStates.length - 1].reply_markup,
				});
				menuStates.splice(menuToReturn, 1);
			};
			break;
	}
});

function showBotMenu(userID) {
	if(userID)
}

//* Adds timestamp to log line *//
console.logCopy = console.log.bind(console);
console.log = function (data) {
	var currentDate =
		"[" + new Date().toLocaleString("en-US", { timeZone: "Europe/Moscow" }) + "] ";
	this.logCopy(currentDate, data);
};
