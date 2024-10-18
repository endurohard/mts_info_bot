import 'dotenv/config';
import TelegramBot from 'node-telegram-bot-api';
import { transformCallHistory } from './functions/transformCallHistory.js'
import pkg from 'pg';
const { Pool } = pkg;

// Настройки подключения к PostgreSQL
const pool = new Pool({
    user: 'postgres',           // Имя пользователя PostgreSQL
    host: 'localhost',          // Адрес хоста
    database: 'webhookdb',      // Название базы данных
    password: '6TQNF_Srld',     // Пароль
    port: 5432,                 // Порт подключения
});

// Инициализация Telegram бота
const bot = new TelegramBot(process.env.BOT_TOKEN, { polling: true });

// Функция для вставки вебхука в базу данных
async function insertWebhook(data) {
    const query = 'INSERT INTO webhooks(data) VALUES($1) RETURNING id';
    const values = [data];

    try {
        const res = await pool.query(query, values);
        console.log('Вебхук добавлен с ID:', res.rows[0].id);
    } catch (err) {
        console.error('Ошибка при вставке вебхука:', err);
    }
}

// Пример данных вебхука
const webhookData = {
    callTime: "18.10.2024, 12:02:59 AM",
    callingNumber: "+79634040144",
    direction: "входящий",
    status: "состоявшийся"
};

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
        const formattedCalls = calls.map(call => {
            const callTime = new Date(call.callTime).toLocaleString('ru-RU', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
                hour12: false // Включаем 24-часовой формат
            });

            const direction = call.direction === 'ORIGINATING' ? 'исходящий' : 'входящий'; // Преобразуем направление
            const status = call.status === 'PLACED' ? 'состоявшийся' : 'пропущенный'; // Преобразуем статус

            return `Время звонка: ${callTime},\nНомер: ${call.callingNumber},\nНаправление: ${direction},\nСтатус: ${status}`;
        }).join('\n\n'); // Соединяем звонки с двумя новыми строками между записями

        bot.sendMessage(chatId, `История вызовов:\n${formattedCalls}`);
    } catch (error) {
        console.error('Ошибка при получении истории вызовов:', error.message);
        bot.sendMessage(chatId, 'Ошибка при получении истории вызовов.');
    }
});

// Запускаем бота
console.log('Бот запущен...');

let promise = insertWebhook(webhookData);