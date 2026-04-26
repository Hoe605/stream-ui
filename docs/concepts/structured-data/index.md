# 结构化数据抽取

Stream UI 不仅仅是一个渲染引擎，它还可以帮助你从流式文本中提取结构化的状态信息。通过使用 `v-model:data`，你可以实时获取当前已解析出的所有区块（Blocks）的状态。

## 为什么需要它？

在渲染流式对话时，除了将内容显示在屏幕上，你可能还需要：
- 在外部 UI 中显示当前是否有“思考中”的状态。
- 统计当前输出中的所有代码块或自定义标签。
- 将解析后的结构化数据同步到其他状态管理器中。
- 让某个区块组件主动回传交互数据，例如 `<input-block>`。

## 使用方法

<preview path="./InteractiveInputBlock.vue"></preview>

## 数据结构解析

`blocks` 数组中的每一项都包含基本的 `category` 属性，用于区分该区块的类型：

- **`component`**: 表示该区块已被识别为已注册的自定义子组件（例如你拦截的 `<think>` 标签）。
- **`fallback`**: 表示该区块由内置的默认标签渲染（通常是未拦截的标签或普通文本）。

### StreamBlockData 接口

```ts
interface StreamBlockData {
  /** 区块唯一 ID */
  id: string
  /** 区块分类 */
  category: 'component' | 'fallback'
  /** 原始标签名称 */
  tagName: string
  /** 内部内容 */
  content: string
  /** 是否已闭合 */
  isClosed: boolean
  /** 子组件通过 reportData 回传的任意数据 */
  payload?: unknown
}
```

## 子组件回传数据

如果你的标签组件接收了 `reportData` 属性（类型为 `Function`），它可以把交互结果实时回传给父容器。回传的数据会反映到 `v-model:data` 中对应区块项的 `payload` 字段里。

这使得你可以实现复杂的流式交互：LLM 输出一个交互组件（如 `<input />`），用户在组件内操作，你的应用可以从 `v-model:data` 中直接读取到用户的输入状态。

### 代码示例

```vue
<!-- 自定义输入组件 -->
<script setup>
const props = defineProps(['label', 'reportData', 'isClosed']);
const onInput = (e) => {
  // 将数据回传给 StreamContains
  props.reportData({ value: e.target.value });
};
</script>

<template>
  <div class="input-block">
    <span>{{ label }}</span>
    <input @input="onInput" :disabled="!isClosed" />
  </div>
</template>
```

## 自闭合标签支持

Stream UI 完全支持自闭合标签（Self-closing tags），例如 `<input />` 或 `<img />`。

- **立即闭合**：解析器识别到 `/>` 后会将该区块标记为 `isClosed: true`。
- **无内容吞噬**：自闭合标签不会尝试匹配后续的闭合标签，这确保了后续的流式文本能够被正确解析为独立的区块，而不会被误认为是该标签的内部内容。
- **灵活性**：支持 `<tag/>`、`<tag />` 以及带有属性的 `<tag attr="val" />` 格式。

## 注意事项

- **模式选择**: 虽然 `fast` 模式也支持基本渲染，但 `v-model:data` 在 `mode="accurate"` (基于栈的解析) 下能提供更稳定和准确的结构化数据。
- **性能**: 只有当内容发生实际解析变化时，`blocks` 才会更新，确保了极佳的性能表现。
