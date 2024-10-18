import 'dotenv/config';
import TelegramBot from 'node-telegram-bot-api';
import { getCallHistory } from './functions/api.js'; // Импортируем функцию получения истории вызовов
import { transformCallHistory } from './functions/transformCallHistory.js'; // Импортируем функцию преобразования
import { getCallHistoryFromDB as getHistoryFromDB } from './functions/db.js';
import pkg from 'pg';
const { Pool } = pkg;
export { pool };
// Настройки подключения к PostgreSQL
const pool = new Pool({
    user: process.env.DB_USER || 'postgres',
    host: 'localhost',
    database: process.env.DB_NAME || 'webhookdb',
    password: process.env.DB_PASSWORD || '6TQNF_Srld',
    port: 5432,
});

const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN, { polling: true });

// Функция для создания клавиатуры
function createKeyboard() {
    return {
        reply_markup: {
            keyboard: [
                [
                    { text: 'Активация API' },
                    { text: 'Получить список абонентов' }
                ],
                [
                    { text: 'История вызовов' },
                    { text: 'Получить историю вызовов DB' }
                ],
                [
                    { text: 'Запуск' }
                ]
            ],
            resize_keyboard: true,
            one_time_keyboard: true
        }
    };
}

// Обработка команды /start
bot.onText(/\/start/, (msg) => {
    const chatId = msg.chat.id;
    bot.sendMessage(chatId, 'Добро пожаловать! Выберите действие:', createKeyboard());
});

// Обработка кнопки 'Активация API'
bot.onText(/Активация API/, async (msg) => {
    const chatId = msg.chat.id;
    console.log('Кнопка "Активация API" нажата');
    try {
        const response = await activateApi();
        bot.sendMessage(chatId, `Ответ API: ${response.body}`);
    } catch (error) {
        console.error('Ошибка при выполнении запроса:', error.message);
        bot.sendMessage(chatId, 'Ошибка при активации API. Проверьте токен и права доступа.');
    }
});

// Обработка кнопки 'Получить список абонентов'
bot.onText(/Получить список абонентов/, async (msg) => {
    const chatId = msg.chat.id;
    console.log('Кнопка "Получить список абонентов" нажата');
    try {
        const response = await getAbonents();
        bot.sendMessage(chatId, `Список абонентов: ${JSON.stringify(response.body, null, 2)}`);
    } catch (error) {
        console.error('Ошибка при получении списка абонентов:', error.message);
        bot.sendMessage(chatId, 'Ошибка при получении списка абонентов.');
    }
});

// Обработка кнопки 'История вызовов'
bot.onText(/История вызовов/, async (msg) => {
    const chatId = msg.chat.id;
    try {
        const response = await getCallHistory();
        const calls = response.content || [];

        if (!Array.isArray(calls) || calls.length === 0) {
            bot.sendMessage(chatId, 'История вызовов пуста.');
            return;
        }

        const transformedCalls = transformCallHistory(response);
        const formattedCalls = transformedCalls.map(call => {
            return `Время звонка: ${call.callTime}, Номер: ${call.callingNumber}, Направление: ${call.direction}, Статус: ${call.status}`;
        }).join('\n\n');

        bot.sendMessage(chatId, `История вызовов:\n${formattedCalls}`);
    } catch (error) {
        console.error('Ошибка при получении истории вызовов:', error.message);
        bot.sendMessage(chatId, 'Ошибка при получении истории вызовов.');
    }
});

// Обработка кнопки 'Получить историю вызовов DB'
bot.onText(/Получить историю вызовов DB/, async (msg) => {
    const chatId = msg.chat.id;
    try {
        const callHistory = await getHistoryFromDB(); // Теперь функция доступна
        console.log('Получена история вызовов из базы данных:', callHistory); // Для отладки
        if (callHistory.length === 0) {
            bot.sendMessage(chatId, 'История вызовов пуста.');
            return;
        }

        const formattedCalls = callHistory.map(call => {
            return `Время звонка: ${call.call_time}, Номер: ${call.calling_number}`; // Замените на ваши поля
        }).join('\n\n');

        bot.sendMessage(chatId, `История вызовов:\n${formattedCalls}`);
    } catch (error) {
        console.error('Ошибка при получении истории вызовов из базы данных:', error.message);
        bot.sendMessage(chatId, 'Ошибка при получении истории вызовов.');
    }
});

// Обработка команды /Запуск
bot.onText(/Запуск/, (msg) => {
    const chatId = msg.chat.id;
    bot.sendMessage(chatId, 'Бот успешно запущен!');
    insertWebhook(webhookData).catch(err => console.error('Ошибка:', err));
});

// Запускаем бота
console.log('Бот запущен...');