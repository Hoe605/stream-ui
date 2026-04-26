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
          <Think />
          <CustomCodeBlock />
        </StreamContains>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, defineComponent, h } from 'vue'
import { StreamContains, Think } from 'stream-ui'
import Input from '../../.comm/Input.vue'

// 演示时为了便于展示使用render函数，正常使用template即可
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
