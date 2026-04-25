<template>
  <div class="enhanced-text">
    <div class="text-inner">
      <slot>{{ content }}</slot>
    </div>
  </div>
</template>

<script setup>
defineOptions({
  name: 'Text'
});

defineProps({
  content: {
    type: String,
    default: ''
  },
  isClosed: {
    type: Boolean,
    default: true
  }
});
</script>

<style scoped>
.enhanced-text {
  display: inline;
  background: linear-gradient(120deg, rgba(59, 130, 246, 0.08) 0%, rgba(147, 51, 234, 0.08) 100%);
  border-bottom: 2px solid rgba(59, 130, 246, 0.3);
  border-radius: 2px;
  padding: 0 2px;
  margin: 0 1px;
  color: #0f172a;
  font-weight: 600;
}

.text-inner {
  display: inline;
}
</style>
