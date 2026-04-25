import type { Component, PropType } from 'vue';

export type RenderMode = 'fast' | 'accurate';

export interface StreamContainsProps {
    modelValue: string;
    mode: RenderMode;
}

export interface StackNode {
    tagName: string;
    children: (StackNode | string)[];
}

export type ComponentMap = Record<string, Component>;

/**
 * 集中管理 Props 定义
 */
export const streamContainsProps = {
    modelValue: {
        type: String,
        default: ''
    },
    mode: {
        type: String as PropType<RenderMode>,
        default: 'fast'
    }
};
