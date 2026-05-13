import { defineConfig } from 'vitepress'
import path from 'path'
import { containerPreview, componentPreview } from '@vitepress-demo-preview/plugin'

export default defineConfig({
  title: "Stream UI",
  description: "一个轻量的 Vue 3 流式文本标签拦截渲染引擎",
  themeConfig: {
    logo: '/logo.png', // 如果有 logo 的话
    nav: [
      { text: '指南', link: '/introduction/getting-started/' },
      { text: '组件', link: '/components/stream-contains/' },
      { text: 'GitHub', link: 'https://github.com/Hoe605/stream-ui' }
    ],

    sidebar: [
      {
        text: '介绍',
        items: [
          { text: '什么是 Stream UI?', link: '/introduction/what-is-stream-ui/' },
          { text: '快速开始', link: '/introduction/getting-started/' },
        ]
      },
      {
        text: '核心概念',
        items: [
          { text: '流式渲染', link: '/concepts/stream-rendering/' },
          { text: '标签拦截', link: '/concepts/tag-interception/' },
          { text: '结构化数据抽取', link: '/concepts/structured-data/' },
          { text: '公共 Base 组件扩展', link: '/concepts/base-component/' },
        ]
      },
      {
        text: '内置组件',
        items: [
          { text: 'StreamContains (核心容器)', link: '/components/stream-contains/' },
          { text: 'Think (思考过程效果)', link: '/components/think/' },
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
