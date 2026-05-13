import { Fragment, h, isVNode, type Component, type PropType, type Slots, type VNode } from 'vue';

import type {
    ComponentMap,
    RenderMode,
    StackNode,
    StreamBlockCategory,
    StreamBlockData,
    StreamBlockReporter,
    StreamContainsProps,
    StreamContainsRenderOptions
} from '../types';

export const streamContainsProps = {
    modelValue: {
        type: String,
        default: ''
    },
    mode: {
        type: String as PropType<RenderMode>,
        default: 'accurate'
    },
    data: {
        type: Array as PropType<StreamBlockData[]>,
        default: () => []
    }
};

export const TEXT_NODE_STYLE = { whiteSpace: 'pre-wrap' } as const;
export const TAG_NAME_PATTERN = '[A-Za-z][\\w-]*';
export const FAST_MODE_TAG_REGEX = new RegExp(
    `<(${TAG_NAME_PATTERN})(?:\\s+[^>]*)?(?:(\\/>)|(?=>)>([\\s\\S]*?)(?:<\\/\\1>|$))`,
    'gi'
);
export const ACCURATE_MODE_TAG_REGEX = new RegExp(`</?(${TAG_NAME_PATTERN})(?:\\s+[^>]*)?>`, 'g');

export const normalizeTagName = (value: string) => value.toLowerCase();

export const toKebabCase = (value: string) =>
    value
        .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
        .replace(/_/g, '-')
        .toLowerCase();

export const buildComponentMap = (defaultSlots: unknown[]): ComponentMap => {
    const componentMap: ComponentMap = {};

    const registerComponent = (name: string, component: Component) => {
        const normalizedName = normalizeTagName(name);
        componentMap[normalizedName] = component;
        componentMap[toKebabCase(name)] = component;
    };

    const flatten = (nodes: unknown[]) => {
        nodes.forEach(node => {
            if (Array.isArray(node)) {
                flatten(node);
                return;
            }

            if (!isVNode(node)) return;

            if (node.type === Fragment && Array.isArray(node.children)) {
                flatten(node.children);
                return;
            }

            if (typeof node.type === 'string') return;

            const componentType = node.type as Record<string, unknown>;
            const name = typeof componentType?.name === 'string'
                ? componentType.name
                : typeof componentType?.__name === 'string'
                    ? componentType.__name
                    : '';

            if (name) registerComponent(name, node.type as Component);

            if (Array.isArray(node.children)) {
                flatten(node.children);
            }
        });
    };

    flatten(defaultSlots);
    return componentMap;
};

export const parseAccurateStream = (
    rawText: string,
    options: {
        getCrossedTagWarning: (tagName: string, closedTags: string[]) => string;
        getIsolatedClosingTagWarning: (tagName: string) => string;
        warnedParserMessages: Set<string>;
    }
) => {
    const root: StackNode = { tagName: 'root', children: [], isClosed: true };
    const stack: StackNode[] = [root];
    const currentWarnings: string[] = [];
    let lastIndex = 0;
    let match: RegExpExecArray | null;

    ACCURATE_MODE_TAG_REGEX.lastIndex = 0;
    while ((match = ACCURATE_MODE_TAG_REGEX.exec(rawText)) !== null) {
        const fullMatch = match[0];
        const isClose = fullMatch.startsWith('</');
        const tagName = normalizeTagName(match[1]);

        if (match.index > lastIndex) {
            stack[stack.length - 1].children.push(rawText.slice(lastIndex, match.index));
        }
        lastIndex = ACCURATE_MODE_TAG_REGEX.lastIndex;

        if (!isClose) {
            const isSelfClosing = fullMatch.endsWith('/>') || fullMatch.endsWith('/ >');
            const newNode: StackNode = { tagName, children: [], isClosed: isSelfClosing };
            stack[stack.length - 1].children.push(newNode);
            if (!isSelfClosing) {
                stack.push(newNode);
            }
        } else {
            let stackIndex = -1;
            for (let i = stack.length - 1; i > 0; i--) {
                if (stack[i].tagName === tagName) {
                    stackIndex = i;
                    break;
                }
            }

            if (stackIndex > 0) {
                stack[stackIndex].isClosed = true;
                if (stack.length - 1 > stackIndex) {
                    const closedTags = stack.slice(stackIndex + 1).map(node => node.tagName);
                    const msg = options.getCrossedTagWarning(tagName, closedTags);
                    if (!options.warnedParserMessages.has(msg)) {
                        currentWarnings.push(msg);
                        options.warnedParserMessages.add(msg);
                    }
                }
                while (stack.length > stackIndex) stack.pop();
            } else {
                const msg = options.getIsolatedClosingTagWarning(tagName);
                if (!options.warnedParserMessages.has(msg)) {
                    currentWarnings.push(msg);
                    options.warnedParserMessages.add(msg);
                }
            }
        }
    }

    if (lastIndex < rawText.length) {
        stack[stack.length - 1].children.push(rawText.slice(lastIndex));
    }

    return { root, currentWarnings };
};

