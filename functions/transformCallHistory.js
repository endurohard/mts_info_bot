import dateFormat, { masks } from "dateformat";
// Функция для преобразования ответа с историей звонков
export function transformCallHistory(callHistory) {
    return callHistory.content.map(call => {
        const callTime = new Date(call.callTime);

        return {
            enterpriseBwksId: call.enterpriseBwksId,
            groupBwksId: call.groupBwksId,
            userId: call.userId,
            callTime: dateFormat(callTime, "dd.mm.yyyy, h:MM:ss TT"),
            callingNumber: call.callingNumber,
            calledNumber: call.calledNumber,
            duration: call.duration,
            direction: call.direction === 'ORIGINATING' ? 'исходящий' : 'входящий',
            status: call.status === 'PLACED' ? 'состоявшийся' : 'пропущенный',
            answerDuration: call.answerDuration // Добавлено для отображения времени ответа
        };
    });
}
