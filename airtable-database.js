// Airtableデータベースシステム（最も簡単・推奨）
class AirtableDatabase {
    constructor() {
        this.airtableUrl = 'https://api.airtable.com/v0'; // Airtable API
        
        // 設定ファイルから値を取得
        if (window.AIRTABLE_CONFIG) {
            this.baseId = window.AIRTABLE_CONFIG.baseId;
            this.apiKey = window.AIRTABLE_CONFIG.apiKey;
        } else {
            this.baseId = 'YOUR_BASE_ID'; // フォールバック
            this.apiKey = 'YOUR_API_KEY'; // フォールバック
        }
        
        this.tableId = 'tblbl1AsRZ82OXPzJ'; // 実際のテーブルID
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
        console.log('AirtableDatabaseを初期化しています');
        
        // 設定の検証
        if (this.baseId === 'YOUR_BASE_ID' || this.apiKey === 'YOUR_API_KEY') {
            console.warn('⚠️ Airtable設定が完了していません。airtable-config.jsを設定してください。');
            console.warn('設定方法: ベースIDを取得してairtable-config.jsを更新してください。');
            return;
        }
        
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
        
        // APIテストを実行
        this.testAirtableConnection();
        
        // 定期的な同期（2秒ごと）
        this.syncInterval = setInterval(() => {
            if (this.isOnline) {
                this.syncData();
            }
        }, 2000);

        // ページの可視性変更時の同期
        document.addEventListener('visibilitychange', () => {
            if (!document.hidden && this.isOnline) {
                this.syncData();
            }
        });

        console.log('AirtableDatabaseの初期化が完了しました');
    }

    // Airtable接続テスト
    async testAirtableConnection() {
        try {
            console.log('🔍 Airtable接続テストを開始します...');
            const url = `${this.airtableUrl}/${this.baseId}`;
            console.log('🔍 Base URL:', url);
            
            const response = await fetch(url, {
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`,
                    'Content-Type': 'application/json'
                }
            });
            
            console.log('📡 Base test response status:', response.status);
            
            if (response.ok) {
                const result = await response.json();
                console.log('✅ Base接続成功:', result);
                console.log('📊 利用可能なテーブル:', result.tables?.map(t => ({ id: t.id, name: t.name })));
            } else {
                const errorText = await response.text();
                console.error('❌ Base接続エラー:', {
                    status: response.status,
                    statusText: response.statusText,
                    error: errorText
                });
            }
        } catch (error) {
            console.error('❌ Airtable接続テストエラー:', error);
        }
    }

    // データを読み込み
    async loadData() {
        try {
            if (this.isOnline) {
                const url = `${this.airtableUrl}/${this.baseId}/${this.tableId}?maxRecords=1&sort%5B0%5D%5Bfield%5D=LastUpdated&sort%5B0%5D%5Bdirection%5D=desc`;
                console.log('🔍 Airtable URL:', url);
                console.log('🔑 API Key (first 20 chars):', this.apiKey.substring(0, 20) + '...');
                
                const response = await fetch(url, {
                    headers: {
                        'Authorization': `Bearer ${this.apiKey}`,
                        'Content-Type': 'application/json'
                    }
                });
                
                console.log('📡 Response status:', response.status);
                
                if (response.ok) {
                    const result = await response.json();
                    console.log('📊 Airtable response:', result);
                    if (result.records && result.records.length > 0) {
                        const record = result.records[0];
                        if (record.fields.Data) {
                            this.data = { ...this.data, ...JSON.parse(record.fields.Data) };
                            console.log('✅ Airtableからデータを読み込みました:', this.data);
                        }
                    } else {
                        console.log('📝 Airtableにデータがありません。新しいデータを作成します。');
                    }
                } else {
                    const errorText = await response.text();
                    console.error('❌ Airtable API Error:', {
                        status: response.status,
                        statusText: response.statusText,
                        error: errorText,
                        url: url
                    });
                    throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
                }
            } else {
                // オフライン時はローカルストレージから読み込み
                const localData = localStorage.getItem('juku-airtable-data');
                if (localData) {
                    this.data = { ...this.data, ...JSON.parse(localData) };
                    console.log('ローカルからデータを読み込みました:', this.data);
                }
            }
            
            this.notifyListeners('dataLoaded', this.data);
            return this.data;
        } catch (error) {
            console.error('❌ Airtableデータ読み込みエラー:', error);
            // フォールバック: ローカルストレージから読み込み
            const localData = localStorage.getItem('juku-airtable-data');
            if (localData) {
                this.data = { ...this.data, ...JSON.parse(localData) };
                console.log('📱 ローカルストレージからデータを読み込みました');
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
            localStorage.setItem('juku-airtable-data', JSON.stringify(this.data));

            if (this.isOnline) {
                // Airtableに保存
                const response = await fetch(`${this.airtableUrl}/${this.baseId}/${this.tableId}`, {
                    method: 'PATCH',
                    headers: {
                        'Authorization': `Bearer ${this.apiKey}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        records: [{
                            id: 'recMainQueue', // 固定ID
                            fields: {
                                Data: JSON.stringify(this.data),
                                LastUpdated: new Date().toISOString()
                            }
                        }]
                    })
                });

                if (response.ok) {
                    console.log('Airtableにデータを保存しました:', this.data);
                    this.notifyListeners('dataSaved', this.data);
                    return true;
                } else {
                    console.error('Airtable保存に失敗しました:', response.status);
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
            const response = await fetch(`${this.airtableUrl}/${this.baseId}/${this.tableId}?maxRecords=1&sort%5B0%5D%5Bfield%5D=LastUpdated&sort%5B0%5D%5Bdirection%5D=desc`, {
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`
                }
            });

            if (response.ok) {
                const result = await response.json();
                if (result.records && result.records.length > 0) {
                    const record = result.records[0];
                    if (record.fields.Data) {
                        const remoteData = JSON.parse(record.fields.Data);
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

// グローバルインスタンス
window.airtableDatabase = new AirtableDatabase();