type ResolvedRenderOptions = {
    emptyClassName: string;
    fastContainerClassName: string;
    accurateContainerClassName: string;
    getUndefinedTagWarning: (tagName: string) => string;
    getCrossedTagWarning: (tagName: string, closedTags: string[]) => string;
    getIsolatedClosingTagWarning: (tagName: string) => string;
    getParserWarningsTitle: (count: number) => string;
    DefaultTag: StreamContainsRenderOptions['DefaultTag'];
    emit?: StreamContainsRenderOptions['emit'];
};

// Normalize options once to keep render functions focused.
const resolveRenderOptions = (options: StreamContainsRenderOptions): ResolvedRenderOptions => ({
    emptyClassName: options.emptyClassName ?? 'stream-content',
    fastContainerClassName: options.fastContainerClassName ?? 'stream-ui-container mode-fast',
    accurateContainerClassName: options.accurateContainerClassName ?? 'stream-ui-container mode-accurate',
    getUndefinedTagWarning: options.getUndefinedTagWarning
        ?? ((tagName: string) => `[Stream-UI] 检测到未定义的标签 <${tagName}>，使用默认样式。`),
    getCrossedTagWarning: options.getCrossedTagWarning
        ?? ((tagName: string, closedTags: string[]) =>
            `[Stream-UI] 检测到标签交错：由于 </${tagName}> 闭合，强制闭合了内部未匹配的标签：<${closedTags.join('>, <')}>`),
    getIsolatedClosingTagWarning: options.getIsolatedClosingTagWarning
        ?? ((tagName: string) => `[Stream-UI] 检测到孤立的闭合标签 </${tagName}>，已自动过滤。`),
    getParserWarningsTitle: options.getParserWarningsTitle
        ?? ((count: number) => `[Stream-UI] Accurate Mode Parser Warnings (${count})`),
    DefaultTag: options.DefaultTag,
    emit: options.emit
});

// Seed payloads from external data to keep block updates stable across renders.
const initBlockPayloadMap = (data?: StreamBlockData[]) => {
    const blockPayloadMap = new Map<string, unknown>();

    data?.forEach(block => {
        if (typeof block?.id === 'string' && 'payload' in block) {
            blockPayloadMap.set(block.id, block.payload);
        }
    });

    return blockPayloadMap;
};

