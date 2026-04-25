<template>
  <div class="morandi-container">
    <h1>Hui-Online Stream UI</h1>
    <StreamContains :modelValue="streamingText" mode="accurate">
      <Think />
      <Text />
    </StreamContains>
  </div>


</template>

<script setup>
import { ref, onMounted } from 'vue';
import { StreamContains } from '@/index'; // 直接从 src 引入源码
import { mockFetchStream } from './test/out';
import Think from './component/Think.vue';
import Text from './component/Text.vue';
import { chaosMessage } from './component/testText';


const streamingText = ref('');

onMounted(async () => {
  const stream = await mockFetchStream(chaosMessage, 20);
  const reader = stream.getReader();
  const decoder = new TextDecoder();

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    streamingText.value += decoder.decode(value, { stream: true });
  }
});


</script>