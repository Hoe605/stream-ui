<template>
  <div class="demo-card">
    <Input v-model="text" :simulate-text="exampleText" />

    <hr>

    <StreamContains v-model:data="blocks" :model-value="text" mode="accurate">
      <MyInputBlock />
    </StreamContains>

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

<style>
.state-monitor {
  padding: 4px;
}

.tag {
  color: #007acc;
}

.payload {
  color: #a1a1a1;
}
</style>
