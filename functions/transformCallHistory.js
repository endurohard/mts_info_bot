import dateFormat from 'dateformat';

// Функция для преобразования ответа с историей звонков
export function transformCallHistory(callHistory) {
    return callHistory.content.map(call => {
        const callTime = new Date(call.callTime);

        return {
            callTime: dateFormat(callTime, "dd.mm.yyyy, h:MM:ss TT"),
            callingNumber: call.callingNumber,
            calledNumber: call.calledNumber,
            direction: call.direction === 'ORIGINATING' ? 'исходящий' : 'входящий',
            status: call.status === 'PLACED' ? 'состоявшийся' : 'пропущенный'
        };
    });
}

