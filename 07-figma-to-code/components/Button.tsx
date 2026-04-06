import React from "react";

/**
 * Button コンポーネント
 *
 * Figma のボタンコンポーネントと1:1で対応。
 * variant / size / disabled の組み合わせでバリエーションを表現。
 *
 * Why:
 * - variant でスタイルの意味を明示（primary = 主アクション、secondary = 副アクション）
 * - CSS Custom Properties（デザイントークン）で色・スペーシングを管理
 * - disabled 時のスタイルも一貫して制御
 */

type ButtonVariant = "primary" | "secondary" | "outline" | "ghost" | "danger";
type ButtonSize = "sm" | "md" | "lg";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  children: React.ReactNode;
}

const variantStyles: Record<ButtonVariant, React.CSSProperties> = {
  primary: {
    backgroundColor: "var(--color-primary)",
    color: "var(--color-text-inverse)",
    border: "1px solid transparent",
  },
  secondary: {
    backgroundColor: "var(--color-bg-tertiary)",
    color: "var(--color-text-primary)",
    border: "1px solid transparent",
  },
  outline: {
    backgroundColor: "transparent",
    color: "var(--color-primary)",
    border: "1px solid var(--color-primary)",
  },
  ghost: {
    backgroundColor: "transparent",
    color: "var(--color-text-secondary)",
    border: "1px solid transparent",
  },
  danger: {
    backgroundColor: "var(--color-error)",
    color: "var(--color-text-inverse)",
    border: "1px solid transparent",
  },
};

const sizeStyles: Record<ButtonSize, React.CSSProperties> = {
  sm: {
    padding: "var(--spacing-1) var(--spacing-3)",
    fontSize: "var(--font-size-sm)",
  },
  md: {
    padding: "var(--spacing-2) var(--spacing-4)",
    fontSize: "var(--font-size-base)",
  },
  lg: {
    padding: "var(--spacing-3) var(--spacing-6)",
    fontSize: "var(--font-size-lg)",
  },
};

export const Button: React.FC<ButtonProps> = ({
  variant = "primary",
  size = "md",
  fullWidth = false,
  disabled = false,
  children,
  style,
  ...props
}) => {
  const baseStyle: React.CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "var(--spacing-2)",
    borderRadius: "var(--radius-md)",
    fontWeight: "var(--font-weight-medium)" as unknown as number,
    fontFamily: "var(--font-family-sans)",
    lineHeight: "var(--line-height-normal)",
    cursor: disabled ? "not-allowed" : "pointer",
    opacity: disabled ? 0.5 : 1,
    transition: `all var(--transition-fast)`,
    width: fullWidth ? "100%" : "auto",
    ...variantStyles[variant],
    ...sizeStyles[size],
    ...style,
  };

  return (
    <button style={baseStyle} disabled={disabled} {...props}>
      {children}
    </button>
  );
};
