<template>
  <span class="s-text" :data-closed="isClosed">
    <slot>{{ content }}</slot>
  </span>
</template>

<script setup lang="ts">
import type { StreamBlockData } from '../../types'

defineOptions({
  name: 'Text'
})

defineProps<{
  attrs?: Record<string, string | boolean>
  content?: string
  isClosed?: boolean
  block?: StreamBlockData
}>()
</script>

<style>
.s-text {
  display: inline;
}
</style>
