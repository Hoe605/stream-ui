<template>
  <span class="enhanced-text">
    <slot>{{ content }}</slot>
  </span>
</template>

<script setup lang="ts">
defineOptions({
  name: 'Text'
})

defineProps<{
  block?: {
    id: string
    tagName: string
    content: string
    isClosed: boolean
    category: 'component' | 'fallback'
    payload?: unknown
  }
  content?: string
  isClosed?: boolean
  reportData?: (payload: unknown) => void
}>()
</script>

<style scoped>
.enhanced-text {
  display: inline;
  background: linear-gradient(120deg, rgba(14, 165, 233, 0.08) 0%, rgba(37, 99, 235, 0.12) 100%);
  border-bottom: 2px solid rgba(37, 99, 235, 0.26);
  border-radius: 2px;
  padding: 0 2px;
  margin: 0 1px;
  color: #0f172a;
  font-weight: 600;
}
</style>
