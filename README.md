# 📚 塾 順番管理システム

生徒と先生が使える順番管理WEBアプリケーションです。

## 🌟 機能

### 📱 生徒用画面
- 氏名・教科・内容（丸付け・質問）を入力
- 順番登録
- 登録完了通知

### 👨‍🏫 先生用画面
- 待機状況の表示（丸付け・直し・質問）
- 生徒リストの管理
- 段階的な対応（丸付け→直し→質問→完了）

## 🚀 デプロイ方法

### 1. GitHub Pages（推奨）

1. **GitHubにリポジトリを作成**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin https://github.com/yourusername/juku-system.git
   git push -u origin main
   ```

2. **GitHub Pagesを有効化**
   - リポジトリの Settings → Pages
   - Source: Deploy from a branch
   - Branch: main
   - 保存後、数分で `https://yourusername.github.io/juku-system` でアクセス可能

### 2. Netlify

1. **Netlifyにアクセス**: https://netlify.com
2. **New site from Git** を選択
3. **GitHubリポジトリを選択**
4. **Build settings**:
   - Build command: (空のまま)
   - Publish directory: (空のまま)
5. **Deploy site** をクリック

### 3. Vercel

1. **Vercelにアクセス**: https://vercel.com
2. **New Project** をクリック
3. **GitHubリポジトリを選択**
4. **Deploy** をクリック

### 4. Firebase Hosting

1. **Firebase CLIをインストール**
   ```bash
   npm install -g firebase-tools
   ```

2. **Firebaseプロジェクトを作成**
   ```bash
   firebase login
   firebase init hosting
   ```

3. **デプロイ**
   ```bash
   firebase deploy
   ```

## 📁 ファイル構成

```
juku-system-new/
├── index.html          # メインページ（生徒用・先生用選択）
├── student.html        # 生徒用画面
├── student-script.js   # 生徒用のJavaScript
├── student-style.css   # 生徒用のCSS
├── teacher.html        # 先生用画面
├── teacher-script.js   # 先生用のJavaScript
├── teacher-style.css   # 先生用のCSS
└── README.md          # このファイル
```

## 🔧 使用方法

1. **生徒**: `student.html` または メインページの「生徒用画面」をクリック
2. **先生**: `teacher.html` または メインページの「先生用画面」をクリック

## 💡 特徴

- **レスポンシブデザイン**: PC・タブレット・スマートフォン対応
- **リアルタイム同期**: localStorageを使用したデータ共有
- **シンプル操作**: 直感的で使いやすいUI
- **オフライン対応**: インターネット接続が不要

## 🌐 アクセス方法

デプロイ後、以下のURLでアクセス可能：
- **GitHub Pages**: `https://yourusername.github.io/juku-system`
- **Netlify**: `https://your-site-name.netlify.app`
- **Vercel**: `https://your-site-name.vercel.app`
- **Firebase**: `https://your-project-id.web.app`

## 📱 対応ブラウザ

- Chrome (推奨)
- Firefox
- Safari
- Edge

## 🔒 セキュリティ

- ローカルストレージのみ使用
- サーバーにデータを送信しません
- プライバシー保護

## 🐛 修正履歴

### 2025年1月4日
- **重複メソッドの修正**: `teacher-script.js`の`getContentTypeClass`メソッドの重複定義を修正
- **Firebase設定の改善**: エラーハンドリングを追加し、Firebaseが利用できない場合の適切な処理を実装
- **データ同期の改善**: 生徒と先生間のデータ同期をより確実にするため、エラーハンドリングとリトライ機能を強化
- **フォーム送信の改善**: 登録失敗時の適切なエラー表示を追加
- **コードの整理**: 不要なコメントとインデントの不整合を修正

### 2025年1月4日（データ共有改善）
- **新しい共有ストレージシステム**: `shared-storage.js`を追加し、より確実なデータ共有を実装
- **端末間データ共有の改善**: 異なる端末間でのデータ共有を大幅に改善
- **リアルタイム同期の強化**: BroadcastChannel、StorageEvent、定期同期を組み合わせた堅牢な同期システム
- **エラーハンドリングの強化**: データ保存・読み込み時のエラー処理を改善
- **WebSocketサーバーの追加**: より高度なデータ共有のためのWebSocketサーバーを実装

### 2025年1月4日（完全自動同期システム）
- **根本的なデータベースシステムの見直し**: 複数のクラウドデータベースオプションを提供
- **完全自動同期の実現**: 生徒登録 → 自動的に先生画面に反映（共有URL不要）
- **Airtable統合**: 最も簡単で確実なデータベースオプション
- **Supabase統合**: 高性能なリアルタイムデータベース
- **JSONBin統合**: シンプルで軽量なデータベース
- **マルチデータベース対応**: 優先順位に基づく自動選択システム
- **オフライン対応**: 接続復旧時の自動同期機能

## 🆘 トラブルシューティング

### データが共有されない場合
- 同じブラウザで生徒用と先生用を開いてください
- ブラウザのlocalStorageが有効になっているか確認してください

### スマートフォンで表示が崩れる場合
- ブラウザを最新版に更新してください
- ページを再読み込みしてください
