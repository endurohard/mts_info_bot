import 'dotenv/config';
import TelegramBot from 'node-telegram-bot-api';
import { getCallHistory } from './functions/api.js'; // Импортируем функцию получения истории вызовов
import { transformCallHistory } from './functions/transformCallHistory.js'; // Импортируем функцию преобразования
import pkg from 'pg';
const { Pool } = pkg;

// Настройки подключения к PostgreSQL
console.log('DB_USER:', process.env.DB_USER);
console.log('DB_NAME:', process.env.DB_NAME);
console.log('DB_PASSWORD:', process.env.DB_PASSWORD);

const pool = new Pool({
    user: process.env.DB_USER || 'postgres',
    host: 'localhost',
    database: process.env.DB_NAME || 'webhookdb',
    password: process.env.DB_PASSWORD || '6TQNF_Srld',
    port: 5432,
});

const yourWebhookUrl = 'localhost'; // Укажите правильный URL

const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN, { polling: true });

// Функция для преобразования строки даты в формат, который распознается PostgreSQL
function formatDateString(dateString) {
    const [datePart, timePart] = dateString.split(', ');
    const [day, month, year] = datePart.split('.');
    const [time, modifier] = timePart.split(' ');

    // Преобразуем в 24-часовой формат
    const [hours, minutes, seconds] = time.split(':');
    let formattedHours = parseInt(hours);
    if (modifier === 'PM' && formattedHours < 12) {
        formattedHours += 12;
    }
    if (modifier === 'AM' && formattedHours === 12) {
        formattedHours = 0;
    }

    return `${year}-${month}-${day} ${String(formattedHours).padStart(2, '0')}:${minutes}:${seconds}`;
}

// Пример данных вебхука с добавленным webhook_url
const webhookData = {
    webhookUrl: "https://example.com/webhook", // Замените на ваш URL вебхука
    callTime: "18.10.2024, 12:02:59 AM",
    callingNumber: "+79634040144",
    direction: "входящий",
    status: "состоявшийся"
};

// Вставка вебхука
async function insertWebhook(data) {
    const formattedCallTime = formatDateString(data.callTime); // Преобразуем строку даты

    const query = 'INSERT INTO webhooks(webhook_url, call_time, calling_number, direction, status) VALUES($1, $2, $3, $4, $5) RETURNING id';
    const values = [data.webhookUrl, formattedCallTime, data.callingNumber, data.direction, data.status];

    try {
        const res = await pool.query(query, values);
        console.log('Вебхук добавлен с ID:', res.rows[0].id);
    } catch (err) {
        console.error('Ошибка при вставке вебхука:', err);
    }
}

// Обработчик команды /Запуск
bot.onText(/Запуск/, (msg) => {
    const chatId = msg.chat.id;
    bot.sendMessage(chatId, 'Бот успешно запущен!');
    insertWebhook(webhookData).catch(err => console.error('Ошибка:', err));
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

import { getCallHistoryFromDB } from './db.js';

// Пример использования функции
bot.onText(/Получить историю вызовов/, async (msg) => {
    const chatId = msg.chat.id;
    try {
        const callHistory = await getCallHistoryFromDB();
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

// Запускаем бота
console.log('Бот запущен...');

let promise = insertWebhook(webhookData);