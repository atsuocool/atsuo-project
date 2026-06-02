# atsuo-project — HubSpot CRM BI ダッシュボード

HubSpot CRM データをリアルタイムで可視化する Streamlit 製 BI ダッシュボードです。

## 機能

- **KPI カード**: パイプライン総額・成約額・案件数・コンタクト数・成約率
- **案件パイプライン**: ステージ別ファネル・月次推移グラフ・上位案件テーブル
- **コンタクト分析**: 増加推移・リードステータス・ライフサイクルステージ
- **会社分析**: 業種別分布・国別分布・会社一覧

API トークンなしでも**デモデータ**で動作します。

## セットアップ

### 1. 依存パッケージのインストール

```bash
pip install -r requirements.txt
```

### 2. HubSpot トークンの設定（任意）

```bash
cp .env.example .env
# .env を編集して HUBSPOT_ACCESS_TOKEN を設定
```

HubSpot プライベートアプリトークンは `設定 > インテグレーション > プライベートアプリ` から作成できます。

必要なスコープ:
- `crm.objects.deals.read`
- `crm.objects.contacts.read`
- `crm.objects.companies.read`

### 3. アプリの起動

```bash
streamlit run app.py
```

ブラウザで `http://localhost:8501` が自動的に開きます。

## ファイル構成

```
.
├── app.py              # メインダッシュボード
├── hubspot_client.py   # HubSpot API クライアント / デモデータ生成
├── requirements.txt    # Python 依存パッケージ
├── .env.example        # 環境変数テンプレート
└── README.md
```
