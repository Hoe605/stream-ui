<template>
  <div>
    <Input v-model="textStream" :rows="3" />
    <hr>
    <StreamContains :model-value="textStream" mode="accurate">
      <Think />
    </StreamContains>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import Input from '../../.comm/Input.vue'
import { StreamContains, Think } from 'stream-ui'

const textStream = ref("Hello! <think>I am thinking about how to explain this...</think> How can I help you today?")
</script>
