import dateFormat from "dateformat";

// Функция для получения истории звонков (добавь свою логику здесь)
export async function getCallHistory() {
    // Пример логики получения истории звонков
    // Например, выполнение HTTP-запроса к API
    const response = await fetch('ваш_адрес_api'); // Замените на ваш адрес
    if (!response.ok) {
        throw new Error('Ошибка получения данных');
    }
    return await response.json(); // Возвращаем JSON-ответ
}

// Функция для преобразования ответа с историей звонков
export function transformCallHistory(callHistory) {
    return callHistory.content.map(call => {
        const callTime = new Date(call.callTime);

        return {
            callTime: dateFormat(callTime, "dd.mm.yyyy, h:MM:ss TT"), // Время звонка
            callingNumber: call.callingNumber, // Номер, с которого был сделан звонок
            calledNumber: call.calledNumber,   // Номер, на который звонили
            direction: call.direction === 'ORIGINATING' ? 'исходящий' : 'входящий', // Направление звонка
            status: call.status === 'PLACED' ? 'состоявшийся' : 'пропущенный' // Статус звонка
        };
    });
}