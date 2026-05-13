<template>
  <div class="demo-container">
    <div class="demo-section">
      <div class="demo-label">输入流 (Markdown + LaTeX-like Text)</div>
      <Input v-model="text" :rows="4" :simulate-text="exampleText" />
    </div>

    <div class="demo-section">
      <div class="demo-label">渲染结果 (Base Component Extension)</div>
      <div class="demo-box rendered-box">
        <StreamContains :model-value="text" mode="accurate" :base-component="MarkdownBase">
          <Think />
        </StreamContains>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, defineComponent, h, ref } from 'vue'
import { StreamContains, Think } from 'stream-ui'
import Input from '../../.comm/Input.vue'

const escapeHtml = (value) => value
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')

const renderInline = (value) => escapeHtml(value)
  .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
  .replace(/`([^`]+)`/g, '<code>$1</code>')
  .replace(/\$([^$]+)\$/g, '<span class="math">$1</span>')
  .replace(/\n/g, '<br>')

const MarkdownBase = defineComponent({
  name: 'MarkdownBase',
  props: ['block', 'tagName', 'content'],
  setup(props, { slots }) {
    const html = computed(() => renderInline(props.content || ''))

    return () => h('div', {
      class: ['markdown-base', `category-${props.block?.category || 'unknown'}`],
      'data-tag': props.tagName
    }, props.block?.category === 'text'
      ? h('span', { innerHTML: html.value })
      : slots.default?.())
  }
})

const exampleText = '普通文本也可以渲染 **Markdown**、`inline code` 和 $E=mc^2$。\n<think>标签内容仍然先进入 Think 组件，再由 Base 包装。</think>\n后续普通文本继续支持 **加粗** 和 $a^2+b^2=c^2$。'
const text = ref(exampleText)
</script>

<style scoped>
.markdown-base {
  line-height: 1.75;
  white-space: normal;
}

.markdown-base :deep(code) {
  padding: 2px 5px;
  border-radius: 4px;
  background: var(--vp-c-bg-soft);
  color: var(--vp-c-text-1);
  font-size: 0.92em;
}

.markdown-base :deep(.math) {
  padding: 1px 6px;
  border-radius: 999px;
  background: color-mix(in srgb, var(--vp-c-brand-1) 12%, transparent);
  color: var(--vp-c-brand-1);
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
}

.category-component {
  margin: 12px 0;
}
</style>
