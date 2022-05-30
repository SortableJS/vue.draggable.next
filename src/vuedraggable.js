import Sortable, { MultiDrag, Swap } from "sortablejs";
import { insertNodeAt, removeNode } from "./util/htmlHelper";
import { console } from "./util/console";
import {
  getComponentAttributes,
  createSortableOption,
  getValidSortableEntries
} from "./core/componentBuilderHelper";
import { computeComponentStructure } from "./core/renderHelper";
import { events } from "./core/sortableEvents";
import { h, defineComponent, nextTick } from "vue";

function emit(evtName, evtData) {
  nextTick(() => this.$emit(evtName.toLowerCase(), evtData));
}

function manage(evtName) {
  return (evtData, originalElement) => {
    if (this.realList !== null) {
      return this[`onDrag${evtName}`](evtData, originalElement);
    }
  };
}

function manageAndEmit(evtName) {
  const delegateCallBack = manage.call(this, evtName);
  return (evtData, originalElement) => {
    delegateCallBack.call(this, evtData, originalElement);
    emit.call(this, evtName, evtData);
  };
}

function createSortableInstance(rootContainer, options) {
  const sortable = new Sortable(rootContainer, options);
  // check multidrag plugin loaded
  // - cjs ("sortable.js") and complete esm ("sortable.complete.esm") mount MultiDrag automatically.
  // - default esm ("sortable.esm") does not mount MultiDrag automatically.
  if (options.swap && !sortable.swap) {
    // mount plugin if not mounted
    Sortable.mount(new Swap());
    // destroy and recreate sortable.js instance
    sortable.destroy();
    return createSortableInstance(rootContainer, options);
  } else if (options.multiDrag && !sortable.multiDrag) {
    // mount plugin if not mounted
    Sortable.mount(new MultiDrag());
    // destroy and recreate sortable.js instance
    sortable.destroy();
    return createSortableInstance(rootContainer, options);
  } else {
    return sortable;
  }
}

function getIndiciesToRemove(items, offset) {
  return Array.from(items)
    .reverse()
    .map(({ index }) => index - offset);
}

let draggingElement = null;

const props = {
  list: {
    type: Array,
    required: false,
    default: null
  },
  modelValue: {
    type: Array,
    required: false,
    default: null
  },
  itemKey: {
    type: [String, Function],
    required: true
  },
  clone: {
    type: Function,
    default: original => {
      return original;
    }
  },
  tag: {
    type: String,
    default: "div"
  },
  move: {
    type: Function,
    default: null
  },
  componentData: {
    type: Object,
    required: false,
    default: null
  }
};

const emits = [
  "update:modelValue",
  "change",
  ...[...events.manageAndEmit, ...events.emit].map(evt => evt.toLowerCase())
];

