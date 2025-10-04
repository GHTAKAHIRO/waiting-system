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

## 🆘 トラブルシューティング

### データが共有されない場合
- 同じブラウザで生徒用と先生用を開いてください
- ブラウザのlocalStorageが有効になっているか確認してください

### スマートフォンで表示が崩れる場合
- ブラウザを最新版に更新してください
- ページを再読み込みしてください
