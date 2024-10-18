// db.js
export async function getCallHistoryFromDB() {
    const query = 'SELECT * FROM call_history'; // Замените на ваш запрос
    try {
        const res = await pool.query(query);
        return res.rows; // Вернем строки результата
    } catch (err) {
        console.error('Ошибка при выполнении запроса к базе данных:', err.message);
        throw err; // Прокидываем ошибку дальше
    }
}