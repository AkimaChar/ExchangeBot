import UserModel from "./User_Model.js";

export function mainMenu(bot, userID, menuStates) {
	bot.sendMessage(userID, "Меню менеджера, выберите действие", {
		reply_markup: {
			inline_keyboard: [
				[
					{
						text: "Просмотреть заявки",
						callback_data: "/showrequests",
					},
				],
				[
					{
						text: "Получить консультацию",
						callback_data: "/getconsult",
					},
				],
			],
		},
	}).then((mainMenuMessage) => {
		menuStates = [mainMenuMessage];
	});
}

//* ВЫВОД СПИСКА ЗАКАЗОВ *//
const AllUser = await UserModel.findAll({ raw: true });

export function getUsersRequests(bot, prev_msg, menuStates) {
	const message = "<b>Список заявок:</b>\n";

	for (const [value] of Object.entries(AllUser)) {
		message.concat(value);
	}

	console.log(message);

	menuStates.push(prev_msg);
	bot.editMessageText(message, {
		chat_id: prev_msg.chat.id,
		message_id: prev_msg.message_id,
		parse_mode: "HTML",
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
}
