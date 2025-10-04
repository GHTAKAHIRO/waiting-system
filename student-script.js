class StudentRegistration {
    constructor() {
        this.registeredStudent = null;
        this.broadcastChannel = null;
        this.init();
    }

    init() {
        console.log('StudentRegistrationを初期化しています');
        this.setupBroadcastChannel();
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

    registerStudent() {
        console.log('registerStudentメソッドが呼び出されました');
        
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

        // 既に登録済みかチェック（簡易版）
        const savedRegisteredStudent = localStorage.getItem('registeredStudent');
        if (savedRegisteredStudent) {
            console.log('前回の登録情報が存在します。新しい登録を許可します。');
            // 前回の登録情報をクリアして新しい登録を許可
            localStorage.removeItem('registeredStudent');
            this.registeredStudent = null;
        }

        const student = {
            id: Date.now(),
            name: name,
            subject: subject,
            contentType: contentType,
            addedAt: new Date(),
            completed: false
        };

        // ローカルストレージに保存
        this.registeredStudent = student;
        localStorage.setItem('registeredStudent', JSON.stringify(student));

        // 先生用のキューに追加（共有データ）
        console.log('addToTeacherQueueを呼び出します:', student);
        this.addToTeacherQueue(student);
        console.log('addToTeacherQueueの呼び出しが完了しました');

        this.showSuccessPopup();
        
        // URLパラメータでデータを共有（より確実な方法）
        this.shareDataViaURL(student);
        
        // フォームをリセット
        this.resetForm();
    }

    addToTeacherQueue(student) {
        try {
            // 先生用のキューに追加（内容に応じて適切なリストに追加）
            console.log('addToTeacherQueue開始:', student);
        
            // 複数回試行してデータの整合性を確保
            let success = false;
            let attempts = 0;
            const maxAttempts = 5;
            
            while (!success && attempts < maxAttempts) {
                attempts++;
                console.log(`データ保存試行 ${attempts}/${maxAttempts}`);
                
                try {
                    const teacherData = JSON.parse(localStorage.getItem('jukuManagementData') || '{"markingQueue":[],"retryQueue":[],"questionQueue":[]}');
                    console.log('読み込んだteacherData:', teacherData);
                    
                    // 古いデータ構造から新しいデータ構造に移行
                    if (teacherData.queue && !teacherData.markingQueue) {
                        console.log('古いデータ構造を新しい構造に移行');
                        teacherData.markingQueue = teacherData.queue;
                        delete teacherData.queue;
                    }
                    
                    // データ構造を確認して、存在しない場合は初期化
                    if (!teacherData.markingQueue) {
                        console.log('markingQueueを初期化');
                        teacherData.markingQueue = [];
                    }
                    if (!teacherData.retryQueue) {
                        console.log('retryQueueを初期化');
                        teacherData.retryQueue = [];
                    }
                    if (!teacherData.questionQueue) {
                        console.log('questionQueueを初期化');
                        teacherData.questionQueue = [];
                    }
                    
                    console.log('初期化後のteacherData:', teacherData);
                    
                    // 内容に応じて適切なキューに追加
                    console.log('switch文に入る前のcontentType:', student.contentType);
                    console.log('switch文に入る前のcontentTypeの型:', typeof student.contentType);
                    
                    switch (student.contentType) {
                        case '丸付け':
                            teacherData.markingQueue.push(student);
                            console.log('丸付けリストに追加:', student.name);
                            break;
                        case '質問':
                            teacherData.questionQueue.push(student);
                            console.log('質問リストに直接追加:', student.name);
                            break;
                        default:
                            // デフォルトは丸付けリストに追加
                            teacherData.markingQueue.push(student);
                            console.log('デフォルトで丸付けリストに追加:', student.name, 'contentType:', student.contentType);
                    }
                    
                    console.log('保存前の最終状態:');
                    console.log('丸付けリスト:', teacherData.markingQueue);
                    console.log('直しリスト:', teacherData.retryQueue);
                    console.log('質問リスト:', teacherData.questionQueue);
                    
                    // データを保存
                    localStorage.setItem('jukuManagementData', JSON.stringify(teacherData));
                    
                    // 保存を確認
                    const savedData = localStorage.getItem('jukuManagementData');
                    if (savedData) {
                        const parsedData = JSON.parse(savedData);
                        const targetQueue = student.contentType === '質問' ? parsedData.questionQueue : parsedData.markingQueue;
                        const found = targetQueue.some(s => s.id === student.id);
                        
                        if (found) {
                            console.log('データ保存確認成功:', student.name);
                            success = true;
                        } else {
                            console.log('データ保存確認失敗、再試行します');
                        }
                    } else {
                        console.log('データが保存されませんでした、再試行します');
                    }
                    
                } catch (saveError) {
                    console.error(`保存試行 ${attempts} でエラー:`, saveError);
                    if (attempts < maxAttempts) {
                        // 少し待ってから再試行
                        setTimeout(() => {}, 100);
                    }
                }
            }
            
            if (!success) {
                console.error('最大試行回数に達しました。データの保存に失敗しました。');
                this.showNotification('登録に失敗しました。もう一度お試しください。', 'error');
            } else {
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
                
                // 追加の同期確認（storageイベントを手動で発火）
                window.dispatchEvent(new StorageEvent('storage', {
                    key: 'jukuManagementData',
                    newValue: localStorage.getItem('jukuManagementData'),
                    url: window.location.href
                }));
            }
        
        } catch (error) {
            console.error('addToTeacherQueueでエラーが発生しました:', error);
            console.error('エラーの詳細:', error.stack);
        }
    }

    // URLパラメータでデータを共有
    shareDataViaURL(student) {
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
            
            // 先生画面のURLを生成（新しいタブで開く）
            const teacherURL = `teacher.html?newStudent=${encodedData}&timestamp=${Date.now()}`;
            
            console.log('先生画面URLを生成:', teacherURL);
            
            // ポップアップで先生画面を開く（または新しいタブ）
            const popup = window.open(teacherURL, '_blank', 'width=1200,height=800,scrollbars=yes,resizable=yes');
            
            if (popup) {
                console.log('先生画面を新しいタブで開きました');
                
                // 通知メッセージを表示
                this.showNotification('先生画面を開きました。登録情報が反映されています。', 'success');
                
                // QRコードも表示（フォールバック用）
                this.showQRCodeForTeacher(teacherURL);
            } else {
                console.log('ポップアップがブロックされました');
                this.showNotification('ポップアップがブロックされました。手動で先生画面を開いてください。', 'error');
            }
            
        } catch (error) {
            console.error('URL共有でエラー:', error);
        }
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
