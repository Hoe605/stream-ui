<template>
  <div class="demo-card">
    <Input v-model="text" :simulate-text="exampleText" />

    <div class="render-area">
      <StreamContains v-model:data="blocks" :model-value="text" mode="accurate">
        <MyInputBlock />
      </StreamContains>
    </div>

    <!-- 实时数据监控 -->
    <div class="state-monitor">
      <div v-for="b in blocks" :key="b.id" class="state-item">
        <span class="tag">[{{ b.tagName }}]</span>
        <span class="payload">已上报数据: {{ b.payload || '等待输入...' }}</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, h, defineComponent } from 'vue'
import { StreamContains } from 'stream-ui'
import Input from '../../.comm/Input.vue'

// 定义一个简单的交互式拦截组件
const MyInputBlock = defineComponent({
  name: 'MyInputBlock',
  props: ['reportData', 'label', 'isClosed'],
  setup(props) {
    return () => h('div', { class: 'custom-input-box' }, [
      h('span', props.label || '输入组件：'),
      h('input', {
        class: 's-raw-input',
        placeholder: props.isClosed ? '请输入并回传' : '流式生成中...',
        disabled: !props.isClosed,
        onInput: (e) => props.reportData(e.target.value)
      })
    ])
  }
})

const exampleText = '系统已就绪，请填写以下信息：\n<my-input-block label="用户名"></my-input-block>\n<my-input-block label="邮箱地址" />'
const text = ref(exampleText)
const blocks = ref([])
</script>

<style scoped>
.demo-card {
  padding: 1rem;
  border: 1px solid var(--vp-c-border);
  border-radius: 8px;
  background: var(--vp-c-bg-soft);
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.render-area {
  padding: 12px;
  background: var(--vp-c-bg);
  border-radius: 6px;
  border-left: 3px solid var(--vp-c-brand);
}

.state-monitor {
  font-family: monospace;
  font-size: 12px;
}

.state-item {
  display: flex;
  gap: 8px;
  margin-bottom: 4px;
  padding: 4px;
  background: var(--vp-c-bg);
  border-radius: 4px;
}

.tag {
  color: var(--vp-c-brand-1);
  font-weight: bold;
}

.custom-input-box {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 8px 0;
  padding: 8px;
  border: 1px dashed var(--vp-c-border);
  border-radius: 6px;
}

.s-raw-input {
  border: 1px solid var(--vp-c-border);
  border-radius: 4px;
  padding: 2px 8px;
  background: var(--vp-c-bg-soft);
  font-size: 13px;
  outline: none;
  transition: border-color 0.2s;
}

.s-raw-input:focus {
  border-color: var(--vp-c-brand-1);
}

.s-raw-input:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
</style>
