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

- `content?: string`
- `isClosed?: boolean`

`isClosed` is useful for streaming UIs where a tag may have started but not yet received its closing tag.

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
