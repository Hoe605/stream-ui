import { describe, it, expect, vi, beforeEach } from 'vitest';
import { h, defineComponent, Fragment } from 'vue';
import { buildComponentMap, createStreamContainsRender } from '../src/core/stream-contains-core';

// 模拟组件
const MockComponent = defineComponent({
    name: 'MockComponent',
    props: ['block', 'content', 'isClosed', 'reportData'],
    render() {
        return h('div', { class: 'mock-component' }, this.$slots.default?.() || 'mock');
    }
});

const DefaultTag = defineComponent({
    name: 'DefaultTag',
    props: ['block', 'tagName', 'content', 'isClosed', 'reportData'],
    render() {
        return h('div', { class: `default-tag-${this.tagName}` }, this.$slots.default?.() || this.content);
    }
});

const BaseComponent = defineComponent({
    name: 'BaseComponent',
    props: ['block', 'tagName', 'content', 'isClosed', 'reportData'],
    render() {
        return h('section', { class: `base-${this.tagName}` }, this.$slots.default?.());
    }
});

describe('stream-contains-core', () => {
    describe('buildComponentMap', () => {
        it('应该能从插槽中正确映射组件', () => {
            const vnode = h(MockComponent);
            const map = buildComponentMap([vnode]);
            
            expect(map['mockcomponent']).toBe(MockComponent);
            expect(map['mock-component']).toBe(MockComponent);
        });

        it('应该处理嵌套的 Fragment 和数组', () => {
            const vnode = h(Fragment, [h(MockComponent)]);
            const map = buildComponentMap([[vnode]]);
            expect(map['mock-component']).toBe(MockComponent);
        });
    });

    describe('createStreamContainsRender', () => {
        let emit: any;
        let options: any;

        beforeEach(() => {
            emit = vi.fn();
            options = {
                DefaultTag,
                emit
            };
            vi.clearAllMocks();
        });

        it('默认应该以 accurate 模式渲染', () => {
            const props = { modelValue: 'hello <mock-component>world</mock-component>', mode: 'accurate' as const };
            const render = createStreamContainsRender(props, { default: () => [h(MockComponent)] }, options);
            const vnode = render();
            
            // 检查是否包含 accurate 模式的容器类名
            expect(vnode.props.class).toContain('mode-accurate');
        });

        it('accurate 模式应该支持嵌套标签', () => {
            const props = { modelValue: '<a><b>text</b></a>', mode: 'accurate' as const };
            const render = createStreamContainsRender(props, {}, options);
            const vnode = render();
            
            // 结构: root(div) -> a -> b -> text
            const aVNode = vnode.children[0];
            const bVNode = aVNode.children.default()[0];
            
            expect(aVNode.props.block.tagName).toBe('a');
            expect(bVNode.props.block.tagName).toBe('b');
        });

        it('accurate 模式应该处理未闭合的标签', async () => {
            const props = { modelValue: '<a>text', mode: 'accurate' as const };
            const render = createStreamContainsRender(props, {}, options);
            render();
            
            await new Promise(resolve => setTimeout(resolve, 0));
            
            expect(emit).toHaveBeenCalledWith('update:data', expect.arrayContaining([
                expect.objectContaining({ tagName: 'a', isClosed: false })
            ]));
        });

        it('应该支持自闭合标签', async () => {
            const props = { modelValue: '<br />', mode: 'accurate' as const };
            const render = createStreamContainsRender(props, {}, options);
            render();
            
            await new Promise(resolve => setTimeout(resolve, 0));
            
            expect(emit).toHaveBeenCalledWith('update:data', expect.arrayContaining([
                expect.objectContaining({ tagName: 'br', isClosed: true })
            ]));
        });

        it('应该能更新 payload 并重新 emit blocks', async () => {
            const props = { modelValue: '<mock />', mode: 'accurate' as const };
            const render = createStreamContainsRender(props, { default: () => [h(MockComponent)] }, options);
            const vnode = render();
            
            // 找到渲染的组件并调用 reportData
            const mockVNode = vnode.children[0];
            const reportData = mockVNode.props.reportData;
            const blockId = mockVNode.props.block.id;
            
            reportData({ status: 'done' });
            
            // 等待微任务执行 (queueMicrotask)
            await new Promise(resolve => setTimeout(resolve, 0));
            
            expect(emit).toHaveBeenLastCalledWith('update:data', expect.arrayContaining([
                expect.objectContaining({ id: blockId, payload: { status: 'done' } })
            ]));
        });

        it('应该支持 fast 模式', async () => {
            const props = { modelValue: '<tag>content</tag>', mode: 'fast' as const };
            const render = createStreamContainsRender(props, {}, options);
            const vnode = render();
            
            expect(vnode.props.class).toContain('mode-fast');
            
            await new Promise(resolve => setTimeout(resolve, 0));
            
            expect(emit).toHaveBeenCalledWith('update:data', expect.arrayContaining([
                expect.objectContaining({ tagName: 'tag', content: 'content' })
            ]));
        });

        it('文本内容应该保持 pre-wrap 样式', () => {
            const props = { modelValue: 'some text', mode: 'accurate' as const };
            const render = createStreamContainsRender(props, {}, options);
            const vnode = render();
            
            const textNode = vnode.children[0];
            expect(textNode.props.style).toEqual({ whiteSpace: 'pre-wrap' });
        });

        it('纯文本内容应该能用 baseComponent 包装', () => {
            const props = {
                modelValue: 'plain **markdown** text',
                mode: 'accurate' as const,
                baseComponent: BaseComponent
            };
            const render = createStreamContainsRender(props, {}, options);
            const vnode = render();
            const baseVNode = vnode.children[0];
            const childVNode = baseVNode.children.default()[0];

            expect(baseVNode.type).toBe(BaseComponent);
            expect(baseVNode.props.tagName).toBe('text');
            expect(baseVNode.props.block.category).toBe('text');
            expect(baseVNode.props.content).toBe('plain **markdown** text');
            expect(childVNode.type).toBe('span');
        });

        it('纯文本内容应该同步到结构化数据', async () => {
            const props = { modelValue: 'plain text', mode: 'accurate' as const };
            const render = createStreamContainsRender(props, {}, options);
            render();

            await new Promise(resolve => setTimeout(resolve, 0));

            expect(emit).toHaveBeenCalledWith('update:data', [
                expect.objectContaining({
                    tagName: 'text',
                    content: 'plain text',
                    isClosed: true,
                    category: 'text'
                })
            ]);
        });

        it('应该能用 baseComponent 包装已注册组件', () => {
            const props = {
                modelValue: '<mock-component>world</mock-component>',
                mode: 'accurate' as const,
                baseComponent: BaseComponent
            };
            const render = createStreamContainsRender(props, { default: () => [h(MockComponent)] }, options);
            const vnode = render();
            const baseVNode = vnode.children[0];
            const childVNode = baseVNode.children.default()[0];

            expect(baseVNode.type).toBe(BaseComponent);
            expect(baseVNode.props.tagName).toBe('mock-component');
            expect(childVNode.type).toBe(MockComponent);
            expect(childVNode.props.block.category).toBe('component');
        });

        it('应该能用 baseComponent 包装 fallback 组件', () => {
            const props = {
                modelValue: '<unknown>tag content</unknown>',
                mode: 'accurate' as const,
                baseComponent: BaseComponent
            };
            const render = createStreamContainsRender(props, {}, options);
            const vnode = render();
            const baseVNode = vnode.children[0];
            const childVNode = baseVNode.children.default()[0];

            expect(baseVNode.type).toBe(BaseComponent);
            expect(baseVNode.props.tagName).toBe('unknown');
            expect(childVNode.type).toBe(DefaultTag);
            expect(childVNode.props.block.category).toBe('fallback');
        });

        it('baseComponent 应该能通过 reportData 更新 payload', async () => {
            const props = {
                modelValue: '<mock />',
                mode: 'accurate' as const,
                baseComponent: BaseComponent
            };
            const render = createStreamContainsRender(props, { default: () => [h(MockComponent)] }, options);
            const vnode = render();
            const baseVNode = vnode.children[0];

            baseVNode.props.reportData({ rendered: 'markdown' });

            await new Promise(resolve => setTimeout(resolve, 0));

            expect(emit).toHaveBeenLastCalledWith('update:data', expect.arrayContaining([
                expect.objectContaining({ id: baseVNode.props.block.id, payload: { rendered: 'markdown' } })
            ]));
        });
    });
});
