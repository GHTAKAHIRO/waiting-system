// WebSocketサーバー（Node.js）
const WebSocket = require('ws');
const http = require('http');

const server = http.createServer();
const wss = new WebSocket.Server({ server });

// 生徒データを保存
let students = {
    markingQueue: [],
    retryQueue: [],
    questionQueue: []
};

wss.on('connection', (ws) => {
    console.log('新しいクライアントが接続しました');
    
    // 接続時に現在のデータを送信
    ws.send(JSON.stringify({
        type: 'initialData',
        data: students
    }));
    
    ws.on('message', (message) => {
        try {
            const data = JSON.parse(message);
            console.log('受信したデータ:', data);
            
            switch (data.type) {
                case 'studentRegistered':
                    // 新しい生徒を追加
                    const student = data.student;
                    switch (student.contentType) {
                        case '丸付け':
                            students.markingQueue.push(student);
                            break;
                        case '質問':
                            students.questionQueue.push(student);
                            break;
                        default:
                            students.markingQueue.push(student);
                    }
                    
                    // 全クライアントに通知
                    broadcast({
                        type: 'studentAdded',
                        student: student,
                        data: students
                    });
                    break;
                    
                case 'studentCompleted':
                    // 生徒を完了として削除
                    const studentId = data.studentId;
                    removeStudent(studentId);
                    
                    // 全クライアントに通知
                    broadcast({
                        type: 'studentCompleted',
                        studentId: studentId,
                        data: students
                    });
                    break;
                    
                case 'studentMoved':
                    // 生徒を移動
                    moveStudent(data.studentId, data.fromQueue, data.toQueue);
                    
                    // 全クライアントに通知
                    broadcast({
                        type: 'studentMoved',
                        data: students
                    });
                    break;
            }
        } catch (error) {
            console.error('メッセージ処理エラー:', error);
        }
    });
    
    ws.on('close', () => {
        console.log('クライアントが切断しました');
    });
});

function removeStudent(studentId) {
    students.markingQueue = students.markingQueue.filter(s => s.id !== studentId);
    students.retryQueue = students.retryQueue.filter(s => s.id !== studentId);
    students.questionQueue = students.questionQueue.filter(s => s.id !== studentId);
}

function moveStudent(studentId, fromQueue, toQueue) {
    let student = null;
    
    // 元のキューから削除
    switch (fromQueue) {
        case 'marking':
            student = students.markingQueue.find(s => s.id === studentId);
            if (student) students.markingQueue = students.markingQueue.filter(s => s.id !== studentId);
            break;
        case 'retry':
            student = students.retryQueue.find(s => s.id === studentId);
            if (student) students.retryQueue = students.retryQueue.filter(s => s.id !== studentId);
            break;
        case 'question':
            student = students.questionQueue.find(s => s.id === studentId);
            if (student) students.questionQueue = students.questionQueue.filter(s => s.id !== studentId);
            break;
    }
    
    // 新しいキューに追加
    if (student) {
        switch (toQueue) {
            case 'marking':
                students.markingQueue.push(student);
                break;
            case 'retry':
                students.retryQueue.push(student);
                break;
            case 'question':
                students.questionQueue.push(student);
                break;
        }
    }
}

function broadcast(message) {
    wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify(message));
        }
    });
}

const PORT = process.env.PORT || 8080;
server.listen(PORT, () => {
    console.log(`WebSocketサーバーがポート${PORT}で起動しました`);
});
