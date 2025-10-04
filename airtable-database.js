// Airtableデータベースクラス
class AirtableDatabase {
    constructor() {
        this.airtableUrl = 'https://api.airtable.com/v0';
        
        if (window.AIRTABLE_CONFIG) {
            this.baseId = window.AIRTABLE_CONFIG.baseId;
            this.apiKey = window.AIRTABLE_CONFIG.apiKey;
        } else {
            this.baseId = 'YOUR_BASE_ID';
            this.apiKey = 'YOUR_API_KEY';
        }
        
        this.tableId = 'tblQueueData';
        this.data = {
            markingQueue: [],
            retryQueue: [],
            questionQueue: [],
            completedCount: 0,
            lastUpdated: new Date().toISOString()
        };
        
        console.log('AirtableDatabaseを初期化しました');
        console.log('Base ID:', this.baseId);
        console.log('API Key:', this.apiKey ? '設定済み' : '未設定');
    }

    init() {
        console.log('AirtableDatabaseを初期化しています');
        
        if (this.baseId === 'YOUR_BASE_ID' || this.apiKey === 'YOUR_API_KEY') {
            console.warn('⚠️ Airtable設定が完了していません。');
            return;
        }
        
        this.loadData();
        
        setInterval(() => {
            this.loadData();
        }, 5000);
        
        console.log('✅ AirtableDatabase初期化完了');
    }

    async loadData() {
        try {
            const response = await fetch(`${this.airtableUrl}/${this.baseId}/${this.tableId}`, {
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result = await response.json();
            
            if (result.records && result.records.length > 0) {
                const latestRecord = result.records[0];
                const fields = latestRecord.fields;
                
                this.data = {
                    markingQueue: JSON.parse(fields.markingQueue || '[]'),
                    retryQueue: JSON.parse(fields.retryQueue || '[]'),
                    questionQueue: JSON.parse(fields.questionQueue || '[]'),
                    completedCount: parseInt(fields.completedCount || '0'),
                    lastUpdated: fields.lastUpdated || new Date().toISOString()
                };
                
                console.log('✅ Airtableからデータを読み込みました');
                this.emitDataChange();
            }
            
        } catch (error) {
            console.error('❌ Airtableデータ読み込みエラー:', error);
        }
    }

    async saveData() {
        try {
            const response = await fetch(`${this.airtableUrl}/${this.baseId}/${this.tableId}`, {
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`,
                    'Content-Type': 'application/json'
                }
            });

            let recordId = null;
            if (response.ok) {
                const result = await response.json();
                if (result.records && result.records.length > 0) {
                    recordId = result.records[0].id;
                }
            }

            this.data.lastUpdated = new Date().toISOString();
            
            const recordData = {
                fields: {
                    markingQueue: JSON.stringify(this.data.markingQueue),
                    retryQueue: JSON.stringify(this.data.retryQueue),
                    questionQueue: JSON.stringify(this.data.questionQueue),
                    completedCount: this.data.completedCount.toString(),
                    lastUpdated: this.data.lastUpdated
                }
            };

            let saveResponse;
            if (recordId) {
                saveResponse = await fetch(`${this.airtableUrl}/${this.baseId}/${this.tableId}/${recordId}`, {
                    method: 'PATCH',
                    headers: {
                        'Authorization': `Bearer ${this.apiKey}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(recordData)
                });
            } else {
                saveResponse = await fetch(`${this.airtableUrl}/${this.baseId}/${this.tableId}`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${this.apiKey}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(recordData)
                });
            }

            if (!saveResponse.ok) {
                throw new Error(`HTTP error! status: ${saveResponse.status}`);
            }

            console.log('✅ Airtableにデータを保存しました');
            
        } catch (error) {
            console.error('❌ Airtableデータ保存エラー:', error);
        }
    }

    async addStudent(student) {
        console.log('Airtableに生徒を追加:', student);
        
        switch (student.contentType) {
            case '丸付け':
                this.data.markingQueue.push(student);
                break;
            case '質問':
                this.data.questionQueue.push(student);
                break;
            case '直し':
                this.data.retryQueue.push(student);
                break;
        }
        
        await this.saveData();
        this.emitDataChange();
        
        return student;
    }

    async moveStudent(studentId, fromQueue, toQueue) {
        console.log(`Airtableで生徒を移動: ${studentId} (${fromQueue} → ${toQueue})`);
        
        const fromArray = this.data[fromQueue];
        const studentIndex = fromArray.findIndex(s => s.id === studentId);
        if (studentIndex !== -1) {
            const student = fromArray.splice(studentIndex, 1)[0];
            
            if (toQueue === 'completedCount') {
                this.data.completedCount++;
            } else {
                this.data[toQueue].push(student);
            }
            
            await this.saveData();
            this.emitDataChange();
            
            return student;
        }
        
        return null;
    }

    emitDataChange() {
        const event = new CustomEvent('airtableDataChange', {
            detail: this.data
        });
        window.dispatchEvent(event);
    }

    getData() {
        return this.data;
    }
}

window.AirtableDatabase = AirtableDatabase;