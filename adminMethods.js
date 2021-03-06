import UserModel from "./User_Model.js";

export async function menu(bot, userID, menuStates) {
	bot.sendMessage(userID, "Бот активен! Добро пожаловать", {
		reply_markup: {
			inline_keyboard: [
				[
					{
						text: "Показать новые заявки",
						callback_data: "/shownewrequests",
					},
				],
				[
					{
						text: "Погказать все заявки",
						callback_data: "/showallrequests",
					},
				],
				[
					{
						text: "Отметить закрытые заявки",
						callback_data: "/setchecked",
					},
				],
			],
		},
	});
}

async function getRequestsList(needOpenDialog, options) {
	let keyboard = [];
	Object.values(await UserModel.findAll(options)).map((el) => {
		let button = [
			{
				text: `${el.date} ${el.username} ${el.type} ${el.amount != 0 ? el.amount : ""} ${
					el.currency != "null" ? el.currency : ""
				}${el.priceUSD ? "USD:" + el.priceUSD : ""}${
					el.priceRUB ? " RUB:" + el.priceRUB : ""
				}(${el.status})`,
				callback_data: el.manager == null ? `${el.id}` : "/",
				url: needOpenDialog === true ? `https://t.me/${el.username}` : "",
			},
		];
		keyboard.push(button);
	});
	keyboard.push([{ text: "Назад", callback_data: "/back" }]);
	return keyboard;
}

//* ВЫВОД СПИСКА ЗАКАЗОВ *//
// const AllUser = await UserModel.findAll({ raw: true });

export async function showRequestsList(
	bot,
	prev_msg,
	menuStates,
	needOpenDialog,
	options,
	manager
) {
	getRequestsList(needOpenDialog, options, manager).then((keyboard) => {
		menuStates.push(prev_msg);

		if (needOpenDialog) {
			bot.editMessageText(`Нажмите на интересующую заявку, чтобы начать диалог с клиентом`, {
				chat_id: prev_msg.chat.id,
				message_id: prev_msg.message_id,
				parse_mode: "HTML",
				reply_markup: {
					inline_keyboard: keyboard,
				},
			});
		} else {
			bot.editMessageText(`Нажмите на заявку, которую хотите закрыть`, {
				chat_id: prev_msg.chat.id,
				message_id: prev_msg.message_id,
				parse_mode: "HTML",
				reply_markup: {
					inline_keyboard: keyboard,
				},
			});
		}
	});
}

export async function updateRequestStatus(id, msg) {
	await UserModel.update(
		{ status: "checked", manager: msg.from.username },
		{
			where: {
				id: id,
			},
		}
	);
}
