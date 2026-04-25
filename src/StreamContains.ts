import { Fragment, defineComponent, h, isVNode, useSlots, type Component, type VNode } from 'vue';
import DefaultTag from './DefaultTag.vue';
import { streamContainsProps, type StackNode, type ComponentMap } from './types/stream-ui';

const TEXT_NODE_STYLE = { whiteSpace: 'pre-wrap' } as const;
const TAG_NAME_PATTERN = '[A-Za-z][\\w-]*';
const FAST_MODE_TAG_REGEX = new RegExp(
    `<(${TAG_NAME_PATTERN})(?:\\s+[^>]*)?>([\\s\\S]*?)(?:<\\/\\1>|$)`,
    'gi'
);
const ACCURATE_MODE_TAG_REGEX = new RegExp(`</?(${TAG_NAME_PATTERN})(?:\\s+[^>]*)?>`, 'g');

const normalizeTagName = (value: string) => value.toLowerCase();

const toKebabCase = (value: string) =>
    value
        .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
        .replace(/_/g, '-')
        .toLowerCase();

export const StreamContains = defineComponent({
    name: 'StreamContains',
    props: streamContainsProps,
    setup(props) {
        const slots = useSlots();
        const warnedUndefinedTags = new Set<string>();
        const warnedParserMessages = new Set<string>();

        /**
         * 渲染单个标签节点的通用逻辑
         */
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
                console.warn(`[Stream-UI] 检测到未定义的标签 <${normalizedTagName}>，使用默认样式。`);
                warnedUndefinedTags.add(normalizedTagName);
            }

            return h(DefaultTag, { tagName: normalizedTagName, content, key: index }, slotData);
        };


        /**
         * 模式 A：正则快速模式
         */
        const renderFastMode = (rawText: string, componentMap: ComponentMap) => {
            const nodes: (VNode | string)[] = [];
            let lastIndex = 0;
            let match;

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
            return h('div', { class: 'stream-ui-container mode-fast' }, nodes);
        };

        /**
         * 模式 B：扫描器精确模式
         */
        const renderAccurateMode = (rawText: string, componentMap: ComponentMap) => {
            const root: StackNode = { tagName: 'root', children: [] };
            const stack: StackNode[] = [root];
            const currentWarnings: string[] = []; // 收集本次渲染新产生的警告
            let lastIndex = 0;
            let match;

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
                        if (stack[i].tagName === tagName) { stackIndex = i; break; }
                    }
                    if (stackIndex > 0) {
                        if (stack.length - 1 > stackIndex) {
                            const closedTags = stack.slice(stackIndex + 1).map(n => n.tagName);
                            const msg = `[Stream-UI] 检测到标签交错：由于 </${tagName}> 闭合，强制闭合了内部未匹配的标签：<${closedTags.join('>, <')}>`;
                            if (!warnedParserMessages.has(msg)) {
                                currentWarnings.push(msg);
                                warnedParserMessages.add(msg);
                            }
                        }
                        while (stack.length > stackIndex) stack.pop();
                    } else {
                        const msg = `[Stream-UI] 检测到孤立的闭合标签 </${tagName}>，已自动过滤。`;
                        if (!warnedParserMessages.has(msg)) {
                            currentWarnings.push(msg);
                            warnedParserMessages.add(msg);
                        }
                    }
                }
            }

            // 如果本次渲染产生了新的结构警告，进行分组打印
            if (currentWarnings.length > 0) {
                console.groupCollapsed(`[Stream-UI] Accurate Mode Parser Warnings (${currentWarnings.length})`);
                currentWarnings.forEach(msg => console.warn(msg));
                console.groupEnd();
            }


            if (lastIndex < rawText.length) {
                stack[stack.length - 1].children.push(rawText.slice(lastIndex));
            }

            let nodeCounter = 0;
            const reconstructRawHTML = (n: StackNode | string): string => {
                if (typeof n === 'string') return n;
                return `<${n.tagName}>${n.children.map(reconstructRawHTML).join('')}</${n.tagName}>`;
            };

            const buildVNodes = (node: StackNode | string): VNode | string => {
                if (typeof node === 'string') return h('span', { style: TEXT_NODE_STYLE }, node);

                const childrenNodes = node.children.map(buildVNodes);
                if (node.tagName === 'root') {
                    return h('div', { class: 'stream-ui-container mode-accurate' }, childrenNodes);
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
            const componentMap: ComponentMap = {};
            const registerComponent = (name: string, component: Component) => {
                const normalizedName = normalizeTagName(name);
                componentMap[normalizedName] = component;

                const kebabName = toKebabCase(name);
                componentMap[kebabName] = component;
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

            if (Object.keys(componentMap).length === 0 && !rawText) {
                return h('div', { class: 'stream-content' }, '');
            }

            return props.mode === 'accurate'
                ? renderAccurateMode(rawText, componentMap)
                : renderFastMode(rawText, componentMap);
        };
    }
});
