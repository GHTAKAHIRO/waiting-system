# Firebase設定手順

## 1. Firebaseプロジェクトの作成

1. [Firebase Console](https://console.firebase.google.com/)にアクセス
2. 「プロジェクトを作成」をクリック
3. プロジェクト名を入力（例：juku-waiting-system）
4. Google Analyticsは不要なので「無効」を選択
5. 「プロジェクトを作成」をクリック

## 2. Realtime Databaseの設定

1. 左メニューから「Realtime Database」を選択
2. 「データベースを作成」をクリック
3. ロケーションを選択（asia-northeast1 推奨）
4. セキュリティルールを「テストモード」に設定

## 3. Webアプリの登録

1. プロジェクト設定（歯車アイコン）をクリック
2. 「アプリを追加」→「Web」を選択
3. アプリのニックネームを入力
4. 「Firebase Hostingも設定する」のチェックを外す
5. 「アプリを登録」をクリック

## 4. 設定情報の取得

登録後、以下のような設定情報が表示されます：

```javascript
const firebaseConfig = {
    apiKey: "AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXX",
    authDomain: "juku-waiting-system.firebaseapp.com",
    databaseURL: "https://juku-waiting-system-default-rtdb.firebaseio.com/",
    projectId: "juku-waiting-system",
    storageBucket: "juku-waiting-system.appspot.com",
    messagingSenderId: "123456789012",
    appId: "1:123456789012:web:abcdef1234567890"
};
```

## 5. firebase-config.jsの更新

上記の設定情報を`firebase-config.js`にコピー&ペーストしてください。

## 6. セキュリティルール（本番用）

テストモードのままでは誰でもデータにアクセスできてしまいます。本番環境では以下のルールに変更してください：

```json
{
  "rules": {
    "students": {
      ".read": true,
      ".write": true
    }
  }
}
```

## 7. デプロイ

設定完了後、GitHubにプッシュすると自動でデプロイされます。
