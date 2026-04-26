<template>
  <div class="demo-container">
    <div class="demo-section">
      <div class="demo-label">输入流 (Interactive Stream Input)</div>
      <Input v-model="textStream" :rows="3" />
    </div>

    <div class="demo-section">
      <div class="demo-label">渲染结果 (Rendered Result)</div>
      <div class="demo-box rendered-box">
        <StreamContains :model-value="textStream" mode="accurate">
          <DocsThink />
        </StreamContains>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { StreamContains } from 'stream-ui'
import DocsThink from '../../components/DocsThink.vue'
import Input from '../../.comm/Input.vue'

const textStream = ref("Hello! <think>I am thinking about how to explain this...</think> How can I help you today?")
</script>

<style scoped>
.demo-container {
  display: flex;
  flex-direction: column;
  gap: 20px;
  padding: 16px;
  background: var(--vp-c-bg-soft);
  border-radius: 12px;
  border: 1px solid var(--vp-c-border);
}

.demo-section {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.demo-label {
  font-size: 12px;
  font-weight: 600;
  color: var(--vp-c-text-2);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.demo-box {
  padding: 12px 16px;
  background: var(--vp-c-bg);
  border-radius: 8px;
  border: 1px solid var(--vp-c-border);
  min-height: 48px;
  display: flex;
  align-items: center;
}

.rendered-box {
  border-left: 4px solid var(--vp-c-brand);
}
</style>
