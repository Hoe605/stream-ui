<template>
  <div style="padding: 20px;">
    <StreamContains v-model="message" />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { StreamContains } from '../src/index.ts'
import { mockFetchStream } from './test/out'

const message = ref('')

onMounted(async () => {
  const stream = await mockFetchStream('Hello! <think>I am thinking about this minimalist demo...</think> \n\nStream UI is ready.', 50)
  const reader = stream.getReader()
  const decoder = new TextDecoder()

  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    message.value += decoder.decode(value)
  }
})
</script>
