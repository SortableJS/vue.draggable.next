declare module 'vuedraggable' {

  import { ComponentPublicInstance, VueConstructor } from 'vue';

  type CombinedVueInstance<
    Instance extends ComponentPublicInstance,
    Data,
    Methods,
    Computed,
    Props
  > = Data & Methods & Computed & Props & Instance;

  type ExtendedVue<
    Instance extends ComponentPublicInstance,
    Data,
    Methods,
    Computed,
    Props
  > = VueConstructor<
    CombinedVueInstance<Instance, Data, Methods, Computed, Props> & ComponentPublicInstance
  >;

  export type DraggedContext<T> = {
    index: number;
    futureIndex: number;
    element: T;
  };

  export type DropContext<T> = {
    index: number;
    component: ComponentPublicInstance;
    element: T;
  };

  export type Rectangle = {
    top: number;
    right: number;
    bottom: number;
    left: number;
    width: number;
    height: number;
  };

  export type MoveEvent<T> = {
    originalEvent: DragEvent;
    dragged: Element;
    draggedContext: DraggedContext<T>;
    draggedRect: Rectangle;
    related: Element;
    relatedContext: DropContext<T>;
    relatedRect: Rectangle;
    from: Element;
    to: Element;
    willInsertAfter: boolean;
    isTrusted: boolean;
  };

  export type ChangeEvent<T> = {
    added?: {
      element: T;
      newIndex: number;
    };
    removed?: {
      element: T;
      oldIndex: number;
    };
    moved?: {
      element: T;
      newIndex: number;
      oldIndex: number;
    };
  };

  const draggable: ExtendedVue<
    ComponentPublicInstance,
    {},
    {},
    {},
    {
      options: any;
      list: any[];
      value: any[];
      clone: any;
      tag?: string | null;
      move: any;
      componentData: any;
    }
  >;

  export default draggable;
}
