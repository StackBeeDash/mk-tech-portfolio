import React from "react";
import ReactDOM from "react-dom/client";
import { DemoPage } from "../pages/index";
import "../design-tokens/tokens.css";

/**
 * React アプリケーションのエントリポイント
 *
 * tokens.css をグローバルに読み込み、
 * 全コンポーネントでデザイントークンを利用可能にする。
 */

const rootElement = document.getElementById("root");

if (!rootElement) {
  throw new Error("Root element not found. Ensure index.html has <div id='root'></div>");
}

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <DemoPage />
  </React.StrictMode>
);
