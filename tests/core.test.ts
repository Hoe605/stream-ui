import { describe, it, expect, vi, beforeEach } from 'vitest';
import { h, defineComponent, Fragment } from 'vue';
import {
    buildComponentMap,
    createStreamContainsRender,
    parseTagAttrs,
    parseAccurateStream,
    getOpeningTagSource,
    streamContainsProps,
} from '../src/core/stream-contains-core';

const MockComponent = defineComponent({
    name: 'MockComponent',
    props: ['block', 'attrs', 'content', 'isClosed', 'reportData'],
    render() {
        return h('div', { class: 'mock-component' }, this.$slots.default?.() || 'mock');
    }
});

const DefaultTag = defineComponent({
    name: 'DefaultTag',
    props: ['block', 'tagName', 'attrs', 'content', 'isClosed', 'reportData'],
    render() {
        return h('div', { class: `default-tag-${this.tagName}` }, this.$slots.default?.() || this.content);
    }
});

const BaseComponent = defineComponent({
    name: 'BaseComponent',
    props: ['block', 'tagName', 'attrs', 'content', 'isClosed', 'reportData'],
    render() {
        return h('section', { class: `base-${this.tagName}` }, this.$slots.default?.());
    }
});

describe('streamContainsProps', () => {
    it('data prop default returns empty array', () => {
        const arr = (streamContainsProps.data.default as () => [])();
        expect(arr).toEqual([]);
    });
});

describe('getOpeningTagSource', () => {
    it('extracts opening tag from source', () => {
        expect(getOpeningTagSource('<div lang="ts">content</div>')).toBe('<div lang="ts">');
    });

    it('returns empty for non-tag source', () => {
        expect(getOpeningTagSource('plain text')).toBe('');
    });
});

describe('parseTagAttrs', () => {
    it('parses double-quoted, single-quoted, unquoted, and boolean attributes', () => {
        expect(parseTagAttrs('<code lang="ts" theme=\'dark\' line=12 disabled>')).toEqual({
            lang: 'ts',
            theme: 'dark',
            line: '12',
            disabled: true
        });
    });

    it('handles closing tag', () => {
        expect(parseTagAttrs('</div>')).toEqual({});
    });

    it('handles tag with no attrs', () => {
        expect(parseTagAttrs('<div>')).toEqual({});
    });
});

describe('buildComponentMap', () => {
    it('maps components from slots by name', () => {
        const vnode = h(MockComponent);
        const map = buildComponentMap([vnode]);

        expect(map['mockcomponent']).toBe(MockComponent);
        expect(map['mock-component']).toBe(MockComponent);
    });

    it('handles nested Fragment and arrays', () => {
        const vnode = h(Fragment, [h(MockComponent)]);
        const map = buildComponentMap([[vnode]]);
        expect(map['mock-component']).toBe(MockComponent);
    });

    it('skips native HTML elements', () => {
        const vnode = h('div');
        const map = buildComponentMap([vnode]);
        expect(Object.keys(map)).toHaveLength(0);
    });

    it('skips components without a name', () => {
        const anonymous = defineComponent({
            render() { return h('span', 'anon'); }
        });
        const map = buildComponentMap([h(anonymous)]);
        expect(Object.keys(map)).toHaveLength(0);
    });

    it('recursively flattens VNodes with array children', () => {
        const Wrapper = defineComponent({
            name: 'Wrapper',
            render() { return h('div'); }
        });
        const wrapper = h(Wrapper, {}, [h(MockComponent)]);
        const map = buildComponentMap([wrapper]);
        expect(map['wrapper']).toBe(Wrapper);
        expect(map['mock-component']).toBe(MockComponent);
    });

    it('recursively flattens nested Fragment children', () => {
        const vnode = h(Fragment, [h(Fragment, [h(MockComponent)])]);
        const map = buildComponentMap([[vnode]]);
        expect(map['mock-component']).toBe(MockComponent);
    });

    it('skips non-VNode items', () => {
        const map = buildComponentMap(['string', 42, null, undefined]);
        expect(Object.keys(map)).toHaveLength(0);
    });

    it('registers components using __name', () => {
        const ScriptSetupComp = { __name: 'ScriptSetupComp', render() { return h('div'); } };
        const map = buildComponentMap([h(ScriptSetupComp)]);
        expect(map['scriptsetupcomp']).toBe(ScriptSetupComp);
    });
});

