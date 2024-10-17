// Функция для преобразования ответа с историей звонков
export function transformCallHistory(callHistory) {
    return callHistory.map(call => {
        return {
            enterpriseBwksId: call.enterpriseBwksId,
            groupBwksId: call.groupBwksId,
            userId: call.userId,
            callTime: new Date(call.callTime).toLocaleString(),
            callingNumber: call.callingNumber,
            calledNumber: call.calledNumber,
            duration: call.duration,
            direction: call.direction === 'ORIGINATING' ? 'исходящий' : 'входящий',
            status: call.status === 'PLACED' ? 'состоявшийся' : 'пропущенный',
            answerDuration: call.answerDuration // Добавлено для отображения времени ответа
        };
    });
}