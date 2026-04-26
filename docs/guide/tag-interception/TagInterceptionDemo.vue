<template>
  <div class="demo-container">
    <div class="demo-section">
      <div class="demo-label">输入流 (Interactive Stream Input)</div>
      <Input v-model="text" :rows="3" :simulate-text="exampleText" />
    </div>

    <div class="demo-section">
      <div class="demo-label">渲染结果 (Tag Interception)</div>
      <div class="demo-box rendered-box">
        <StreamContains :model-value="text" mode="accurate">
          <DocsThink />
          <CustomCodeBlock />
        </StreamContains>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, defineComponent, h } from 'vue'
import { StreamContains } from 'stream-ui'
import DocsThink from '../../components/think/DocsThink.vue'
import Input from '../../.comm/Input.vue'

// 演示时使用 render 函数替代 template 字符串，避免运行时编译报错 正常使用 template 即可
const CustomCodeBlock = defineComponent({
  name: 'Code',
  props: ['content', 'isClosed'],
  setup(props) {
    return () => h('div', { class: 'custom-code' }, [
      h('div', { class: 'code-header' }, [
        h('span', 'CODE BLOCK'),
        h('span', { class: 'status' }, props.isClosed ? 'DONE' : 'TYPING...')
      ]),
      h('pre', [h('code', props.content)])
    ])
  }
})

const exampleText = 'Hello! <think>I am thinking about the code...</think> Check this out: <code>const greeting = "Hello World";</code>'
const text = ref(exampleText)
</script>
