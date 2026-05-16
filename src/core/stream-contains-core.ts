import { Fragment, h, isVNode, type Component, type PropType, type Slots, type VNode } from 'vue';

import type {
    ComponentMap,
    RenderMode,
    StackNode,
    StreamBlockAttrs,
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
    },
    baseComponent: {
        type: [Object, Function] as PropType<Component | null>,
        default: null
    }
};

export const TEXT_NODE_STYLE = { whiteSpace: 'pre-wrap' } as const;
export const TAG_NAME_PATTERN = '[A-Za-z][\\w-]*';
export const FAST_MODE_TAG_REGEX = new RegExp(
    `<(${TAG_NAME_PATTERN})(?:\\s+[^>]*)?(?:(\\/>)|(?=>)>([\\s\\S]*?)(?:<\\/\\1>|$))`,
    'gi'
);
export const ACCURATE_MODE_TAG_REGEX = new RegExp(`</?(${TAG_NAME_PATTERN})(?:\\s+[^>]*)?>`, 'g');
export const ATTR_NAME_PATTERN = '[^\\s=/>]+';
export const ATTR_REGEX = new RegExp(
    `(${ATTR_NAME_PATTERN})(?:\\s*=\\s*(?:"([^"]*)"|'([^']*)'|([^\\s"'=<>` + '`' + `]+)))?`,
    'g'
);

export const normalizeTagName = (value: string) => value.toLowerCase();

export const toKebabCase = (value: string) =>
    value
        .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
        .replace(/_/g, '-')
        .toLowerCase();

export const parseTagAttrs = (tagSource: string): StreamBlockAttrs => {
    const attrsSource = tagSource
        .replace(/^<\/?\s*[A-Za-z][\w-]*/, '')
        .replace(/\/?\s*>$/, '');
    const attrs: StreamBlockAttrs = {};
    let match: RegExpExecArray | null;

    ATTR_REGEX.lastIndex = 0;
    while ((match = ATTR_REGEX.exec(attrsSource)) !== null) {
        const [, name, doubleQuoted, singleQuoted, unquoted] = match;
        if (!name) continue;
        attrs[name] = doubleQuoted ?? singleQuoted ?? unquoted ?? true;
    }

    return attrs;
};

export const getOpeningTagSource = (tagSource: string) => {
    const match = tagSource.match(/^<[^>]+>/);
    return match?.[0] ?? '';
};

const hasAttrs = (attrs?: StreamBlockAttrs) => !!attrs && Object.keys(attrs).length > 0;

const areAttrsEqual = (left?: StreamBlockAttrs, right?: StreamBlockAttrs) => {
    if (!hasAttrs(left) && !hasAttrs(right)) return true;
    if (!left || !right) return false;
    const leftKeys = Object.keys(left);
    const rightKeys = Object.keys(right);
    return leftKeys.length === rightKeys.length
        && leftKeys.every(key => left[key] === right[key]);
};

const serializeAttrs = (attrs?: StreamBlockAttrs) => {
    if (!attrs || !hasAttrs(attrs)) return '';
    return Object.entries(attrs)
        .map(([key, value]) => value === true ? key : `${key}="${String(value).replace(/"/g, '&quot;')}"`)
        .join(' ');
};

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
            const attrs = parseTagAttrs(fullMatch);
            const newNode: StackNode = {
                tagName,
                attrs: hasAttrs(attrs) ? attrs : undefined,
                children: [],
                isClosed: isSelfClosing
            };
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
                && areAttrsEqual(block.attrs, other?.attrs)
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
    BaseComponent: Component | null | undefined,
    getPayload: (id: string) => unknown,
    updateBlockPayload: (id: string, payload: unknown) => void
) => (
    tagName: string,
    attrs: StreamBlockAttrs | undefined,
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
            attrs: hasAttrs(attrs) ? attrs : undefined,
            content,
            isClosed,
            category,
            payload: getPayload(String(index))
        };
        const reportData: StreamBlockReporter = (payload) => updateBlockPayload(block.id, payload);
        const slotData = childrenVNodes ? { default: () => childrenVNodes } : { default: () => content };

        const renderedBlock = Component
            ? h(Component, { block, attrs, content, isClosed, reportData, key: index }, slotData)
            : null;

        if (!Component && !warnedUndefinedTags.has(normalizedTagName)) {
            console.warn(options.getUndefinedTagWarning(normalizedTagName));
            warnedUndefinedTags.add(normalizedTagName);
        }

        const resolvedBlock = renderedBlock
            ?? h(options.DefaultTag, { block, tagName: normalizedTagName, attrs, content, isClosed, reportData, key: index }, slotData);

        if (!BaseComponent) return resolvedBlock;

        return h(
            BaseComponent,
            { block, tagName: normalizedTagName, attrs, content, isClosed, reportData, key: `base-${index}` },
            {
                default: () => [resolvedBlock],
                raw: () => content
            }
        );
    };

