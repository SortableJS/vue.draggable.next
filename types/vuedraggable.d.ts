export default draggableComponent;
declare const draggableComponent: import("vue").DefineComponent<{
    list: {
        type: ArrayConstructor;
        required: boolean;
        default: any;
    };
    modelValue: {
        type: ArrayConstructor;
        required: boolean;
        default: any;
    };
    itemKey: {
        type: (FunctionConstructor | StringConstructor)[];
        required: boolean;
    };
    clone: {
        type: FunctionConstructor;
        default: (original: any) => any;
    };
    tag: {
        type: StringConstructor;
        default: string;
    };
    move: {
        type: FunctionConstructor;
        default: any;
    };
    componentData: {
        type: ObjectConstructor;
        required: boolean;
        default: any;
    };
}, any, {
    error: boolean;
}, {
    realList(): any;
    getKey(): any;
}, {
    getUnderlyingVm(domElement: any): any;
    getUnderlyingPotencialDraggableComponent(htmElement: any): any;
    emitChanges(evt: any): void;
    alterList(onList: any): void;
    spliceList(): void;
    updatePosition(oldIndex: any, newIndex: any): void;
    getRelatedContextFromMoveEvent({ to, related }: {
        to: any;
        related: any;
    }): any;
    getVmIndexFromDomIndex(domIndex: any): any;
    onDragStart(evt: any): void;
    onDragAdd(evt: any): void;
    onDragRemove(evt: any): void;
    onDragUpdate(evt: any): void;
    computeFutureIndex(relatedContext: any, evt: any): any;
    onDragMove(evt: any, originalEvent: any): any;
    onDragEnd(): void;
}, import("vue").ComponentOptionsMixin, import("vue").ComponentOptionsMixin, string[], string, import("vue").VNodeProps & import("vue").AllowedComponentProps & import("vue").ComponentCustomProps, Readonly<{
    move: Function;
    clone: Function;
    componentData: Record<string, any>;
    tag: string;
    list: unknown[];
    modelValue: unknown[];
} & {
    itemKey?: string | Function;
}>, {
    move: Function;
    clone: Function;
    componentData: Record<string, any>;
    tag: string;
    list: unknown[];
    modelValue: unknown[];
}>;
