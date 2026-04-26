# 标签拦截

标签拦截是 Stream UI 的核心功能。它允许你将特定的 XML-like 标签关联到 Vue 组件上。

## 演示

<preview path="./TagInterceptionDemo.vue"></preview>

## 配置方式

通过 `StreamContains` 的默认插槽传入子组件。组件名会自动映射到标签名：

- `Think` -> `<think>`
- `InputBlock` -> `<input-block>`

```vue
<script setup lang="ts">
import { StreamContains } from '@huiol/stream-ui'
import CodeBlock from './components/CodeBlock.vue'
import ThinkProcess from './components/ThinkProcess.vue'
</script>

<template>
  <StreamContains :model-value="streamText" mode="accurate">
    <CodeBlock />
    <ThinkProcess />
  </StreamContains>
</template>
```

## 组件接收的 Props

被拦截的组件会自动接收以下属性：

- **`block`**: 当前区块的完整结构化信息。
- **`content`**: 标签内部的原始内容。
- **`isClosed`**: 当前标签是否已经闭合。
- **`reportData`**: 子组件向容器回传交互数据的方法。

## 默认行为

如果没有匹配到已注册组件，Stream UI 会回退到内置的 `DefaultTag`。这类区块在 `v-model:data` 中的 `category` 会是 `fallback`。
