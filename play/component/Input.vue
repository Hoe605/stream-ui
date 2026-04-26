<template>
  <div class="input-block-container" :class="{ 'is-streaming': !isClosed }">
    <div v-if="label" class="input-label">{{ label }}</div>
    
    <div class="input-field-wrapper">
      <div class="input-icon">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
        </svg>
      </div>
      
      <input
        v-model="inputValue"
        :type="type"
        :placeholder="placeholder || '请输入...'"
        class="premium-input"
        @input="onInputChange"
        :disabled="isFinished && !isInteractiveAfterFinish"
      />
      
      <div class="focus-border"></div>
    </div>

    <div class="input-footer" v-if="isClosed">
      <div class="status-badge" :class="{ 'has-data': inputValue }">
        <span class="dot"></span>
        {{ inputValue ? '已同步到 v-model:data' : '等待用户输入' }}
      </div>
      <div v-if="inputValue" class="current-value">
        Payload: <code>{{ JSON.stringify({ value: inputValue }) }}</code>
      </div>
    </div>
    
    <!-- 流式输出时的提示 -->
    <div v-else class="streaming-indicator">
      <span class="spinner"></span>
      组件加载中...
    </div>
  </div>
</template>

<script setup>
import { ref, watch, onMounted } from 'vue';

defineOptions({
  name: 'Input'
});

const props = defineProps({
  // 标签属性 (由 LLM 提供)
  label: {
    type: String,
    default: ''
  },
  placeholder: {
    type: String,
    default: ''
  },
  type: {
    type: String,
    default: 'text'
  },
  isInteractiveAfterFinish: {
    type: Boolean,
    default: true
  },

  // Stream UI 注入的属性
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
    default: false
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

const inputValue = ref('');

// 当 LLM 提供的 content 发生变化时（如果有的话）
watch(() => props.content, (newVal) => {
  // 如果用户还没开始输入，或者我们想同步 LLM 的预设值
  if (!inputValue.value && newVal) {
    inputValue.value = newVal.trim();
    syncData();
  }
});

// 同步数据到父组件的 v-model:data
const syncData = () => {
  if (props.reportData) {
    props.reportData({
      value: inputValue.value,
      lastUpdated: new Date().toISOString()
    });
  }
};

const onInputChange = () => {
  syncData();
};

onMounted(() => {
  if (inputValue.value) {
    syncData();
  }
});
</script>

<style scoped>
.input-block-container {
  margin: 16px 0;
  padding: 16px;
  background: rgba(255, 255, 255, 0.7);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(226, 232, 240, 0.8);
  border-radius: 12px;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  max-width: 400px;
}

.input-block-container:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
  border-color: #3b82f6;
}

.input-label {
  font-size: 14px;
  font-weight: 600;
  color: #1e293b;
  margin-bottom: 8px;
  display: flex;
  align-items: center;
}

.input-field-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}

.input-icon {
  position: absolute;
  left: 12px;
  color: #94a3b8;
  display: flex;
  align-items: center;
  pointer-events: none;
}

.premium-input {
  width: 100%;
  padding: 10px 12px 10px 38px;
  font-size: 14px;
  color: #334155;
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  outline: none;
  transition: all 0.2s ease;
}

.premium-input:focus {
  border-color: transparent;
}

.focus-border {
  position: absolute;
  inset: -1px;
  border: 2px solid #3b82f6;
  border-radius: 8px;
  opacity: 0;
  transform: scale(0.98);
  transition: all 0.2s ease;
  pointer-events: none;
}

.premium-input:focus + .focus-border {
  opacity: 1;
  transform: scale(1);
}

.input-footer {
  margin-top: 12px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.status-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: #64748b;
  background: #f1f5f9;
  padding: 4px 10px;
  border-radius: 20px;
  width: fit-content;
}

.status-badge.has-data {
  color: #059669;
  background: #ecfdf5;
}

.dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #cbd5e1;
}

.has-data .dot {
  background: #10b981;
  box-shadow: 0 0 0 2px rgba(16, 185, 129, 0.2);
  animation: pulse 2s infinite;
}

.current-value {
  font-size: 11px;
  color: #94a3b8;
}

.current-value code {
  background: #f8fafc;
  padding: 2px 4px;
  border-radius: 4px;
  color: #475569;
}

.streaming-indicator {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: #3b82f6;
}

.spinner {
  width: 14px;
  height: 14px;
  border: 2px solid rgba(59, 130, 246, 0.2);
  border-top-color: #3b82f6;
  border-radius: 50%;
  animation: rotate 0.8s linear infinite;
}

@keyframes rotate {
  to { transform: rotate(360deg); }
}

@keyframes pulse {
  0% { transform: scale(1); opacity: 1; }
  50% { transform: scale(1.5); opacity: 0.5; }
  100% { transform: scale(1); opacity: 1; }
}

/* 适配暗色模式 (可选) */
@media (prefers-color-scheme: dark) {
  .input-block-container {
    background: rgba(30, 41, 59, 0.7);
    border-color: rgba(51, 65, 85, 0.8);
  }
  .input-label { color: #f1f5f9; }
  .premium-input {
    background: #0f172a;
    border-color: #334155;
    color: #f1f5f9;
  }
}
</style>
