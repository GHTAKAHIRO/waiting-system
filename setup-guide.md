# 🚀 自動データ同期システム セットアップガイド

## 📋 概要

複数のデータベースオプションを提供し、**生徒が登録したデータが自動的に先生画面に反映される**システムを構築しました。

## 🎯 目標

- ✅ 生徒が登録 → **自動的に先生画面に反映**
- ✅ 共有URL方式は不要
- ✅ 異なる端末間でのリアルタイム同期
- ✅ 簡単なセットアップ

## 🔧 セットアップ方法（3つのオプション）

### オプション1: Airtable（最も簡単・推奨）

#### 1. Airtableアカウント作成
1. [Airtable.com](https://airtable.com)にアクセス
2. 無料アカウントを作成

#### 2. ベースとテーブル作成
1. 新しいベースを作成
2. テーブル名を「QueueData」に変更
3. 以下のフィールドを作成：
   - **Data** (Long text field)
   - **LastUpdated** (Date & time field)

#### 3. APIキー取得
1. [Airtable API](https://airtable.com/create/tokens)にアクセス
2. 新しいトークンを作成
3. スコープで「data.records:read」と「data.records:write」を選択

#### 4. 設定ファイル更新
`airtable-database.js`の以下の値を更新：
```javascript
this.baseId = 'YOUR_BASE_ID'; // ベースID（URLから取得）
this.apiKey = 'YOUR_API_KEY'; // 作成したAPIキー
```

### オプション2: Supabase（無料・高性能）

#### 1. Supabaseアカウント作成
1. [Supabase.com](https://supabase.com)にアクセス
2. 無料アカウントを作成

#### 2. プロジェクト作成
1. 新しいプロジェクトを作成
2. データベースURLとAPIキーを取得

#### 3. テーブル作成
SQL Editorで以下を実行：
```sql
CREATE TABLE queue_data (
    id INTEGER PRIMARY KEY DEFAULT 1,
    data JSONB NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS（Row Level Security）を無効化（簡易版）
ALTER TABLE queue_data DISABLE ROW LEVEL SECURITY;
```

#### 4. 設定ファイル更新
`supabase-database.js`の以下の値を更新：
```javascript
this.supabaseUrl = 'YOUR_SUPABASE_URL';
this.supabaseKey = 'YOUR_ANON_KEY';
```

### オプション3: JSONBin（最もシンプル）

#### 1. JSONBinアカウント作成
1. [JSONBin.io](https://jsonbin.io)にアクセス
2. 無料アカウントを作成

#### 2. 新しいBin作成
1. 新しいBinを作成
2. 初期データとして以下を設定：
```json
{
    "markingQueue": [],
    "retryQueue": [],
    "questionQueue": [],
    "completedCount": 0,
    "lastUpdated": 0
}
```

#### 3. APIキー取得
1. アカウント設定からMaster Keyを取得

#### 4. 設定ファイル更新
`realtime-database.js`の以下の値を更新：
```javascript
this.apiKey = 'YOUR_JSONBIN_API_KEY';
this.binId = 'YOUR_BIN_ID';
```

## 🔄 データベースの優先順位

システムは以下の順序でデータベースを自動選択します：

1. **Airtable** (最も推奨)
2. **Supabase** (高性能)
3. **JSONBin** (シンプル)
4. **SharedStorage** (フォールバック)

## 🎮 使用方法

### 基本的な流れ
1. **セットアップ完了後**、システムが自動的にデータベースを選択
2. **生徒が登録** → 自動的にクラウドに保存
3. **先生画面が自動更新** → 2-3秒以内に反映
4. **複数端末で同期** → どこからでもアクセス可能

### 特徴
- ✅ **完全自動同期**: 手動操作不要
- ✅ **リアルタイム更新**: 2-3秒以内に反映
- ✅ **オフライン対応**: 接続復旧時に自動同期
- ✅ **複数端末対応**: スマホ・タブレット・PC全て対応

## 🛠️ トラブルシューティング

### データが同期されない場合

#### 1. ブラウザの開発者ツールで確認
```javascript
// Consoleで実行
console.log('利用中のデータベース:', window.airtableDatabase || window.supabaseDatabase || window.realtimeDatabase || window.sharedStorage);
```

#### 2. ネットワーク接続を確認
- インターネット接続が安定しているか確認
- ファイアウォールでAPIアクセスがブロックされていないか確認

#### 3. API設定を確認
- APIキーが正しく設定されているか確認
- データベースのアクセス権限が適切か確認

### よくある問題

#### 問題: 「データベースシステムが利用できません」
**解決策**: いずれかのデータベースの設定を完了してください

#### 問題: データが保存されない
**解決策**: APIキーとデータベースIDを確認してください

#### 問題: 同期が遅い
**解決策**: ネットワーク接続を確認し、ページを再読み込みしてください

## 📊 各データベースの比較

| 特徴 | Airtable | Supabase | JSONBin | SharedStorage |
|------|----------|----------|---------|---------------|
| セットアップ難易度 | ⭐⭐⭐ | ⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| 同期速度 | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐ |
| 無料制限 | 1,200レコード/月 | 500MB | 10,000リクエスト/月 | 制限なし |
| 推奨度 | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐ |

## 🎉 完了後の動作確認

1. **生徒端末**で`student.html`を開く
2. **先生端末**で`teacher.html`を開く
3. **生徒が登録** → **先生画面に自動反映**を確認
4. **複数の生徒**で登録テストを実行
5. **異なる端末**で同期テストを実行

これで、**完全に自動化されたデータ同期システム**が完成です！