// Maintain latest blocks and debounce emit to avoid duplicate updates.
const createBlockStore = (
    blockPayloadMap: Map<string, unknown>,
    emit?: StreamContainsRenderOptions['emit']
) => {
    let latestBlocks: StreamBlockData[] = [];
    let lastEmittedBlocks: StreamBlockData[] = [];
    let scheduledBlocks: StreamBlockData[] | null = null;
    let isEmitScheduled = false;

    const areBlocksEqual = (left: StreamBlockData[], right: StreamBlockData[]) =>
        left.length === right.length
        && left.every((block, index) => {
            const other = right[index];
            return block.id === other?.id
                && block.tagName === other?.tagName
                && block.content === other?.content
                && block.isClosed === other?.isClosed
                && block.category === other?.category
                && block.payload === other?.payload;
        });

    const emitBlocks = (blocks: StreamBlockData[]) => {
        if (!emit) return;
        if (areBlocksEqual(blocks, lastEmittedBlocks)) return;
        scheduledBlocks = blocks;
        if (isEmitScheduled) return;

        isEmitScheduled = true;
        queueMicrotask(() => {
            isEmitScheduled = false;
            if (!scheduledBlocks) return;
            lastEmittedBlocks = scheduledBlocks;
            emit('update:data', scheduledBlocks);
        });
    };

    const setLatestBlocks = (blocks: StreamBlockData[]) => {
        latestBlocks = blocks;
        emitBlocks(blocks);
    };

    const updateBlockPayload = (id: string, payload: unknown) => {
        blockPayloadMap.set(id, payload);
        latestBlocks = latestBlocks.map(block => (
            block.id === id
                ? { ...block, payload }
                : block
        ));
        emitBlocks(latestBlocks);
    };

    return {
        setLatestBlocks,
        updateBlockPayload,
        getPayload: (id: string) => blockPayloadMap.get(id)
    };
};

// Create a renderer that resolves component/fallback and wires block reporting.
const createTagRenderer = (
    options: ResolvedRenderOptions,
    warnedUndefinedTags: Set<string>,
    componentMap: ComponentMap,
    getPayload: (id: string) => unknown,
    updateBlockPayload: (id: string, payload: unknown) => void
) => (
    tagName: string,
    content: string,
    isClosed: boolean,
    index: string | number,
    childrenVNodes?: (VNode | string)[]
) => {
        const normalizedTagName = normalizeTagName(tagName);
        const Component = componentMap[normalizedTagName];
        const category: StreamBlockCategory = Component ? 'component' : 'fallback';
        const block: StreamBlockData = {
            id: String(index),
            tagName: normalizedTagName,
            content,
            isClosed,
            category,
            payload: getPayload(String(index))
        };
        const reportData: StreamBlockReporter = (payload) => updateBlockPayload(block.id, payload);
        const slotData = childrenVNodes ? { default: () => childrenVNodes } : { default: () => content };

        if (Component) {
            return h(Component, { block, content, isClosed, reportData, key: index }, slotData);
        }

        if (!warnedUndefinedTags.has(normalizedTagName)) {
            console.warn(options.getUndefinedTagWarning(normalizedTagName));
            warnedUndefinedTags.add(normalizedTagName);
        }

        return h(options.DefaultTag, { block, tagName: normalizedTagName, content, isClosed, reportData, key: index }, slotData);
    };

