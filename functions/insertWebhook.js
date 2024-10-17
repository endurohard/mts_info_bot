export = insertWebhook()
const { Pool } = require('pg');
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