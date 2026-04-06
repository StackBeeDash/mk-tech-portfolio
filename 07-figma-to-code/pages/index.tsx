import React, { useState } from "react";
import { Button, Card, Input, Badge } from "../components";

/**
 * デモページ — コンポーネントショーケース
 *
 * 全コンポーネントのバリエーションを一覧表示し、
 * デザイントークンとの連携を視覚的に確認できるページ。
 */

const sectionStyle: React.CSSProperties = {
  marginBottom: "var(--spacing-8)",
};

const sectionTitleStyle: React.CSSProperties = {
  fontSize: "var(--font-size-2xl)",
  fontWeight: "var(--font-weight-bold)" as unknown as number,
  color: "var(--color-text-primary)",
  marginBottom: "var(--spacing-4)",
  fontFamily: "var(--font-family-sans)",
};

const rowStyle: React.CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  gap: "var(--spacing-3)",
  alignItems: "center",
  marginBottom: "var(--spacing-3)",
};

const labelStyle: React.CSSProperties = {
  fontSize: "var(--font-size-sm)",
  color: "var(--color-text-secondary)",
  fontFamily: "var(--font-family-sans)",
  marginBottom: "var(--spacing-1)",
};

const gridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
  gap: "var(--spacing-4)",
};

export const DemoPage: React.FC = () => {
  const [inputValue, setInputValue] = useState("");

  return (
    <div
      style={{
        maxWidth: "960px",
        margin: "0 auto",
        padding: "var(--spacing-8)",
        fontFamily: "var(--font-family-sans)",
        color: "var(--color-text-primary)",
        backgroundColor: "var(--color-bg-secondary)",
        minHeight: "100vh",
      }}
    >
      <h1
        style={{
          fontSize: "var(--font-size-4xl)",
          fontWeight: "var(--font-weight-bold)" as unknown as number,
          marginBottom: "var(--spacing-2)",
        }}
      >
        Component Showcase
      </h1>
      <p
        style={{
          fontSize: "var(--font-size-lg)",
          color: "var(--color-text-secondary)",
          marginBottom: "var(--spacing-10)",
        }}
      >
        Figma デザイントークンに基づく React コンポーネント一覧
      </p>

      {/* Button */}
      <section style={sectionStyle}>
        <h2 style={sectionTitleStyle}>Button</h2>

        <p style={labelStyle}>Variants</p>
        <div style={rowStyle}>
          <Button variant="primary">Primary</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="outline">Outline</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="danger">Danger</Button>
        </div>

        <p style={labelStyle}>Sizes</p>
        <div style={rowStyle}>
          <Button size="sm">Small</Button>
          <Button size="md">Medium</Button>
          <Button size="lg">Large</Button>
        </div>

        <p style={labelStyle}>States</p>
        <div style={rowStyle}>
          <Button disabled>Disabled</Button>
          <Button fullWidth>Full Width</Button>
        </div>
      </section>

      {/* Card */}
      <section style={sectionStyle}>
        <h2 style={sectionTitleStyle}>Card</h2>
        <div style={gridStyle}>
          <Card header="シンプルカード">
            <p>header と body のみのカードです。</p>
          </Card>

          <Card
            header="フルカード"
            footer={
              <div style={rowStyle}>
                <Button variant="ghost" size="sm">
                  キャンセル
                </Button>
                <Button size="sm">保存</Button>
              </div>
            }
          >
            <p>header / body / footer の全セクションを持つカードです。</p>
          </Card>

          <Card shadow="lg" padding="lg">
            <p style={{ fontWeight: "var(--font-weight-semibold)" as unknown as number }}>
              ヘッダーなし
            </p>
            <p style={{ color: "var(--color-text-secondary)", marginTop: "var(--spacing-2)" }}>
              header を省略したカードも可能です。大きめの影とパディングを適用しています。
            </p>
          </Card>
        </div>
      </section>

      {/* Input */}
      <section style={sectionStyle}>
        <h2 style={sectionTitleStyle}>Input</h2>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "var(--spacing-4)",
            maxWidth: "400px",
          }}
        >
          <Input
            label="メールアドレス"
            type="email"
            placeholder="you@example.com"
            helperText="会社のメールアドレスを入力してください"
            fullWidth
          />

          <Input
            label="パスワード"
            type="password"
            placeholder="8文字以上"
            error="パスワードは8文字以上で入力してください"
            fullWidth
          />

          <Input
            label="テキスト入力"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="入力してください..."
            helperText={`${inputValue.length} 文字`}
            fullWidth
          />

          <Input label="無効状態" disabled placeholder="入力不可" fullWidth />
        </div>
      </section>

      {/* Badge */}
      <section style={sectionStyle}>
        <h2 style={sectionTitleStyle}>Badge</h2>

        <p style={labelStyle}>Variants</p>
        <div style={rowStyle}>
          <Badge variant="default">Default</Badge>
          <Badge variant="primary">Primary</Badge>
          <Badge variant="success">Success</Badge>
          <Badge variant="error">Error</Badge>
          <Badge variant="warning">Warning</Badge>
          <Badge variant="info">Info</Badge>
        </div>

        <p style={labelStyle}>Sizes</p>
        <div style={rowStyle}>
          <Badge size="sm" variant="primary">
            Small
          </Badge>
          <Badge size="md" variant="primary">
            Medium
          </Badge>
        </div>

        <p style={labelStyle}>実用例</p>
        <div style={rowStyle}>
          <Badge variant="success">完了</Badge>
          <Badge variant="warning">進行中</Badge>
          <Badge variant="error">エラー</Badge>
          <Badge variant="default">下書き</Badge>
          <Badge variant="primary">v1.4</Badge>
        </div>
      </section>

      {/* Composition Example */}
      <section style={sectionStyle}>
        <h2 style={sectionTitleStyle}>組み合わせ例</h2>
        <Card
          header={
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span>ユーザー管理</span>
              <Badge variant="primary">3 users</Badge>
            </div>
          }
          footer={
            <div style={{ display: "flex", justifyContent: "flex-end", gap: "var(--spacing-2)" }}>
              <Button variant="outline" size="sm">
                キャンセル
              </Button>
              <Button size="sm">招待を送信</Button>
            </div>
          }
        >
          <div style={{ display: "flex", flexDirection: "column", gap: "var(--spacing-3)" }}>
            <Input
              label="名前"
              placeholder="山田 太郎"
              fullWidth
            />
            <Input
              label="メールアドレス"
              type="email"
              placeholder="taro@example.com"
              fullWidth
            />
          </div>
        </Card>
      </section>
    </div>
  );
};
