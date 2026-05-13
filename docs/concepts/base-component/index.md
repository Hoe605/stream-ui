# 公共 Base 组件扩展

`baseComponent` 用于给所有渲染内容增加一层用户自定义能力。它会包裹：

- 已经命中插槽注册的标签组件，例如 `<think>`。
- 没有注册组件的 fallback 标签。
- 标签之外的普通文本。

这意味着你可以在业务项目里统一接入 markdown、LaTeX、高亮、埋点或复制操作，而不需要 Stream UI 内置这些渲染库。

## 演示

<preview path="./BaseComponentDemo.vue"></preview>

## 基础写法

```vue
<script setup lang="ts">
import { defineComponent } from 'vue'
import { StreamContains, type StreamBlockBaseProps } from '@huiol/stream-ui'
import Think from './think.vue'

const MarkdownBase = defineComponent({
  props: ['block', 'tagName', 'content', 'isClosed', 'reportData'],
  setup(props: StreamBlockBaseProps, { slots }) {
    return () => props.block.category === 'text'
      ? renderMarkdown(props.content)
      : slots.default?.()
  }
})
</script>

<template>
  <StreamContains :model-value="message" :base-component="MarkdownBase">
    <Think />
  </StreamContains>
</template>
```

## Base 组件收到的 Props

| 属性名 | 类型 | 说明 |
| --- | --- | --- |
| `block` | `StreamBlockData` | 当前区块的结构化数据。普通文本的 `category` 为 `text`。 |
| `tagName` | `string` | 标签名。普通文本固定为 `text`。 |
| `content` | `string` | 当前区块的原始内容。 |
| `isClosed` | `boolean` | 区块是否闭合。普通文本恒为 `true`。 |
| `reportData` | `(payload: unknown) => void` | 将 base 层产生的数据写回 `block.payload`。 |

默认插槽是 Stream UI 原本解析出的内容。对于已注册组件，它是对应组件；对于 fallback，它是内置 fallback；对于普通文本，它是原来的 `span` 文本节点。

## 适合放在 Base 里的能力

- markdown 和 LaTeX 渲染。
- 统一的复制、引用、选择、悬浮工具栏。
- 日志、埋点、内容审计标记。
- 按 `block.category` 或 `tagName` 增加统一布局。

Stream UI 只提供扩展点，不绑定具体 markdown 或 LaTeX 依赖。你可以在自己的项目中选择 `markdown-it`、`remark`、`KaTeX`、`MathJax` 或其他实现。
