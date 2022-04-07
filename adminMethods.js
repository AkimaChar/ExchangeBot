import UserModel from "./User_Model.js";

export function menu(bot, userID, menuStates) {
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
	}).then((mainMenuMessage) => {
		menuStates = [mainMenuMessage];
	});
}

async function getRequestsList(needOpenDialog, options, manager) {
	let keyboard = [];
	Object.values(await UserModel.findAll(options)).map((el) => {
		let button = [
			{
				text: `
				 ${el.username} ${el.type} ${el.amount != 0 ? el.amount : ""} ${
					el.currency != "null" ? el.currency : ""
				} (${el.manager != null ? el.manager + " " : ""}${el.status})
			`,
				callback_data: el.manager == null ? `${el.id}` : "/",
				url:
					needOpenDialog === true
						? `https://t.me/${el.username}`
						: "",
			},
		];
		keyboard.push(button);
	});
	keyboard.push([{ text: "Назад", callback_data: "/back" }]);
	return keyboard;
}

//* ВЫВОД СПИСКА ЗАКАЗОВ *//
const AllUser = await UserModel.findAll({ raw: true });

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

export function devmenu(bot, userID, menuStates) {
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
	}).then((mainMenuMessage) => {
		menuStates = [mainMenuMessage];
	});
}
