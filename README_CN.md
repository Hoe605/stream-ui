# `@huiol/stream-ui`

[English](./README.md) | 简体中文

基于 Vue 3 的 LLM 输出标签化流式渲染工具。

本项目支持两种使用方式：

1. **直接导入运行时**：直接从 NPM 包中导入打包好的组件和逻辑。
2. **使用 CLI 导入源码**：通过命令行将组件源码复制到你的项目中，类似于 `shadcn/ui` 的工作模式，方便自行定制。

## 安装

```bash
pnpm add @huiol/stream-ui vue
```

或者使用 CLI 初始化：

```bash
npx @huiol/stream-ui init
```

## 运行时使用

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { StreamContains } from '@huiol/stream-ui'
import Think from './components/ui/think.vue'
import Text from './components/ui/text.vue'

const message = ref('<think>正在思考...</think><text>最终回答内容</text>')
</script>

<template>
  <StreamContains :model-value="message" mode="accurate">
    <Think />
    <Text />
  </StreamContains>
</template>
```

传递给子组件的辅助 Props：

- `content?: string`：标签内的内容。
- `isClosed?: boolean`：标签是否已闭合。

`isClosed` 在流式 UI 中非常有用，可以判断某个标签是正在输出中还是已经接收到了闭合标签。

## 公共 Base 组件

当所有渲染出来的区块都需要同一类能力时，可以使用 `baseComponent`，例如 markdown、LaTeX、埋点、复制按钮或统一布局。它会包裹已注册组件、fallback 标签和标签之外的普通文本。组件库本身不内置 markdown/LaTeX 渲染器；base 组件是留给用户自行接入这些能力的扩展点。

```vue
<script setup lang="ts">
import { StreamContains } from '@huiol/stream-ui'
import MarkdownBase from './components/MarkdownBase.vue'
import Think from './components/ui/think.vue'
import Text from './components/ui/text.vue'
</script>

<template>
  <StreamContains :model-value="message" :base-component="MarkdownBase">
    <Think />
    <Text />
  </StreamContains>
</template>
```

base 组件会收到同样的 block props，并额外收到 `tagName`。默认插槽是原本解析出的组件、fallback 或文本 `span`：

```vue
<template>
  <div class="stream-block-base" :data-tag="tagName">
    <slot />
  </div>
</template>

<script setup lang="ts">
import type { StreamBlockBaseProps } from '@huiol/stream-ui'

defineProps<StreamBlockBaseProps>()
</script>
```

如果希望 base 组件完全接管渲染，可以忽略默认插槽，直接基于 `content` 渲染。

## CLI 命令

初始化本地组件配置：

```bash
npx @huiol/stream-ui init
```

该命令会创建：

- `components.json`：组件配置文件。
- `src/components/ui/stream-contains.ts`：核心渲染组件源码。

添加内置组件：

```bash
npx @huiol/stream-ui add think
npx @huiol/stream-ui add text
npx @huiol/stream-ui add think text
```

创建一个自定义组件模板：

```bash
npx @huiol/stream-ui create reasoning-card
```

列出所有可用的内置组件：

```bash
npx @huiol/stream-ui list
```

### CLI 标志位 (Flags)

- `--yes`, `-y`：跳过确认提示，全部使用默认值。
- `--overwrite`, `-o`：直接覆盖现有文件，不进行询问。
- `--diff`：在决定覆盖前显示代码差异。
- `--cwd <path>`：在指定的项目目录下运行。

使用示例：

```bash
npx @huiol/stream-ui init --cwd ./apps/chat --yes
npx @huiol/stream-ui add think text --cwd ./apps/chat --diff
npx @huiol/stream-ui create tool-call --cwd ./apps/chat --overwrite
```

## 生成的项目结构

执行 `init` 和 `add think text` 后的结构：

```text
components.json
src/components/ui/
  stream-contains.ts
  think.vue
  text.vue
```

## `components.json` 配置

默认配置：

```json
{
  "$schema": "https://huiol.com/schema/stream-ui-components.json",
  "style": "default",
  "framework": "vue",
  "typescript": true,
  "aliases": {
    "ui": "@/components/ui"
  }
}
```

CLI 使用 `aliases.ui` 来确定生成的组件文件存放位置。

## 注意事项

- **逻辑同步**：`StreamContains` 在打包版本和 CLI 源码版本中使用相同的核心逻辑，确保解析行为一致。
- **自定义化**：内置的 `.vue` 文件（如 `think.vue`）是直接复制源码的。这是有意为之的设计，方便你根据项目需求直接修改样式或行为。
- **解析模式**：当你需要可靠的嵌套标签处理和准确的 `isClosed` 状态时，推荐使用 `mode="accurate"`。