describe('parseAccurateStream', () => {
    const defaultOptions = {
        getCrossedTagWarning: (tagName: string, closedTags: string[]) =>
            `Crossed: </${tagName}> closed <${closedTags.join('>, <')}>`,
        getIsolatedClosingTagWarning: (tagName: string) =>
            `Isolated: </${tagName}>`,
        warnedParserMessages: new Set<string>(),
    };

    it('parses nested tags', () => {
        const { root } = parseAccurateStream('<a><b>text</b></a>', defaultOptions);
        const a = root.children[0] as any;
        expect(a.tagName).toBe('a');
        const b = a.children[0] as any;
        expect(b.tagName).toBe('b');
        expect(b.children[0]).toBe('text');
    });

    it('detects crossed tags', () => {
        const options = {
            ...defaultOptions,
            warnedParserMessages: new Set<string>(),
        };
        const { root, currentWarnings } = parseAccurateStream('<a><b></a></b>', options);
        expect(currentWarnings.length).toBeGreaterThan(0);
        expect(currentWarnings[0]).toContain('Crossed');
    });

    it('detects isolated closing tags', () => {
        const options = {
            ...defaultOptions,
            warnedParserMessages: new Set<string>(),
        };
        const { currentWarnings } = parseAccurateStream('<a></b>', options);
        expect(currentWarnings.length).toBeGreaterThan(0);
        expect(currentWarnings[0]).toContain('Isolated');
    });

    it('deduplicates warnings', () => {
        const options = {
            ...defaultOptions,
            warnedParserMessages: new Set<string>(),
        };
        const { currentWarnings } = parseAccurateStream('<a></b><a></b>', options);
        expect(currentWarnings.length).toBe(1);
    });

    it('deduplicates crossed tag warnings', () => {
        const options = {
            ...defaultOptions,
            warnedParserMessages: new Set<string>(),
        };
        const { currentWarnings } = parseAccurateStream('<a><b></a><a><b></a>', options);
        expect(currentWarnings.length).toBe(1);
    });

    it('handles self-closing tag with / > space', () => {
        const { root } = parseAccurateStream('<br / >', defaultOptions);
        const br = root.children[0] as any;
        expect(br.tagName).toBe('br');
        expect(br.isClosed).toBe(true);
    });

    it('captures text after last tag', () => {
        const { root } = parseAccurateStream('<a>x</a>trailing', defaultOptions);
        const a = root.children[0] as any;
        expect(a.tagName).toBe('a');
        expect(a.children[0]).toBe('x');
        expect(root.children[1]).toBe('trailing');
    });

    it('handles text with no tags', () => {
        const { root } = parseAccurateStream('just text', defaultOptions);
        expect(root.children[0]).toBe('just text');
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

    it('renders empty div when no text and no components', () => {
        const props = { modelValue: '', mode: 'accurate' as const };
        const render = createStreamContainsRender(props, {}, options);
        const vnode = render();
        expect(vnode.props.class).toBe('stream-content');
    });

    it('renders in accurate mode by default', () => {
        const props = { modelValue: 'hello <mock-component>world</mock-component>', mode: 'accurate' as const };
        const render = createStreamContainsRender(props, { default: () => [h(MockComponent)] }, options);
        const vnode = render();
        expect(vnode.props.class).toContain('mode-accurate');
    });

    it('accurate mode supports nested tags', () => {
        const props = { modelValue: '<a><b>text</b></a>', mode: 'accurate' as const };
        const render = createStreamContainsRender(props, {}, options);
        const vnode = render();
        const aVNode = vnode.children[0];
        const bVNode = aVNode.children.default()[0];

        expect(aVNode.props.block.tagName).toBe('a');
        expect(bVNode.props.block.tagName).toBe('b');
    });

    it('accurate mode serializes attrs on nested child tags', () => {
        const props = { modelValue: '<outer><inner lang="ts">code</inner></outer>', mode: 'accurate' as const };
        const render = createStreamContainsRender(props, {}, options);
        const vnode = render();
        const outer = vnode.children[0];
        const inner = outer.children.default()[0];

        expect(outer.props.block.tagName).toBe('outer');
        expect(inner.props.block.tagName).toBe('inner');
        expect(inner.props.attrs).toEqual({ lang: 'ts' });
    });

    it('accurate mode handles unclosed tags', async () => {
        const props = { modelValue: '<a>text', mode: 'accurate' as const };
        const render = createStreamContainsRender(props, {}, options);
        render();

        await new Promise(resolve => setTimeout(resolve, 0));

        expect(emit).toHaveBeenCalledWith('update:data', expect.arrayContaining([
            expect.objectContaining({ tagName: 'a', isClosed: false })
        ]));
    });

    it('supports self-closing tags', async () => {
        const props = { modelValue: '<br />', mode: 'accurate' as const };
        const render = createStreamContainsRender(props, {}, options);
        render();

        await new Promise(resolve => setTimeout(resolve, 0));

        expect(emit).toHaveBeenCalledWith('update:data', expect.arrayContaining([
            expect.objectContaining({ tagName: 'br', isClosed: true })
        ]));
    });

    it('accurate mode passes attrs to component and structured data', async () => {
        const props = { modelValue: '<mock-component lang="ts" live>code</mock-component>', mode: 'accurate' as const };
        const render = createStreamContainsRender(props, { default: () => [h(MockComponent)] }, options);
        const vnode = render();
        const mockVNode = vnode.children[0];

        expect(mockVNode.props.attrs).toEqual({ lang: 'ts', live: true });
        expect(mockVNode.props.block.attrs).toEqual({ lang: 'ts', live: true });

        await new Promise(resolve => setTimeout(resolve, 0));

        expect(emit).toHaveBeenCalledWith('update:data', expect.arrayContaining([
            expect.objectContaining({
                tagName: 'mock-component',
                attrs: { lang: 'ts', live: true }
            })
        ]));
    });

    it('fast mode passes attrs to component and structured data', async () => {
        const props = { modelValue: '<mock-component lang="ts">code</mock-component>', mode: 'fast' as const };
        const render = createStreamContainsRender(props, { default: () => [h(MockComponent)] }, options);
        const vnode = render();
        const mockVNode = vnode.children[0];

        expect(mockVNode.props.attrs).toEqual({ lang: 'ts' });
        expect(mockVNode.props.block.attrs).toEqual({ lang: 'ts' });

        await new Promise(resolve => setTimeout(resolve, 0));

        expect(emit).toHaveBeenCalledWith('update:data', expect.arrayContaining([
            expect.objectContaining({
                tagName: 'mock-component',
                attrs: { lang: 'ts' }
            })
        ]));
    });

    it('emits block updates via reportData', async () => {
        const props = { modelValue: '<mock />', mode: 'accurate' as const };
        const render = createStreamContainsRender(props, { default: () => [h(MockComponent)] }, options);
        const vnode = render();

        const mockVNode = vnode.children[0];
        const reportData = mockVNode.props.reportData;
        const blockId = mockVNode.props.block.id;

        reportData({ status: 'done' });

        await new Promise(resolve => setTimeout(resolve, 0));

        expect(emit).toHaveBeenLastCalledWith('update:data', expect.arrayContaining([
            expect.objectContaining({ id: blockId, payload: { status: 'done' } })
        ]));
    });

    it('supports fast mode', async () => {
        const props = { modelValue: '<tag>content</tag>', mode: 'fast' as const };
        const render = createStreamContainsRender(props, {}, options);
        const vnode = render();

        expect(vnode.props.class).toContain('mode-fast');

        await new Promise(resolve => setTimeout(resolve, 0));

        expect(emit).toHaveBeenCalledWith('update:data', expect.arrayContaining([
            expect.objectContaining({ tagName: 'tag', content: 'content' })
        ]));
    });

    it('text content has pre-wrap style', () => {
        const props = { modelValue: 'some text', mode: 'accurate' as const };
        const render = createStreamContainsRender(props, {}, options);
        const vnode = render();

        const textNode = vnode.children[0];
        expect(textNode.props.style).toEqual({ whiteSpace: 'pre-wrap' });
    });

    it('text content can be wrapped by baseComponent', () => {
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

        baseVNode.children.raw();
    });

    it('text content syncs to structured data', async () => {
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

    it('wraps registered component with baseComponent', () => {
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
        expect(baseVNode.props.attrs).toBeUndefined();
        expect(childVNode.type).toBe(MockComponent);
        expect(childVNode.props.block.category).toBe('component');

        baseVNode.children.raw();
    });

    it('baseComponent receives tag attributes', () => {
        const props = {
            modelValue: '<mock-component kind="answer">world</mock-component>',
            mode: 'accurate' as const,
            baseComponent: BaseComponent
        };
        const render = createStreamContainsRender(props, { default: () => [h(MockComponent)] }, options);
        const vnode = render();
        const baseVNode = vnode.children[0];
        const childVNode = baseVNode.children.default()[0];

        expect(baseVNode.props.attrs).toEqual({ kind: 'answer' });
        expect(baseVNode.props.block.attrs).toEqual({ kind: 'answer' });
        expect(childVNode.props.attrs).toEqual({ kind: 'answer' });
    });

    it('wraps fallback component with baseComponent', () => {
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

        baseVNode.children.raw();
    });

    it('baseComponent reportData updates payload', async () => {
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

    it('fast mode handles text before and after tags', async () => {
        const props = { modelValue: 'pre<tag>mid</tag>post', mode: 'fast' as const };
        const render = createStreamContainsRender(props, {}, options);
        const vnode = render();

        expect(vnode.props.class).toContain('mode-fast');
        expect(vnode.children.length).toBe(3);

        await new Promise(resolve => setTimeout(resolve, 0));

        expect(emit).toHaveBeenCalledWith('update:data', expect.arrayContaining([
            expect.objectContaining({ tagName: 'text', content: 'pre' }),
            expect.objectContaining({ tagName: 'tag', content: 'mid' }),
            expect.objectContaining({ tagName: 'text', content: 'post' }),
        ]));
    });

    it('preserves payload from initial data across renders', () => {
        const props = {
            modelValue: '<mock />',
            mode: 'accurate' as const,
            data: [{ id: 'acc-1', tagName: 'mock', content: '', isClosed: false, category: 'component' as const, payload: { cached: true } }]
        };
        const render = createStreamContainsRender(props, { default: () => [h(MockComponent)] }, options);
        const vnode = render();
        const mockVNode = vnode.children[0];

        expect(mockVNode.props.block.payload).toEqual({ cached: true });
    });

    it('shows parser warnings for crossed tags in accurate mode', () => {
        const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
        const groupSpy = vi.spyOn(console, 'groupCollapsed').mockImplementation(() => {});

        const props = { modelValue: '<a><b></a></b>', mode: 'accurate' as const };
        const render = createStreamContainsRender(props, {}, { DefaultTag, emit: vi.fn() });
        render();

        expect(warnSpy).toHaveBeenCalled();
        groupSpy.mockRestore();
        warnSpy.mockRestore();
    });

    it('shows parser warnings for isolated closing tags in accurate mode', () => {
        const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
        const groupSpy = vi.spyOn(console, 'groupCollapsed').mockImplementation(() => {});

        const props = { modelValue: '<a></b>', mode: 'accurate' as const };
        const render = createStreamContainsRender(props, {}, { DefaultTag, emit: vi.fn() });
        render();

        expect(warnSpy).toHaveBeenCalled();
        groupSpy.mockRestore();
        warnSpy.mockRestore();
    });

    it('skips duplicate emit when blocks have not changed', async () => {
        const props = { modelValue: 'static text', mode: 'accurate' as const };
        const render = createStreamContainsRender(props, {}, options);

        render();
        await new Promise(resolve => setTimeout(resolve, 0));

        render();
        await new Promise(resolve => setTimeout(resolve, 0));

        expect(emit).toHaveBeenCalledTimes(1);
    });

    it('skips emit when blocks with same attrs', async () => {
        const props = { modelValue: '<tag lang="ts">content</tag>', mode: 'accurate' as const };
        const render = createStreamContainsRender(props, {}, options);
        render();
        await new Promise(resolve => setTimeout(resolve, 0));

        emit.mockClear();

        render();
        await new Promise(resolve => setTimeout(resolve, 0));

        expect(emit).toHaveBeenCalledTimes(0);
    });

    it('emits again when attrs differ between renders', async () => {
        const props = { modelValue: '<tag lang="ts">content</tag>', mode: 'accurate' as const };
        const render = createStreamContainsRender(props, {}, options);
        render();
        await new Promise(resolve => setTimeout(resolve, 0));

        emit.mockClear();

        props.modelValue = '<tag>content</tag>';
        render();
        await new Promise(resolve => setTimeout(resolve, 0));

        expect(emit).toHaveBeenCalledTimes(1);
    });

    it('emits again when attr values differ between renders', async () => {
        const props = { modelValue: '<tag lang="ts">content</tag>', mode: 'accurate' as const };
        const render = createStreamContainsRender(props, {}, options);
        render();
        await new Promise(resolve => setTimeout(resolve, 0));

        emit.mockClear();

        props.modelValue = '<tag lang="js">content</tag>';
        render();
        await new Promise(resolve => setTimeout(resolve, 0));

        expect(emit).toHaveBeenCalledTimes(1);
    });

    it('emits again when attr count differs between renders', async () => {
        const props = { modelValue: '<tag lang="ts">content</tag>', mode: 'accurate' as const };
        const render = createStreamContainsRender(props, {}, options);
        render();
        await new Promise(resolve => setTimeout(resolve, 0));

        emit.mockClear();

        props.modelValue = '<tag lang="ts" extra="val">content</tag>';
        render();
        await new Promise(resolve => setTimeout(resolve, 0));

        expect(emit).toHaveBeenCalledTimes(1);
    });

    it('serializes boolean attributes in nested tag content', async () => {
        const props = { modelValue: '<div><span disabled>text</span></div>', mode: 'accurate' as const };
        const render = createStreamContainsRender(props, {}, options);
        render();
        await new Promise(resolve => setTimeout(resolve, 0));

        expect(emit).toHaveBeenCalledWith('update:data', expect.arrayContaining([
            expect.objectContaining({ content: '<span disabled>text</span>' })
        ]));
    });

    it('handles data entries without id or payload', () => {
        const props = {
            modelValue: '',
            data: [{}, { id: 'no-payload' }, { id: 123 }]
        };
        const render = createStreamContainsRender(props, {}, options);
        expect(() => render()).not.toThrow();
    });

    it('renders without emit option', () => {
        const render = createStreamContainsRender(
            { modelValue: '<tag>content</tag>', mode: 'accurate' as const },
            {},
            { DefaultTag }
        );
        expect(() => render()).not.toThrow();
    });

    it('updateBlockPayload handles multiple blocks', async () => {
        const props = { modelValue: '<p><span>text</span></p>', mode: 'accurate' as const };
        const render = createStreamContainsRender(props, {}, options);
        const vnode = render();

        const outerVNode = vnode.children[0];
        const innerVNode = outerVNode.children.default()[0];
        innerVNode.props.reportData({ key: 'val' });

        await new Promise(resolve => setTimeout(resolve, 0));
        expect(emit).toHaveBeenCalled();
    });

    it('handles self-closing tag in fast mode', async () => {
        const props = { modelValue: '<br/>', mode: 'fast' as const };
        const render = createStreamContainsRender(props, {}, options);
        const vnode = render();
        expect(vnode.props.class).toContain('mode-fast');
        await new Promise(resolve => setTimeout(resolve, 0));
        expect(emit).toHaveBeenCalled();
    });

    it('calls reportData on text block with baseComponent', async () => {
        const props = {
            modelValue: 'hello',
            mode: 'accurate' as const,
            baseComponent: BaseComponent
        };
        const render = createStreamContainsRender(props, {}, options);
        const vnode = render();
        const baseVNode = vnode.children[0];

        baseVNode.props.reportData({ rendered: 'text' });

        await new Promise(resolve => setTimeout(resolve, 0));
        expect(emit).toHaveBeenCalled();
    });
});
