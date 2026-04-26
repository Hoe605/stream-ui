import DefaultTheme from 'vitepress/theme'
import { ElementPlusContainer } from '@vitepress-demo-preview/component'
import '@vitepress-demo-preview/component/dist/style.css'
import './custom.css'
import { h, defineComponent } from 'vue'

export default {
  ...DefaultTheme,
  enhanceApp({ app }) {
    // 包装一个 Shim 组件来吸收多余的 props，防止 Vue 报警
    const ShimComponent = defineComponent({
      // 声明接收这些“多余”的属性，这样 Vue 就不会尝试把它们挂载到根节点上
      props: ['suffixName', 'absolutePath', 'relativePath'],
      setup(props, { attrs, slots }) {
        // 关键：这里只传 attrs，不传 props。
        // 因为 suffixName/absolutePath/relativePath 已经被 props 接收了，
        // 这样它们就不会出现在 attrs 里，也就不会被传给内部组件导致再次报警。
        return () => h(ElementPlusContainer, attrs, slots)
      }
    })

    app.component('demo-preview', ShimComponent)
    app.component('ElementPlus', ShimComponent)
  }
}
