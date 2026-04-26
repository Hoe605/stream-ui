<template>
  <div class="morandi-container">
    <div class="layout">
      <div class="main-panel">
        <h1 class="title">Hui-Online Stream UI</h1>
        <p class="subtitle">结构化数据抽取与交互演示 (Structured Data Extraction)</p>
        
        <div class="stream-box">
          <StreamContains 
            v-model:data="extractedData" 
            :modelValue="streamingText" 
            mode="accurate"
          >
            <Think />
            <Text />
            <Input />
          </StreamContains>
        </div>
      </div>
      
      <div class="side-panel">
        <div class="panel-header">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="16 18 22 12 16 6"></polyline>
            <polyline points="8 6 2 12 8 18"></polyline>
          </svg>
          <h3>实时结构化数据</h3>
        </div>
        
        <div class="data-preview">
          <div v-for="block in extractedData" :key="block.id" class="data-block">
            <div class="block-meta">
              <span class="block-tag">{{ block.tagName }}</span>
              <span class="block-category" :class="block.category">{{ block.category }}</span>
              <span class="block-status" :class="{ 'is-closed': block.isClosed }">
                {{ block.isClosed ? '已闭合' : '解析中...' }}
              </span>
            </div>
            <div class="block-payload" v-if="block.payload">
              <div class="payload-title">Payload (交互回传):</div>
              <pre>{{ JSON.stringify(block.payload, null, 2) }}</pre>
            </div>
          </div>
          
          <div v-if="extractedData.length === 0" class="empty-state">
            等待数据解析...
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { StreamContains, Think } from '@/index';
import { mockFetchStream } from './test/out';
import Text from './component/Text.vue';
import Input from './component/Input.vue';
import { inputMessage } from './component/testText';

const streamingText = ref('');
const extractedData = ref([]);

onMounted(async () => {
  // 使用包含 input 标签的测试文本
  const stream = await mockFetchStream(inputMessage, 40);
  const reader = stream.getReader();
  const decoder = new TextDecoder();

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    streamingText.value += decoder.decode(value, { stream: true });
  }
});
</script>

<style>
body {
  margin: 0;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  background-color: #f0f2f5;
}

.morandi-container {
  min-height: 100vh;
}

.layout {
  display: flex;
  gap: 32px;
  max-width: 1300px;
  margin: 0 auto;
  padding: 40px 20px;
}

.main-panel {
  flex: 1;
  min-width: 0;
}

.title {
  font-size: 28px;
  font-weight: 800;
  color: #1e293b;
  margin-bottom: 8px;
  background: linear-gradient(135deg, #1e293b 0%, #3b82f6 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.subtitle {
  font-size: 14px;
  color: #64748b;
  margin-bottom: 32px;
}

.stream-box {
  background: white;
  border-radius: 16px;
  padding: 24px;
  box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.05);
  border: 1px solid #e2e8f0;
  line-height: 1.6;
}

.side-panel {
  width: 420px;
  background: #ffffff;
  border-radius: 16px;
  display: flex;
  flex-direction: column;
  border: 1px solid #e2e8f0;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.03);
  height: calc(100vh - 80px);
  position: sticky;
  top: 40px;
}

.panel-header {
  padding: 20px;
  border-bottom: 1px solid #f1f5f9;
  display: flex;
  align-items: center;
  gap: 10px;
}

.panel-header h3 {
  margin: 0;
  font-size: 16px;
  color: #334155;
}

.data-preview {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.data-block {
  background: #f8fafc;
  border-radius: 10px;
  padding: 12px;
  border: 1px solid #f1f5f9;
}

.block-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
  flex-wrap: wrap;
}

.block-tag {
  font-family: monospace;
  font-weight: 700;
  color: #3b82f6;
  background: #eff6ff;
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 12px;
}

.block-category {
  font-size: 10px;
  text-transform: uppercase;
  padding: 2px 5px;
  border-radius: 10px;
  font-weight: 600;
}

.block-category.component { color: #8b5cf6; background: #f5f3ff; }
.block-category.fallback { color: #6b7280; background: #f3f4f6; }

.block-status {
  font-size: 11px;
  color: #94a3b8;
}

.block-status.is-closed {
  color: #10b981;
}

.block-payload {
  margin-top: 8px;
  padding: 8px;
  background: #ffffff;
  border-radius: 6px;
  border: 1px solid #e2e8f0;
}

.payload-title {
  font-size: 11px;
  font-weight: 600;
  color: #64748b;
  margin-bottom: 4px;
}

pre {
  margin: 0;
  font-size: 11px;
  color: #0f172a;
  white-space: pre-wrap;
  word-break: break-all;
}

.empty-state {
  text-align: center;
  color: #94a3b8;
  padding: 40px 0;
  font-size: 14px;
}
</style>