const createTextRenderer = (
    BaseComponent: Component | null | undefined,
    getPayload: (id: string) => unknown,
    updateBlockPayload: (id: string, payload: unknown) => void
) => (
    content: string,
    index: string | number
) => {
        const block: StreamBlockData = {
            id: String(index),
            tagName: 'text',
            content,
            isClosed: true,
            category: 'text',
            payload: getPayload(String(index))
        };
        const reportData: StreamBlockReporter = (payload) => updateBlockPayload(block.id, payload);
        const textNode = h('span', { style: TEXT_NODE_STYLE, key: index }, content);

        if (!BaseComponent) return textNode;

        return h(
            BaseComponent,
            { block, tagName: block.tagName, content, isClosed: true, reportData, key: `base-${index}` },
            {
                default: () => [textNode],
                raw: () => content
            }
        );
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
            props.baseComponent,
            blockStore.getPayload,
            blockStore.updateBlockPayload
        );
        const renderTextNode = createTextRenderer(
            props.baseComponent,
            blockStore.getPayload,
            blockStore.updateBlockPayload
        );

        FAST_MODE_TAG_REGEX.lastIndex = 0;
        while ((match = FAST_MODE_TAG_REGEX.exec(rawText)) !== null) {
            if (match.index > lastIndex) {
                const blockId = `text-fast-${lastIndex}`;
                const content = rawText.slice(lastIndex, match.index);
                blocks.push({
                    id: blockId,
                    tagName: 'text',
                    content,
                    isClosed: true,
                    category: 'text',
                    payload: blockStore.getPayload(blockId)
                });
                nodes.push(renderTextNode(content, blockId));
            }
            const isSelfClosing = typeof match[2] === 'string' && match[2].startsWith('/>');
            const isClosed = isSelfClosing || match[0].toLowerCase().endsWith(`</${match[1].toLowerCase()}>`);
            const blockId = `fast-${match.index}`;
            const normalizedTagName = normalizeTagName(match[1]);
            const attrs = parseTagAttrs(getOpeningTagSource(match[0]));
            const content = match[3] || '';
            blocks.push({
                id: blockId,
                tagName: normalizedTagName,
                attrs: hasAttrs(attrs) ? attrs : undefined,
                content,
                isClosed,
                category: componentMap[normalizedTagName] ? 'component' : 'fallback',
                payload: blockStore.getPayload(blockId)
            });
            nodes.push(renderTagNode(match[1], attrs, content, isClosed, blockId));
            lastIndex = FAST_MODE_TAG_REGEX.lastIndex;
        }

        if (lastIndex < rawText.length) {
            const blockId = `text-fast-${lastIndex}`;
            const content = rawText.slice(lastIndex);
            blocks.push({
                id: blockId,
                tagName: 'text',
                content,
                isClosed: true,
                category: 'text',
                payload: blockStore.getPayload(blockId)
            });
            nodes.push(renderTextNode(content, blockId));
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
        let textCounter = 0;
        const reconstructRawHTML = (node: StackNode | string): string => {
            if (typeof node === 'string') return node;
            const attrs = serializeAttrs(node.attrs);
            const openingTag = attrs ? `<${node.tagName} ${attrs}>` : `<${node.tagName}>`;
            return `${openingTag}${node.children.map(reconstructRawHTML).join('')}</${node.tagName}>`;
        };

        const blocks: StreamBlockData[] = [];
        const renderTagNode = createTagRenderer(
            resolvedOptions,
            warnedUndefinedTags,
            componentMap,
            props.baseComponent,
            blockStore.getPayload,
            blockStore.updateBlockPayload
        );
        const renderTextNode = createTextRenderer(
            props.baseComponent,
            blockStore.getPayload,
            blockStore.updateBlockPayload
        );
        const buildVNodes = (node: StackNode | string): VNode | string => {
            if (typeof node === 'string') {
                textCounter++;
                const blockId = `text-acc-${textCounter}`;
                blocks.push({
                    id: blockId,
                    tagName: 'text',
                    content: node,
                    isClosed: true,
                    category: 'text',
                    payload: blockStore.getPayload(blockId)
                });
                return renderTextNode(node, blockId);
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
                attrs: hasAttrs(node.attrs) ? node.attrs : undefined,
                content: node.children.map(reconstructRawHTML).join(''),
                isClosed: node.isClosed ?? false,
                category: componentMap[normalizedTagName] ? 'component' : 'fallback',
                payload: blockStore.getPayload(blockId)
            });
            return renderTagNode(
                node.tagName,
                node.attrs,
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
