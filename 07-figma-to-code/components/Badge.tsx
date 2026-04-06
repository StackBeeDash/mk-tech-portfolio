import React from "react";

/**
 * Badge コンポーネント
 *
 * ステータスやカテゴリを示すラベル。
 * variant で色を、size でサイズを制御。
 *
 * Why:
 * - セマンティックな variant 名（success, error, warning, info）で意図を明確に
 * - デザイントークンの色を活用し、アプリ全体で一貫したステータス表現
 * - 小さなコンポーネントだが、一貫性に最も影響するため独立コンポーネント化
 */

type BadgeVariant = "default" | "primary" | "success" | "error" | "warning" | "info";
type BadgeSize = "sm" | "md";

interface BadgeProps {
  variant?: BadgeVariant;
  size?: BadgeSize;
  children: React.ReactNode;
  style?: React.CSSProperties;
}

const variantStyles: Record<
  BadgeVariant,
  { backgroundColor: string; color: string }
> = {
  default: {
    backgroundColor: "var(--color-bg-tertiary)",
    color: "var(--color-text-secondary)",
  },
  primary: {
    backgroundColor: "var(--color-primary-light)",
    color: "var(--color-primary)",
  },
  success: {
    backgroundColor: "var(--color-success-light)",
    color: "var(--color-success)",
  },
  error: {
    backgroundColor: "var(--color-error-light)",
    color: "var(--color-error)",
  },
  warning: {
    backgroundColor: "var(--color-warning-light)",
    color: "var(--color-warning)",
  },
  info: {
    backgroundColor: "var(--color-primary-light)",
    color: "var(--color-primary)",
  },
};

const sizeStyles: Record<BadgeSize, React.CSSProperties> = {
  sm: {
    padding: "var(--spacing-0-5) var(--spacing-1-5)",
    fontSize: "var(--font-size-xs)",
  },
  md: {
    padding: "var(--spacing-1) var(--spacing-2)",
    fontSize: "var(--font-size-sm)",
  },
};

export const Badge: React.FC<BadgeProps> = ({
  variant = "default",
  size = "sm",
  children,
  style,
}) => {
  const badgeStyle: React.CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    borderRadius: "var(--radius-full)",
    fontWeight: "var(--font-weight-medium)" as unknown as number,
    fontFamily: "var(--font-family-sans)",
    lineHeight: 1,
    whiteSpace: "nowrap",
    ...variantStyles[variant],
    ...sizeStyles[size],
    ...style,
  };

  return <span style={badgeStyle}>{children}</span>;
};
