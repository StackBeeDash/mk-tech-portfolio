# Hands-on Lab: FastAPI で REST API を作ろう

## 概要

FastAPI を使って TODO アプリの REST API をゼロから構築するハンズオンラボ。Python の基本文法を理解している初学者を対象に、Web API の設計・実装・テストの基礎を体験する。

## Why このラボを設計したか

- **FastAPI を選んだ理由**: 型ヒントベースの自動バリデーション、自動生成される OpenAPI ドキュメントにより、「API とは何か」を視覚的に理解できる。Django REST Framework より学習コストが低く、Flask より型安全
- **TODO アプリを題材にした理由**: CRUD 操作を一通り体験でき、実務で必要な API 設計パターン（リソース指向、ステータスコード、エラーハンドリング）を自然に学べる
- **インメモリストレージにした理由**: DB セットアップの手間を省き、API 設計そのものに集中させるため。DB 連携は発展課題として位置づける

## 前提条件

- Python 3.11 以上がインストールされていること
- pip または uv が利用可能であること
- ターミナル（コマンドライン）の基本操作ができること
- REST API の概念を聞いたことがある程度で OK

## セットアップ

```bash
cd hands-on-lab/src
pip install -r requirements.txt
```

## ラボの実行

```bash
uvicorn main:app --reload
```

ブラウザで http://localhost:8000/docs にアクセスすると、Swagger UI が表示される。

## ラボガイド

[lab-guide.md](lab-guide.md) に Step-by-step の手順を記載。

## 所要時間

約 60-90 分（初学者の場合）
