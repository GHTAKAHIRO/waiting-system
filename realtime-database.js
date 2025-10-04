// リアルタイムデータベースシステム
class RealtimeDatabase {
    constructor() {
        this.baseUrl = 'https://api.jsonbin.io/v3/b'; // JSONBin API（無料）
        this.apiKey = 'YOUR_JSONBIN_API_KEY'; // 実際のAPIキーに置き換え
        this.binId = 'YOUR_BIN_ID'; // 実際のBin IDに置き換え
        this.data = {
            markingQueue: [],
            retryQueue: [],
            questionQueue: [],
            completedCount: 0,
            lastUpdated: Date.now()
        };
        this.listeners = [];
        this.isOnline = navigator.onLine;
        this.syncInterval = null;
        this.init();
    }

    init() {
        console.log('RealtimeDatabaseを初期化しています');
        
        // オンライン状態の監視
        window.addEventListener('online', () => {
            this.isOnline = true;
            console.log('オンラインになりました');
            this.syncData();
        });

        window.addEventListener('offline', () => {
            this.isOnline = false;
            console.log('オフラインになりました');
        });

        // 初期データの読み込み
        this.loadData();
        
        // 定期的な同期（5秒ごと）
        this.syncInterval = setInterval(() => {
            if (this.isOnline) {
                this.syncData();
            }
        }, 5000);

        // ページの可視性変更時の同期
        document.addEventListener('visibilitychange', () => {
            if (!document.hidden && this.isOnline) {
                this.syncData();
            }
        });

        console.log('RealtimeDatabaseの初期化が完了しました');
    }

    // データを読み込み
    async loadData() {
        try {
            if (this.isOnline) {
                const response = await fetch(`${this.baseUrl}/${this.binId}/latest`, {
                    headers: {
                        'X-Master-Key': this.apiKey
                    }
                });
                
                if (response.ok) {
                    const result = await response.json();
                    if (result.record) {
                        this.data = { ...this.data, ...result.record };
                        console.log('クラウドからデータを読み込みました:', this.data);
                    }
                }
            } else {
                // オフライン時はローカルストレージから読み込み
                const localData = localStorage.getItem('juku-offline-data');
                if (localData) {
                    this.data = { ...this.data, ...JSON.parse(localData) };
                    console.log('ローカルからデータを読み込みました:', this.data);
                }
            }
            
            this.notifyListeners('dataLoaded', this.data);
            return this.data;
        } catch (error) {
            console.error('データ読み込みエラー:', error);
            // フォールバック: ローカルストレージから読み込み
            const localData = localStorage.getItem('juku-offline-data');
            if (localData) {
                this.data = { ...this.data, ...JSON.parse(localData) };
                this.notifyListeners('dataLoaded', this.data);
            }
            return this.data;
        }
    }

