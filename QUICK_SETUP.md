# 🚀 クイックセットアップガイド

## 📋 手順1: Airtableでベースを作成

### 1.1 ベースの作成
1. [Airtable.com](https://airtable.com) にログイン
2. 「Add a base」→「Start from scratch」
3. ベース名を「塾 順番管理システム」に変更

### 1.2 テーブルの設定
1. テーブル名を「QueueData」に変更
2. 以下のフィールドを作成：

**フィールド1: Data**
- タイプ: Long text
- 名前: Data

**フィールド2: LastUpdated**  
- タイプ: Date & time
- 名前: LastUpdated
- デフォルト値: Now

### 1.3 初期データの追加
テーブルの最初の行に以下を入力：

**Data フィールド:**
```
{"markingQueue":[],"retryQueue":[],"questionQueue":[],"completedCount":0,"lastUpdated":0}
```

**LastUpdated フィールド:**
現在の日時を選択

## 📋 手順2: APIキーを取得

### 2.1 トークン作成
1. [Airtable API](https://airtable.com/create/tokens) にアクセス
2. 「Create new token」
3. 名前: 「塾順番管理システム」
4. スコープ選択:
   - ✅ `data.records:read`
   - ✅ `data.records:write`
5. 「Create token」→ トークンをコピー

### 2.2 ベースIDを取得
1. Airtableのベースに戻る
2. 右上「Help」→「API documentation」
3. 「Base ID」をコピー

## 📋 手順3: 設定ファイルを更新

### 3.1 設定ファイルを開く
`airtable-config.js` をテキストエディタで開く

### 3.2 値を入力
```javascript
const AIRTABLE_CONFIG = {
    // ベースIDを入力（例: appXXXXXXXXXXXXXX）
    baseId: 'ここにベースIDを入力',
    
    // APIキーを入力（例: patXXXXXXXXXXXXXX.XXXXXXXXXXXXXX）
    apiKey: 'ここにAPIキーを入力'
};
```

### 3.3 保存
ファイルを保存

## 📋 手順4: 動作確認

### 4.1 ブラウザで確認
1. `student.html` を開く
2. ブラウザの開発者ツール（F12）を開く
3. Consoleタブで以下を確認：
   - 「✅ Airtable設定が完了しました」が表示される
   - 「AirtableDatabaseを設定しました」が表示される

### 4.2 テスト実行
1. 生徒画面で登録をテスト
2. 先生画面で自動反映を確認
3. 複数端末で同期テスト

## 🔧 トラブルシューティング

### 問題: 「Airtable設定が完了していません」
**解決策**: `airtable-config.js`の値を正しく入力してください

### 問題: 「API Keyが無効です」
**解決策**: APIキーが正しくコピーされているか確認してください

### 問題: 「Base IDが見つかりません」
**解決策**: ベースIDが正しくコピーされているか確認してください

## ✅ 完了！

設定が完了すると：
- 生徒が登録 → 自動的に先生画面に反映
- 共有URLは不要
- 複数端末でリアルタイム同期
- 2-3秒以内に自動更新

🎉 **これで完全自動同期システムが動作します！**
