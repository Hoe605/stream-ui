import { h, defineComponent, type PropType } from 'vue'
import type { StreamBlockData } from '../../types'

export const Think = defineComponent({
  name: 'Think',
  props: {
    /** 标签内部的原始内容 */
    content: {
      type: String,
      default: ''
    },
    /** 当前标签是否已经闭合 */
    isClosed: {
      type: Boolean,
      default: false
    },
    /** 完整的区块数据对象 */
    block: {
      type: Object as PropType<StreamBlockData>,
      required: true
    }
  },
  setup(props, { slots }) {
    return () => {
      // 保持最精简的 HTML 结构，仅作为容器存在
      // 使用 data-closed 方便用户通过 CSS 钩子定制 思考中/思考完成 的样式
      return h('div', {
        class: 's-think',
        'data-closed': props.isClosed
      }, [
        // 优先渲染插槽内容（Vue 习惯），兜底渲染 content 字符串
        slots.default ? slots.default() : props.content
      ])
    }
  }
})

export default Think
