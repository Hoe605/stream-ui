import { defineComponent, useSlots } from 'vue';
import { createStreamContainsRender, streamContainsProps, type StreamContainsProps } from './core/stream-contains-core';
import { DefaultTag } from './core/default-tag';

export const StreamContains = defineComponent({
    name: 'StreamContains',
    props: streamContainsProps,
    setup(props) {
        return createStreamContainsRender(props as StreamContainsProps, useSlots(), {
            DefaultTag
        });
    }
});
