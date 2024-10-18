import { getCallHistory } from './functions/api.js'; // Импортируем функцию получения истории вызовов
import { transformCallHistory } from './functions/transformCallHistory.js'; // Импортируем функцию преобразования

// Обработка нажатия на кнопку 'История вызовов'
bot.onText(/История вызовов/, async (msg) => {
    const chatId = msg.chat.id;
    try {
        const response = await getCallHistory(); // Получаем историю вызовов
        const calls = response.content || []; // Проверяем, есть ли вызовы

        if (!Array.isArray(calls) || calls.length === 0) {
            bot.sendMessage(chatId, 'История вызовов пуста.');
            return;
        }

        // Преобразуем и отформатируем историю звонков
        const transformedCalls = transformCallHistory(response); // Используем transformCallHistory

        const formattedCalls = transformedCalls.map(call => {
            return `Время звонка: ${call.callTime},\nНомер: ${call.callingNumber},\nНаправление: ${call.direction},\nСтатус: ${call.status}`;
        }).join('\n\n'); // Соединяем звонки с двумя новыми строками между записями

        bot.sendMessage(chatId, `История вызовов:\n${formattedCalls}`);
    } catch (error) {
        console.error('Ошибка при получении истории вызовов:', error.message);
        bot.sendMessage(chatId, 'Ошибка при получении истории вызовов.');
    }
});