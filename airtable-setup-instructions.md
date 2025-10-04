# Airtable セットアップ手順

## 1. ベースの作成

1. [Airtable.com](https://airtable.com) にログイン
2. 「Add a base」をクリック
3. 「Start from scratch」を選択
4. ベース名を「塾 順番管理システム」に変更

## 2. テーブルの設定

### テーブル名の変更
- デフォルトのテーブル名を「QueueData」に変更

### フィールドの作成
以下のフィールドを作成してください：

| フィールド名 | フィールドタイプ | 設定 |
|-------------|----------------|------|
| Data | Long text | デフォルト値なし |
| LastUpdated | Date & time | デフォルト値: Now |

### 初期データの追加
1. テーブルの最初の行に以下のデータを入力：

**Data フィールド:**
```json
{
    "markingQueue": [],
    "retryQueue": [],
    "questionQueue": [],
    "completedCount": 0,
    "lastUpdated": 0
}
```

**LastUpdated フィールド:**
現在の日時を入力

## 3. APIキーの取得

1. [Airtable API](https://airtable.com/create/tokens) にアクセス
2. 「Create new token」をクリック
3. トークン名を「塾順番管理システム」に設定
4. スコープで以下を選択：
   - `data.records:read`
   - `data.records:write`
5. 「Create token」をクリック
6. 生成されたトークンをコピー（重要：後で使用します）

## 4. ベースIDの取得

1. Airtableのベースに戻る
2. 右上の「Help」をクリック
3. 「API documentation」を選択
4. 「Base ID」をコピー（重要：後で使用します）

## 5. 設定ファイルの更新

取得した情報を以下のファイルに設定します：
- Base ID: `airtable-database.js`の`this.baseId`
- API Key: `airtable-database.js`の`this.apiKey`
