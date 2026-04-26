<script setup>
import { ref } from 'vue'
import Input from '../../.comm/Input.vue'
const text = ref("Hello! <think>I should be polite.</think> How can I help you today?")
</script>

# 什么是 Stream UI?

**Stream UI** 是一个专门为处理 LLM（大语言模型）流式输出而设计的渲染引擎。

在 AI 聊天应用中，模型通常会输出类似以下的流式文本：

<Input v-model="text" :rows="2" />

传统的 Markdown 渲染器往往只能全量渲染，或者难以处理标签内部的实时解析。Stream UI 允许你：

1. **拦截标签**：将 `<think>`、`<code>` 或任何你定义的标签动态拦截。
2. **渲染组件**：被拦截的部分会自动替换为你定义的 Vue 组件。
3. **实时更新**：随着文本流的进入，组件内部的内容会即时更新（例如打字机效果）。
4. **性能极致**：针对流式场景进行了高度优化，避免不必要的 DOM 重绘。

它是构建下一代 AI 交互界面（如 DeepSeek、ChatGPT 类似的思考过程流）的理想选择。
