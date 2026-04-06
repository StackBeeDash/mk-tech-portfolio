import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Monorepo Demo - Web",
  description: "Turborepo + pnpm monorepo demo application",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  );
}
