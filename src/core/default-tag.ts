import { defineComponent, h } from 'vue';

export const DEFAULT_TAG_STYLES = {
    container: {
        border: '1px solid #ebeef5',
        borderRadius: '8px',
        margin: '16px 0',
        overflow: 'hidden',
        backgroundColor: '#fafafa'
    },
    header: {
        backgroundColor: '#f5f7fa',
        padding: '6px 12px',
        borderBottom: '1px solid #ebeef5',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        userSelect: 'none'
    },
    icon: {
        fontSize: '12px',
        color: '#606266'
    },
    name: {
        fontSize: '11px',
        fontWeight: 700,
        color: '#606266',
        letterSpacing: '0.8px'
    },
    label: {
        fontSize: '10px',
        color: '#909399',
        backgroundColor: '#ffffff',
        padding: '1px 6px',
        borderRadius: '4px',
        border: '1px solid #e4e7ed'
    },
    content: {
        padding: '12px 16px',
        color: '#303133',
        lineHeight: '1.6',
        fontSize: '14px',
        whiteSpace: 'pre-wrap',
        wordBreak: 'break-word'
    }
} as const;

export const DefaultTag = defineComponent({
    name: 'StreamContainsDefaultTag',
    props: {
        tagName: {
            type: String,
            required: true
        },
        content: {
            type: String,
            default: ''
        },
        isClosed: {
            type: Boolean,
            default: true
        }
    },
    setup(props, { slots }) {
        return () =>
            h('div', { style: DEFAULT_TAG_STYLES.container }, [
                h('div', { style: DEFAULT_TAG_STYLES.header }, [
                    h('span', { style: DEFAULT_TAG_STYLES.icon }, '[]'),
                    h('span', { style: DEFAULT_TAG_STYLES.name }, props.tagName.toUpperCase()),
                    h('span', { style: DEFAULT_TAG_STYLES.label }, props.isClosed ? 'fallback' : 'streaming')
                ]),
                h('div', { style: DEFAULT_TAG_STYLES.content }, slots.default ? slots.default() : props.content)
            ]);
    }
});
