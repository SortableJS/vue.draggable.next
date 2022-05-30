import { mount } from "@vue/test-utils";
import Sortable from "sortablejs";
import "./helper/setup";
import draggable from "@/vuedraggable";
import { nextTick, h } from "vue";

function create(options, slots) {
  const opts = Object.assign({
    slots: Object.assign({
      item: ({ element }) => {
        return h("div", null, element);
      }
    }, slots),
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

describe("draggable.vue with swap plugin", () => {
  describe.skip("when initialized", () => {
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
          swap: true
        },
      });
      expect(wrapper).not.toBeUndefined();
      expect(vm._sortable.options).toMatchObject({
        swap: true
      });
      expect(console.error).not.toHaveBeenCalled();
      expect(console.warn).not.toHaveBeenCalled();
    });
  });

  describe('swap drag and drop', () => {
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

    describe('without header', () => {
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
            swap: true
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

      describe('when drop first into third', () => {
        beforeEach(async () => {
          item1 = wrapperItems[0];

          // start drag from first item
          const startEvent = { item: item1.element };
          onStart(startEvent);
          await nextTick();

          // console.log(Array.from(vm.targetDomElement.children))
          // drop to last item
          const updateEvent = {
            from: wrapper.element,
            newIndex: 2,
            oldIndex: 0,
            item: item1.element
          };
          onUpdate(updateEvent);
          await nextTick();
        });

        it('should change', () => {
          expect(vm.list).toEqual(['c', 'b', 'a', 'd']);
        });

        it('should send events', () => {
          const expectedEvents = {
            moved: { element: 'a', oldIndex: 0, newIndex: 2 },
          };
          const { start: startEmit, update: updateEmit, change: changeEmit } = wrapper.emitted();
          expect(startEmit).toHaveLength(1);
          expect(updateEmit).toHaveLength(1);
          expect(changeEmit).toHaveLength(1);
          expect(changeEmit).toEqual([[expectedEvents]]);
        });
      });

      describe('when drop first into last', () => {
        beforeEach(async () => {
          item1 = wrapperItems[0];

          // start drag from first item
          const startEvent = { item: item1.element };
          onStart(startEvent);
          await nextTick();

          // console.log(Array.from(vm.targetDomElement.children))
          // drop to last item
          const updateEvent = {
            from: wrapper.element,
            newIndex: 3,
            oldIndex: 0,
            item: item1.element
          };
          onUpdate(updateEvent);
          await nextTick();
        });

        it('should change', () => {
          expect(vm.list).toEqual(['d', 'b', 'c', 'a']);
        });

        it('should send events', () => {
          const expectedEvents = {
            moved: { element: 'a', oldIndex: 0, newIndex: 3 },
          };
          const { start: startEmit, update: updateEmit, change: changeEmit } = wrapper.emitted();
          expect(startEmit).toHaveLength(1);
          expect(updateEmit).toHaveLength(1);
          expect(changeEmit).toHaveLength(1);
          expect(changeEmit).toEqual([[expectedEvents]]);
        });
      });
    });

    describe('with header', () => {
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
            swap: true
          },
        }, {
          header: () => h("header"),
          footer: () => h("footer")
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

      describe('when drop first into third', () => {
        beforeEach(async () => {
          item1 = wrapperItems[0];

          // start drag from first item
          const startEvent = { item: item1.element };
          onStart(startEvent);
          await nextTick();

          // console.log(Array.from(vm.targetDomElement.children))
          // drop to last item
          const updateEvent = {
            from: wrapper.element,
            newIndex: 3,
            oldIndex: 1,
            item: item1.element
          };
          onUpdate(updateEvent);
          await nextTick();
        });

        it('should change', () => {
          expect(vm.list).toEqual(['c', 'b', 'a', 'd']);
        });

        it('should send events', () => {
          const expectedEvents = {
            moved: { element: 'a', oldIndex: 0, newIndex: 2 },
          };
          const { start: startEmit, update: updateEmit, change: changeEmit } = wrapper.emitted();
          expect(startEmit).toHaveLength(1);
          expect(updateEmit).toHaveLength(1);
          expect(changeEmit).toHaveLength(1);
          expect(changeEmit).toEqual([[expectedEvents]]);
        });
      });

      describe('when drop first into last', () => {
        beforeEach(async () => {
          item1 = wrapperItems[0];

          // start drag from first item
          const startEvent = { item: item1.element };
          onStart(startEvent);
          await nextTick();

          // console.log(Array.from(vm.targetDomElement.children))
          // drop to last item
          const updateEvent = {
            from: wrapper.element,
            newIndex: 4,
            oldIndex: 1,
            item: item1.element
          };
          onUpdate(updateEvent);
          await nextTick();
        });

        it('should change', () => {
          expect(vm.list).toEqual(['d', 'b', 'c', 'a']);
        });

        it('should send events', () => {
          const expectedEvents = {
            moved: { element: 'a', oldIndex: 0, newIndex: 3 },
          };
          const { start: startEmit, update: updateEmit, change: changeEmit } = wrapper.emitted();
          expect(startEmit).toHaveLength(1);
          expect(updateEmit).toHaveLength(1);
          expect(changeEmit).toHaveLength(1);
          expect(changeEmit).toEqual([[expectedEvents]]);
        });
      });
    });
  });
});
