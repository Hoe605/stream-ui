import { defineComponent, useSlots } from 'vue';
import { createStreamContainsRender, streamContainsProps, type StreamContainsProps } from './core/stream-contains-core';
import { DefaultTag } from './core/default-tag';

export const StreamContains = defineComponent({
    name: 'StreamContains',
    props: streamContainsProps,
    emits: ['update:data'],
    setup(props, { emit }) {
        return createStreamContainsRender(props as StreamContainsProps, useSlots(), {
            emit,
            DefaultTag
        });
    }
});