export const createStreamContainsRender = (
    props: StreamContainsProps,
    slots: Slots,
    options: StreamContainsRenderOptions
) => {
    // Shared state for warnings and block synchronization.
    const resolvedOptions = resolveRenderOptions(options);
    const warnedUndefinedTags = new Set<string>();
    const warnedParserMessages = new Set<string>();
    const blockPayloadMap = initBlockPayloadMap(props.data);
    const blockStore = createBlockStore(blockPayloadMap, resolvedOptions.emit);

    const renderFastMode = (rawText: string, componentMap: ComponentMap) => {
        const nodes: (VNode | string)[] = [];
        const blocks: StreamBlockData[] = [];
        let lastIndex = 0;
        let match: RegExpExecArray | null;
        const renderTagNode = createTagRenderer(
            resolvedOptions,
            warnedUndefinedTags,
            componentMap,
            blockStore.getPayload,
            blockStore.updateBlockPayload
        );

        FAST_MODE_TAG_REGEX.lastIndex = 0;
        while ((match = FAST_MODE_TAG_REGEX.exec(rawText)) !== null) {
            if (match.index > lastIndex) {
                nodes.push(h('span', { style: TEXT_NODE_STYLE }, rawText.slice(lastIndex, match.index)));
            }
            const isSelfClosing = typeof match[2] === 'string' && match[2].startsWith('/>');
            const isClosed = isSelfClosing || match[0].toLowerCase().endsWith(`</${match[1].toLowerCase()}>`);
            const blockId = `fast-${match.index}`;
            const normalizedTagName = normalizeTagName(match[1]);
            const content = match[3] || '';
            blocks.push({
                id: blockId,
                tagName: normalizedTagName,
                content,
                isClosed,
                category: componentMap[normalizedTagName] ? 'component' : 'fallback',
                payload: blockStore.getPayload(blockId)
            });
            nodes.push(renderTagNode(match[1], content, isClosed, blockId));
            lastIndex = FAST_MODE_TAG_REGEX.lastIndex;
        }

        if (lastIndex < rawText.length) {
            nodes.push(h('span', { style: TEXT_NODE_STYLE }, rawText.slice(lastIndex)));
        }

        blockStore.setLatestBlocks(blocks);
        return h('div', { class: resolvedOptions.fastContainerClassName }, nodes);
    };

    const renderAccurateMode = (rawText: string, componentMap: ComponentMap) => {
        const { root, currentWarnings } = parseAccurateStream(rawText, {
            getCrossedTagWarning: resolvedOptions.getCrossedTagWarning,
            getIsolatedClosingTagWarning: resolvedOptions.getIsolatedClosingTagWarning,
            warnedParserMessages
        });

        if (currentWarnings.length > 0) {
            console.groupCollapsed(resolvedOptions.getParserWarningsTitle(currentWarnings.length));
            currentWarnings.forEach(msg => console.warn(msg));
            console.groupEnd();
        }


        let nodeCounter = 0;
        const reconstructRawHTML = (node: StackNode | string): string => {
            if (typeof node === 'string') return node;
            return `<${node.tagName}>${node.children.map(reconstructRawHTML).join('')}</${node.tagName}>`;
        };

        const blocks: StreamBlockData[] = [];
        const renderTagNode = createTagRenderer(
            resolvedOptions,
            warnedUndefinedTags,
            componentMap,
            blockStore.getPayload,
            blockStore.updateBlockPayload
        );
        const buildVNodes = (node: StackNode | string): VNode | string => {
            if (typeof node === 'string') {
                return h('span', { style: TEXT_NODE_STYLE }, node);
            }

            const childrenNodes = node.children.map(buildVNodes);
            if (node.tagName === 'root') {
                return h('div', { class: resolvedOptions.accurateContainerClassName }, childrenNodes);
            }

            nodeCounter++;
            const blockId = `acc-${nodeCounter}`;
            const normalizedTagName = normalizeTagName(node.tagName);
            blocks.push({
                id: blockId,
                tagName: normalizedTagName,
                content: node.children.map(reconstructRawHTML).join(''),
                isClosed: node.isClosed ?? false,
                category: componentMap[normalizedTagName] ? 'component' : 'fallback',
                payload: blockStore.getPayload(blockId)
            });
            return renderTagNode(
                node.tagName,
                node.children.map(reconstructRawHTML).join(''),
                node.isClosed ?? false,
                blockId,
                childrenNodes
            );
        };

        const vnode = buildVNodes(root) as VNode;
        blockStore.setLatestBlocks(blocks);
        return vnode;
    };

    return () => {
        const rawText = props.modelValue;
        const defaultSlots = slots.default ? slots.default() : [];
        const componentMap = buildComponentMap(defaultSlots);

        if (Object.keys(componentMap).length === 0 && !rawText) {
            return h('div', { class: resolvedOptions.emptyClassName }, '');
        }

        return props.mode === 'accurate'
            ? renderAccurateMode(rawText, componentMap)
            : renderFastMode(rawText, componentMap);
    };
};
