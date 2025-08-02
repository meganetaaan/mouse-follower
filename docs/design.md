# Mouse Follower Library Design Document

## Overview
マウスフォロワーライブラリは、Canvasベースのスプライトアニメーションを使用してマウスカーソルを追跡する要素を作成します。物理演算による滑らかな動きと、複数のフォロワーによる隊列形成、イベント駆動のアニメーションをサポートします。

## Architecture

### Core Components

#### 1. Follower Class (`src/follower.ts`)
- マウスフォロワーのメインクラス
- 位置、速度、加速度の管理
- アニメーションループの制御
- DOM要素とCanvasの作成・管理
- イベントシステム（EventTarget組み込み）

#### 2. Physics Engine (`src/follower/physics.ts`)
- 等加速度運動の計算
- 最大速度の制限
- ブレーキシステム（停止距離、ブレーキ強度）
- ベクトル演算（方向、距離）

#### 3. Sprite System (`src/follower/sprite.ts`)
- Canvas基盤のスプライトレンダリング
- 複数アニメーション設定の管理
- 透明色マスキング（グリーンスクリーン）
- スプライトシートの読み込みと処理

### API Design

```typescript
// Main factory function
export function follower(options?: FollowerOptions): Follower;

// Options interface
interface FollowerOptions {
  target?: FollowTarget;        // default: mouseTarget()
  bindTo?: HTMLElement;         // default: document.body
  physics?: PhysicsOptions;     // 物理演算設定
  sprite?: SpriteOptions;       // スプライト設定
}

// Physics configuration
interface PhysicsOptions {
  velocity?: number;            // default: 400 (px/s)
  accel?: number;              // default: 2000 (px/s²)
  braking?: {
    stopDistance?: number;      // default: 30 (px)
    distance?: number;          // default: 200 (px)
    strength?: number;          // default: 8.0
    minVelocity?: number;       // default: 50.0
  };
}

// Sprite configuration
interface SpriteOptions {
  url?: string;                 // default: "/stack-chan.png"
  width?: number;               // default: 32
  height?: number;              // default: 32
  frames?: number;              // default: 4
  transparentColor?: string;    // default: "rgb(0, 255, 0)"
  animation?: {
    interval?: number;          // default: 125 (ms)
  };
  animations?: AnimationsConfig; // アニメーション設定
}

// Animation system
interface AnimationConfig {
  start: [number, number];      // [x, y] スプライトシート内の開始位置
  numFrames: number;            // フレーム数
  repeat: boolean;              // 繰り返し再生
  interval?: number;            // カスタムアニメーション間隔
}

interface AnimationsConfig {
  [key: string]: AnimationConfig;
}

// Follow target type
type FollowTarget = Position | Follower;

interface Position {
  x: number;
  y: number;
}

// Main Follower interface
interface Follower extends Position {
  start(): Promise<void>;
  stop(): void;
  setTarget(target: FollowTarget): void;
  destroy(): void;
  playAnimation(name: string): void;
  pauseAnimation(): void;
  addEventListener(type: "start", listener: (event: FollowerStartEvent) => void): void;
  addEventListener(type: "stop", listener: (event: FollowerStopEvent) => void): void;
  removeEventListener(type: "start", listener: (event: FollowerStartEvent) => void): void;
  removeEventListener(type: "stop", listener: (event: FollowerStopEvent) => void): void;
}
```

## Implementation Details

### Physics Calculation
1. 毎フレーム（requestAnimationFrame）で更新
2. ターゲットへの方向ベクトルを計算
3. 加速度を適用（最大加速度で制限）
4. ブレーキシステムを適用（距離に応じて減速）
5. 速度を更新（最大速度で制限）
6. 位置を更新
7. 停止距離内なら速度を0に

### Sprite Animation System
- 32×32ピクセルのStack-chanスプライト
- 横に4フレーム配置
- Canvas APIでレンダリング
- 複数アニメーション設定をサポート:
  - `walk`: [0, 0]から4フレーム、繰り返し
  - `action`: [0, 32]から4フレーム、1回のみ
- グリーンスクリーン透明化処理

### Event System
- EventTarget組み込みによるカスタムイベント
- 移動状態の変化を自動検出:
  - `start`: フォロワーが動き始めたとき
  - `stop`: フォロワーが停止したとき
- イベント駆動でアニメーション制御が可能

### Mouse Tracking
- MouseTargetクラスでマウス座標を管理
- window.addEventListener('mousemove') でマウス座標を取得
- シングルトンパターンで効率的な座標共有

### Formation Support
- 他のFollowerインスタンスを追跡可能
- OffsetTargetクラスでオフセット追従をサポート
- 同じ物理演算ルールで追従

## Sprite Presets

### Stack-chan Preset
```typescript
export const SPRITE_PRESET_STACK_CHAN: SpriteOptions = {
  url: "/stack-chan.png",
  width: 32,
  height: 32,
  frames: 4,
  transparentColor: "rgb(0, 255, 0)",
  animation: {
    interval: 125,
  },
  animations: {
    walk: {
      start: [0, 0],
      numFrames: 4,
      repeat: true,
    },
    action: {
      start: [0, 32],
      numFrames: 4,
      repeat: false,
    },
  },
};
```

## Default Values
```typescript
const DEFAULTS = {
  physics: {
    velocity: 400,        // px/s
    accel: 2000,          // px/s²
    braking: {
      stopDistance: 30,   // px
      distance: 200,      // px
      strength: 8.0,
      minVelocity: 50.0,  // px/s
    },
  },
  sprite: SPRITE_PRESET_STACK_CHAN,
};
```

## Usage Examples

```typescript
// 基本的な使用方法
const f1 = follower();
await f1.start();

// スプライトプリセットを使用
const f2 = follower({ 
  sprite: SPRITE_PRESET_STACK_CHAN 
});

// カスタム物理設定
const f3 = follower({
  physics: {
    velocity: 600,
    braking: {
      stopDistance: 50,
    },
  },
});

// イベント駆動アニメーション
const f4 = follower();
f4.addEventListener("stop", (e) => {
  e.detail.follower.playAnimation("action");
});
f4.addEventListener("start", (e) => {
  e.detail.follower.playAnimation("walk");
});

// 隊列形成
const leader = follower();
const follower1 = follower({ 
  target: offsetTarget(leader, -40, 0) 
});
const follower2 = follower({ 
  target: offsetTarget(follower1, -40, 0) 
});

await leader.start();
await follower1.start();
await follower2.start();

// 動的にターゲット変更
follower1.setTarget(mouseTarget());
```

## Testing Strategy
- Vitest を使用したユニットテスト
- jsdom環境でDOM操作をテスト
- Canvas APIとImage読み込みのモック
- タイマーのモック化でアニメーション時間を制御
- 各モジュールの独立したテスト