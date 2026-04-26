<template>
  <div class="think-container">
    <div class="think-header" @click="isExpanded = !isExpanded">
      <div class="header-left">
        <span class="icon" :class="{ 'is-collapsed': !isExpanded }">▶</span>
        <span class="title">思维链 (Chain of Thought)</span>
      </div>
      <div class="header-right">
        <span v-if="!isFinished" class="loading-dots">思考中...</span>
      </div>
    </div>
    <div v-show="isExpanded" class="think-content">
      <slot>{{ content }}</slot>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';

defineOptions({
  name: 'Think'
});

defineProps({
  content: {
    type: String,
    default: ''
  },
  block: {
    type: Object,
    default: null
  },
  isClosed: {
    type: Boolean,
    default: true
  },
  reportData: {
    type: Function,
    default: null
  },
  isFinished: {
    type: Boolean,
    default: false
  }
});

const isExpanded = ref(true);
</script>

<style scoped>
.think-container {
  margin: 12px 0;
  border: 1px solid #e2e8f0;
  border-left: 4px solid #3b82f6;
  border-radius: 4px 8px 8px 4px;
  overflow: hidden;
  background-color: #f8fafc;
}

.think-header {
  padding: 8px 12px;
  background-color: #f1f5f9;
  display: flex;
  justify-content: space-between;
  align-items: center;
  cursor: pointer;
  user-select: none;
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
  font-weight: 600;
  color: #475569;
}

.loading-dots {
  font-size: 11px;
  color: #3b82f6;
  font-weight: 500;
}

.think-content {
  padding: 12px 16px;
  font-size: 14px;
  line-height: 1.6;
  color: #334155;
  white-space: pre-wrap;
  border-top: 1px solid #e2e8f0;
}
</style>
