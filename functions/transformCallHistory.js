import dateFormat, { masks } from "dateformat";
// Функция для преобразования ответа с историей звонков
export function transformCallHistory(callHistory) {
    return callHistory.content.map(call => {
        const callTime = new Date(call.callTime);

        return {

            callTime: dateFormat(callTime, "dd.mm.yyyy, h:MM:ss TT"), // Дата и время звонка
            callingNumber: call.callingNumber || 'Неизвестный номер', // Номер звонящего
            calledNumber: call.calledNumber,   // Номер, на который звонили
            direction: call.direction === 'ORIGINATING' ? 'исходящий' : 'входящий', // Направление звонка
            status: call.status === 'PLACED' ? 'состоявшийся' : 'пропущенный' // Статус звонка
        };
    });
}
