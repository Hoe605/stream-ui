<template>
  <div>
    <Input v-model="text" :simulate-text="exampleText" />

    <hr>

    <div>
      <StreamContains :model-value="text">
        <Think />
      </StreamContains>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { StreamContains, Think } from 'stream-ui'
import Input from '../../.comm/Input.vue'

const exampleText = '你好！让我想想...<think>我会用最专业的态度回答这个问题。正在检索相关资料...okokokokokokokokok\nokokokokoko</think> 很高兴为您服务。'
const text = ref(exampleText)
</script>
