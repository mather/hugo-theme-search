# Hugo Theme Search

Hugoテーマをサムネイル一覧で視覚的に確認し、タグ・機能・対応Hugoバージョンで絞り込める検索サービスです。

**URL: https://mather.github.io/hugo-theme-search/**

## 機能

- **サムネイルグリッド** — 全テーマをカード形式で一覧表示（547件）
- **テキスト検索** — テーマ名・説明文のインクリメンタル検索
- **Tags フィルタ** — `blog`, `responsive`, `minimal` などテーマの性質を複数選択（AND条件）
- **Features フィルタ** — `dark-mode`, `table-of-contents`, `search` など機能の有無を複数選択（AND条件）
- **Hugo バージョンフィルタ** — 指定したバージョンに対応しているテーマのみ表示
- **ソート** — スター数 / 最終更新日 / 名前で並び替え
- カードクリック → GitHubリポジトリを新規タブで開く
- Demo ボタン → デモサイトを新規タブで開く

## データソース

[gohugoio/hugoThemesSiteBuilder](https://github.com/gohugoio/hugoThemesSiteBuilder) の `themes.txt` をベースに、各テーマの `theme.toml` および GitHub API からメタデータを取得しています。

- GitHub リポジトリのテーマのみ対象（プロトタイプ）
- GitHub Actions により **毎日 UTC 01:00** に自動更新

## 技術スタック

| 層 | 技術 |
|----|------|
| フロントエンド | React + Vite + TypeScript |
| スタイル | Tailwind CSS |
| ホスティング | GitHub Pages |
| データ収集 | Node.js (tsx) + [@octokit/rest](https://github.com/octokit/rest.js) + [smol-toml](https://github.com/nicolo-ribaudo/smol-toml) |
| CI/CD | GitHub Actions |

## ローカル開発

### 必要なもの

- Node.js 20+
- GitHub Personal Access Token（データ取得スクリプト実行時のみ）

### セットアップ

```bash
git clone https://github.com/mather/hugo-theme-search.git
cd hugo-theme-search
npm install
```

### 開発サーバー起動

```bash
npm run dev
```

`public/themes.json` が空の場合はテーマが表示されないため、先にデータ取得スクリプトを実行してください。

### テーマデータの取得

```bash
GITHUB_TOKEN=your_token npm run fetch-themes
```

`GITHUB_TOKEN` は `public:repo` スコープの読み取り権限があれば十分です。実行には約10分かかります（563テーマ × 3リクエスト、レート制限対策のため）。

### ビルド

```bash
npm run build
```

`dist/` に静的ファイルが生成されます。

## GitHub Pages へのデプロイ

`main` ブランチへの push 時に `.github/workflows/deploy.yml` が自動的にビルド・デプロイします。

初回セットアップ時は GitHub リポジトリの Settings → Pages → Source を **GitHub Actions** に設定してください。

## ディレクトリ構成

```
hugo-theme-search/
├── .github/workflows/
│   ├── fetch-themes.yml   # テーマデータ自動更新（毎日 UTC 01:00）
│   └── deploy.yml         # GitHub Pages デプロイ（main push 時）
├── scripts/
│   └── fetch-themes.ts    # テーマデータ収集スクリプト
├── src/
│   ├── App.tsx            # メインアプリ（フィルタ状態管理）
│   ├── components/
│   │   ├── Header.tsx     # ヘッダー（件数・更新日表示）
│   │   ├── FilterPanel.tsx # 検索/タグ/Features/バージョン/ソート
│   │   └── ThemeCard.tsx  # テーマカード
│   ├── types/theme.ts     # 型定義
│   └── utils/version.ts   # Hugo バージョン比較ユーティリティ
└── public/
    └── themes.json        # 取得済みテーマデータ
```

## themes.json スキーマ

```typescript
type Theme = {
  id: string;              // "github.com/user/repo"
  name: string;
  repo_url: string;
  description: string;
  demosite: string | null;
  license: string;
  tags: string[];          // theme.toml の tags フィールド
  features: string[];      // theme.toml の features フィールド
  hugo_min_version: string | null;
  thumbnail_url: string | null;
  stars: number;
  last_updated: string;    // ISO 8601
};
```

## ライセンス

MIT
