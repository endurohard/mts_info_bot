// db.js
export async function getCallHistoryFromDB() {
    const query = 'SELECT * FROM webhooks'; // Ваш запрос к базе данных
    try {
        const res = await pool.query(query);
        return res.rows; // Возвращаем результаты запроса
    } catch (err) {
        console.error('Ошибка при выполнении запроса к базе данных:', err.message);
        throw err; // Прокидываем ошибку дальше
    }
}