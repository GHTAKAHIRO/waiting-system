// Firebase設定
const firebaseConfig = {
    // 実際のFirebaseプロジェクトの設定に置き換えてください
    apiKey: "your-api-key",
    authDomain: "your-project.firebaseapp.com",
    databaseURL: "https://your-project-default-rtdb.firebaseio.com/",
    projectId: "your-project-id",
    storageBucket: "your-project.appspot.com",
    messagingSenderId: "123456789",
    appId: "your-app-id"
};

// Firebaseの初期化
firebase.initializeApp(firebaseConfig);
const database = firebase.database();
