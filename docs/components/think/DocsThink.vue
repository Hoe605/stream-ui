<template>
  <div class="think-wrapper" :class="{ 'is-searching': !isClosed }">
    <button class="think-header" type="button" @click="isExpanded = !isExpanded">
      <div class="header-main">
        <span class="arrow-icon" :class="{ 'is-active': isExpanded }">▶</span>
        <span class="title">Thinking Process</span>
      </div>
      <div class="status-indicator">
        <span v-if="!isClosed" class="pulse-dot"></span>
        <span class="status-text">{{ isClosed ? 'Completed' : 'Thinking...' }}</span>
      </div>
    </button>

    <div v-show="isExpanded" class="think-body">
      <div class="content-inner">
        <slot>{{ content }}</slot>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

defineOptions({ name: 'Think' })

defineProps<{
  content?: string
  isClosed?: boolean
}>()

const isExpanded = ref(true)
</script>

<style scoped>
.think-wrapper {
  margin: 16px 0;
  border-radius: 12px;
  border: 1px solid var(--vp-c-border);
  background: var(--vp-c-bg-soft);
  overflow: hidden;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

/* 思考中状态的特殊样式 */
.is-searching {
  border-color: var(--vp-c-brand-soft);
  box-shadow: 0 4px 12px rgba(100, 108, 255, 0.05);
}

.think-header {
  width: 100%;
  padding: 10px 16px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: transparent;
  cursor: pointer;
  border: none;
}

.think-header:hover {
  background: rgba(128, 128, 128, 0.05);
}

.header-main {
  display: flex;
  align-items: center;
  gap: 10px;
}

.arrow-icon {
  display: inline-block;
  font-size: 10px;
  color: var(--vp-c-text-3);
  transition: transform 0.2s ease;
}

.arrow-icon.is-active {
  transform: rotate(90deg);
}

.title {
  font-size: 13px;
  font-weight: 600;
  color: var(--vp-c-text-2);
  letter-spacing: 0.3px;
}

.status-indicator {
  display: flex;
  align-items: center;
  gap: 8px;
}

.status-text {
  font-size: 11px;
  color: var(--vp-c-text-3);
  font-weight: 500;
}

.pulse-dot {
  width: 6px;
  height: 6px;
  background-color: var(--vp-c-brand-1);
  border-radius: 50%;
  animation: pulse 1.5s infinite;
}

@keyframes pulse {
  0% {
    transform: scale(0.9);
    opacity: 0.8;
  }

  50% {
    transform: scale(1.3);
    opacity: 0.4;
  }

  100% {
    transform: scale(0.9);
    opacity: 0.8;
  }
}

.think-body {
  border-top: 1px solid var(--vp-c-border);
  background: var(--vp-c-bg);
}

.content-inner {
  padding: 14px 18px;
  font-size: 14px;
  line-height: 1.7;
  color: var(--vp-c-text-1);
  white-space: pre-wrap;
}
</style>
