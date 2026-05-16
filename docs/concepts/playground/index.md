# 流式 Playground

这个页面把输入流、渲染结果和 `v-model:data` 的 blocks JSON 放在一起，方便观察 Stream UI 在流式追加时如何拆分普通文本、标签组件和 fallback。

## 在线调试

<StreamPlayground />

<script setup>
import StreamPlayground from './StreamPlayground.vue'
</script>

## 可以观察什么

- 标签外普通文本会生成 `category: 'text'`。
- `<think source="model">` 会命中 `Think` 组件，`source` 会进入 `attrs`。
- `<code lang="ts" filename="hello.ts">` 会命中示例里的 `Code` 组件，并接收 `attrs`。
- `baseComponent` 会统一包裹普通文本、命中组件和 fallback。
