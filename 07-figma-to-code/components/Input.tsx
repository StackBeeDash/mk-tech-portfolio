import React from "react";

/**
 * Input コンポーネント
 *
 * label / error / helperText に対応した入力フィールド。
 * Figma のフォーム入力コンポーネントと1:1で対応。
 *
 * Why:
 * - label を組み込むことで、アクセシビリティ（htmlFor）を自動管理
 * - error 状態でボーダー色・メッセージを切り替え、ユーザーに即座にフィードバック
 * - helperText で入力のヒントを提供し、UX を向上
 */

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  fullWidth?: boolean;
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  helperText,
  fullWidth = false,
  id,
  style,
  ...props
}) => {
  const inputId = id || `input-${label?.toLowerCase().replace(/\s+/g, "-")}`;
  const hasError = !!error;

  const wrapperStyle: React.CSSProperties = {
    display: "flex",
    flexDirection: "column",
    gap: "var(--spacing-1)",
    width: fullWidth ? "100%" : "auto",
  };

  const labelStyle: React.CSSProperties = {
    fontSize: "var(--font-size-sm)",
    fontWeight: "var(--font-weight-medium)" as unknown as number,
    color: "var(--color-text-primary)",
    fontFamily: "var(--font-family-sans)",
  };

  const inputStyle: React.CSSProperties = {
    padding: "var(--spacing-2) var(--spacing-3)",
    fontSize: "var(--font-size-base)",
    fontFamily: "var(--font-family-sans)",
    lineHeight: "var(--line-height-normal)",
    color: "var(--color-text-primary)",
    backgroundColor: "var(--color-bg-primary)",
    border: `1px solid ${hasError ? "var(--color-border-error)" : "var(--color-border)"}`,
    borderRadius: "var(--radius-md)",
    outline: "none",
    transition: `all var(--transition-fast)`,
    width: fullWidth ? "100%" : "auto",
    boxSizing: "border-box",
    ...style,
  };

  const helperStyle: React.CSSProperties = {
    fontSize: "var(--font-size-xs)",
    color: "var(--color-text-tertiary)",
    fontFamily: "var(--font-family-sans)",
  };

  const errorStyle: React.CSSProperties = {
    fontSize: "var(--font-size-xs)",
    color: "var(--color-text-error)",
    fontFamily: "var(--font-family-sans)",
  };

  return (
    <div style={wrapperStyle}>
      {label && (
        <label htmlFor={inputId} style={labelStyle}>
          {label}
        </label>
      )}
      <input id={inputId} style={inputStyle} aria-invalid={hasError} {...props} />
      {error && <span style={errorStyle} role="alert">{error}</span>}
      {!error && helperText && <span style={helperStyle}>{helperText}</span>}
    </div>
  );
};
