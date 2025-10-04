// 改善されたデータ共有システム
class SharedStorage {
    constructor() {
        this.storageKey = 'juku-waiting-system-shared';
        this.listeners = [];
        this.isOnline = navigator.onLine;
        this.init();
    }

    init() {
        // オンライン状態の監視
        window.addEventListener('online', () => {
            this.isOnline = true;
            this.syncData();
        });

        window.addEventListener('offline', () => {
            this.isOnline = false;
        });

        // 定期的なデータ同期
        setInterval(() => {
            this.checkForUpdates();
        }, 3000);

        // ページの可視性変更時の同期
        document.addEventListener('visibilitychange', () => {
            if (!document.hidden) {
                this.syncData();
            }
        });
    }

    // データを保存
    saveData(data) {
        try {
            const dataWithTimestamp = {
                ...data,
                lastUpdated: Date.now(),
                deviceId: this.getDeviceId()
            };
            
            localStorage.setItem(this.storageKey, JSON.stringify(dataWithTimestamp));
            
            // 他のタブに通知
            this.notifyOtherTabs('dataUpdated', dataWithTimestamp);
            
            // オンラインの場合は外部サービスにも保存
            if (this.isOnline) {
                this.saveToExternal(dataWithTimestamp);
            }
            
            return true;
        } catch (error) {
            console.error('データ保存エラー:', error);
            return false;
        }
    }

    // データを読み込み
    loadData() {
        try {
            const savedData = localStorage.getItem(this.storageKey);
            if (savedData) {
                return JSON.parse(savedData);
            }
            return null;
        } catch (error) {
            console.error('データ読み込みエラー:', error);
            return null;
        }
    }

    // 生徒データを追加
    addStudent(student) {
        const currentData = this.loadData() || {
            markingQueue: [],
            retryQueue: [],
            questionQueue: [],
            completedCount: 0
        };

        // 重複チェック
        const existingStudent = [...currentData.markingQueue, ...currentData.retryQueue, ...currentData.questionQueue]
            .find(s => s.id === student.id);
        
        if (existingStudent) {
            console.log('既存の生徒データが存在します:', student.name);
            return false;
        }

        // 適切なキューに追加
        switch (student.contentType) {
            case '丸付け':
                currentData.markingQueue.push(student);
                break;
            case '質問':
                currentData.questionQueue.push(student);
                break;
            default:
                currentData.markingQueue.push(student);
        }

        return this.saveData(currentData);
    }

    // 生徒データを更新
    updateStudent(studentId, updates) {
        const currentData = this.loadData();
        if (!currentData) return false;

        let found = false;
        const allQueues = [
            { queue: currentData.markingQueue, name: 'markingQueue' },
            { queue: currentData.retryQueue, name: 'retryQueue' },
            { queue: currentData.questionQueue, name: 'questionQueue' }
        ];

        for (const { queue } of allQueues) {
            const index = queue.findIndex(s => s.id === studentId);
            if (index !== -1) {
                queue[index] = { ...queue[index], ...updates };
                found = true;
                break;
            }
        }

        if (found) {
            return this.saveData(currentData);
        }
        return false;
    }

    // 生徒データを削除
    removeStudent(studentId) {
        const currentData = this.loadData();
        if (!currentData) return false;

        let found = false;
        currentData.markingQueue = currentData.markingQueue.filter(s => {
            if (s.id === studentId) {
                found = true;
                return false;
            }
            return true;
        });

        currentData.retryQueue = currentData.retryQueue.filter(s => {
            if (s.id === studentId) {
                found = true;
                return false;
            }
            return true;
        });

        currentData.questionQueue = currentData.questionQueue.filter(s => {
            if (s.id === studentId) {
                found = true;
                return false;
            }
            return true;
        });

        if (found) {
            currentData.completedCount = (currentData.completedCount || 0) + 1;
            return this.saveData(currentData);
        }
        return false;
    }

