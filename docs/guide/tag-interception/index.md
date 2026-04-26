# 标签拦截核心指南

标签拦截是 Stream UI 将“流式文本”转化为“交互组件”的关键桥梁。了解其底层解析规则，能帮助你更精准地控制 AI 通信过程中的 UI 呈现。

## 演示

<preview path="./TagInterceptionDemo.vue"></preview>

## 匹配逻辑探秘

### 1. 自动名称转换 (Naming Convention)
Stream UI 会自动管理组件名与标签名的映射。它同时支持 `PascalCase` 和 `kebab-case`。

- **组件名**: `CodeBlock` 会匹配 `<code-block>` 和 `<CodeBlock>`。
- **匹配顺序**: 转换过程是完全自动的，容器会自动扫描插槽内所有组件的 `name` 属性或其在 Vue 定义中的变量名。

### 2. 局部注册机制
只有直接放入 `<StreamContains>` 默认插槽中的组件才会被注册为拦截器。

```vue
<StreamContains :model-value="text">
  <!-- 此时 'Select' 标签被激活 -->
  <Select /> 
</StreamContains>
```

---

## 属性解析规则 (Attributes)

Stream UI 的解析引擎不仅能识别标签名，还能提取标签上的属性（Attributes），并将其通过 `block.props` 传递给子组件。

- **语法**: 支持 `<tag key="value">` 格式。
- **动态性**: 在流式输出过程中，一旦起始标签解析完成，其属性即变为**不可变状态**。

> [!TIP]
> 建议将非交互的配置信息（如：`type="warning"`、`language="javascript"`）通过标签属性传入。

---

## 区块的生命周期

每个被拦截的区块都会经历三个关键状态，你可以通过自动注入的 `isClosed` 属性来感知：

1. **已打开 (Opened)**: 发现起始标签（如 `<think>`），组件被挂载。此时 `isClosed` 为 `false`。
2. **增长中 (Growing)**: 内容随着流持续追加，组件的 `content` 属性实时更新。
3. **已闭合 (Closed)**: 发现闭合标签（如 `</think>`）或流异常终止。此时 `isClosed` 变为 `true`。

---

## 嵌套拦截规则

在 **`accurate` (精确模式)** 下，Stream UI 支持**深度嵌套**。

如果 AI 输出如下文本：
```html
<box>
  这是外层
  <think>这是内层</think>
</box>
```
如果你在容器中同时注册了 `Box` 和 `Think` 组件，`Box` 组件的 `default` 插槽中将包含被渲染后的 `Think` 组件。这使得构建复杂的层级 UI（如：卡片内的思考过程）变得及其简单。

---

## 最佳实践

- **利用 `isClosed` 优化性能**: 只有在 `isClosed` 为 `true` 时，才允许用户进行提交或交互操作，防止在流式输出中产生非预期的并发错误。
- **降级渲染**: 如果 AI 输出了未注册的标签，Stream UI 会将其作为 `fallback` 处理。你可以通过查看 `v-model:data` 中对应区块的 `category` 字段来统计这些未定义的输出。
