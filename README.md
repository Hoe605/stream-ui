# `@huiol/stream-ui`

English | [简体中文](./README_CN.md)

Vue 3 stream rendering utilities for tagged LLM output.

This package supports two workflows:

1. Import the packaged runtime directly.
2. Use the CLI to copy local source components into your app, similar to `shadcn/ui`.

## Install

```bash
pnpm add @huiol/stream-ui vue
```

Or with the CLI:

```bash
npx @huiol/stream-ui init
```

## Runtime Usage

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { StreamContains } from '@huiol/stream-ui'
import Think from './components/ui/think.vue'
import Text from './components/ui/text.vue'

const message = ref('<think>drafting...</think><text>final answer</text>')
</script>

<template>
  <StreamContains :model-value="message" mode="accurate">
    <Think />
    <Text />
  </StreamContains>
</template>
```

Supported props passed into child components:

- `block?: { id; tagName; content; isClosed; category; payload }`
- `content?: string`
- `isClosed?: boolean`
- `reportData?: (payload) => void`

`isClosed` is useful for streaming UIs where a tag may have started but not yet received its closing tag.

You can also collect structured block state from the container:

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { StreamContains, type StreamBlockData } from '@huiol/stream-ui'

const text = ref('')
const blocks = ref<StreamBlockData[]>([])
</script>

<template>
  <StreamContains v-model:data="blocks" :model-value="text" mode="accurate" />
</template>
```

Each block includes a basic `category`:

- `component`: rendered by a registered child component
- `fallback`: rendered by the built-in default tag
- `text`: plain text outside tags

## Shared Base Component

Use `baseComponent` when every rendered block needs the same behavior, such as markdown, LaTeX, analytics, copy actions, or shared layout. It wraps registered components, fallback tags, and plain text outside tags. The package does not ship markdown or LaTeX renderers; the base component is the user-owned extension point.

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

The base component receives the same block props plus `tagName`, and its default slot is the originally resolved component, fallback, or text span:

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

If you want the base component to fully control rendering, ignore the default slot and render from `content` instead.

## CLI

Initialize the local component setup:

```bash
npx @huiol/stream-ui init
```

This creates:

- `components.json`
- `src/components/ui/stream-contains.ts`

Add built-in components:

```bash
npx @huiol/stream-ui add think
npx @huiol/stream-ui add text
npx @huiol/stream-ui add think text
```

Create a custom component scaffold:

```bash
npx @huiol/stream-ui create reasoning-card
```

List available built-ins:

```bash
npx @huiol/stream-ui list
```

### CLI flags

- `--yes`, `-y`: skip prompts and accept defaults
- `--overwrite`, `-o`: replace existing files without asking
- `--diff`: show a diff before overwrite decisions
- `--cwd <path>`: run against another project directory

Examples:

```bash
npx @huiol/stream-ui init --cwd ./apps/chat --yes
npx @huiol/stream-ui add think text --cwd ./apps/chat --diff
npx @huiol/stream-ui create tool-call --cwd ./apps/chat --overwrite
```

## Generated Project Structure

After `init` and `add think text`:

```text
components.json
src/components/ui/
  stream-contains.ts
  think.vue
  text.vue
```

## `components.json`

Default shape:

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

The CLI uses `aliases.ui` to decide where generated files should be written.

## Notes

- `StreamContains` uses a shared core for both the packaged runtime and CLI-generated source, so parsing behavior stays aligned.
- Built-in `.vue` files like `think.vue` and `text.vue` are copied directly. This is intentional and keeps them easy to customize.
- `accurate` mode is the preferred mode when you need reliable nested-tag handling and `isClosed` state.
