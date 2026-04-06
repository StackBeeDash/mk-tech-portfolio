import React from "react";

/**
 * Card コンポーネント
 *
 * header / body / footer の3セクション構成。
 * Figma のカードコンポーネントと対応し、コンテンツの構造化に使用。
 *
 * Why:
 * - header / footer を optional にすることで、シンプルなカードから複雑なカードまで対応
 * - children を body として使い、コンテンツの自由度を確保
 * - デザイントークンでスタイルを統一し、影・角丸・余白の一貫性を保証
 */

interface CardProps {
  header?: React.ReactNode;
  footer?: React.ReactNode;
  children: React.ReactNode;
  padding?: "sm" | "md" | "lg";
  shadow?: "none" | "sm" | "md" | "lg";
  style?: React.CSSProperties;
}

const paddingMap = {
  sm: "var(--spacing-3)",
  md: "var(--spacing-4)",
  lg: "var(--spacing-6)",
};

const shadowMap = {
  none: "none",
  sm: "var(--shadow-sm)",
  md: "var(--shadow-md)",
  lg: "var(--shadow-lg)",
};

export const Card: React.FC<CardProps> = ({
  header,
  footer,
  children,
  padding = "md",
  shadow = "sm",
  style,
}) => {
  const cardStyle: React.CSSProperties = {
    backgroundColor: "var(--color-bg-primary)",
    border: "1px solid var(--color-border)",
    borderRadius: "var(--radius-lg)",
    boxShadow: shadowMap[shadow],
    overflow: "hidden",
    ...style,
  };

  const headerStyle: React.CSSProperties = {
    padding: paddingMap[padding],
    borderBottom: "1px solid var(--color-border)",
    fontWeight: "var(--font-weight-semibold)" as unknown as number,
    fontSize: "var(--font-size-lg)",
    color: "var(--color-text-primary)",
  };

  const bodyStyle: React.CSSProperties = {
    padding: paddingMap[padding],
    color: "var(--color-text-primary)",
  };

  const footerStyle: React.CSSProperties = {
    padding: paddingMap[padding],
    borderTop: "1px solid var(--color-border)",
    backgroundColor: "var(--color-bg-secondary)",
  };

  return (
    <div style={cardStyle}>
      {header && <div style={headerStyle}>{header}</div>}
      <div style={bodyStyle}>{children}</div>
      {footer && <div style={footerStyle}>{footer}</div>}
    </div>
  );
};
