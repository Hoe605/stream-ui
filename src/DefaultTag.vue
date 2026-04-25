<template>
  <div class="stream-default-tag">
    <div class="tag-header">
      <span class="tag-icon">🧩</span>
      <span class="tag-name">{{ tagName.toUpperCase() }}</span>
      <span class="tag-label">未定义组件</span>
    </div>
    <div class="tag-content">
      <slot>{{ content }}</slot>
    </div>
  </div>
</template>

<script setup>
defineProps({
  tagName: {
    type: String,
    required: true
  },
  content: {
    type: String,
    default: ''
  }
});
</script>

<style scoped>
.stream-default-tag {
  border: 1px solid #ebeef5;
  border-radius: 8px;
  margin: 16px 0;
  overflow: hidden;
  background-color: #fafafa;
  transition: all 0.3s ease;
}

.stream-default-tag:hover {
  border-color: #dcdfe6;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.05);
}

.tag-header {
  background-color: #f5f7fa;
  padding: 6px 12px;
  border-bottom: 1px solid #ebeef5;
  display: flex;
  align-items: center;
  gap: 8px;
  user-select: none;
}

.tag-icon {
  font-size: 14px;
}

.tag-name {
  font-size: 11px;
  font-weight: 700;
  color: #606266;
  letter-spacing: 0.8px;
}

.tag-label {
  font-size: 10px;
  color: #909399;
  background-color: #ffffff;
  padding: 1px 6px;
  border-radius: 4px;
  border: 1px solid #e4e7ed;
  font-weight: normal;
}

.tag-content {
  padding: 12px 16px;
  color: #303133;
  line-height: 1.6;
  font-size: 14px;
  white-space: pre-wrap;
  word-break: break-all;
}
</style>
