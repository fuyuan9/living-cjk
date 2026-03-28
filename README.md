# Living CJK - Interactive Kinetic Typography Engine

Living CJKは、日本語・中国語（簡体字）・韓国語（ハングル）を物理演算によって「躍動的な文字」へと変貌させる、高精度・高パフォーマンスなタイポグラフィ演出エンジンです。

### 🚀 [Live Demo](https://fuyuan9.github.io/living-cjk/)

本プロジェクトは **pnpm Workspace** を用いたモノレポ構成を採用しており、エンジン本体、Reactコンポーネント、デモアプリケーションがモジュール化されています。

---

## 🏗 プロジェクト構成 (Architecture)

```text
living-cjk/
├── packages/
│   ├── core/         # 物理演算・スケルトン生成の核（Pure TS / tsup）
│   └── react/        # React用描画コンポーネント（LivingCJK / Vite）
└── apps/
    └── demo/         # 洗練されたUIを持つデモアプリ（Next.js / Vite / Tailwind）
```

### 各パッケージの役割
- **`@living-cjk/core`**: `opentype.js` を用いたグリフ解析と、Web Worker 上で動作する高精度な物理演算シミュレータを提供します。
- **`@living-cjk/react`**: 物理演算の結果を SVG path として描画する、パフォーマンス特化型の React コンポーネントを提供します。
- **`apps/demo`**: 4ヶ国語対応のヘルプモーダルや詳細なパラメータ調整機能を備えた、Living CJK のショーケースです。

---

## 🛠 コア・テクノロジー

### 1. 東アジア言語を網羅するスケルトン生成
- **Noto Sans CJK フルサポート**: 日本語 (JP)、中国語簡体字 (SC)、韓国語 (KR) のフォントデータを動的に解析。
- **高精度ベジェ解析**: `opentype.js` を用いて、ハングルの複雑な曲線や漢字の細部を数千の頂点（Joint）とバネ（Bone）の構造へ変換します。

### 2. 進化した物理エンジン
- **Suppleness（しなやかさ）ロジック**: 弾性モデルにより、パーツが有機的に「しなる」挙動を実現。単なる剛体の動きを超えた、上品で流動的な質感を表現します。
- **マルチスレッド演算**: Web Worker と `Float32Array`（Typed Array）を活用し、膨大な頂点情報の演算を安定した 60FPS で実行。

---

## ✨ 主要機能

- **3言語動的切り替え**: JP / SC / KR 各言語固有の字形を正確に再現。
- **UIヘルプモーダル**: 各パラメータの影響を 4ヶ国語（英・日・中・韓）で解説。
- **Rainbow Mode**: 文字に虹色の輝きを宿し、絶え間なく変化する色彩の波を演出。
- **ダーク/ライトモード**: システム設定に同期し、かつUI上で瞬時に切り替え可能なテーマ設定。

---

## 🏃‍♂️ 開発・ビルド方法

本プロジェクトの管理には `pnpm` を使用します。

### 1. セットアップ
```bash
pnpm install
```

### 2. 全パッケージのビルド
```bash
pnpm build
```

### 3. デモアプリの起動
```bash
# デモアプリを開発モードで起動
pnpm --filter demo dev
```

---

## 🎛 パラメータ・ガイド (Parameter Guide)

- **Suppleness (しなやかさ)**: 文字の柔らかさと有機的な余韻。
- **Coordination**: 文字同士が同期してウェーブを描く度合い。
- **Rigidity / Restoration**: 骨格の硬さと、元の形に戻ろうとする力（レスポンスの鋭さ）。
- **Touch Interaction**: カーソルに対する「吸引（Attract）」と「反発（Repulse）」の強度。
- **Stroke Weight**: 文字の太さ。0.045 が推奨される黄金比です。

---

## 📄 License
MIT License
