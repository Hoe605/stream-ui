<template>
  <div class="s-think" :data-closed="isClosed" :data-expand="expand">
    <div class="s-think-head" @click="expand = !expand">
      {{ isClosed ? title : '思考中...' }}
    </div>
    <div class="s-think-content">
      <slot>{{ content }}</slot>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import type { StreamBlockData } from '../../types'

defineOptions({
  name: 'Think'
})

withDefaults(defineProps<{
  /** 标签属性 */
  attrs?: Record<string, string | boolean>
  /** 标签内部的原始内容 */
  content?: string
  /** 当前标签是否已经闭合 */
  isClosed?: boolean
  /** 完整的区块数据对象 */
  block?: StreamBlockData
  /** 头部标题 */
  title?: string
}>(), {
  content: '',
  isClosed: false,
  title: '思考完毕'
})

const expand = ref(true)
</script>

<style>
.s-think {
  margin: 12px 0;
  border-left: 2px solid #e2e8f0;
  padding-left: 12px;
}

.s-think-head {
  font-size: 0.85em;
  color: #64748b;
  cursor: pointer;
  user-select: none;
  display: flex;
  align-items: center;
  gap: 4px;
}

.s-think-head::before {
  content: '▼';
  font-size: 0.7em;
  transition: transform 0.2s;
}

.s-think[data-expand="false"] .s-think-head::before {
  transform: rotate(-90deg);
}

.s-think-content {
  margin-top: 8px;
  color: #475569;
  white-space: pre-wrap;
}

.s-think[data-expand="false"] .s-think-content {
  display: none;
}
</style>
