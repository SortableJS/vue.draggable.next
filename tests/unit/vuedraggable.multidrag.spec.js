import { mount } from "@vue/test-utils";
import Sortable from "sortablejs";
import "./helper/setup";
import draggable from "@/vuedraggable";
import { nextTick, h } from "vue";

function create(options) {
  const opts = Object.assign({
    slots: {
      item: ({ element }) => {
        return h("div", null, element);
      },
      header: () => h("header"),
      footer: () => h("footer")
    },
  }, options);
  const wrapper = mount(draggable, opts)
  const { vm, element } = wrapper;
  const { $options: { props } } = vm;
  return { wrapper, vm, props, element };
}

/**
 * @param {'addEventListener' | 'removeEventListener'} listnerName 
 * @param {GlobalEventHandlers[listnerName]} callback 
 * @returns {jest.SpyInstance}
 */
function eventListnerDelegationMock(listnerName, callback) {
  const instance = jest.spyOn(document, listnerName);
  const actual = instance.getMockImplementation();
  return instance.mockImplementation((type, listener, options) => {
    actual.call(document, type, listener, options);
    callback && callback(type, listener, options);
  });
}

describe("draggable.vue with multidrag plugin", () => {
  describe("when initialized", () => {
    const { error } = console;
    const { warn } = console;

    beforeEach(() => {
      console.error = jest.fn();
      console.warn = jest.fn();
    });

    afterEach(() => {
      console.error = error;
      console.warn = warn;
    });

    it('instantiate without error', () => {
      const list = ["a", "b", "c"];
      const { element, wrapper, vm } = create({
        props: {
          list, 
          itemKey: key => key
        },
        attrs: {
          multiDrag: true,
          selectedClass: 'selected',
        },
      });
      expect(wrapper).not.toBeUndefined();
      expect(vm._sortable.options).toMatchObject({
        multiDrag: true,
        selectedClass: 'selected',
      });
      expect(console.error).not.toHaveBeenCalled();
      expect(console.warn).not.toHaveBeenCalled();
    });
  });

  describe('item select and deselect', () => {
    /** @type {import('@vue/test-utils').Wrapper<Vue>} */
    let wrapper;
    /** @type {Vue} */
    let vm;
    /** @type {jest.SpyInstance} */
    let addEventListenerMock;
    /** @type {jest.SpyInstance} */
    let removeEventListenerMock;

    beforeEach(() => {
      // event listener delegation hack
      addEventListenerMock = eventListnerDelegationMock('addEventListener', (type, listener, options) => {
        wrapper?.element?.addEventListener(type, listener, options);
      });
      removeEventListenerMock = eventListnerDelegationMock('removeEventListener', (type, listener, options) => {
        wrapper?.element?.removeEventListener(type, listener, options);
      });

      // component
      const items = ['a', 'b', 'c', 'd'];
      const { wrapper: _w, vm: _v } = create({
        props: {
          list: items,
          itemKey: key => key
        },
        attrs: {
          multiDrag: true,
          selectedClass: 'selected',
        },
      });
      wrapper = _w;
      vm = _v;
    });

    afterEach(() => {
      addEventListenerMock.mockRestore();
      removeEventListenerMock.mockRestore();
    });

    it('should be selected', async () => {
      const wrapperItems = wrapper.findAll('[data-draggable]');
      const item1 = wrapperItems[0];
      const item2 = wrapperItems[wrapperItems.length - 1];

      expect(item1.element.matches('.selected')).toBe(false);
      expect(item2.element.matches('.selected')).toBe(false);

      // select first item
      // simulate mouse event
      await item1.trigger('mousedown').then(() => item1.trigger('mouseup'));
      expect(item1.element.matches('.selected')).toBe(true);

      // select second item
      // simulate mouse event
      await item2.trigger('mousedown').then(() => item2.trigger('mouseup'));
      expect(item2.element.matches('.selected')).toBe(true);

      // check emit event
      const { select: selectEmit } = wrapper.emitted();
      expect(selectEmit).not.toBeUndefined();
      expect(selectEmit).toHaveLength(2);
      const [[emitEvent1], [emitEvent2]] = selectEmit;
      expect(emitEvent1.items).toEqual([item1.element]);
      expect(emitEvent1.newIndicies).toEqual([{ multiDragElement: item1.element, index: 1 }]);
      expect(emitEvent2.items).toEqual([item1.element, item2.element]);
      expect(emitEvent2.newIndicies).toEqual([{ multiDragElement: item1.element, index: 1 }, { multiDragElement: item2.element, index: 4 }]);
    });

    it('should be deselected', async () => {
      const wrapperItems = wrapper.findAll('[data-draggable]');
      const item1 = wrapperItems[0];
      const item2 = wrapperItems[wrapperItems.length - 1];

      // select items for deselect
      Sortable.utils.select(item1.element);
      Sortable.utils.select(item2.element);

      expect(item1.element.matches('.selected')).toBe(true);
      expect(item2.element.matches('.selected')).toBe(true);

      // deselect first item
      // simulate mouse event
      await item1.trigger('mousedown').then(() => item1.trigger('mouseup'));
      expect(item1.element.matches('.selected')).toBe(false);

      // deselect second item
      // simulate mouse event
      await item2.trigger('mousedown').then(() => item2.trigger('mouseup'));
      expect(item2.element.matches('.selected')).toBe(false);

      // check emit event
      const { deselect: deselectEmit } = wrapper.emitted();
      expect(deselectEmit).not.toBeUndefined();
      expect(deselectEmit).toHaveLength(2);
      const [[emitEvent1], [emitEvent2]] = deselectEmit;
      expect(emitEvent1.items).toEqual([item2.element]);
      expect(emitEvent1.newIndicies).toEqual([{ multiDragElement: item2.element, index: 4 }]);
      expect(emitEvent2.items).toEqual([]);
      expect(emitEvent2.newIndicies).toEqual([]);
    });
  });

  describe('multi item drag and drop', () => {
    /** @type {import('@vue/test-utils').Wrapper<Vue>} */
    let wrapper;
    /** @type {import('@vue/test-utils').WrapperArray<Vue>} */
    let wrapperItems;
    /** @type {import('@vue/test-utils').Wrapper<Vue>} */
    let item1;
    /** @type {import('@vue/test-utils').Wrapper<Vue>} */
    let item2;
    /** @type {Vue} */
    let vm;
    /** @type {jest.SpyInstance} */
    let addEventListenerMock;
    /** @type {jest.SpyInstance} */
    let removeEventListenerMock;
    /** @type {(event: Event) => void} */
    let onStart;
    /** @type {(event: Event) => void} */
    let onUpdate;
    /** @type {(event: Event) => void} */
    let onAdd;
    /** @type {(event: Event) => void} */
    let onRemove;

    beforeEach(() => {
      // event listener delegation hack
      addEventListenerMock = eventListnerDelegationMock('addEventListener', (type, listener, options) => {
        wrapper?.element?.addEventListener(type, listener, options);
      });
      removeEventListenerMock = eventListnerDelegationMock('removeEventListener', (type, listener, options) => {
        wrapper?.element?.removeEventListener(type, listener, options);
      });

      // component
      const items = ['a', 'b', 'c', 'd'];
      const { wrapper: _w, vm: _v } = create({
        props: {
          list: items,
          itemKey: key => key
        },
        attrs: {
          multiDrag: true,
          selectedClass: 'selected',
        },
      });
      wrapper = _w;
      vm = _v;
      wrapperItems = wrapper.findAll('[data-draggable]');

      onStart = vm._sortable.options.onStart;
      onUpdate = vm._sortable.options.onUpdate;
      onAdd = vm._sortable.options.onAdd;
      onRemove = vm._sortable.options.onRemove;
    });

    afterEach(() => {
      addEventListenerMock.mockRestore();
      removeEventListenerMock.mockRestore();
    });

    describe('when drop first and second into last', () => {
      beforeEach(async () => {
        item1 = wrapperItems[0];
        item2 = wrapperItems[1];

        // start drag from first item
        const startEvent = {
          item: item1.element,
          items: [item1.element, item2.element],
        };
        onStart(startEvent);
        await nextTick();

        // console.log(Array.from(vm.targetDomElement.children))
        // drop to last item
        const updateEvent = {
          from: wrapper.element,
          newIndex: 3,
          newDraggableIndex: 3,
          oldIndex: 1,
          oldDraggableIndex: 1,
          item: item1.element,
          items: [item1.element, item2.element],
          oldIndicies: [
            { multiDragElement: item1.element, index: 1 },
            { multiDragElement: item2.element, index: 2 },
          ],
          newIndicies: [
            { multiDragElement: item1.element, index: 3 },
            { multiDragElement: item2.element, index: 4 },
          ],
        };
        onUpdate(updateEvent);
        await nextTick();
      });

      it('should changed', () => {
        expect(vm.list).toEqual(['c', 'd', 'a', 'b']);
      });

      it('should send events', () => {
        const expectedEvents = {
          moved: [
            { element: 'a', oldIndex: 0, newIndex: 2 },
            { element: 'b', oldIndex: 1, newIndex: 3 }
          ]
        };
        const { start: startEmit, update: updateEmit, change: changeEmit } = wrapper.emitted();
        expect(startEmit).toHaveLength(1);
        expect(updateEmit).toHaveLength(1);
        expect(changeEmit).toHaveLength(1);
        expect(changeEmit).toEqual([[expectedEvents]]);
      });
    });

    describe('when drop second and first into last', () => {
      beforeEach(async () => {
        item1 = wrapperItems[0];
        item2 = wrapperItems[1];
  
        // start drag from first item
        const startEvent = {
          item: item2.element,
          items: [item2.element, item1.element],
        };
        onStart(startEvent);
        await nextTick();

        // drop to last item
        const updateEvent = {
          from: wrapper.element,
          newIndex: 3,
          newDraggableIndex: 3,
          oldIndex: 1,
          oldDraggableIndex: 1,
          item: item1.element,
          items: [item2.element, item1.element],
          oldIndicies: [
            { multiDragElement: item2.element, index: 2 },
            { multiDragElement: item1.element, index: 1 },
          ],
          newIndicies: [
            { multiDragElement: item2.element, index: 4 },
            { multiDragElement: item1.element, index: 3 },
          ],
        };
        onUpdate(updateEvent);
        await nextTick();
      });

      it('should changed', () => {
        expect(vm.list).toEqual(['c', 'd', 'a', 'b']);
      });

      it('should send events', () => {
        const expectedEvents = {
          moved: [
            { element: 'a', oldIndex: 0, newIndex: 2 },
            { element: 'b', oldIndex: 1, newIndex: 3 }
          ]
        };
        const { start: startEmit, update: updateEmit, change: changeEmit } = wrapper.emitted();
        expect(startEmit).toHaveLength(1);
        expect(updateEmit).toHaveLength(1);
        expect(changeEmit).toHaveLength(1);
        expect(changeEmit).toEqual([[expectedEvents]]);
      });
    });

    describe('when drop second and last into first', () => {
      beforeEach(async () => {
        item1 = wrapperItems[1];
        item2 = wrapperItems[3];
  
        // start drag from second item
        const startEvent = {
          item: item1.element,
          items: [item1.element, item2.element],
        };
        onStart(startEvent);
        await nextTick();

        // console.log(Array.from(vm.targetDomElement.children))
        // drop to first item
        const updateEvent = {
          from: wrapper.element,
          newIndex: 0,
          newDraggableIndex: 0,
          oldIndex: 1,
          oldDraggableIndex: 1,
          item: item1.element,
          items: [item2.element, item1.element],
          oldIndicies: [
            { multiDragElement: item1.element, index: 2 },
            { multiDragElement: item2.element, index: 4 },
          ],
          newIndicies: [
            { multiDragElement: item1.element, index: 1 },
            { multiDragElement: item2.element, index: 2 },
          ],
        };
        onUpdate(updateEvent);
        await nextTick();
      });

      it('should changed', () => {
        expect(vm.list).toEqual(['b', 'd', 'a', 'c']);
      });

      it('should send events', () => {
        const expectedEvents = {
          moved: [
            { element: 'b', oldIndex: 1, newIndex: 0 },
            { element: 'd', oldIndex: 3, newIndex: 1 }
          ]
        };
        const { start: startEmit, update: updateEmit, change: changeEmit } = wrapper.emitted();
        expect(startEmit).toHaveLength(1);
        expect(updateEmit).toHaveLength(1);
        expect(changeEmit).toHaveLength(1);
        expect(changeEmit).toEqual([[expectedEvents]]);
      });
    });

    describe('when selecting items, but dragging a non-selected item', () => {
      /** @type {HTMLElement[]} */
      let newElements;

      beforeEach(async () => {
        const newItems = ['x', 'y'];
        newElements = newItems.map((item) => {
          const element = document.createElement('div');
          element.appendChild(document.createTextNode(item));
          return element;
        });
        const newElement = newElements[0];
        // after selecting items, but then dragging a non-selected item, items is an empty array
        const eventItems = []
        newElement._underlying_vm_ = newItems[0];

        // drop after last item
        // console.log(Array.from(vm.targetDomElement.children))
        const addEvent = {
          newIndex: 5,
          newDraggableIndex: 5,
          item: newElement,
          items: eventItems
        };
        onAdd(addEvent);
        await nextTick();
      });

      it('should added', () => {
        expect(vm.list).toEqual(['a', 'b', 'c', 'd', 'x']);
      });

      it('should send events', () => {
        const expectedEvents = {
          added: { element: 'x', newIndex: 4 },
        };
        const { add: addEmit, change: changeEmit } = wrapper.emitted();
        expect(addEmit).toHaveLength(1);
        expect(changeEmit).toHaveLength(1);
        expect(changeEmit).toEqual([[expectedEvents]]);
      });
    });

    describe('when drop from other (add)', () => {
      /** @type {HTMLElement[]} */
      let newElements;

      beforeEach(async () => {
        const newItems = ['x', 'y'];
        newElements = newItems.map((item) => {
          const element = document.createElement('div');
          element.appendChild(document.createTextNode(item));
          return element;
        });
        const newElement = newElements[0];
        newElement._underlying_vm_multidrag_ = newItems;

        // drop after last item
        const addEvent = {
          newIndex: 5,
          newDraggableIndex: 5,
          item: newElement,
          items: newElements,
        };
        onAdd(addEvent);
        await nextTick();
      });

      it('should added', () => {
        expect(vm.list).toEqual(['a', 'b', 'c', 'd', 'x', 'y']);
      });

      it('should send events', () => {
        const expectedEvents = {
          added: [
            { element: 'x', newIndex: 4 },
            { element: 'y', newIndex: 5 }
          ]
        };
        const { add: addEmit, change: changeEmit } = wrapper.emitted();
        expect(addEmit).toHaveLength(1);
        expect(changeEmit).toHaveLength(1);
        expect(changeEmit).toEqual([[expectedEvents]]);
      });
    });

    describe('when drop to other (remove)', () => {
      beforeEach(async () => {
        item1 = wrapperItems[0];
        item2 = wrapperItems[2];
  
        // start drag from first item
        const startEvent = {
          item: item1.element,
          items: [item1.element, item2.element],
        };
        onStart(startEvent);
        await nextTick();

        wrapper.element.removeChild(item1.element);
        wrapper.element.removeChild(item2.element);

        // drop after last item
        const removeEvent = {
          newIndex: 5,
          newDraggableIndex: 5,
          item: item1,
          items: [item1, item2],
          oldIndicies: [
            { multiDragElement: item1.element, index: 1 },
            { multiDragElement: item2.element, index: 3 },
          ],
        };
        onRemove(removeEvent);
        await nextTick();
      });

      it('should removed', () => {
        expect(vm.list).toEqual(['b', 'd']);
      });

      it('should send events', () => {
        const expectedEvents = {
          removed: [
            { element: 'a', oldIndex: 0 },
            { element: 'c', oldIndex: 2 }
          ]
        };
        const { remove: removeEmit, change: changeEmit } = wrapper.emitted();
        expect(removeEmit).toHaveLength(1);
        expect(changeEmit).toHaveLength(1);
        expect(changeEmit).toEqual([[expectedEvents]]);
      });
    });
  });
});
