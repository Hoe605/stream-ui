import type { Component } from 'vue';

export type RenderMode = 'fast' | 'accurate';
export type StreamBlockCategory = 'component' | 'fallback';

export interface StreamBlockData {
    id: string;
    tagName: string;
    content: string;
    isClosed: boolean;
    category: StreamBlockCategory;
    payload?: unknown;
}

export type StreamBlockReporter = (payload: unknown) => void;

export interface StreamContainsProps {
    modelValue: string;
    mode: RenderMode;
    data?: StreamBlockData[];
}

export interface StackNode {
    tagName: string;
    children: (StackNode | string)[];
    isClosed?: boolean;
}

export type ComponentMap = Record<string, Component>;

export interface StreamContainsRenderOptions {
    DefaultTag: Component;
    emit?: (event: 'update:data', value: StreamBlockData[]) => void;
    emptyClassName?: string;
    fastContainerClassName?: string;
    accurateContainerClassName?: string;
    getUndefinedTagWarning?: (tagName: string) => string;
    getCrossedTagWarning?: (tagName: string, closedTags: string[]) => string;
    getIsolatedClosingTagWarning?: (tagName: string) => string;
    getParserWarningsTitle?: (count: number) => string;
}