    // データを保存
    async saveData(newData = null) {
        try {
            if (newData) {
                this.data = { ...this.data, ...newData, lastUpdated: Date.now() };
            } else {
                this.data.lastUpdated = Date.now();
            }

            // ローカルストレージに保存（オフライン対応）
            localStorage.setItem('juku-offline-data', JSON.stringify(this.data));

            if (this.isOnline) {
                // クラウドに保存
                const response = await fetch(`${this.baseUrl}/${this.binId}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-Master-Key': this.apiKey
                    },
                    body: JSON.stringify(this.data)
                });

                if (response.ok) {
                    console.log('クラウドにデータを保存しました:', this.data);
                    this.notifyListeners('dataSaved', this.data);
                    return true;
                } else {
                    console.error('クラウド保存に失敗しました:', response.status);
                    return false;
                }
            } else {
                console.log('オフラインのためローカルに保存しました:', this.data);
                this.notifyListeners('dataSaved', this.data);
                return true;
            }
        } catch (error) {
            console.error('データ保存エラー:', error);
            return false;
        }
    }

    // データを同期
    async syncData() {
        if (!this.isOnline) return;

        try {
            const response = await fetch(`${this.baseUrl}/${this.binId}/latest`, {
                headers: {
                    'X-Master-Key': this.apiKey
                }
            });

            if (response.ok) {
                const result = await response.json();
                if (result.record) {
                    const remoteData = result.record;
                    const localData = this.data;

                    // リモートデータが新しい場合は更新
                    if (remoteData.lastUpdated > localData.lastUpdated) {
                        console.log('リモートデータが新しいため更新します');
                        this.data = { ...this.data, ...remoteData };
                        this.notifyListeners('dataSynced', this.data);
                    }
                    // ローカルデータが新しい場合はアップロード
                    else if (localData.lastUpdated > remoteData.lastUpdated) {
                        console.log('ローカルデータが新しいためアップロードします');
                        await this.saveData();
                    }
                }
            }
        } catch (error) {
            console.error('データ同期エラー:', error);
        }
    }

    // 生徒を追加
    async addStudent(student) {
        try {
            // 重複チェック
            const existingStudent = [
                ...this.data.markingQueue,
                ...this.data.retryQueue,
                ...this.data.questionQueue
            ].find(s => s.id === student.id);

            if (existingStudent) {
                console.log('既存の生徒データが存在します:', student.name);
                return false;
            }

            // 適切なキューに追加
            switch (student.contentType) {
                case '丸付け':
                    this.data.markingQueue.push(student);
                    break;
                case '質問':
                    this.data.questionQueue.push(student);
                    break;
                default:
                    this.data.markingQueue.push(student);
            }

            // データを保存
            const success = await this.saveData();
            
            if (success) {
                console.log('生徒を追加しました:', student.name);
                this.notifyListeners('studentAdded', student);
            }
            
            return success;
        } catch (error) {
            console.error('生徒追加エラー:', error);
            return false;
        }
    }

    // 生徒を移動
    async moveStudent(studentId, fromQueue, toQueue) {
        try {
            let student = null;

            // 元のキューから削除
            switch (fromQueue) {
                case 'marking':
                    student = this.data.markingQueue.find(s => s.id === studentId);
                    if (student) {
                        this.data.markingQueue = this.data.markingQueue.filter(s => s.id !== studentId);
                    }
                    break;
                case 'retry':
                    student = this.data.retryQueue.find(s => s.id === studentId);
                    if (student) {
                        this.data.retryQueue = this.data.retryQueue.filter(s => s.id !== studentId);
                    }
                    break;
                case 'question':
                    student = this.data.questionQueue.find(s => s.id === studentId);
                    if (student) {
                        this.data.questionQueue = this.data.questionQueue.filter(s => s.id !== studentId);
                    }
                    break;
            }

            // 新しいキューに追加
            if (student) {
                switch (toQueue) {
                    case 'marking':
                        this.data.markingQueue.push(student);
                        break;
                    case 'retry':
                        this.data.retryQueue.push(student);
                        break;
                    case 'question':
                        this.data.questionQueue.push(student);
                        break;
                }

                const success = await this.saveData();
                if (success) {
                    console.log('生徒を移動しました:', student.name, `${fromQueue} → ${toQueue}`);
                    this.notifyListeners('studentMoved', { student, fromQueue, toQueue });
                }
                return success;
            }
            return false;
        } catch (error) {
            console.error('生徒移動エラー:', error);
            return false;
        }
    }

    // 生徒を削除（完了）
    async removeStudent(studentId) {
        try {
            let student = null;

            // すべてのキューから削除
            this.data.markingQueue = this.data.markingQueue.filter(s => {
                if (s.id === studentId) {
                    student = s;
                    return false;
                }
                return true;
            });

            this.data.retryQueue = this.data.retryQueue.filter(s => {
                if (s.id === studentId) {
                    student = s;
                    return false;
                }
                return true;
            });

            this.data.questionQueue = this.data.questionQueue.filter(s => {
                if (s.id === studentId) {
                    student = s;
                    return false;
                }
                return true;
            });

            if (student) {
                this.data.completedCount = (this.data.completedCount || 0) + 1;
                const success = await this.saveData();
                
                if (success) {
                    console.log('生徒を完了しました:', student.name);
                    this.notifyListeners('studentCompleted', student);
                }
                return success;
            }
            return false;
        } catch (error) {
            console.error('生徒削除エラー:', error);
            return false;
        }
    }

    // データ変更を監視
    onDataChange(callback) {
        this.listeners.push(callback);
    }

    // リスナーに通知
    notifyListeners(type, data) {
        this.listeners.forEach(callback => {
            try {
                callback(type, data, this.data);
            } catch (error) {
                console.error('リスナー通知エラー:', error);
            }
        });
    }

    // データを取得
    getData() {
        return { ...this.data };
    }

    // データをクリア
    async clearData() {
        this.data = {
            markingQueue: [],
            retryQueue: [],
            questionQueue: [],
            completedCount: 0,
            lastUpdated: Date.now()
        };
        
        const success = await this.saveData();
        if (success) {
            this.notifyListeners('dataCleared', null);
        }
        return success;
    }

    // 破棄
    destroy() {
        if (this.syncInterval) {
            clearInterval(this.syncInterval);
        }
        this.listeners = [];
    }
}

// グローバルインスタンス（設定が不完全なため無効化）
// window.realtimeDatabase = new RealtimeDatabase();
console.log('RealtimeDatabaseは設定が不完全なため無効化されています');