    // 生徒を移動
    moveStudent(studentId, fromQueue, toQueue) {
        const currentData = this.loadData();
        if (!currentData) return false;

        let student = null;

        // 元のキューから削除
        switch (fromQueue) {
            case 'marking':
                student = currentData.markingQueue.find(s => s.id === studentId);
                if (student) {
                    currentData.markingQueue = currentData.markingQueue.filter(s => s.id !== studentId);
                }
                break;
            case 'retry':
                student = currentData.retryQueue.find(s => s.id === studentId);
                if (student) {
                    currentData.retryQueue = currentData.retryQueue.filter(s => s.id !== studentId);
                }
                break;
            case 'question':
                student = currentData.questionQueue.find(s => s.id === studentId);
                if (student) {
                    currentData.questionQueue = currentData.questionQueue.filter(s => s.id !== studentId);
                }
                break;
        }

        // 新しいキューに追加
        if (student) {
            switch (toQueue) {
                case 'marking':
                    currentData.markingQueue.push(student);
                    break;
                case 'retry':
                    currentData.retryQueue.push(student);
                    break;
                case 'question':
                    currentData.questionQueue.push(student);
                    break;
            }
            return this.saveData(currentData);
        }
        return false;
    }

    // 他のタブに通知
    notifyOtherTabs(type, data) {
        try {
            // BroadcastChannelを使用
            const channel = new BroadcastChannel('juku-waiting-system');
            channel.postMessage({
                type: type,
                data: data,
                timestamp: Date.now()
            });
            channel.close();
        } catch (error) {
            console.log('BroadcastChannelが利用できません:', error);
        }

        // StorageEventを手動で発火
        window.dispatchEvent(new StorageEvent('storage', {
            key: this.storageKey,
            newValue: JSON.stringify(data),
            url: window.location.href
        }));
    }

    // 変更を監視
    onDataChange(callback) {
        this.listeners.push(callback);

        // StorageEventを監視
        window.addEventListener('storage', (e) => {
            if (e.key === this.storageKey && e.newValue) {
                try {
                    const data = JSON.parse(e.newValue);
                    callback('storage', data);
                } catch (error) {
                    console.error('データ解析エラー:', error);
                }
            }
        });

        // BroadcastChannelを監視
        try {
            const channel = new BroadcastChannel('juku-waiting-system');
            channel.addEventListener('message', (e) => {
                if (e.data.type === 'dataUpdated') {
                    callback('broadcast', e.data.data);
                }
            });
        } catch (error) {
            console.log('BroadcastChannelが利用できません:', error);
        }
    }

    // 定期的な更新チェック
    checkForUpdates() {
        const currentData = this.loadData();
        if (currentData) {
            // データが古い場合は更新を通知
            const now = Date.now();
            const lastUpdated = currentData.lastUpdated || 0;
            if (now - lastUpdated > 30000) { // 30秒以上古い場合
                this.notifyListeners('dataStale', currentData);
            }
        }
    }

    // リスナーに通知
    notifyListeners(type, data) {
        this.listeners.forEach(callback => {
            try {
                callback(type, data);
            } catch (error) {
                console.error('リスナー通知エラー:', error);
            }
        });
    }

    // 外部サービスに保存（将来の拡張用）
    saveToExternal(data) {
        // 将来的にFirebaseやその他のサービスと連携
        // 現在はローカルストレージのみ使用
        console.log('外部サービスへの保存は未実装です');
    }

    // データ同期
    syncData() {
        if (this.isOnline) {
            // オンライン時の同期処理
            console.log('データ同期を実行中...');
        }
    }

    // デバイスIDを取得
    getDeviceId() {
        let deviceId = localStorage.getItem('juku-device-id');
        if (!deviceId) {
            deviceId = 'device_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
            localStorage.setItem('juku-device-id', deviceId);
        }
        return deviceId;
    }

    // データをクリア
    clearData() {
        localStorage.removeItem(this.storageKey);
        this.notifyOtherTabs('dataCleared', null);
    }
}

// グローバルインスタンス
window.sharedStorage = new SharedStorage();
