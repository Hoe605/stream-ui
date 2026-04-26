# 快速开始

Stream UI 是一个用于处理 AI 流式输出的渲染引擎。它可以拦截特定的标签（如 `<think>`）并将其替换为 Vue 组件，同时保持其余文本的正常渲染。

## 安装

由于目前处于开发阶段，你可以直接克隆仓库或通过 npm 安装（如果已发布）：

```bash
pnpm add @huiol/stream-ui
```

## 实时演示

<preview path="./BasicUsage.vue"></preview>

## 核心特性

- **流式增量渲染**：无需等待全文生成即可开始渲染。
- **自定义标签**：支持拦截任何 `xml-like` 标签。
- **组件插槽拦截**：通过给 `StreamContains` 传入子组件来声明你要拦截的标签。
