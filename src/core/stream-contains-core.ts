import { Fragment, h, isVNode, type Component, type PropType, type Slots, type VNode } from 'vue';

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

export const TEXT_NODE_STYLE = { whiteSpace: 'pre-wrap' } as const;
export const TAG_NAME_PATTERN = '[A-Za-z][\\w-]*';
export const FAST_MODE_TAG_REGEX = new RegExp(
    `<(${TAG_NAME_PATTERN})(?:\\s+[^>]*)?>([\\s\\S]*?)(?:<\\/\\1>|$)`,
    'gi'
);
export const ACCURATE_MODE_TAG_REGEX = new RegExp(`</?(${TAG_NAME_PATTERN})(?:\\s+[^>]*)?>`, 'g');

export const normalizeTagName = (value: string) => value.toLowerCase();

export const toKebabCase = (value: string) =>
    value
        .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
        .replace(/_/g, '-')
        .toLowerCase();

export interface StreamContainsRenderOptions {
    DefaultTag: Component;
    emptyClassName?: string;
    fastContainerClassName?: string;
    accurateContainerClassName?: string;
    getUndefinedTagWarning?: (tagName: string) => string;
    getCrossedTagWarning?: (tagName: string, closedTags: string[]) => string;
    getIsolatedClosingTagWarning?: (tagName: string) => string;
    getParserWarningsTitle?: (count: number) => string;
}

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

export const createStreamContainsRender = (
    props: StreamContainsProps,
    slots: Slots,
    options: StreamContainsRenderOptions
) => {
    const warnedUndefinedTags = new Set<string>();
    const warnedParserMessages = new Set<string>();
    const emptyClassName = options.emptyClassName ?? 'stream-content';
    const fastContainerClassName = options.fastContainerClassName ?? 'stream-ui-container mode-fast';
    const accurateContainerClassName = options.accurateContainerClassName ?? 'stream-ui-container mode-accurate';
    const getUndefinedTagWarning = options.getUndefinedTagWarning
        ?? ((tagName: string) => `[Stream-UI] 检测到未定义的标签 <${tagName}>，使用默认样式。`);
    const getCrossedTagWarning = options.getCrossedTagWarning
        ?? ((tagName: string, closedTags: string[]) =>
            `[Stream-UI] 检测到标签交错：由于 </${tagName}> 闭合，强制闭合了内部未匹配的标签：<${closedTags.join('>, <')}>`);
    const getIsolatedClosingTagWarning = options.getIsolatedClosingTagWarning
        ?? ((tagName: string) => `[Stream-UI] 检测到孤立的闭合标签 </${tagName}>，已自动过滤。`);
    const getParserWarningsTitle = options.getParserWarningsTitle
        ?? ((count: number) => `[Stream-UI] Accurate Mode Parser Warnings (${count})`);

    const renderTagNode = (
        tagName: string,
        content: string,
        index: string | number,
        componentMap: ComponentMap,
        childrenVNodes?: (VNode | string)[]
    ) => {
        const normalizedTagName = normalizeTagName(tagName);
        const Component = componentMap[normalizedTagName];
        const slotData = childrenVNodes ? { default: () => childrenVNodes } : { default: () => content };

        if (Component) {
            return h(Component, { content, key: index }, slotData);
        }

        if (!warnedUndefinedTags.has(normalizedTagName)) {
            console.warn(getUndefinedTagWarning(normalizedTagName));
            warnedUndefinedTags.add(normalizedTagName);
        }

        return h(options.DefaultTag, { tagName: normalizedTagName, content, key: index }, slotData);
    };

    const renderFastMode = (rawText: string, componentMap: ComponentMap) => {
        const nodes: (VNode | string)[] = [];
        let lastIndex = 0;
        let match: RegExpExecArray | null;

        FAST_MODE_TAG_REGEX.lastIndex = 0;
        while ((match = FAST_MODE_TAG_REGEX.exec(rawText)) !== null) {
            if (match.index > lastIndex) {
                nodes.push(h('span', { style: TEXT_NODE_STYLE }, rawText.slice(lastIndex, match.index)));
            }
            nodes.push(renderTagNode(match[1], match[2], `fast-${match.index}`, componentMap));
            lastIndex = FAST_MODE_TAG_REGEX.lastIndex;
        }

        if (lastIndex < rawText.length) {
            nodes.push(h('span', { style: TEXT_NODE_STYLE }, rawText.slice(lastIndex)));
        }

        return h('div', { class: fastContainerClassName }, nodes);
    };

    const renderAccurateMode = (rawText: string, componentMap: ComponentMap) => {
        const root: StackNode = { tagName: 'root', children: [] };
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
                const newNode: StackNode = { tagName, children: [] };
                stack[stack.length - 1].children.push(newNode);
                stack.push(newNode);
            } else {
                let stackIndex = -1;
                for (let i = stack.length - 1; i > 0; i--) {
                    if (stack[i].tagName === tagName) {
                        stackIndex = i;
                        break;
                    }
                }

                if (stackIndex > 0) {
                    if (stack.length - 1 > stackIndex) {
                        const closedTags = stack.slice(stackIndex + 1).map(node => node.tagName);
                        const msg = getCrossedTagWarning(tagName, closedTags);
                        if (!warnedParserMessages.has(msg)) {
                            currentWarnings.push(msg);
                            warnedParserMessages.add(msg);
                        }
                    }
                    while (stack.length > stackIndex) stack.pop();
                } else {
                    const msg = getIsolatedClosingTagWarning(tagName);
                    if (!warnedParserMessages.has(msg)) {
                        currentWarnings.push(msg);
                        warnedParserMessages.add(msg);
                    }
                }
            }
        }

        if (currentWarnings.length > 0) {
            console.groupCollapsed(getParserWarningsTitle(currentWarnings.length));
            currentWarnings.forEach(msg => console.warn(msg));
            console.groupEnd();
        }

        if (lastIndex < rawText.length) {
            stack[stack.length - 1].children.push(rawText.slice(lastIndex));
        }

        let nodeCounter = 0;
        const reconstructRawHTML = (node: StackNode | string): string => {
            if (typeof node === 'string') return node;
            return `<${node.tagName}>${node.children.map(reconstructRawHTML).join('')}</${node.tagName}>`;
        };

        const buildVNodes = (node: StackNode | string): VNode | string => {
            if (typeof node === 'string') {
                return h('span', { style: TEXT_NODE_STYLE }, node);
            }

            const childrenNodes = node.children.map(buildVNodes);
            if (node.tagName === 'root') {
                return h('div', { class: accurateContainerClassName }, childrenNodes);
            }

            nodeCounter++;
            return renderTagNode(
                node.tagName,
                node.children.map(reconstructRawHTML).join(''),
                `acc-${nodeCounter}`,
                componentMap,
                childrenNodes
            );
        };

        return buildVNodes(root) as VNode;
    };

    return () => {
        const rawText = props.modelValue;
        const defaultSlots = slots.default ? slots.default() : [];
        const componentMap = buildComponentMap(defaultSlots);

        if (Object.keys(componentMap).length === 0 && !rawText) {
            return h('div', { class: emptyClassName }, '');
        }

        return props.mode === 'accurate'
            ? renderAccurateMode(rawText, componentMap)
            : renderFastMode(rawText, componentMap);
    };
};
