import { defineConfig } from 'vitepress'
import path from 'path'
import { containerPreview, componentPreview } from '@vitepress-demo-preview/plugin'

export default defineConfig({
  title: "Stream UI",
  description: "一个轻量的 Vue 3 流式文本标签拦截渲染引擎",
  themeConfig: {
    logo: '/logo.png', // 如果有 logo 的话
    nav: [
      { text: '指南', link: '/guide/getting-started' },
      { text: '组件', link: '/components/think' },
      { text: 'GitHub', link: 'https://github.com/Hoe605/stream-ui' }
    ],

    sidebar: [
      {
        text: '介绍',
        items: [
          { text: '什么是 Stream UI?', link: '/guide/what-is-stream-ui/' },
          { text: '快速开始', link: '/guide/getting-started/' },
        ]
      },
      {
        text: '核心概念',
        items: [
          { text: '流式渲染', link: '/guide/stream-rendering/' },
          { text: '标签拦截', link: '/guide/tag-interception/' },
          // { text: 'v-model:data 深度指南', link: '/guide/v-model-data/' },
          { text: '结构化数据抽取', link: '/guide/structured-data/' },
        ]
      },
      {
        text: '内置组件',
        items: [
          { text: 'Think (思考过程)', link: '/components/think' },
        ]
      }
    ],

    socialLinks: [
      { icon: 'github', link: 'https://github.com/Hoe605/stream-ui' }
    ],

    footer: {
      message: 'Released under the MIT License.',
      copyright: 'Copyright © 2026-present Hoe605'
    }
  },

  markdown: {
    config: (md) => {
      md.use(containerPreview)
      md.use(componentPreview)
    }
  },

  vite: {
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '../../src'),
        'stream-ui': path.resolve(__dirname, '../../src/index.ts')
      }
    }
  }
})
