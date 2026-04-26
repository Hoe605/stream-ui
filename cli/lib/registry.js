import { toKebabCase } from './path.js';

export const registry = {
  init: {
    files: [
      {
        source: 'generated:stream-contains',
        target: 'stream-contains.ts'
      }
    ]
  },
  components: {
    think: {
      description: 'Collapsible reasoning panel for <think> blocks.',
      files: [
        {
          source: 'src:think/Think.vue',
          target: 'think.vue'
        }
      ]
    },

    text: {
      description: 'Inline emphasis wrapper for <text> blocks.',
      files: [
        {
          source: 'src:text/Text.vue',
          target: 'text.vue'
        }
      ]
    }

  }
};

export function createCustomComponentEntry(componentName) {
  return {
    description: `Custom scaffold for <${toKebabCase(componentName)}> blocks.`,
    files: [
      {
        source: 'generated:custom-component',
        target: `${toKebabCase(componentName)}.vue`
      }
    ]
  };
}
