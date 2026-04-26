<template>
  <div class="think-container">
    <button class="think-header" type="button" @click="isExpanded = !isExpanded">
      <div class="header-left">
        <span class="icon" :class="{ 'is-collapsed': !isExpanded }">▶</span>
        <span class="title">Thinking</span>
      </div>
      <span v-if="!isFinished" class="loading-dots">streaming...</span>
    </button>

    <div v-show="isExpanded" class="think-content">
      <slot>{{ content }}</slot>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

defineOptions({
  name: 'Think'
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
  isFinished?: boolean
  isClosed?: boolean
  reportData?: (payload: unknown) => void
}>()

const isExpanded = ref(true)
</script>

<style scoped>
.think-container {
  margin: 12px 0;
  border: 1px solid #d8dee9;
  border-left: 4px solid #2563eb;
  border-radius: 6px 10px 10px 6px;
  overflow: hidden;
  background: linear-gradient(180deg, #f8fbff 0%, #f3f7fd 100%);
}

.think-header {
  width: 100%;
  padding: 10px 12px;
  border: 0;
  background: rgba(37, 99, 235, 0.05);
  display: flex;
  justify-content: space-between;
  align-items: center;
  cursor: pointer;
  text-align: left;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 8px;
}

.icon {
  font-size: 10px;
  color: #64748b;
  transition: transform 0.2s ease;
}

.icon.is-collapsed {
  transform: rotate(90deg);
}

.title {
  font-size: 13px;
  font-weight: 700;
  color: #334155;
  letter-spacing: 0.02em;
}

.loading-dots {
  font-size: 11px;
  color: #2563eb;
  font-weight: 600;
}

.think-content {
  padding: 12px 16px;
  font-size: 14px;
  line-height: 1.65;
  color: #334155;
  white-space: pre-wrap;
  border-top: 1px solid rgba(148, 163, 184, 0.18);
}
</style>
