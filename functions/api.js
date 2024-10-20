import https from 'https';
import got from 'got'; // Убедитесь, что got импортирован

const apiToken = process.env.MTS_API_TOKEN;


// Создаем агент с параметрами шифрования
const agent = new https.Agent({
    rejectUnauthorized: false,
    secureProtocol: 'TLSv1_2_method',
    ciphers: 'ECDHE-RSA-AES128-SHA256:ECDHE-RSA-AES128-SHA:ECDHE-RSA-AES256-SHA384',
});

// Функция для получения списка абонентов
export async function getAbonents() {
    const url = 'https://vpbx.mts.ru/api/abonents'; // URL для получения списка абонентов
    const headers = {
        'X-AUTH-TOKEN': apiToken,
        'Content-Type': 'application/json',
        'cache-control': 'no-cache'
    };

    return got.get(url, {
        responseType: 'json',
        headers,
        agent: { https: agent }
    });
}


// Функция для получения истории вызовов
export async function getCallHistory() {
    const dateFrom = new Date();
    dateFrom.setHours(0, 0, 0, 0); // Устанавливаем начало текущего дня

    // URL с параметрами
    const url = `https://vpbx.mts.ru/api/v1/callHistory/enterprise?dateFrom=${dateFrom.getTime()}&page=0&size=50`;

    const headers = {
        'X-AUTH-TOKEN': apiToken,
        'Content-Type': 'application/json',
        'cache-control': 'no-cache'
    };

    // Логируем URL и заголовки для отладки
    console.log('Запрос на URL:', url);
    console.log('Заголовки:', headers);

    try {
        // Отправляем запрос и возвращаем ответ в формате JSON
        return await got.get(url, {
            responseType: 'json',
            headers,
            agent: { https: agent }
        }).json();
    } catch (error) {
        // Логируем ошибку при запросе
        console.error('Ошибка при получении истории вызовов:', error.message);
        throw error; // Прокидываем ошибку дальше
    }
}