/** @type {import('next').NextConfig} */
const nextConfig = {
  // モノレポ内の shared パッケージをトランスパイル対象にする
  transpilePackages: ["@monorepo-demo/shared"],

  // React Strict Mode を有効化（開発時のバグ検出）
  reactStrictMode: true,
};

module.exports = nextConfig;
