# RBAC（Role-Based Access Control）設計

## 概要

Admin / Manager / User の 3 ロール構成によるアクセス制御設計。Supabase Auth の JWT クレームにロール情報を含め、API ミドルウェアと DB（RLS）の両方で権限を検証する。

## Why この RBAC 設計にしたか

- **3 ロール構成**: SaaS アプリケーションで最も一般的な構成。過度に細かいロール設計は運用コストが高く、3 階層で十分なケースが多い
- **JWT クレームにロール埋め込み**: DB への問い合わせなしで API レベルの権限チェックが可能。Cloud Run のスケールアウト時にも DB がボトルネックにならない
- **権限マトリクスの明示**: 「誰が何をできるか」をドキュメントとして管理し、実装とのズレを防止

## ロール定義

| ロール | 説明 | 想定ユーザー |
|--------|------|-------------|
| `admin` | システム全体の管理権限。テナント横断でアクセス可能 | システム管理者 |
| `manager` | テナント内の管理権限。メンバー管理やデータエクスポートが可能 | チームリーダー、部門管理者 |
| `user` | テナント内の一般操作権限。自分のデータの CRUD のみ | 一般メンバー |

## 権限マトリクス

### ユーザー管理

| 操作 | admin | manager | user |
|------|:-----:|:-------:|:----:|
| ユーザー一覧（全テナント） | o | - | - |
| ユーザー一覧（自テナント） | o | o | - |
| ユーザー招待 | o | o | - |
| ユーザーロール変更 | o | o* | - |
| ユーザー削除 | o | - | - |
| 自分のプロフィール編集 | o | o | o |

*manager は user ロールへの変更のみ可能（manager/admin への昇格は不可）

### データ操作

| 操作 | admin | manager | user |
|------|:-----:|:-------:|:----:|
| データ作成 | o | o | o |
| 自分のデータ閲覧 | o | o | o |
| テナント内データ閲覧 | o | o | - |
| 全テナントデータ閲覧 | o | - | - |
| 自分のデータ更新 | o | o | o |
| テナント内データ更新 | o | o | - |
| データ削除（自分） | o | o | o |
| データ削除（他メンバー） | o | o | - |
| データエクスポート | o | o | - |

### システム管理

| 操作 | admin | manager | user |
|------|:-----:|:-------:|:----:|
| テナント作成 | o | - | - |
| テナント設定変更 | o | o | - |
| 監査ログ閲覧 | o | o | - |
| API キー管理 | o | - | - |
| Webhook 設定 | o | o | - |

## JWT クレームの構造

```json
{
  "sub": "user-uuid",
  "role": "authenticated",
  "app_metadata": {
    "app_role": "manager",
    "tenant_id": "tenant-001"
  }
}
```

### ロールの設定方法

Supabase の `auth.users.raw_app_meta_data` にロール情報を格納:

```sql
-- ユーザーのロールを更新（管理者が実行）
UPDATE auth.users
SET raw_app_meta_data = raw_app_meta_data || '{"app_role": "manager"}'::jsonb
WHERE id = 'target-user-uuid';
```

## 実装

### API ミドルウェアでの権限チェック

[src/policies/rbac.ts](../src/policies/rbac.ts) で実装。

```typescript
// 使用例: manager 以上のロールが必要なエンドポイント
app.get('/api/team/members', requireRole('manager'), async (c) => {
  // manager と admin のみアクセス可能
})
```

### DB（RLS）での権限チェック

```sql
-- テナント内のデータのみ閲覧可能なポリシー
CREATE POLICY "tenant_isolation" ON items
  FOR SELECT
  USING (
    tenant_id = (auth.jwt() -> 'app_metadata' ->> 'tenant_id')::text
  );

-- manager 以上はテナント内の全データを更新可能
CREATE POLICY "manager_update" ON items
  FOR UPDATE
  USING (
    tenant_id = (auth.jwt() -> 'app_metadata' ->> 'tenant_id')::text
    AND (auth.jwt() -> 'app_metadata' ->> 'app_role') IN ('admin', 'manager')
  );
```

## ロール昇格攻撃への対策

1. **JWT クレームの改ざん防止**: Supabase Auth の JWT 署名を必ず検証
2. **ロール変更の監査**: ロール変更操作は全て監査ログに記録
3. **自己昇格の禁止**: ユーザーが自分自身のロールを変更することを API レベルで禁止
4. **manager の権限制限**: manager は自テナント内の user ロールへの変更のみ許可
