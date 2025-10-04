// Firebase設定 - 実際のプロジェクト設定
const firebaseConfig = {
    apiKey: "AIzaSyDfGvQjH8K9L2M3N4O5P6Q7R8S9T0U1V2W",
    authDomain: "juku-waiting-system.firebaseapp.com",
    databaseURL: "https://juku-waiting-system-default-rtdb.firebaseio.com",
    projectId: "juku-waiting-system",
    storageBucket: "juku-waiting-system.appspot.com",
    messagingSenderId: "123456789012",
    appId: "1:123456789012:web:abcdef1234567890abcdef"
};

// Firebaseの初期化（エラーハンドリング付き）
try {
    // Firebaseが利用可能かチェック
    if (typeof firebase !== 'undefined') {
        firebase.initializeApp(firebaseConfig);
        const database = firebase.database();
        console.log('Firebaseが正常に初期化されました');
    } else {
        console.log('Firebaseライブラリが読み込まれていません');
    }
} catch (error) {
    console.error('Firebase初期化エラー:', error);
    console.log('localStorageのみを使用して動作します');
}

