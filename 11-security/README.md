# 11: Security

認証・認可設計、API セキュリティに関するポートフォリオ。Supabase Auth を中心とした認証基盤の設計と、Cloud Run 上での API 保護パターンを示す。

## Why この設計にしたか

### セキュリティ設計方針

本ポートフォリオのセキュリティ設計は、以下の 3 つの原則に基づいている。

#### 1. Defense in Depth（多層防御）

単一の防御策に依存せず、複数のレイヤーで保護する。

```
[Client] → [Cloud Run IAM] → [Rate Limiter] → [JWT Verification] → [RBAC Policy] → [RLS (DB)]
```

各レイヤーが独立して機能するため、1 つが突破されても次のレイヤーが防御する。

#### 2. Least Privilege（最小権限の原則）

- ロールベースアクセス制御（RBAC）で、各ユーザーに必要最小限の権限のみ付与
- マルチテナント環境では RLS（Row Level Security）で物理的にデータを分離
- Cloud Run サービスアカウントは最小限の IAM ロールのみ付与

#### 3. Secure by Default（デフォルトで安全）

- Cloud Run は `--no-allow-unauthenticated` をデフォルトに
- API エンドポイントは認証必須がデフォルト、公開エンドポイントは明示的にオプトイン
- レート制限は全エンドポイントに適用

### OWASP Top 10 への対策

| OWASP Top 10 (2021) | 本設計での対策 |
|---------------------|--------------|
| A01: Broken Access Control | RBAC + RLS によるアクセス制御 ([rbac.md](authorization/rbac.md)) |
| A02: Cryptographic Failures | Supabase Auth の JWT 署名検証、TLS 強制 |
| A03: Injection | Supabase クライアントのパラメータ化クエリ |
| A04: Insecure Design | マルチテナント分離設計 ([multi-tenant.md](authorization/multi-tenant.md)) |
| A05: Security Misconfiguration | Cloud Run IAM 設定 ([cloud-run-auth.md](api-security/cloud-run-auth.md)) |
| A06: Vulnerable Components | 依存パッケージの定期更新（Dependabot） |
| A07: Auth Failures | Supabase Auth + OAuth 2.0 ([oauth-flow.md](auth/oauth-flow.md)) |
| A08: Software/Data Integrity | JWT 署名検証、CI/CD パイプラインでの整合性チェック |
| A09: Logging Failures | Cloud Logging への監査ログ出力 |
| A10: SSRF | Cloud Run のネットワーク制御、Egress ポリシー |

## ディレクトリ構成

```
11-security/
├── README.md                          # 本ファイル（セキュリティ設計方針）
├── auth/
│   ├── supabase-auth.md               # Supabase Auth 統合パターン
│   └── oauth-flow.md                  # OAuth 2.0 / OIDC フロー設計
├── authorization/
│   ├── rbac.md                        # RBAC 設計
│   └── multi-tenant.md               # マルチテナント分離戦略
├── api-security/
│   ├── rate-limiting.md               # レート制限設計
│   └── cloud-run-auth.md             # Cloud Run 認証設定
├── src/
│   ├── middleware/
│   │   ├── auth.ts                    # 認証ミドルウェア
│   │   └── rate-limiter.ts            # レート制限ミドルウェア
│   └── policies/
│       ├── rbac.ts                    # RBAC ポリシー実装
│       └── tenant-isolation.ts        # テナント分離ポリシー
├── package.json
└── tsconfig.json
```

## 技術スタック

- Supabase Auth（認証基盤）
- GCP Cloud Run（ホスティング + IAM）
- TypeScript / Hono（ミドルウェア実装）
- JSON Web Token（JWT）
- Row Level Security（RLS）
