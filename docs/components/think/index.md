# Think 组件

`Think` 组件是 Stream UI 内置的一个示例组件，用于展示 AI 的思考过程。它通常被配置为拦截 `<think>` 标签。

## 演示

<preview path="./ThinkDemo.vue"></preview>

## 配置

在 `StreamContains` 中通过子组件插槽声明拦截：

```vue
<StreamContains :model-value="text" mode="accurate">
  <Think />
</StreamContains>
```

## 属性 (Props)

| 参数 | 类型 | 说明 |
| --- | --- | --- |
| `content` | `string` | 标签内部的文本内容 |
| `isClosed` | `boolean` | 当前标签是否已经闭合 |
| `block` | `object` | 当前区块的完整结构化信息 |
| `reportData` | `function` | 将交互数据回传给 `StreamContains` |

## 建议

如果你需要根据流式状态显示“思考中”，优先使用 `isClosed` 而不是自行猜测文本是否结束。
