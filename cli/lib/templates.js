import { readFile } from 'node:fs/promises';
import { CORE_SOURCE_PATH, DEFAULT_TAG_SOURCE_PATH } from './constants.js';
import { toKebabCase, toPascalCase } from './path.js';

export async function buildStreamContainsTemplate() {
  const coreSource = (await readFile(CORE_SOURCE_PATH, 'utf8')).trim();
  const defaultTagSource = (await readFile(DEFAULT_TAG_SOURCE_PATH, 'utf8'))
    .replace("import { defineComponent, h } from 'vue';\n\n", '')
    .trim();

  return `${coreSource}

import { defineComponent, useSlots } from 'vue';

${defaultTagSource}

export const StreamContains = defineComponent({
  name: 'StreamContains',
  props: streamContainsProps,
  emits: ['update:data'],
  setup(props, { emit }) {
    return createStreamContainsRender(props as StreamContainsProps, useSlots(), {
      emit,
      DefaultTag
    });
  }
});

export default StreamContains;
`;
}

export function buildCustomComponentTemplate(componentName) {
  const kebabName = toKebabCase(componentName);
  const pascalName = toPascalCase(componentName);
  const title = kebabName.split('-').map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join(' ');

  return `<template>
  <div class="${kebabName}-block">
    <div class="${kebabName}-header">
      <span class="title">${title}</span>
      <span class="status" :class="{ open: !isClosed }">{{ isClosed ? 'closed' : 'streaming' }}</span>
    </div>
    <div class="${kebabName}-content">
      <slot>{{ content }}</slot>
    </div>
  </div>
</template>

<script setup lang="ts">
defineOptions({
  name: '${pascalName}'
})

defineProps<{
  block?: {
    id: string
    tagName: string
    content: string
    isClosed: boolean
    category: 'component' | 'fallback'
    payload?: unknown
  }
  content?: string
  isClosed?: boolean
  reportData?: (payload: unknown) => void
}>()
</script>

<style scoped>
.${kebabName}-block {
  margin: 12px 0;
  border: 1px solid #d8dee9;
  border-radius: 10px;
  overflow: hidden;
  background: #ffffff;
}

.${kebabName}-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 10px 12px;
  background: #f8fafc;
  border-bottom: 1px solid #e2e8f0;
}

.title {
  font-size: 13px;
  font-weight: 700;
  color: #334155;
}

.status {
  font-size: 11px;
  font-weight: 600;
  color: #64748b;
}

.status.open {
  color: #2563eb;
}

.${kebabName}-content {
  padding: 12px 16px;
  color: #334155;
  line-height: 1.65;
  white-space: pre-wrap;
}
</style>
`;
}
