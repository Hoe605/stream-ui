<template>
  <div class="playground">
    <section class="panel input-panel">
      <div class="panel-head">
        <span>输入</span>
        <button type="button" @click="reset">重置</button>
      </div>
      <Input v-model="text" :rows="8" :simulate-text="exampleText" />
    </section>

    <section class="panel render-panel">
      <div class="panel-head">
        <span>渲染结果</span>
      </div>
      <div class="render-box">
        <StreamContains
          v-model:data="blocks"
          :model-value="text"
          mode="accurate"
          :base-component="InspectableBase"
        >
          <Think />
          <CodeBlock />
        </StreamContains>
      </div>
    </section>

    <section class="panel blocks-panel">
      <div class="panel-head">
        <span>Blocks JSON</span>
        <span class="count">{{ blocks.length }} blocks</span>
      </div>
      <pre>{{ formattedBlocks }}</pre>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed, defineComponent, h, ref } from 'vue'
import { StreamContains, Think, type StreamBlockData } from 'stream-ui'
import Input from '../../.comm/Input.vue'

const exampleText = [
  '普通文本会生成 category=text 的 block。',
  '<think source="model">这里是思考过程，属性会进入 attrs。</think>',
  '<code lang="ts" filename="hello.ts">const message: string = "hello stream-ui"</code>',
  '后面的普通文本仍然会出现在 blocks 里。'
].join('\n\n')

const text = ref(exampleText)
const blocks = ref<StreamBlockData[]>([])

const formattedBlocks = computed(() => JSON.stringify(blocks.value, null, 2))

const reset = () => {
  text.value = exampleText
}

const InspectableBase = defineComponent({
  name: 'InspectableBase',
  props: ['block', 'tagName', 'attrs', 'content'],
  setup(props, { slots }) {
    return () => h('div', {
      class: ['inspectable-base', `category-${props.block?.category || 'unknown'}`],
      'data-tag': props.tagName
    }, [
      h('div', { class: 'base-meta' }, [
        h('span', props.block?.category || 'unknown'),
        h('span', props.tagName),
        props.attrs && Object.keys(props.attrs).length > 0
          ? h('code', JSON.stringify(props.attrs))
          : null
      ]),
      h('div', { class: 'base-body' }, slots.default?.())
    ])
  }
})

const CodeBlock = defineComponent({
  name: 'Code',
  props: ['content', 'attrs', 'isClosed'],
  setup(props) {
    return () => h('div', { class: 'code-block' }, [
      h('div', { class: 'code-head' }, [
        h('span', props.attrs?.filename || 'code'),
        h('span', props.attrs?.lang || 'text'),
        h('span', props.isClosed ? 'done' : 'streaming')
      ]),
      h('pre', [h('code', props.content)])
    ])
  }
})
</script>

<style scoped>
.playground {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(280px, 0.9fr);
  gap: 16px;
}

.panel {
  border: 1px solid var(--vp-c-border);
  border-radius: 8px;
  overflow: hidden;
  background: var(--vp-c-bg);
}

.input-panel,
.render-panel {
  grid-column: 1;
}

.blocks-panel {
  grid-column: 2;
  grid-row: 1 / span 2;
}

.panel-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 10px 12px;
  border-bottom: 1px solid var(--vp-c-border);
  background: var(--vp-c-bg-soft);
  font-size: 13px;
  font-weight: 700;
}

.panel-head button {
  border: 1px solid var(--vp-c-border);
  border-radius: 6px;
  padding: 3px 8px;
  color: var(--vp-c-text-2);
  font-size: 12px;
}

.count {
  color: var(--vp-c-text-2);
  font-weight: 500;
}

.render-box {
  padding: 14px;
}

.blocks-panel pre {
  max-height: 560px;
  margin: 0;
  padding: 12px;
  overflow: auto;
  font-size: 12px;
  line-height: 1.55;
  background: transparent;
}

:deep(.inspectable-base) {
  margin: 8px 0;
  border: 1px solid var(--vp-c-divider);
  border-radius: 8px;
  overflow: hidden;
}

:deep(.base-meta) {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 8px;
  border-bottom: 1px solid var(--vp-c-divider);
  background: var(--vp-c-bg-soft);
  color: var(--vp-c-text-2);
  font-size: 12px;
}

:deep(.base-meta code) {
  margin-left: auto;
  font-size: 11px;
}

:deep(.base-body) {
  padding: 8px 10px;
}

:deep(.category-text .base-body) {
  white-space: pre-wrap;
}

:deep(.code-block) {
  border: 1px solid var(--vp-c-divider);
  border-radius: 6px;
  overflow: hidden;
}

:deep(.code-head) {
  display: flex;
  gap: 8px;
  padding: 6px 8px;
  background: var(--vp-c-bg-soft);
  color: var(--vp-c-text-2);
  font-size: 12px;
}

:deep(.code-block pre) {
  margin: 0;
  padding: 10px;
  overflow: auto;
}

@media (max-width: 860px) {
  .playground {
    grid-template-columns: 1fr;
  }

  .input-panel,
  .render-panel,
  .blocks-panel {
    grid-column: 1;
    grid-row: auto;
  }
}
</style>
