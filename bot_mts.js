import 'dotenv/config';
import TelegramBot from 'node-telegram-bot-api';
import { getCallHistory } from './functions/api.js';
import { transformCallHistory } from './functions/transformCallHistory.js';
import { getCallHistoryFromDB as getHistoryFromDB } from './functions/db.js';
import pkg from 'pg';
import express from 'express';
import bodyParser from 'body-parser';
import logger from './logger/logger.js';

const { Pool } = pkg;

// Настройки подключения к PostgreSQL
export const pool = new Pool({
    user: process.env.DB_USER || 'postgres',
    host: 'localhost',
    database: process.env.DB_NAME || 'webhookdb',
    password: process.env.DB_PASSWORD || '6TQNF_Srld',
    port: 5432,
});

const app = express();
const PORT = 7771;

// Используем body-parser для парсинга JSON
app.use(bodyParser.json());

// Функция для преобразования временной метки в формат ISO
function convertToDateTime(timestamp) {
    if (timestamp) {
        const date = new Date(Number(timestamp)); // Преобразуем метку времени из миллисекунд
        return date.toISOString(); // Возвращаем в формате ISO
    }
    return null;
}

// Функция для форматирования даты в читаемый формат
function formatDateTime(isoString) {
    if (!isoString) return 'null';
    const date = new Date(isoString);
    const options = {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
    };
    return date.toLocaleDateString('ru-RU', options);
}

// Функция для записи вебхуков в базу данных
async function insertWebhook(data) {
    const query = `
        INSERT INTO webhooks(
            event_type, 
            abonent_id, 
            call_id, 
            state, 
            remote_party_name, 
            remote_party_address, 
            call_direction, 
            start_time, 
            answer_time, 
            end_time, 
            ext_tracking_id
        ) VALUES($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`;

    const values = [
        data.eventType,
        BigInt(data.abonentId),
        data.payload.callId,
        data.payload.state,
        data.payload.remotePartyName,
        data.payload.remotePartyAddress,
        data.payload.callDirection,
        convertToDateTime(data.payload.startTime),
        convertToDateTime(data.payload.answerTime),
        convertToDateTime(data.payload.endTime),
        data.payload.extTrackingId
    ];

    try {
        await pool.query(query, values);
        logger.info('Вебхук добавлен в базу данных:', { data });
    } catch (err) {
        logger.error('Ошибка при вставке вебхука:', { error: err, data });
    }
}

// Обработка вебхуков
app.post('/api/subscription', async (req, res) => {
    const webhookData = req.body;

    // Логируем данные вебхука для отладки
    console.log('Получен вебхук:', JSON.stringify(webhookData, null, 2));
    console.log('Время ответа:', convertToDateTime(webhookData.payload.answerTime));
    console.log('Время завершения:', convertToDateTime(webhookData.payload.endTime));

    // Вставляем вебхук в базу данных
    await insertWebhook(webhookData);

    res.status(200).send('Webhook received');
});

// Запуск сервера
app.listen(PORT, () => {
    console.log(`Сервер запущен на порту ${PORT}`);
});

// Запуск Telegram бота
const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN, { polling: true });

// Функция для создания клавиатуры
function createKeyboard() {
    return {
        reply_markup: {
            keyboard: [
                [{ text: 'Активация API' }, { text: 'Получить список абонентов' }],
                [{ text: 'История вызовов' }, { text: 'Получить историю вызовов DB' }],
                [{ text: 'Запуск' }]
            ],
            resize_keyboard: true,
            one_time_keyboard: true
        }
    };
}

// Функция для обработки нажатия на кнопки в боте
function handleButtonPress(bot, msg, action, actionCallback) {
    const chatId = msg.chat.id;
    console.log(`Кнопка "${action}" нажата`);
    actionCallback(chatId);
}

// Команда /start
bot.onText(/\/start/, (msg) => {
    const chatId = msg.chat.id;
    bot.sendMessage(chatId, 'Добро пожаловать! Выберите действие:', createKeyboard());
});

// Обработка кнопки 'Активация API'
bot.onText(/Активация API/, (msg) => {
    handleButtonPress(bot, msg, 'Активация API', async (chatId) => {
        try {
            const response = await activateApi();
            bot.sendMessage(chatId, `Ответ API: ${response.body}`);
        } catch (error) {
            console.error('Ошибка при выполнении запроса:', error.message);
            bot.sendMessage(chatId, 'Ошибка при активации API.');
        }
    });
});

// Обработка кнопки 'Получить список абонентов'
bot.onText(/Получить список абонентов/, (msg) => {
    handleButtonPress(bot, msg, 'Получить список абонентов', async (chatId) => {
        try {
            const response = await getAbonents();
            bot.sendMessage(chatId, `Список абонентов: ${JSON.stringify(response.body, null, 2)}`);
        } catch (error) {
            console.error('Ошибка при получении списка абонентов:', error.message);
            bot.sendMessage(chatId, 'Ошибка при получении списка абонентов.');
        }
    });
});

// Обработка кнопки 'История вызовов'
bot.onText(/История вызовов/, (msg) => {
    handleButtonPress(bot, msg, 'История вызовов', async (chatId) => {
        try {
            const response = await getCallHistory();
            const calls = response.content || [];

            if (!calls.length) {
                bot.sendMessage(chatId, 'История вызовов пуста.');
                return;
            }

            const transformedCalls = transformCallHistory(response);
            const formattedCalls = transformedCalls.map(call => {
                return `Время звонка: ${formatDateTime(call.answerTime)}, Номер: ${call.remotePartyAddress}`;
            }).join('\n\n');

            bot.sendMessage(chatId, `История вызовов:\n${formattedCalls}`);
        } catch (error) {
            console.error('Ошибка при получении истории вызовов:', error.message);
            bot.sendMessage(chatId, 'Ошибка при получении истории вызовов.');
        }
    });
});

// Обработка кнопки 'Получить историю вызовов DB'
bot.onText(/Получить историю вызовов DB/, (msg) => {
    handleButtonPress(bot, msg, 'Получить историю вызовов DB', async (chatId) => {
        try {
            const callHistory = await getHistoryFromDB();
            console.log('Получена история вызовов из базы данных:', callHistory);

            if (!callHistory.length) {
                bot.sendMessage(chatId, 'История вызовов пуста.');
                return;
            }

            const formattedCalls = callHistory.map(call => {
                return `Время звонка: ${formatDateTime(call.start_time)}, Номер: ${call.remote_party_address}`;
            }).join('\n\n');

            bot.sendMessage(chatId, `История вызовов:\n${formattedCalls}`);
        } catch (error) {
            console.error('Ошибка при получении истории вызовов из базы данных:', error.message);
            bot.sendMessage(chatId, 'Ошибка при получении истории вызовов.');
        }
    });
});

// Команда /Запуск
bot.onText(/Запуск/, (msg) => {
    const chatId = msg.chat.id;
    bot.sendMessage(chatId, 'Бот успешно запущен!');
});

// Запускаем бота
console.log('Бот запущен...');