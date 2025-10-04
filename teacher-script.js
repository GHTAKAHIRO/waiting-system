class TeacherManagement {
    constructor() {
        this.markingQueue = []; // 丸付けリスト
        this.retryQueue = [];   // 直しリスト
        this.questionQueue = []; // 質問リスト
        this.currentStudent = null;
        this.completedCount = 0;
        this.isUpdating = false; // 更新中フラグ
        this.broadcastChannel = null;
        this.database = null;
        this.init();
    }

    init() {
        this.loadData();
        this.bindEvents();
        this.updateDisplay();
        
        // localStorageの変更を監視
        this.setupStorageListener();
        
        // BroadcastChannelを設定
        this.setupBroadcastChannel();
        
        // Firebaseを設定
        this.setupFirebase();
        
        // URLパラメータから新しい生徒データを読み取り
        this.checkURLParameters();
        
        // フォールバック: 定期的にデータを更新（生徒からの新しい登録を検知）
        setInterval(() => {
            this.checkForUpdates();
        }, 2000); // 10秒から2秒に短縮
    }

    setupBroadcastChannel() {
        try {
            this.broadcastChannel = new BroadcastChannel('juku-waiting-system');
            this.broadcastChannel.addEventListener('message', (event) => {
                console.log('BroadcastChannelでメッセージを受信:', event.data);
                if (event.data.type === 'studentRegistered') {
                    console.log('新しい生徒の登録を検知、データを更新します');
                    this.loadData();
                    this.updateDisplay();
                    this.playNotificationSound();
                }
            });
            console.log('BroadcastChannelを設定しました');
        } catch (error) {
            console.log('BroadcastChannelがサポートされていません:', error);
        }
    }

    setupFirebase() {
        try {
            // Firebaseが利用可能かチェック
            if (typeof firebase !== 'undefined' && firebase.database) {
                this.database = firebase.database();
                console.log('Firebaseデータベースを設定しました');
                
                // リアルタイムリスナーを設定
                this.setupFirebaseListeners();
            } else {
                console.log('Firebaseが利用できません。localStorageを使用します。');
            }
        } catch (error) {
            console.log('Firebaseの設定でエラー:', error);
        }
    }

    setupFirebaseListeners() {
        if (!this.database) return;
        
        try {
            // 生徒データの変更を監視
            const studentsRef = this.database.ref('students');
            
            studentsRef.on('child_added', (snapshot) => {
                const student = snapshot.val();
                console.log('Firebaseから新しい生徒データを受信:', student);
                this.addStudentFromFirebase(student);
            });
            
            studentsRef.on('child_changed', (snapshot) => {
                const student = snapshot.val();
                console.log('Firebaseから生徒データの変更を受信:', student);
                this.updateStudentFromFirebase(student);
            });
            
            studentsRef.on('child_removed', (snapshot) => {
                const studentId = snapshot.key;
                console.log('Firebaseから生徒データの削除を受信:', studentId);
                this.removeStudentFromFirebase(studentId);
            });
            
            console.log('Firebaseリスナーを設定しました');
        } catch (error) {
            console.error('Firebaseリスナーの設定でエラー:', error);
        }
    }

    setupStorageListener() {
        // localStorageの変更を監視（他のタブからの変更）
        window.addEventListener('storage', (e) => {
            console.log('Storageイベント検知:', e.key, e.newValue);
            if (e.key === 'jukuManagementData') {
                console.log('jukuManagementDataの変更を検知、データを再読み込みします');
                this.loadData();
                this.updateDisplay();
                
                // 新しい生徒が追加された場合は通知音を再生
                if (e.newValue) {
                    try {
                        const newData = JSON.parse(e.newValue);
                        const oldData = JSON.parse(e.oldValue || '{"markingQueue":[],"retryQueue":[],"questionQueue":[]}');
                        
                        const newMarkingCount = (newData.markingQueue || []).length;
                        const oldMarkingCount = (oldData.markingQueue || []).length;
                        const newQuestionCount = (newData.questionQueue || []).length;
                        const oldQuestionCount = (oldData.questionQueue || []).length;
                        
                        if (newMarkingCount > oldMarkingCount || newQuestionCount > oldQuestionCount) {
                            console.log('新しい生徒の登録を検知、通知音を再生します');
                            this.playNotificationSound();
                        }
                    } catch (error) {
                        console.log('通知音判定でエラー:', error);
                    }
                }
            }
        });
        
        // 同じタブ内での変更も監視（storageイベントは他のタブでの変更のみ）
        const originalSetItem = localStorage.setItem;
        localStorage.setItem = function(key, value) {
            const oldValue = localStorage.getItem(key);
            originalSetItem.apply(this, arguments);
            if (key === 'jukuManagementData') {
                console.log('同じタブ内でのjukuManagementData変更を検知');
                window.dispatchEvent(new Event('localStorageChange'));
                
                // 手動でstorageイベントを発火（他のタブに通知）
                window.dispatchEvent(new StorageEvent('storage', {
                    key: key,
                    newValue: value,
                    oldValue: oldValue,
                    url: window.location.href
                }));
            }
        };
        
        window.addEventListener('localStorageChange', () => {
            console.log('localStorageChangeイベントを検知');
            this.loadData();
            this.updateDisplay();
        });
        
        // ページの可視性変更時にもデータを確認
        document.addEventListener('visibilitychange', () => {
            if (!document.hidden) {
                console.log('ページが表示されました、データを確認します');
                this.checkForUpdates();
            }
        });
    }

    checkURLParameters() {
        try {
            const urlParams = new URLSearchParams(window.location.search);
            const newStudentData = urlParams.get('newStudent');
            const timestamp = urlParams.get('timestamp');
            
            if (newStudentData && timestamp) {
                console.log('URLパラメータから新しい生徒データを検出:', newStudentData);
                
                // Base64デコード（複数回試行）
                let studentData = null;
                let attempts = 0;
                const maxAttempts = 3;
                
                while (!studentData && attempts < maxAttempts) {
                    attempts++;
                    try {
                        studentData = JSON.parse(atob(newStudentData));
                        studentData.addedAt = new Date(studentData.addedAt);
                        console.log('デコードされた生徒データ:', studentData);
                        break;
                    } catch (decodeError) {
                        console.log(`デコード試行 ${attempts} が失敗:`, decodeError);
                        if (attempts < maxAttempts) {
                            // 少し待ってから再試行
                            setTimeout(() => {}, 100);
                        }
                    }
                }
                
                if (studentData) {
                    // データをキューに追加
                    this.addStudentFromURL(studentData);
                    
                    // 成功通知を表示
                    this.showNotification('新しい生徒が登録されました！', 'success');
                } else {
                    console.error('生徒データのデコードに失敗しました');
                    this.showNotification('生徒データの読み込みに失敗しました', 'error');
                }
                
                // URLをクリーンアップ（パラメータを削除）
                const cleanURL = window.location.pathname;
                window.history.replaceState({}, document.title, cleanURL);
                
                console.log('URLパラメータをクリーンアップしました');
            }
        } catch (error) {
            console.error('URLパラメータの処理でエラー:', error);
            this.showNotification('データ処理中にエラーが発生しました', 'error');
        }
    }

    addStudentFromURL(student) {
        try {
            console.log('URLからの生徒データを追加:', student);
            this.addStudentToQueue(student);
        } catch (error) {
            console.error('URLからの生徒データ追加でエラー:', error);
        }
    }

    addStudentFromFirebase(student) {
        try {
            console.log('Firebaseからの生徒データを追加:', student);
            this.addStudentToQueue(student);
        } catch (error) {
            console.error('Firebaseからの生徒データ追加でエラー:', error);
        }
    }

    addStudentToQueue(student) {
        // 重複チェック
        const existingStudent = [...this.markingQueue, ...this.retryQueue, ...this.questionQueue]
            .find(s => s.id === student.id);
        
        if (existingStudent) {
            console.log('既存の生徒データが存在します:', student.name);
            return;
        }
        
        // 内容に応じて適切なキューに追加
        switch (student.contentType) {
            case '丸付け':
                this.markingQueue.push(student);
                console.log('丸付けリストに追加:', student.name);
                break;
            case '質問':
                this.questionQueue.push(student);
                console.log('質問リストに追加:', student.name);
                break;
            default:
                this.markingQueue.push(student);
                console.log('デフォルトで丸付けリストに追加:', student.name);
        }
        
        // データを保存（localStorage）
        this.saveData();
        
        // 表示を更新
        this.updateDisplay();
        
        // 通知音を再生
        this.playNotificationSound();
        
        // 通知メッセージを表示
        this.showNotification(`${student.name}さんが登録されました！`, 'success');
    }

    checkForUpdates() {
        const savedData = localStorage.getItem('jukuManagementData');
        if (savedData) {
            try {
                const data = JSON.parse(savedData);
                const newMarkingQueue = data.markingQueue || [];
                const newRetryQueue = data.retryQueue || [];
                const newCurrentStudent = data.currentStudent || null;
                const newCompletedCount = data.completedCount || 0;
                
                // データが変更された場合のみ更新
                if (JSON.stringify(newMarkingQueue) !== JSON.stringify(this.markingQueue) ||
                    JSON.stringify(newRetryQueue) !== JSON.stringify(this.retryQueue) ||
                    JSON.stringify(newCurrentStudent) !== JSON.stringify(this.currentStudent) ||
                    newCompletedCount !== this.completedCount) {
                    
                    this.markingQueue = newMarkingQueue;
                    this.retryQueue = newRetryQueue;
                    this.currentStudent = newCurrentStudent;
                    this.completedCount = newCompletedCount;
                    this.updateDisplay();
                }
            } catch (error) {
                console.log('データの読み込みに失敗しました');
            }
        }
    }

    bindEvents() {
        // ボタンが削除されたため、イベントリスナーは不要
    }





    resetQueue() {
        if (confirm('本当にリストをリセットしますか？\n（全てのリストが削除されます）')) {
            this.markingQueue = [];
            this.retryQueue = [];
            this.currentStudent = null;
            this.completedCount = 0;
            
            // 生徒の登録情報もクリア
            localStorage.removeItem('registeredStudent');
            
            this.updateDisplay();
            this.saveData();
            this.showNotification('リストをリセットしました。');
        }
    }

    updateDisplay() {
        if (this.isUpdating) return; // 更新中の場合はスキップ
        
        this.isUpdating = true;
        this.updateMarkingList();
        this.updateRetryList();
        this.updateQuestionList();
        this.updateStats();
        this.adjustSectionSpacing();
        this.isUpdating = false;
    }


    updateMarkingList() {
        const markingList = document.getElementById('markingList');
        
        // 現在のHTMLを生成
        let newHTML;
        if (this.markingQueue.length === 0) {
            newHTML = '<p class="empty-message">丸付け待ちの生徒はいません</p>';
        } else {
            newHTML = this.markingQueue.map((student, index) => `
                <div class="queue-item">
                    <div class="queue-info">
                        <div class="number">${index + 1}</div>
                        <div class="student-info">
                            <div class="student-name">${student.name}</div>
                            <div class="student-details">
                                <span class="subject-badge">${student.subject}</span>
                                <span class="content-badge ${this.getContentTypeClass(student.contentType)}">${student.contentType}</span>
                            </div>
                        </div>
                    </div>
                    <div class="queue-actions">
                        <button class="btn btn-warning" onclick="teacherManagement.moveToRetry(${student.id})" title="直し">直し</button>
                        <button class="btn btn-success" onclick="teacherManagement.completeStudent(${student.id})" title="完了">完了</button>
                    </div>
                </div>
            `).join('');
        }
        
        // 内容が変更された場合のみ更新
        if (markingList.innerHTML !== newHTML) {
            markingList.innerHTML = newHTML;
        }
    }

    updateRetryList() {
        const retryList = document.getElementById('retryList');
        
        // 現在のHTMLを生成
        let newHTML;
                if (this.retryQueue.length === 0) {
                    newHTML = '<p class="empty-message">その他待ちの生徒はいません</p>';
        } else {
            newHTML = this.retryQueue.map((student, index) => `
                <div class="queue-item">
                    <div class="queue-info">
                        <div class="number">${index + 1}</div>
                        <div class="student-info">
                            <div class="student-name">${student.name}</div>
                            <div class="student-details">
                                <span class="subject-badge">${student.subject}</span>
                                <span class="content-badge ${this.getContentTypeClass(student.contentType)}">${student.contentType}</span>
                            </div>
                        </div>
                    </div>
                            <div class="queue-actions">
                                <button class="btn btn-info" onclick="teacherManagement.moveToQuestion(${student.id})" title="質問">質問</button>
                                <button class="btn btn-success" onclick="teacherManagement.completeStudent(${student.id})" title="完了">完了</button>
                            </div>
                </div>
            `).join('');
        }
        
        // 内容が変更された場合のみ更新
        if (retryList.innerHTML !== newHTML) {
            retryList.innerHTML = newHTML;
        }
    }

    updateQuestionList() {
        const questionList = document.getElementById('questionList');
        
        // 現在のHTMLを生成
        let newHTML;
        if (this.questionQueue.length === 0) {
            newHTML = '<p class="empty-message">質問待ちの生徒はいません</p>';
        } else {
            newHTML = this.questionQueue.map((student, index) => `
                <div class="queue-item">
                    <div class="queue-info">
                        <div class="number">${index + 1}</div>
                        <div class="student-info">
                            <div class="student-name">${student.name}</div>
                            <div class="student-details">
                                <span class="subject-badge">${student.subject}</span>
                                <span class="content-badge ${this.getContentTypeClass(student.contentType)}">${student.contentType}</span>
                            </div>
                        </div>
                    </div>
                    <div class="queue-actions">
                        <button class="btn btn-success" onclick="teacherManagement.completeStudent(${student.id})" title="完了">完了</button>
                    </div>
                </div>
            `).join('');
        }
        
        // 内容が変更された場合のみ更新
        if (questionList.innerHTML !== newHTML) {
            questionList.innerHTML = newHTML;
        }
    }

    updateStats(type = 'all') {
        const markingElement = document.getElementById('markingCount');
        const retryElement = document.getElementById('retryCount');
        const questionElement = document.getElementById('questionCount');
        
        const markingCount = this.markingQueue.length;
        const retryCount = this.retryQueue.length;
        const questionCount = this.questionQueue.length;
        
        if (markingElement && markingElement.textContent !== markingCount.toString()) {
            markingElement.textContent = markingCount;
        }
        
        if (retryElement && retryElement.textContent !== retryCount.toString()) {
            retryElement.textContent = retryCount;
        }
        
        if (questionElement && questionElement.textContent !== questionCount.toString()) {
            questionElement.textContent = questionCount;
        }
    }

    adjustSectionSpacing() {
        // 各セクションの人数を取得
        const markingCount = this.markingQueue.length;
        const retryCount = this.retryQueue.length;
        const questionCount = this.questionQueue.length;
        const totalCount = markingCount + retryCount + questionCount;

        // 動的にCSSを調整
        const style = document.getElementById('dynamic-spacing-style') || this.createDynamicStyleElement();
        
        let css = '';
        
        if (totalCount === 0) {
            // 誰もいない場合は間隔を狭く
            css = `
                .queue-section {
                    padding: 5px 30px !important;
                }
                .queue-section h2 {
                    margin-bottom: 3px !important;
                }
                .queue-list {
                    min-height: 50px !important;
                }
            `;
        } else if (totalCount <= 3) {
            // 少人数の場合は少し間隔を広げる
            css = `
                .queue-section {
                    padding: 8px 30px !important;
                }
                .queue-section h2 {
                    margin-bottom: 5px !important;
                }
                .queue-list {
                    min-height: 150px !important;
                }
            `;
        } else if (totalCount <= 6) {
            // 中程度の場合は標準間隔
            css = `
                .queue-section {
                    padding: 10px 30px !important;
                }
                .queue-section h2 {
                    margin-bottom: 8px !important;
                }
                .queue-list {
                    min-height: 200px !important;
                }
            `;
        } else {
            // 多人数の場合は間隔を広げる
            css = `
                .queue-section {
                    padding: 15px 30px !important;
                }
                .queue-section h2 {
                    margin-bottom: 12px !important;
                }
                .queue-list {
                    min-height: 250px !important;
                }
            `;
        }

        // 個別セクションの調整も追加
        css += this.adjustIndividualSections(markingCount, retryCount, questionCount);
        
        style.textContent = css;
        console.log(`間隔調整: 総人数 ${totalCount} (丸付け:${markingCount}, 直し:${retryCount}, 質問:${questionCount})`);
    }

    adjustIndividualSections(markingCount, retryCount, questionCount) {
        let css = '';
        
        // 丸付けセクションの調整
        if (markingCount === 0) {
            css += `
                #markingList {
                    min-height: 50px !important;
                }
            `;
        } else if (markingCount >= 5) {
            css += `
                #markingList {
                    min-height: 300px !important;
                }
            `;
        }
        
        // 直しセクションの調整
        if (retryCount === 0) {
            css += `
                #retryList {
                    min-height: 50px !important;
                }
            `;
        } else if (retryCount >= 5) {
            css += `
                #retryList {
                    min-height: 300px !important;
                }
            `;
        }
        
        // 質問セクションの調整
        if (questionCount === 0) {
            css += `
                #questionList {
                    min-height: 50px !important;
                }
            `;
        } else if (questionCount >= 5) {
            css += `
                #questionList {
                    min-height: 300px !important;
                }
            `;
        }
        
        return css;
    }

    createDynamicStyleElement() {
        const style = document.createElement('style');
        style.id = 'dynamic-spacing-style';
        document.head.appendChild(style);
        return style;
    }

    moveToRetry(studentId) {
        // 丸付けリストから直しリストに移動
        const studentIndex = this.markingQueue.findIndex(s => s.id === studentId);
        if (studentIndex !== -1) {
            const student = this.markingQueue.splice(studentIndex, 1)[0];
            this.retryQueue.push(student);
            this.updateDisplay();
            this.saveData();
            this.showNotification(`${student.name}さんを直しリストに移動しました。`);
        }
    }

    moveToQuestion(studentId) {
        // 直しリストから質問リストに移動
        const studentIndex = this.retryQueue.findIndex(s => s.id === studentId);
        if (studentIndex !== -1) {
            const student = this.retryQueue.splice(studentIndex, 1)[0];
            this.questionQueue.push(student);
            this.updateDisplay();
            this.saveData();
            this.showNotification(`${student.name}さんを質問リストに移動しました。`);
        }
    }

    completeStudent(studentId) {
        console.log(`完了処理開始: 学生ID ${studentId}`);
        console.log('完了前のデータ:', {
            markingQueue: this.markingQueue.length,
            retryQueue: this.retryQueue.length,
            questionQueue: this.questionQueue.length,
            completedCount: this.completedCount
        });
        
        // 生徒を完了として削除
        let student = null;
        
        // 丸付けリストから削除
        const markingIndex = this.markingQueue.findIndex(s => s.id === studentId);
        if (markingIndex !== -1) {
            student = this.markingQueue.splice(markingIndex, 1)[0];
            console.log(`丸付けリストから削除: ${student.name}`);
        }
        
        // 直しリストから削除
        const retryIndex = this.retryQueue.findIndex(s => s.id === studentId);
        if (retryIndex !== -1) {
            student = this.retryQueue.splice(retryIndex, 1)[0];
            console.log(`直しリストから削除: ${student.name}`);
        }
        
        // 質問リストから削除
        const questionIndex = this.questionQueue.findIndex(s => s.id === studentId);
        if (questionIndex !== -1) {
            student = this.questionQueue.splice(questionIndex, 1)[0];
            console.log(`質問リストから削除: ${student.name}`);
        }
        
        if (student) {
            this.completedCount++;
            
            // 生徒の登録情報をクリア（より確実に）
            const registeredStudent = JSON.parse(localStorage.getItem('registeredStudent') || '{}');
            if (registeredStudent.id === studentId) {
                localStorage.removeItem('registeredStudent');
                console.log(`${student.name}さんの登録情報をクリアしました`);
            } else {
                // IDが一致しない場合でも、念のため登録情報をクリア
                console.log('IDが一致しませんが、登録情報をクリアします');
                localStorage.removeItem('registeredStudent');
            }
            
            console.log('完了後のデータ:', {
                markingQueue: this.markingQueue.length,
                retryQueue: this.retryQueue.length,
                questionQueue: this.questionQueue.length,
                completedCount: this.completedCount
            });
            
            this.updateDisplay();
            this.saveData();
            this.showNotification(`${student.name}さんの対応を完了しました。`);
        } else {
            console.error(`学生ID ${studentId} が見つかりませんでした`);
        }
    }

    getContentTypeClass(contentType) {
        switch (contentType) {
            case '丸付け': return 'marking';
            case '質問': return 'question';
            case '直し': return 'retry';
            default: return '';
        }
    }

    playNotificationSound() {
        try {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
            gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
            
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.5);
        } catch (error) {
            console.log('音声通知がサポートされていません');
        }
    }

    getContentTypeClass(contentType) {
        switch (contentType) {
            case '丸付け': return 'marking';
            case '直し（質問なし）': return 'retry-no-question';
            case '直し（質問あり）': return 'retry-with-question';
            default: return '';
        }
    }

    showNotification(message, type = 'success') {
        const notification = document.createElement('div');
        const bgColor = type === 'error' ? '#dc3545' : '#28a745';
        
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${bgColor};
            color: white;
            padding: 15px 20px;
            border-radius: 8px;
            box-shadow: 0 4px 15px rgba(0,0,0,0.2);
            z-index: 1000;
            font-weight: 600;
            animation: slideIn 0.3s ease-out;
            max-width: 300px;
            word-wrap: break-word;
        `;
        notification.textContent = message;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease-in';
            setTimeout(() => {
                if (document.body.contains(notification)) {
                    document.body.removeChild(notification);
                }
            }, 300);
        }, 3000);
    }

    saveData() {
        const data = {
            markingQueue: this.markingQueue,
            retryQueue: this.retryQueue,
            questionQueue: this.questionQueue,
            currentStudent: this.currentStudent,
            completedCount: this.completedCount
        };
        localStorage.setItem('jukuManagementData', JSON.stringify(data));
        console.log('データを保存しました:', {
            markingQueue: this.markingQueue.length,
            retryQueue: this.retryQueue.length,
            questionQueue: this.questionQueue.length,
            completedCount: this.completedCount
        });
    }

    loadData() {
        const savedData = localStorage.getItem('jukuManagementData');
        if (savedData) {
            try {
                const data = JSON.parse(savedData);
                this.markingQueue = data.markingQueue || [];
                this.retryQueue = data.retryQueue || [];
                this.questionQueue = data.questionQueue || [];
                this.currentStudent = data.currentStudent || null;
                this.completedCount = data.completedCount || 0;
                
                console.log('データを読み込みました:', {
                    markingQueue: this.markingQueue.length,
                    retryQueue: this.retryQueue.length,
                    questionQueue: this.questionQueue.length,
                    completedCount: this.completedCount
                });
                
                // データの整合性チェック
                this.validateData();
            } catch (error) {
                console.log('保存データの読み込みに失敗しました');
            }
        }
    }

    validateData() {
        // 重複チェック
        const allStudentIds = [...this.markingQueue, ...this.retryQueue, ...this.questionQueue].map(s => s.id);
        const uniqueIds = [...new Set(allStudentIds)];
        
        if (allStudentIds.length !== uniqueIds.length) {
            console.warn('重複する学生IDが検出されました。データをクリーンアップします。');
            this.cleanupDuplicateData();
        }
        
        // 無効なデータチェック
        this.markingQueue = this.markingQueue.filter(student => student && student.id && student.name);
        this.retryQueue = this.retryQueue.filter(student => student && student.id && student.name);
        this.questionQueue = this.questionQueue.filter(student => student && student.id && student.name);
        
        console.log('データ検証完了:', {
            markingQueue: this.markingQueue.length,
            retryQueue: this.retryQueue.length,
            questionQueue: this.questionQueue.length
        });
    }

    cleanupDuplicateData() {
        // 重複を削除（最初の出現のみ保持）
        const seen = new Set();
        this.markingQueue = this.markingQueue.filter(student => {
            if (seen.has(student.id)) {
                console.log(`重複削除: ${student.name} (ID: ${student.id})`);
                return false;
            }
            seen.add(student.id);
            return true;
        });
        
        this.retryQueue = this.retryQueue.filter(student => {
            if (seen.has(student.id)) {
                console.log(`重複削除: ${student.name} (ID: ${student.id})`);
                return false;
            }
            seen.add(student.id);
            return true;
        });
        
        this.questionQueue = this.questionQueue.filter(student => {
            if (seen.has(student.id)) {
                console.log(`重複削除: ${student.name} (ID: ${student.id})`);
                return false;
            }
            seen.add(student.id);
            return true;
        });
        
        this.saveData();
    }
}

// アプリケーションを初期化
let teacherManagement;
document.addEventListener('DOMContentLoaded', () => {
    teacherManagement = new TeacherManagement();
});
