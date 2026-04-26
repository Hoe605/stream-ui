<script setup lang="ts">
import { ref } from 'vue'
import { typewriter } from './utils'

interface Props {
  modelValue: string
  placeholder?: string
  rows?: number
  showSimulate?: boolean
  simulateText?: string
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: '',
  placeholder: 'Type or paste stream text here...',
  rows: 3,
  showSimulate: true,
  simulateText: ''
})

const emit = defineEmits(['update:modelValue'])
const isPlaying = ref(false)

const onInput = (e: Event) => {
  const target = e.target as HTMLTextAreaElement
  emit('update:modelValue', target.value)
}

const playStream = async () => {
  const targetText = props.simulateText || props.modelValue || "这是一段默认的模拟流文本..."
  isPlaying.value = true
  emit('update:modelValue', '')
  await typewriter(targetText, (val) => {
    emit('update:modelValue', val)
  }, { speed: 20 })
  isPlaying.value = false
}
</script>

<template>
  <div class="s-input-wrapper">
    <textarea :value="modelValue" :placeholder="placeholder" :rows="rows" class="s-input" @input="onInput" />
    <button v-if="showSimulate" class="s-simulate-btn" :disabled="isPlaying" @click="playStream">
      {{ isPlaying ? '模拟中...' : '▶ 模拟流' }}
    </button>
    <div class="s-input-glow"></div>
  </div>
</template>

<style scoped>
.s-input-wrapper {
  position: relative;
  width: 100%;
  border-radius: 12px;
  background: var(--vp-c-bg-soft);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  border: 1px solid var(--vp-c-border);
  overflow: hidden;
}

.s-input-wrapper:focus-within {
  border-color: var(--vp-c-brand-1);
  box-shadow: 0 0 0 3px rgba(100, 108, 255, 0.1);
}

.s-input {
  width: 100%;
  padding: 12px 16px;
  padding-top: 36px;
  /* 为按钮留出空间 */
  background: transparent;
  border: none;
  color: var(--vp-c-text-1);
  font-family: var(--vp-font-family-mono);
  font-size: 14px;
  line-height: 1.6;
  resize: vertical;
  outline: none;
  display: block;
}

.s-simulate-btn {
  position: absolute;
  top: 8px;
  right: 8px;
  padding: 4px 10px;
  font-size: 11px;
  background: var(--vp-c-brand-soft);
  color: var(--vp-c-brand-1);
  border-radius: 6px;
  cursor: pointer;
  border: 1px solid transparent;
  font-weight: 600;
  transition: all 0.2s;
  z-index: 10;
}

.s-simulate-btn:hover:not(:disabled) {
  background: var(--vp-c-brand-1);
  color: white;
}

.s-simulate-btn:disabled {
  opacity: 0.6;
}

.s-input::placeholder {
  color: var(--vp-c-text-3);
  font-style: italic;
}

.s-input-glow {
  position: absolute;
  bottom: 0;
  left: 0;
  width: 0;
  height: 2px;
  background: linear-gradient(90deg, var(--vp-c-brand-3), var(--vp-c-brand-1));
  transition: width 0.4s ease;
}

.s-input-wrapper:focus-within .s-input-glow {
  width: 100%;
}

:deep(.dark) .s-input-wrapper {
  background: rgba(30, 30, 32, 0.5);
  backdrop-filter: blur(8px);
}
</style>
