import dateFormat, { masks } from "dateformat";
// Функция для преобразования ответа с историей звонков
export function transformCallHistory(callHistory) {
    return callHistory.content.map(call => {
        const callTime = new Date(call.callTime);

        return {
            enterpriseBwksId: call.enterpriseBwksId,
            groupBwksId: call.groupBwksId,
            userId: call.userId,
            callTime: dateFormat(callTime, "dd.mm.yyyy, h:MM:ss TT"), // Дата и время звонка
            callingNumber: call.callingNumber,
            calledNumber: call.calledNumber,
            duration: call.duration,
            direction: call.direction === 'ORIGINATING' ? 'исходящий' : 'входящий',
            status: call.status === 'PLACED' ? 'состоявшийся' : 'пропущенный',
            answerDuration: call.answerDuration // Добавлено для отображения времени ответа
        };
    });
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
            status: call.status === 'PLACED' ? 'состоявшийся' : 'пропущенный', // Статус звонка
    });
}