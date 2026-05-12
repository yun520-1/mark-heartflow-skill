# UI Demo Sites 源码分析报告

## 四个站点的架构概览

| 站点 | 标题 | 核心引擎 | 复杂度 |
|------|------|----------|--------|
| ui-v5 | Spatial Bento · 空间立体旗舰 | 3D Tilt Engine | ⭐⭐ |
| ui-v6 | Aether · Spatial Dimension v6 | Smart Cursor + 3D Layered Tilt | ⭐⭐⭐ |
| ui-v7 | Prima Vita — 数字生命 | 全栈生物引擎 | ⭐⭐⭐⭐⭐ |
| nexus | AI Prompt Engineering Platform | Next.js SSR | — |

---

## v7 (Prima Vita) — 最完整架构

### 引擎架构
```
BreathingEngine    — 主时钟，驱动所有动画的生物节拍
ColorEcho          — 滚动+时间驱动的色相旋转
CursorPhysics      — 基于质量的指针+碰撞检测
ParticleSystem     — Canvas粒子，重力累积
FractalRenderer    — 递归L-system SVG分形图标
FrostSwipe         — 鼠标快速掠过时模糊度降低
GPUMonitor         — WebGL检测+自适应降级
ConsoleLogger      — 彩色启动日志
```

### 呼吸引擎核心公式
- 吸气 1.2s: `value = 1 - Math.pow(1 - t, 0.6)` (快起)
- 屏息 0.3s: 保持 value=1
- 呼气 1.8s: `value = 1 - Math.pow(t, 0.55)` (慢落)
- CSS变量: `--breath-phase` 实时传递

### 色相引擎
- 时间驱动: `(now / 1000) * 0.15 % 360`
- 滚动驱动: `scrollRatio * 25` 度偏移
- 滚动速度: `scrollVelocity * 0.05` 加速度
- 平滑: lerp 0.03 缓动
- CSS变量: `--hue-offset`

### 指针物理
- 点质量 0.15, 环质量 0.08
- 阻尼 0.85, 刚度 0.12
- 碰撞: 检测玻璃卡片，速度>0.5时施加scale+skew形变
- 弹性恢复: `cubic-bezier(0.34, 1.56, 0.64, 1)`

### 粒子系统
- 最大80粒子(高端)/30(低端)/15(无WebGL)
- 重力: 鼠标距离中心越远，重力越强
- 颜色: oklch 格式，色相随 --hue-offset 旋转
- 生命周期: 200-600帧渐隐

### 分形SVG (L-system)
- Lung: 分支递归，展开角 25+depth*3 度
- Wave: 正弦叠加，多频率谐波
- Collision: 同心圆递归
- Fractal: 三角形Sierpinski，深度4级

### 自修复协议
```javascript
setTimeout(() => {
  if (!bootComplete) {
    document.body.style.opacity = '1';
  }
}, 5000);
```

---

## v6 (Aether) — 智能光标

### 三态光标
```
default   → 6px圆点，oklch(0.95 0.03 180)
magnetic  → 24px光圈，hover卡片时
wrap      → 包围按钮，100px圆角
```

### 3D层叠视差
- 最大旋转: ±12度
- 层级位移:
  - 背景层: norm * 5px
  - 文字层: norm * 10px
  - 图标层: norm * 15px
- CSS变量驱动: `--tilt-rotate-x`, `--layer-icon-x` 等

### 点击涟漪
- 尺寸 = max(width, height)
- 动画: scale 0→2, opacity 1→0
- 时长: 700ms

---

## v5 (Spatial Bento) — 3D倾斜

### 3D倾斜引擎
```javascript
rotateY = ((x - centerX) / centerX) * 5
rotateX = -((y - centerY) / centerY) * 5
perspective: 1000px
```
- 发光层跟随光标位置
- 20px模糊的玻璃效果

---

## 通用最佳实践

### 1. 单rAF主循环
```javascript
function tick(now) {
  breathValue = breath.update(now);
  hueOffset = echo.update(now);
  cursor.update(now);
  particleCount = particles.update(breathValue, hueOffset);
  requestAnimationFrame(tick);
}
requestAnimationFrame(tick);
```

### 2. GPU自适应
```javascript
const lowEnd = /(intel hd|hd graphics|mali|adreno 5|powervr)/i.test(renderer);
this.tier = lowEnd ? 'low' : 'high';
```

### 3. CSS自定义属性驱动
所有动态值通过 CSS 变量传递，实现零重排动画：
- `--breath-phase`: 0-1呼吸值
- `--hue-offset`: 色相偏移
- `--tilt-rotate-x/rotate-y`: 3D倾斜角度
- `--layer-*-x/y`: 层位移

### 4. 自修复兜底
```javascript
setTimeout(() => {
  fallback.classList.remove('active');
}, 3000); // 紧急3秒兜底
```

### 5. 玻璃效果
```css
.glass-card {
  background: oklch(0.15 0.1 280 / 0.4);
  backdrop-filter: blur(20px) saturate(180%);
  border: 1px solid oklch(0.3 0.15 280 / 0.15);
  box-shadow: 0 8px 32px oklch(0.05 0.1 280 / 0.3);
}
```

### 6. 颜色系统 (oklch)
```css
:root {
  --accent: oklch(0.75 0.18 280);
  --accent-glow: oklch(0.6 0.2 280 / 0.4);
  --surface: oklch(0.15 0.08 280);
  --text: oklch(0.95 0.01 280);
}
```

---

## 性能要点

| 技术 | 效果 |
|------|------|
| CSS变量驱动 | 零重排，仅触发 repaint |
| GPU检测+降级 | 低端设备自动降粒子/关光标 |
| 单rAF循环 | 避免多定时器竞争 |
| canvas粒子 | 比DOM粒子性能高10x |
| will-change 提示 | GPU加速层 |

---

## 可复用的架构模块

1. **BreathingEngine** → 可嵌入任何页面的"生命感"
2. **GPUMonitor** → 自适应质量判断
3. **FrostSwipe** → 玻璃模糊动态调节
4. **ParticleSystem** → 背景氛围粒子
5. **FractalRenderer** → 分形SVG图标生成
6. **SmartCursor** → 三态光标系统
7. **Layered3DTilt** → 多层视差卡
