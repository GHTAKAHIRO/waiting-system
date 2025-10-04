class StudentRegistration {
    constructor() {
        this.registeredStudent = null;
        this.broadcastChannel = null;
        this.database = null;
        this.sharedStorage = null;
        this.init();
    }

    init() {
        console.log('StudentRegistrationを初期化しています');
        this.setupBroadcastChannel();
        this.setupFirebase();
        this.setupSharedStorage();
        this.bindEvents();
        this.loadRegisteredStudent();
        console.log('StudentRegistrationの初期化が完了しました');
    }

    setupBroadcastChannel() {
        try {
            this.broadcastChannel = new BroadcastChannel('juku-waiting-system');
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
            } else {
                console.log('Firebaseが利用できません。localStorageを使用します。');
            }
        } catch (error) {
            console.log('Firebaseの設定でエラー:', error);
        }
    }

    setupSharedStorage() {
        try {
            // 優先順位: Airtable > Supabase > RealtimeDatabase > SharedStorage
            if (window.airtableDatabase) {
                this.database = window.airtableDatabase;
                console.log('AirtableDatabaseを設定しました');
            } else if (window.supabaseDatabase) {
                this.database = window.supabaseDatabase;
                console.log('SupabaseDatabaseを設定しました');
            } else if (window.realtimeDatabase) {
                this.database = window.realtimeDatabase;
                console.log('RealtimeDatabaseを設定しました');
            } else if (window.sharedStorage) {
                this.database = window.sharedStorage;
                console.log('SharedStorageを設定しました');
            } else {
                console.log('データベースシステムが利用できません。');
            }
        } catch (error) {
            console.log('データベースシステムの設定でエラー:', error);
            console.warn('⚠️ Airtableが利用できないため、システムが機能しません。');
        }
    }

    bindEvents() {
        const form = document.getElementById('registrationForm');
        const submitButton = document.querySelector('button[type="submit"]');
        
        if (!form) {
            console.error('フォームが見つかりません: registrationForm');
            return;
        }
        
        console.log('フォームのイベントリスナーを設定しました');
        
        // フォーム送信イベント
        form.addEventListener('submit', (e) => {
            console.log('フォーム送信イベントが発生しました');
            e.preventDefault();
            this.registerStudent();
        });
        
        // ボタンクリックイベント（フォールバック）
        if (submitButton) {
            submitButton.addEventListener('click', (e) => {
                console.log('ボタンクリックイベントが発生しました');
                e.preventDefault();
                this.registerStudent();
            });
        }
    }

    async registerStudent() {
        console.log('registerStudentメソッドが呼び出されました - v3.0');
        
        const nameInput = document.getElementById('studentName');
        const subjectSelect = document.getElementById('subject');
        const contentTypeSelect = document.getElementById('contentType');

        if (!nameInput || !subjectSelect || !contentTypeSelect) {
            console.error('必要な要素が見つかりません:', { nameInput, subjectSelect, contentTypeSelect });
            return;
        }
        
        console.log('contentTypeSelect要素:', contentTypeSelect);
        console.log('contentTypeSelect.selectedIndex:', contentTypeSelect.selectedIndex);
        console.log('contentTypeSelect.options:', contentTypeSelect.options);
        if (contentTypeSelect.selectedIndex >= 0) {
            console.log('選択されたoption:', contentTypeSelect.options[contentTypeSelect.selectedIndex]);
        }

        const name = nameInput.value.trim();
        const subject = subjectSelect.value;
        const contentType = contentTypeSelect.value;
        
        console.log('入力値:', { name, subject, contentType });
        console.log('contentTypeの型:', typeof contentType);
        console.log('contentTypeの長さ:', contentType.length);
        console.log('contentType === "質問":', contentType === "質問");

        // バリデーション
        if (!name) {
            this.showNotification('氏名を入力してください。', 'error');
            nameInput.focus();
            return;
        }

        if (!subject) {
            this.showNotification('教科を選択してください。', 'error');
            subjectSelect.focus();
            return;
        }

        if (!contentType) {
            this.showNotification('内容を選択してください。', 'error');
            contentTypeSelect.focus();
            return;
        }

        const student = {
            id: Date.now(),
            name: name,
            subject: subject,
            contentType: contentType,
            addedAt: new Date(),
            completed: false
        };

        // 登録情報を保存
        this.registeredStudent = student;

        // Airtableデータベースを使用
        console.log('Airtableデータベースを使用してデータを保存します:', student);
        
        if (this.database) {
            try {
                const queueSuccess = await this.database.addStudent(student);
                console.log('データ保存結果:', queueSuccess);
                
                if (queueSuccess) {
                    this.showSuccessPopup();
                    // フォームをリセット
                    this.resetForm();
                } else {
                    this.showNotification('登録に失敗しました。もう一度お試しください。', 'error');
                }
            } catch (error) {
                console.error('登録エラー:', error);
                this.showNotification('登録中にエラーが発生しました。もう一度お試しください。', 'error');
            }
        } else {
            console.error('データベースシステムが利用できません');
            this.showNotification('システムエラー: データベースに接続できません。', 'error');
        }
    }

    async addToTeacherQueue(student) {
        try {
            console.log('addToTeacherQueue開始:', student);
        
            // データ保存を試行
            let success = false;
            let attempts = 0;
            const maxAttempts = 3;
            
            while (!success && attempts < maxAttempts) {
                attempts++;
                console.log(`データ保存試行 ${attempts}/${maxAttempts}`);
                
                try {
                    // 既存データを読み込み
                    const existingData = localStorage.getItem('jukuManagementData');
                    const teacherData = existingData ? JSON.parse(existingData) : {
                        markingQueue: [],
                        retryQueue: [],
                        questionQueue: [],
                        completedCount: 0
                    };
                    
                    // データ構造の整合性を確保
                    if (!teacherData.markingQueue) teacherData.markingQueue = [];
                    if (!teacherData.retryQueue) teacherData.retryQueue = [];
                    if (!teacherData.questionQueue) teacherData.questionQueue = [];
                    if (!teacherData.completedCount) teacherData.completedCount = 0;
                    
                    // 重複チェック
                    const existingStudent = [...teacherData.markingQueue, ...teacherData.retryQueue, ...teacherData.questionQueue]
                        .find(s => s.id === student.id);
                    
                    if (existingStudent) {
                        console.log('既存の生徒データが存在します:', student.name);
                        success = true;
                        break;
                    }
                    
                    // 内容に応じて適切なキューに追加
                    switch (student.contentType) {
                        case '丸付け':
                            teacherData.markingQueue.push(student);
                            console.log('丸付けリストに追加:', student.name);
                            break;
                        case '質問':
                            teacherData.questionQueue.push(student);
                            console.log('質問リストに追加:', student.name);
                            break;
                        default:
                            teacherData.markingQueue.push(student);
                            console.log('デフォルトで丸付けリストに追加:', student.name);
                    }
                    
                    // データを保存
                    localStorage.setItem('jukuManagementData', JSON.stringify(teacherData));
                    
                    // 保存確認
                    const savedData = localStorage.getItem('jukuManagementData');
                    if (savedData) {
                        const parsedData = JSON.parse(savedData);
                        const targetQueue = student.contentType === '質問' ? parsedData.questionQueue : parsedData.markingQueue;
                        const found = targetQueue.some(s => s.id === student.id);
                        
                        if (found) {
                            console.log('データ保存確認成功:', student.name);
                            success = true;
                        }
                    }
                    
                } catch (saveError) {
                    console.error(`保存試行 ${attempts} でエラー:`, saveError);
                    if (attempts < maxAttempts) {
                        await new Promise(resolve => setTimeout(resolve, 100));
                    }
                }
            }
            
            if (!success) {
                console.error('データの保存に失敗しました。');
                this.showNotification('登録に失敗しました。もう一度お試しください。', 'error');
                return false;
            }
            
            console.log('先生側のキューに追加しました:', student);
            
            // BroadcastChannelで他のタブに通知
            if (this.broadcastChannel) {
                try {
                    this.broadcastChannel.postMessage({
                        type: 'studentRegistered',
                        student: student,
                        timestamp: Date.now()
                    });
                    console.log('BroadcastChannelで通知を送信しました');
                } catch (error) {
                    console.log('BroadcastChannelでの通知送信に失敗:', error);
                }
            }
            
            // storageイベントを手動で発火（他のタブに通知）
            window.dispatchEvent(new StorageEvent('storage', {
                key: 'jukuManagementData',
                newValue: localStorage.getItem('jukuManagementData'),
                url: window.location.href
            }));
            
            return true;
        
        } catch (error) {
            console.error('addToTeacherQueueでエラーが発生しました:', error);
            return false;
        }
    }

    // 共有URL方式でデータを共有（確実な方法）
    createSharedURL(student) {
        try {
            // データをBase64エンコード
            const studentData = {
                name: student.name,
                subject: student.subject,
                contentType: student.contentType,
                id: student.id,
                addedAt: student.addedAt.toISOString(),
                completed: student.completed
            };
            
            const encodedData = btoa(JSON.stringify(studentData));
            
            // 先生画面のURLを生成
            const teacherURL = `teacher.html?newStudent=${encodedData}&timestamp=${Date.now()}`;
            
            console.log('先生画面URLを生成:', teacherURL);
            
            // 共有URLポップアップを表示
            this.showSharedURLPopup(teacherURL, student);
            
        } catch (error) {
            console.error('URL共有でエラー:', error);
            // フォールバック：シンプルな通知
            this.showSimpleNotification(teacherURL);
        }
    }

    // 共有URLポップアップを表示
    showSharedURLPopup(teacherURL, student) {
        const popup = document.createElement('div');
        popup.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.8);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 10000;
            font-family: Arial, sans-serif;
        `;
        
        popup.innerHTML = `
            <div style="
                background: white;
                padding: 40px;
                border-radius: 15px;
                text-align: center;
                max-width: 600px;
                margin: 20px;
            ">
                <h2 style="color: #28a745; margin-bottom: 20px;">✅ 登録完了！</h2>
                <p style="margin-bottom: 30px; font-size: 16px;">
                    <strong>${student.name}さん</strong>の登録が完了しました。<br>
                    先生に以下のURLを送信してください：
                </p>
                
                <div style="background: #f8f9fa; padding: 20px; border-radius: 10px; margin-bottom: 30px;">
                    <p style="margin-bottom: 15px; font-weight: bold; color: #333;">🔗 先生画面URL</p>
                    <input type="text" value="${teacherURL}" readonly style="
                        width: 100%;
                        padding: 15px;
                        border: 2px solid #007bff;
                        border-radius: 8px;
                        font-size: 14px;
                        background: white;
                        color: #333;
                    " onclick="this.select()">
                </div>
                
                <div style="display: flex; gap: 15px; justify-content: center; flex-wrap: wrap;">
                    <button onclick="navigator.clipboard.writeText('${teacherURL}'); this.textContent='✅ コピー完了!'; setTimeout(() => this.textContent='📋 URLをコピー', 3000);" style="
                        background: #28a745;
                        color: white;
                        border: none;
                        padding: 15px 25px;
                        border-radius: 8px;
                        cursor: pointer;
                        font-size: 14px;
                        font-weight: 600;
                        min-width: 120px;
                    ">📋 URLをコピー</button>
                    
                    <button onclick="window.open('${teacherURL}', '_blank'); this.textContent='✅ 開きました!'; setTimeout(() => this.textContent='🖥️ 先生画面を開く', 3000);" style="
                        background: #007bff;
                        color: white;
                        border: none;
                        padding: 15px 25px;
                        border-radius: 8px;
                        cursor: pointer;
                        font-size: 14px;
                        font-weight: 600;
                        min-width: 120px;
                    ">🖥️ 先生画面を開く</button>
                    
                    <button onclick="this.parentElement.parentElement.parentElement.remove()" style="
                        background: #6c757d;
                        color: white;
                        border: none;
                        padding: 15px 25px;
                        border-radius: 8px;
                        cursor: pointer;
                        font-size: 14px;
                        font-weight: 600;
                        min-width: 120px;
                    ">閉じる</button>
                </div>
                
                <p style="margin-top: 20px; font-size: 12px; color: #666;">
                    💡 ヒント：URLをコピーして先生に送信するか、直接先生画面を開いてください
                </p>
            </div>
        `;
        
        document.body.appendChild(popup);
        
        // 30秒後に自動で閉じる
        setTimeout(() => {
            if (document.body.contains(popup)) {
                document.body.removeChild(popup);
            }
        }, 30000);
    }


    // シンプルな通知（最後の手段）
    showSimpleNotification(teacherURL) {
        alert(`登録完了！\n\n先生画面を開くには以下のURLをコピーしてください：\n\n${teacherURL}`);
    }

    // QRコードを表示して先生画面のURLを共有
    showQRCodeForTeacher(teacherURL) {
        // 簡単なQRコード生成ライブラリを動的に読み込み
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/qrcode@1.5.3/build/qrcode.min.js';
        script.onload = () => {
            try {
                // QRコードを生成
                QRCode.toDataURL(teacherURL, { width: 200 }, (err, url) => {
                    if (err) {
                        console.log('QRコード生成に失敗:', err);
                        return;
                    }
                    
                    // QRコードを表示するポップアップを作成
                    const qrPopup = document.createElement('div');
                    qrPopup.style.cssText = `
                        position: fixed;
                        top: 50%;
                        left: 50%;
                        transform: translate(-50%, -50%);
                        background: white;
                        padding: 30px;
                        border-radius: 15px;
                        box-shadow: 0 10px 30px rgba(0,0,0,0.3);
                        z-index: 1001;
                        text-align: center;
                        max-width: 300px;
                    `;
                    
                    qrPopup.innerHTML = `
                        <h3 style="margin-bottom: 20px; color: #333;">先生画面を開く</h3>
                        <img src="${url}" alt="QRコード" style="margin-bottom: 20px;">
                        <p style="font-size: 14px; color: #666; margin-bottom: 15px;">
                            スマートフォンでQRコードを読み取って先生画面を開いてください
                        </p>
                        <p style="font-size: 12px; color: #999; margin-bottom: 20px; word-break: break-all;">
                            ${teacherURL}
                        </p>
                        <div style="display: flex; gap: 10px; justify-content: center;">
                            <button onclick="navigator.clipboard.writeText('${teacherURL}'); this.textContent='コピー完了!'; setTimeout(() => this.textContent='URLをコピー', 2000);" style="
                                background: #28a745;
                                color: white;
                                border: none;
                                padding: 8px 15px;
                                border-radius: 5px;
                                cursor: pointer;
                                font-size: 12px;
                            ">URLをコピー</button>
                            <button onclick="this.parentElement.parentElement.remove()" style="
                                background: #6c757d;
                                color: white;
                                border: none;
                                padding: 8px 15px;
                                border-radius: 5px;
                                cursor: pointer;
                                font-size: 12px;
                            ">閉じる</button>
                        </div>
                    `;
                    
                    document.body.appendChild(qrPopup);
                    
                    // 3秒後に自動で閉じる
                    setTimeout(() => {
                        if (document.body.contains(qrPopup)) {
                            document.body.removeChild(qrPopup);
                        }
                    }, 10000);
                });
            } catch (error) {
                console.log('QRコード生成でエラー:', error);
            }
        };
        document.head.appendChild(script);
    }

    // Firebaseにデータを保存
    saveToFirebase(student) {
        if (!this.database) {
            console.log('Firebaseが利用できないため、localStorageのみを使用します');
            return;
        }
        
        try {
            console.log('Firebaseにデータを保存:', student);
            
            // データベースに保存
            const studentRef = this.database.ref('students/' + student.id);
            studentRef.set(student).then(() => {
                console.log('Firebaseへの保存が完了しました');
            }).catch((error) => {
                console.error('Firebaseへの保存でエラー:', error);
            });
            
        } catch (error) {
            console.error('Firebase保存でエラー:', error);
        }
    }

    // デバッグ用: localStorageをクリア
    clearLocalStorage() {
        localStorage.clear();
        console.log('localStorageをクリアしました');
    }

    showSuccessPopup() {
        // ポップアップを作成
        const popup = document.createElement('div');
        popup.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.5);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 1000;
            animation: fadeIn 0.3s ease-out;
        `;
        
        const popupContent = document.createElement('div');
        popupContent.style.cssText = `
            background: white;
            padding: 40px;
            border-radius: 15px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.3);
            text-align: center;
            max-width: 400px;
            margin: 20px;
            animation: slideIn 0.3s ease-out;
        `;
        
        popupContent.innerHTML = `
            <div style="font-size: 3em; margin-bottom: 20px;">✅</div>
            <h2 style="color: #28a745; margin-bottom: 15px; font-size: 1.5em;">登録完了</h2>
            <p style="color: #495057; margin-bottom: 30px; font-size: 1.1em; line-height: 1.5;">
                先生に呼ばれるまでお待ちください。
            </p>
            <button id="closePopup" style="
                background: #28a745;
                color: white;
                border: none;
                padding: 12px 30px;
                border-radius: 8px;
                font-size: 16px;
                font-weight: 600;
                cursor: pointer;
                transition: all 0.3s;
            " onmouseover="this.style.background='#218838'" onmouseout="this.style.background='#28a745'">
                閉じる
            </button>
        `;
        
        popup.appendChild(popupContent);
        document.body.appendChild(popup);
        
        // 閉じるボタンのイベント
        const closeBtn = popupContent.querySelector('#closePopup');
        closeBtn.addEventListener('click', () => {
            popup.style.animation = 'fadeOut 0.3s ease-in';
            setTimeout(() => {
                document.body.removeChild(popup);
            }, 300);
        });
        
        // 背景クリックで閉じる
        popup.addEventListener('click', (e) => {
            if (e.target === popup) {
                popup.style.animation = 'fadeOut 0.3s ease-in';
                setTimeout(() => {
                    document.body.removeChild(popup);
                }, 300);
            }
        });
    }


    resetForm() {
        // フォームをリセット
        document.getElementById('studentName').value = '';
        document.getElementById('subject').value = '';
        document.getElementById('contentType').value = '';
        document.getElementById('studentName').focus();
    }

    loadRegisteredStudent() {
        const saved = localStorage.getItem('registeredStudent');
        if (saved) {
            this.registeredStudent = JSON.parse(saved);
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
}

// CSS アニメーションを追加
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOut {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }
    
    @keyframes fadeIn {
        from {
            opacity: 0;
        }
        to {
            opacity: 1;
        }
    }
    
    @keyframes fadeOut {
        from {
            opacity: 1;
        }
        to {
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);

// アプリケーションを初期化
let studentRegistration;
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOMContentLoadedイベントが発生しました');
    studentRegistration = new StudentRegistration();
    console.log('StudentRegistrationインスタンスが作成されました');
});
