# アーキテクチャ設計書

## 全体構成図

```mermaid
graph TB
    subgraph "Client"
        BROWSER[Browser]
    end

    subgraph "CDN / Edge"
        VERCEL[Vercel Edge Network]
    end

    subgraph "Frontend - Vercel"
        NEXT[Next.js App Router]
        RSC[React Server Components]
        CC[Client Components]
        MW[Middleware<br/>認証チェック]
    end

    subgraph "Backend - Cloud Run"
        API[FastAPI]
        BG[Background Tasks<br/>Celery / Cloud Tasks]
    end

    subgraph "Data Layer"
        SB[(Supabase<br/>PostgreSQL + RLS)]
        REDIS[(Redis<br/>キャッシュ)]
        GCS[Cloud Storage<br/>ファイル]
    end

    subgraph "Auth"
        SA[Supabase Auth]
        GOOGLE[Google OAuth]
    end

    subgraph "Observability"
        LOG[Cloud Logging]
        TRACE[Cloud Trace]
        SENTRY[Sentry]
    end

    BROWSER --> VERCEL
    VERCEL --> NEXT
    NEXT --> RSC
    NEXT --> CC
    NEXT --> MW
    MW -->|JWT 検証| SA

    RSC -->|Server-side| API
    CC -->|Client-side| API
    RSC -->|直接クエリ| SB

    API --> SB
    API --> REDIS
    API --> GCS
    API --> BG

    SA --> GOOGLE
    SA --> SB

    API --> LOG
    API --> TRACE
    NEXT --> SENTRY
```

## 認証フロー

```mermaid
sequenceDiagram
    participant U as User
    participant FE as Next.js
    participant MW as Middleware
    participant SA as Supabase Auth
    participant API as FastAPI
    participant DB as Supabase DB

    U->>FE: ログインボタンクリック
    FE->>SA: signInWithOAuth('google')
    SA->>U: Google OAuth 画面へリダイレクト
    U->>SA: Google 認証完了
    SA->>FE: JWT (access_token + refresh_token)
    FE->>FE: Cookie にトークン保存

    Note over FE,MW: 以降の API リクエスト

    U->>FE: ページアクセス
    FE->>MW: リクエスト
    MW->>MW: JWT 検証
    alt トークン有効
        MW->>FE: リクエスト続行
    else トークン期限切れ
        MW->>SA: refresh_token でリフレッシュ
        SA-->>MW: 新しい JWT
        MW->>FE: リクエスト続行（新トークン付き）
    else 未認証
        MW->>U: /login へリダイレクト
    end

    FE->>API: API リクエスト (Authorization: Bearer JWT)
    API->>SA: JWT 検証
    SA-->>API: ユーザー情報
    API->>DB: RLS 付きクエリ (SET request.jwt.claims)
    DB-->>API: フィルタ済みデータ
    API-->>FE: レスポンス
```

## データ更新フロー（楽観的更新）

```mermaid
sequenceDiagram
    participant U as User
    participant CC as Client Component
    participant CACHE as SWR Cache
    participant API as FastAPI
    participant DB as Supabase

    U->>CC: データ更新操作
    CC->>CACHE: 楽観的にキャッシュ更新（即座にUI反映）
    CC->>API: PATCH /api/resources/:id
    
    alt 成功
        API->>DB: UPDATE with RLS
        DB-->>API: Updated record
        API-->>CC: 200 OK
        CC->>CACHE: サーバーレスポンスで確定
    else 失敗
        API-->>CC: 4xx / 5xx
        CC->>CACHE: ロールバック（元のデータに戻す）
        CC->>U: エラー通知
    end
```

## ADR (Architecture Decision Records)

### ADR-001: BFF を置かず Next.js から FastAPI を直接呼ぶ

- **Status**: Accepted
- **Context**: Next.js の API Routes を BFF (Backend for Frontend) として使うか、FastAPI を直接呼ぶか
- **Decision**: BFF を置かず、Next.js (RSC) から FastAPI を直接呼ぶ
- **Rationale**:
  - BFF を挟むとレイテンシが増加する
  - RSC のサーバーサイドから直接呼べば、BFF と同等のセキュリティを確保できる
  - API Routes を BFF にすると、ロジックの二重管理になりやすい
- **Consequences**:
  - CORS 設定が必要（開発環境のみ。本番は同一ドメインで配信）
  - フロントエンドが API のスキーマに直接依存する

### ADR-002: Supabase RLS をメインのアクセス制御とする

- **Status**: Accepted
- **Context**: アクセス制御をアプリケーション層 (FastAPI) で行うか、データベース層 (RLS) で行うか
- **Decision**: Row Level Security をメインのアクセス制御とし、アプリ層は補助的に使う
- **Rationale**:
  - RLS はどの経路からアクセスしても一貫したアクセス制御を保証する
  - アプリ層だけだと、新しいエンドポイント追加時にチェック漏れのリスクがある
  - Supabase Client から直接クエリする場合も、RLS が自動適用される
- **Consequences**:
  - RLS ポリシーの複雑化に注意が必要
  - マイグレーション時に RLS ポリシーも管理対象になる
  - デバッグが難しくなる場合がある（クエリは成功するが結果が空になる）

### ADR-003: RSC と Client Components の使い分け基準

- **Status**: Accepted
- **Context**: Next.js App Router でどのコンポーネントを RSC / Client Component にするか
- **Decision**: 以下の基準で分類する
  - **RSC**: データフェッチ、SEO が必要なコンテンツ、静的なUI
  - **Client Component**: ユーザーインタラクション、リアルタイム更新、ブラウザ API 利用
- **Rationale**:
  - RSC はバンドルサイズに含まれないため、初期表示が高速
  - インタラクションが必要な部分だけ Client Component にすることで、最適なバランスを取れる
- **Consequences**:
  - コンポーネント設計時に「この機能は RSC で十分か」を常に検討する必要がある
  - props のシリアライズ制約を理解する必要がある

### ADR-004: エラーハンドリング戦略

- **Status**: Accepted
- **Context**: フロントエンド・バックエンド間のエラーハンドリング方針
- **Decision**: 構造化エラーレスポンス + フロントエンド Error Boundary の二重防御
- **Rationale**:
  - API は RFC 7807 (Problem Details) 形式で一貫したエラーレスポンスを返す
  - フロントエンドは Error Boundary でクラッシュを防ぎ、ユーザーフレンドリーなフォールバックを表示
  - 予期しないエラーは Sentry に送信し、可視化する
- **Consequences**:
  - エラー型の定義が共有ライブラリとして必要になる
  - Error Boundary のテストが必要
