import type { Component } from 'vue';

export type RenderMode = 'fast' | 'accurate';
export type StreamBlockCategory = 'component' | 'fallback' | 'text';

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
    baseComponent?: Component | null;
}

export interface StackNode {
    tagName: string;
    children: (StackNode | string)[];
    isClosed?: boolean;
}

export type ComponentMap = Record<string, Component>;

export interface StreamBlockBaseProps {
    block: StreamBlockData;
    tagName: string;
    content: string;
    isClosed: boolean;
    reportData: StreamBlockReporter;
}

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
