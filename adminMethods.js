export function mainMenu(bot, userID, menuStates) {
	bot.sendMessage(userID, "Меню администратора, выберите действие", {
		reply_markup: {
			inline_keyboard: [
				[
					{
						text: "Просмотреть заявки",
						callback_data: "/showrequests",
					},
					{
						text: "",
						callback_data: "/orderexchange",
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
