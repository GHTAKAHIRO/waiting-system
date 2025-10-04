# 🚀 デプロイ手順

## GitHub Pages でデプロイ

### 1. GitHubリポジトリを作成
1. GitHubにログイン
2. 「New repository」をクリック
3. リポジトリ名: `juku-system` (任意)
4. 「Create repository」をクリック

### 2. ファイルをアップロード
```bash
# コマンドラインで実行
cd "C:\Users\takah\juku-system-new"
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/juku-system.git
git push -u origin main
```

### 3. GitHub Pagesを有効化
1. リポジトリの「Settings」タブをクリック
2. 左メニューの「Pages」をクリック
3. 「Source」で「Deploy from a branch」を選択
4. 「Branch」で「main」を選択
5. 「Save」をクリック
6. 数分後に `https://YOUR_USERNAME.github.io/juku-system` でアクセス可能

## Netlify でデプロイ

### 1. Netlifyにアクセス
- https://netlify.com にアクセス
- 「Sign up」でアカウント作成（GitHubアカウントで連携可能）

### 2. サイトを作成
1. 「New site from Git」をクリック
2. 「GitHub」を選択してリポジトリを連携
3. 作成したリポジトリを選択
4. 「Deploy site」をクリック

### 3. 自動デプロイ
- GitHubにプッシュするたびに自動でデプロイされます
- カスタムドメインも設定可能

## Vercel でデプロイ

### 1. Vercelにアクセス
- https://vercel.com にアクセス
- GitHubアカウントでログイン

### 2. プロジェクトを作成
1. 「New Project」をクリック
2. GitHubリポジトリを選択
3. 「Deploy」をクリック

## Firebase Hosting でデプロイ

### 1. Firebase CLIをインストール
```bash
npm install -g firebase-tools
```

### 2. Firebaseプロジェクトを作成
```bash
firebase login
firebase init hosting
```

### 3. デプロイ
```bash
firebase deploy
```

## 📱 アクセス方法

デプロイ後、以下のURLでアクセスできます：

- **GitHub Pages**: `https://YOUR_USERNAME.github.io/juku-system`
- **Netlify**: `https://YOUR_SITE_NAME.netlify.app`
- **Vercel**: `https://YOUR_PROJECT_NAME.vercel.app`
- **Firebase**: `https://YOUR_PROJECT_ID.web.app`

## 🔧 使用方法

1. **生徒**: メインページの「📱 生徒用画面」をクリック
2. **先生**: メインページの「👨‍🏫 先生用画面」をクリック

## 💡 推奨デプロイ方法

**GitHub Pages** が最も簡単で無料で利用できます：
- 無料
- 簡単な設定
- 自動HTTPS
- カスタムドメイン対応