const draggableComponent = defineComponent({
  name: "draggable",

  inheritAttrs: false,

  props,

  emits,

  data() {
    return {
      error: false
    };
  },

  render() {
    try {
      this.error = false;
      const { $slots, $attrs, tag, componentData, realList, getKey } = this;
      const componentStructure = computeComponentStructure({
        $slots,
        tag,
        realList,
        getKey
      });
      this.componentStructure = componentStructure;
      const attributes = getComponentAttributes({ $attrs, componentData });
      return componentStructure.render(h, attributes);
    } catch (err) {
      this.error = true;
      return h("pre", { style: { color: "red" } }, err.stack);
    }
  },

  created() {
    if (this.list !== null && this.modelValue !== null) {
      console.error(
        "modelValue and list props are mutually exclusive! Please set one or another."
      );
    }
  },

  mounted() {
    if (this.error) {
      return;
    }

    const { $attrs, $el, componentStructure } = this;
    componentStructure.updated();

    const sortableOptions = createSortableOption({
      $attrs,
      callBackBuilder: {
        manageAndEmit: event => manageAndEmit.call(this, event),
        emit: event => emit.bind(this, event),
        manage: event => manage.call(this, event)
      }
    });
    const targetDomElement = $el.nodeType === 1 ? $el : $el.parentElement;
    this._sortable = createSortableInstance(targetDomElement, sortableOptions);
    this.targetDomElement = targetDomElement;
    targetDomElement.__draggable_component__ = this;
  },

  updated() {
    this.componentStructure.updated();
  },

  beforeUnmount() {
    if (this._sortable !== undefined) this._sortable.destroy();
  },

  computed: {
    realList() {
      const { list } = this;
      return list ? list : this.modelValue;
    },

    getKey() {
      const { itemKey } = this;
      if (typeof itemKey === "function") {
        return itemKey;
      }
      return element => element[itemKey];
    }
  },

  watch: {
    $attrs: {
      handler(newOptionValue) {
        const { _sortable } = this;
        if (!_sortable) return;
        getValidSortableEntries(newOptionValue).forEach(([key, value]) => {
          _sortable.option(key, value);
        });
      },
      deep: true
    }
  },

  methods: {
    getUnderlyingVm(domElement) {
      return this.componentStructure.getUnderlyingVm(domElement) || null;
    },

    getUnderlyingPotencialDraggableComponent(htmElement) {
      //TODO check case where you need to see component children
      return htmElement.__draggable_component__;
    },

    emitChanges(evt) {
      nextTick(() => this.$emit("change", evt));
    },

    alterList(onList) {
      if (this.list) {
        onList(this.list);
        return;
      }
      const newList = [...this.modelValue];
      onList(newList);
      this.$emit("update:modelValue", newList);
    },

    spliceList() {
      // @ts-ignore
      const spliceList = list => list.splice(...arguments);
      this.alterList(spliceList);
    },

    removeAllFromList(indicies) {
      const spliceList = list =>
        indicies.forEach(index => list.splice(index, 1));
      this.alterList(spliceList);
    },

    swapPosition(oldIndex, newIndex) {
      const swapPosition = list => {
        const temp = list[oldIndex];
        list[oldIndex] = list[newIndex];
        list[newIndex] = temp;
      };
      this.alterList(swapPosition);
    },

    updatePosition(oldIndex, newIndex) {
      const updatePosition = list =>
        list.splice(newIndex, 0, list.splice(oldIndex, 1)[0]);
      this.alterList(updatePosition);
    },

    updatePositions(oldIndicies, newIndex) {
      /** @type {<T = any>(list: T[]) => T[]} */
      const updatePosition = list => {
        // get selected items with correct order
        // sort -> reverse (for prevent Array.splice side effect) -> splice -> reverse
        const items = oldIndicies
          .sort()
          .reverse()
          .flatMap(oldIndex => list.splice(oldIndex, 1))
          .reverse();
        return list.splice(newIndex, 0, ...items);
      };
      this.alterList(updatePosition);
    },

    getRelatedContextFromMoveEvent({ to, related }) {
      const component = this.getUnderlyingPotencialDraggableComponent(to);
      if (!component) {
        return { component };
      }
      const list = component.realList;
      const context = { list, component };
      if (to !== related && list) {
        const destination = component.getUnderlyingVm(related) || {};
        return { ...destination, ...context };
      }
      return context;
    },

    getVmIndexFromDomIndex(domIndex) {
      return this.componentStructure.getVmIndexFromDomIndex(
        domIndex,
        this.targetDomElement
      );
    },

    onDragStart(evt) {
      if (Array.isArray(evt.items) && evt.items.length) {
        this.multidragContexts = evt.items.map(e => this.getUnderlyingVm(e));
        const elements = this.multidragContexts
          .sort(({ index: a }, { index: b }) => a - b)
          .map(e => e.element);
        evt.item._underlying_vm_multidrag_ = this.clone(elements);
      }
      this.context = this.getUnderlyingVm(evt.item);
      evt.item._underlying_vm_ = this.clone(this.context.element);
      draggingElement = evt.item;
    },

    onDragAdd(evt) {
      if (Array.isArray(evt.items) && evt.items.length) {
        this.onDragAddMulti(evt);
      } else {
        this.onDragAddSingle(evt);
      }
    },

    onDragAddMulti(evt) {
      const elements = evt.item._underlying_vm_multidrag_;
      if (elements === undefined) {
        return;
      }
      // remove nodes
      evt.items.forEach(e => removeNode(e));
      // insert elements
      const newIndex = this.getVmIndexFromDomIndex(evt.newIndex);
      this.spliceList(newIndex, 0, ...elements);
      // emit change
      const added = elements.map((element, index) => ({
        element,
        newIndex: newIndex + index
      }));
      this.emitChanges({ added });
    },

    onDragAddSingle(evt) {
      const swapMode = this._sortable.options && this._sortable.options.swap;
      const element = evt.item._underlying_vm_;
      if (element === undefined) {
        return;
      }
      const swapItem = swapMode ? evt.from.children[evt.oldIndex] : null;
      removeNode(evt.item);
      let newIndex = this.getVmIndexFromDomIndex(evt.newIndex);
      if (swapMode) newIndex = newIndex === 0 ? 0 : newIndex - 1;
      // @ts-ignore
      this.spliceList(newIndex, swapMode ? 1 : 0, element);
      const added = { element, newIndex };
      if (evt.swap) return;
      this.emitChanges({ added });
      if (!swapMode) return;
      const swapEvt = {
        to: evt.from,
        from: evt.to,
        item: swapItem,
        oldIndex: evt.newIndex,
        newIndex: evt.oldIndex,
        swap: true
      };
      nextTick(() => {
        const context = swapEvt.to.__draggable_component__;
        context.onDragStart(swapEvt);
        context.onDragAdd(swapEvt);
      });
    },

    onDragRemove(evt) {
      if (Array.isArray(evt.items) && evt.items.length) {
        this.onDragRemoveMulti(evt);
      } else {
        this.onDragRemoveSingle(evt);
      }
    },

    onDragRemoveMulti(evt) {
      // for match item index and element index
      const headerSize =
        (this.$slots.header ? this.$slots.header() : []).length || 0;
      // sort old indicies
      // - "order by index asc" for prevent Node.insertBefore side effect
      const items = evt.oldIndicies.sort(({ index: a }, { index: b }) => a - b);
      // restore nodes
      items.forEach(({ multiDragElement: item, index }) => {
        insertNodeAt(this.$el, item, index);
        if (item.parentNode) {
          Sortable.utils.deselect(item);
        }
      });
      // if clone
      if (evt.pullMode === "clone") {
        removeNode(evt.clone);
        return;
      }
      // remove items and reset transition data
      // - "order by index desc" (call reverse()) for prevent Array.splice side effect
      const indiciesToRemove = getIndiciesToRemove(items, headerSize);
      this.removeAllFromList(indiciesToRemove);
      // emit change
      const removed = indiciesToRemove.sort().map(oldIndex => {
        const context = this.multidragContexts.find(e => e.index === oldIndex);
        return { element: context.element, oldIndex };
      });
      this.emitChanges({ removed });
    },

    onDragRemoveSingle(evt) {
      const { index: oldIndex, element } = this.context;
      const removed = { element, oldIndex };
      if (this._sortable.options && this._sortable.options.swap)
        return this.emitChanges({ removed });
      insertNodeAt(this.$el, evt.item, evt.oldIndex);
      if (evt.pullMode === "clone") {
        removeNode(evt.clone);
        return;
      }
      // @ts-ignore
      this.spliceList(oldIndex, 1);
      this.emitChanges({ removed });
    },

    onDragUpdate(evt) {
      if (Array.isArray(evt.items) && evt.items.length) {
        if (!evt.pullMode) this.onDragUpdateMulti(evt);
      } else {
        this.onDragUpdateSingle(evt);
      }
    },

    onDragUpdateMulti(evt) {
      const { items, from } = evt;
      // for match item index and element index
      const headerSize =
        (this.$slots.header ? this.$slots.header() : []).length || 0;
      // remove nodes
      items.forEach(item => removeNode(item));
      // sort items
      // note: "order by oldIndex asc" for prevent Node.insertBefore side effect
      const itemsWithIndex = Array.from(evt.oldIndicies).sort(
        ({ index: a }, { index: b }) => a - b
      );
      // insert nodes
      itemsWithIndex.forEach(e =>
        insertNodeAt(from, e.multiDragElement, e.index)
      );
      // move items
      const oldIndicies = itemsWithIndex.map(({ index }) => index - headerSize);
      const newIndex = this.getVmIndexFromDomIndex(evt.newIndex);
      // note: Array.from = prevent sort change side effect
      this.updatePositions(Array.from(oldIndicies), newIndex);
      // emit change
      const moved = oldIndicies.map((oldIndex, index) => {
        const context = this.multidragContexts.find(e => e.index === oldIndex);
        return {
          element: context.element,
          oldIndex,
          newIndex: newIndex + index
        };
      });
      this.emitChanges({ moved });
    },

    onDragUpdateSingle(evt) {
      const swapMode = this._sortable.options && this._sortable.options.swap;
      const swapItem = swapMode ? evt.from.children[evt.oldIndex] : null;
      removeNode(evt.item);
      insertNodeAt(evt.from, evt.item, evt.oldIndex);
      if (swapMode) {
        removeNode(swapItem);
        insertNodeAt(evt.from, swapItem, evt.newIndex);
      }
      const oldIndex = this.context.index;
      const newIndex = this.getVmIndexFromDomIndex(evt.newIndex);
      if (swapMode) this.swapPosition(oldIndex, newIndex);
      else this.updatePosition(oldIndex, newIndex);
      const moved = { element: this.context.element, oldIndex, newIndex };
      this.emitChanges({ moved });
    },

    computeFutureIndex(relatedContext, evt) {
      if (!relatedContext.element) {
        return 0;
      }
      const domChildren = [...evt.to.children].filter(
        el => el.style["display"] !== "none"
      );
      const currentDomIndex = domChildren.indexOf(evt.related);
      const currentIndex = relatedContext.component.getVmIndexFromDomIndex(
        currentDomIndex
      );
      const draggedInList = domChildren.indexOf(draggingElement) !== -1;
      return draggedInList || !evt.willInsertAfter
        ? currentIndex
        : currentIndex + 1;
    },

    onDragMove(evt, originalEvent) {
      const { move, realList } = this;
      if (!move || !realList) {
        return true;
      }

      const relatedContext = this.getRelatedContextFromMoveEvent(evt);
      const futureIndex = this.computeFutureIndex(relatedContext, evt);
      const draggedContext = {
        ...this.context,
        futureIndex
      };
      const sendEvent = {
        ...evt,
        relatedContext,
        draggedContext
      };
      return move(sendEvent, originalEvent);
    },

    onDragEnd() {
      draggingElement = null;
    }
  }
});

export default draggableComponent;
