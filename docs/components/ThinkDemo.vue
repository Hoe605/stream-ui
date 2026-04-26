<template>
  <div class="demo-card">
    <Input v-model="text" :simulate-text="exampleText" />
    
    <div class="render-area">
      <StreamContains :model-value="text">
        <DocsThink />
      </StreamContains>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { StreamContains } from 'stream-ui'
import DocsThink from './DocsThink.vue'
import Input from '../.comm/Input.vue'

const exampleText = '你好！让我想想...<think>我会用最专业的态度回答这个问题。正在检索相关资料...</think> 很高兴为您服务。'
const text = ref(exampleText)
</script>

<style scoped>
.demo-card {
  padding: 1rem; border: 1px solid var(--vp-c-border); border-radius: 8px;
  background: var(--vp-c-bg-soft); display: flex; flex-direction: column; gap: 1rem;
}
.render-area { padding: 12px; background: var(--vp-c-bg); border-radius: 6px; border-left: 3px solid var(--vp-c-brand); }
</style>
