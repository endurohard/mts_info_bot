import 'dotenv/config';
import TelegramBot from 'node-telegram-bot-api';
import https from 'https';

import { transformCallHistory } from './functions/transformCallHistory.js'
import {getAbonents, getCallHistory} from "./functions/api.js";

// Получение токена из .env
const telegramToken = process.env.TELEGRAM_BOT_TOKEN;

// Включение режима опроса (polling)
const bot = new TelegramBot(telegramToken, { polling: true });

// Создаем агент с параметрами шифрования
const agent = new https.Agent({
    rejectUnauthorized: false,
    secureProtocol: 'TLSv1_2_method',
    ciphers: 'ECDHE-RSA-AES128-SHA256:ECDHE-RSA-AES128-SHA:ECDHE-RSA-AES256-SHA384',
});

// Обработка команды '/start'
bot.onText(/\/start/, (msg) => {
    const chatId = msg.chat.id;
    bot.sendMessage(chatId, 'Привет! Я ваш бот. Нажмите кнопку, чтобы начать.', {
        reply_markup: {
            keyboard: [['Запуск'], ['Активация API'], ['Получить список абонентов'], ['История вызовов']],
            resize_keyboard: true,
            one_time_keyboard: true
        }
    });
});

// Обработка нажатия на кнопку 'Запуск'
bot.onText(/Запуск/, (msg) => {
    const chatId = msg.chat.id;
    console.log('Кнопка "Запуск" нажата');
    bot.sendMessage(chatId, 'Вы нажали кнопку "Запуск".');
});

// Обработка нажатия на кнопку 'Активация API'
bot.onText(/Активация API/, async (msg) => {
    const chatId = msg.chat.id;
    console.log('Кнопка "Активация API" нажата');
    try {
        const response = await activateApi();
        bot.sendMessage(chatId, `Ответ API: ${response.body}`);
    } catch (error) {
        console.error('Ошибка при выполнении запроса:', error.response ? error.response.body : error.message);
        bot.sendMessage(chatId, 'Ошибка при активации API. Проверьте токен и права доступа.');
    }
});

// Обработка нажатия на кнопку 'Получить список абонентов'
bot.onText(/Получить список абонентов/, async (msg) => {
    const chatId = msg.chat.id;
    console.log('Кнопка "Получить список абонентов" нажата');
    try {
        const response = await getAbonents();
        bot.sendMessage(chatId, `Список абонентов: ${JSON.stringify(response.body, null, 2)}`);
    } catch (error) {
        console.error('Ошибка при получении списка абонентов:', error.response ? error.response.body : error.message);
        bot.sendMessage(chatId, 'Ошибка при получении списка абонентов.');
    }
});

// Обработка нажатия на кнопку 'История вызовов'
bot.onText(/История вызовов/, async (msg) => {
    const chatId = msg.chat.id;
    console.log('Кнопка "История вызовов" нажата');
    try {
        const callHistory = await getCallHistory();
        const transformedHistory = transformCallHistory(callHistory);
        console.log('transformedHistory', JSON.stringify(transformedHistory, null, 2));
        bot.sendMessage(chatId, `История вызовов: ${JSON.stringify(transformedHistory, null, 2)}`);
    } catch (error) {
        console.error('Ошибка при получении истории вызовов:', error.response ? error.response.body : error.message);
        bot.sendMessage(chatId, 'Ошибка при получении истории вызовов.');
    }
});



// Запускаем бота
console.log('Бот запущен...');