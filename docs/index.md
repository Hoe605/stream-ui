---
layout: home

hero:
  name: "Stream UI"
  text: "流式文本渲染组件"
  tagline: 轻量级 Vue 3 引擎，专为 LLM 流式输出设计，支持复杂标签拦截与异步组件渲染。
  image:
    src: /logo.png
    alt: Stream UI
  actions:
    - theme: brand
      text: 快速开始
      link: /introduction/getting-started/
    - theme: alt
      text: 在 GitHub 上查看
      link: https://github.com/Hoe605/stream-ui

features:
  - title:  极速渲染
    details: 基于正则与栈双模式解析，确保在大规模文本流下依然保持丝滑性能。
  - title:   灵活拦截
    details: 支持自定义 XML-like 标签拦截，轻松实现 <think>、<code> 等特殊内容的渲染注入。
  - title:  零依赖
    details: 核心库极小，完全适配 Vue 3 生态，支持单文件组件直接渲染。
---

<style>
:root {
  --vp-home-hero-name-color: transparent;
  --vp-home-hero-name-background: linear-gradient(135deg, #646cff 10%, #42d392 100%);
}
</style>
