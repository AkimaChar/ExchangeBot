import TelegramBot from "node-telegram-bot-api";
import UserModel from "./User_Model.js";
import * as Admin from "./adminMethods.js";
import * as User from "./userMethods.js";
import dotenv from "dotenv";

dotenv.config();

const token = process.env.DEV_BOT_TOKEN;
const bot = new TelegramBot(token, { polling: true });
const menuStates = [];
let msgID;

bot.on("message", (msg) => {
	if (msg.chat.id > 0 && msg.text === "/start") {
		showMenu(msg);
	}
	if (msg.chat.id > 0 && msg.text === "/dev") {
		Admin.menu(bot, msg.from.id, menuStates, msgID);
	}
	if (msg.chat.id > 0 && msg.text === "/client") {
		bot.getChatMember(process.env.DEV_CHANNEL_ID, msg.from.id).then((response) => {
			if (response.status === "creator") User.menu(bot, msg.from.id, msg.from.username);
		});
	}
});

function showMenu(msg) {
	bot.getChatMember(process.env.DEV_CHANNEL_ID, msg.from.id).then((response) => {
		if (response.status === "left") User.menu(bot, msg.from.id, msg.from.username);
		else if (response.status === "Manager" || response.status === "creator")
			Admin.menu(bot, msg.from.id, msg.from.username);
	});
}

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
		case "/showallrequests":
			Admin.showRequestsList(
				bot,
				callback.message,
				menuStates,
				true,
				{},
				callback.from.username
			);
			break;
		case "/shownewrequests":
			Admin.showRequestsList(bot, callback.message, menuStates, true, {
				where: { status: "new" },
				raw: true,
			});
			break;
		case "/setchecked":
			Admin.showRequestsList(bot, callback.message, menuStates, false, {
				where: { status: "new" },
				raw: true,
			});
			break;
		case "/usdt":
		case "/btc":
		case "/eth":
			User.setAmountToExchange(bot, callback.message, menuStates, callback.data);
			break;
		case "/mainmenu":
			showMenu(callback);
			break;

		case "/back":
			back();
			break;
	}
	let temp = Number.parseInt(callback.data);
	if (!isNaN(temp) && typeof temp == "number") {
		console.log(callback.data);
		console.log(temp);
		Admin.updateRequestStatus(temp, callback);
	}
});

function back() {
	bot.editMessageText(menuStates[menuStates.length - 1].text, {
		chat_id: menuStates[menuStates.length - 1].chat.id,
		message_id: menuStates[menuStates.length - 1].message_id,
		reply_markup: menuStates[menuStates.length - 1].reply_markup,
	});
	menuStates.splice(menuStates.length - 1, 1);
}

bot.on("polling_error", (er) => {
	console.log(er);
});

//* Adds timestamp to log line *//
console.logCopy = console.log.bind(console);
console.log = function (data) {
	var currentDate =
		"[" + new Date().toLocaleString("en-US", { timeZone: "Europe/Moscow" }) + "] ";
	this.logCopy(currentDate, data);
};
