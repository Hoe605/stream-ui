# StreamContains 组件

`StreamContains` 是 Stream UI 的核心容器组件。它负责解析流式文本、拦截特定标签，并将其分发给对应的 Vue 组件进行实时渲染。

## 导入与使用

通常你不需要手动导入 `stream-contains-core`，直接从主包引用即可：

```vue
<script setup>
import { StreamContains } from '@huiol/stream-ui'
</script>
```

## 属性 (Props)

| 参数 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `model-value` / `v-model` | `string` | `''` | **必填**。待解析的原始流式文本（通常是来自 LLM 的输出）。 |
| `mode` | `'fast' \| 'accurate' `| `'fast'` | 渲染模式。建议在涉及交互组件时使用 `accurate`。 |
| `v-model:data` (blocks) | `StreamBlockData[]` | `[]` | **可选**。双向绑定解析出的结构化数据列表。 |
| `base-component` | `Component \| null` | `null` | **可选**。统一包裹所有标签块、fallback 和普通文本的基础组件。 |

### 模式区别 (Render Mode)
- **`fast` (默认模式)**: 基于正则表达式的扁平化解析。速度极快，适用于大多数简单的流式输出和非嵌套标签。
- **`accurate` (精确模式)**: 基于栈算法（Stack-based）的深度解析。支持标签嵌套、能够更准确地识别自闭合标签边缘，并能提供最可靠的 `v-model:data` 结构化数据。

---

## 标签拦截规则 (Slots)

### `default` 插槽
默认插槽用于**注册拦截组件**。容器会通过分析插槽内的组件定义，建立标签名与组件的映射关系。

- **名称映射**：组件的 `name`（或 `__name`）将作为匹配标签。支持 `CamelCase` 到 `kebab-case` 的自动转换。
- **降级渲染**：未匹配到组件的标签会使用内置的 `DefaultTag` 进行降级渲染（保持 HTML 原样但不具备特殊逻辑）。

```vue
<StreamContains :model-value="text">
  <!-- 自动拦截 <think> 标签 -->
  <DocsThink /> 
  <!-- 自动拦截 <input-block> 标签 -->
  <SelectBlock />
</StreamContains>
```

---

## 子组件 API (Injected Props)

被拦截的子组件会被注入以下 Props，无需在组件内部显式声明，直接接收即可（推荐在使用时定义对应的 interface）：

| 属性名 | 类型 | 说明 |
| --- | --- | --- |
| `block` | `StreamBlockData` | 当前区块在整个流中的完整元数据对象。 |
| `content` | `string` | 标签内部的字符串内容（随着流式输出实时增长）。 |
| `isClosed` | `boolean` | 当前标签是否已完成解析并成功闭合。 |
| `reportData` | `(data: any) => void` | **核心交互接口**。调用此函数可将子组件内部状态上报至 `block.payload`。 |

---

## 结构化数据 (StreamBlockData)

`v-model:data` 返回的数组包含以下结构：

```ts
interface StreamBlockData {
  id: string;          // 唯一标识符，在流式追加过程中保持不变
  tagName: string;     // 匹配到的标签名（不带括号）
  content: string;     // 标签内部的原始内容
  isClosed: boolean;   // 该标签是否已经完全输出完毕
  category: 'component' | 'fallback' | 'text'; // 标识自定义组件、普通降级标签或标签外文本
  payload?: any;       // 存储由子组件通过 reportData 上报的自定义交互数据
}
```

## 注意事项

1. **响应式频率**：`StreamContains` 针对高频流式输出进行了节流优化，`v-model:data` 的更新会合并到微任务（Microtask）中执行。
2. **Key 管理**：组件内部自动管理 `key`，在流式追加过程中尽量复用已有 DOM 节点，保证了极佳的渲染性能。
3. **解析警告**：在 `accurate` 模式下，如果遇到标签未对齐（如 `<a><b></a>`）等异常 HTML，会在控制台输出详细的解析警告辅助调试。
