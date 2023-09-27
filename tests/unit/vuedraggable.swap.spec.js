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

describe("draggable.vue with swap plugin", () => {
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
        props: { list, itemKey: key => key },
        attrs: { swap: true },
      });
      expect(wrapper).not.toBeUndefined();
      expect(vm._sortable.options).toMatchObject({ swap: true });
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
        // component
        const items = ['a', 'b', 'c', 'd'];
        const { wrapper: _w, vm: _v } = create({
          props: { list: items, itemKey: key => key },
          attrs: { swap: true },
        });
        wrapper = _w;
        vm = _v;
        wrapperItems = wrapper.findAll('[data-draggable]');

        onStart = vm._sortable.options.onStart;
        onUpdate = vm._sortable.options.onUpdate;
        onAdd = vm._sortable.options.onAdd;
        onRemove = vm._sortable.options.onRemove;
      });

      describe('when drop first into third', () => {
        beforeEach(async () => {
          item1 = wrapperItems[0];

          // start drag from first item
          const startEvent = { item: item1.element };
          onStart(startEvent);
          await nextTick();

          const temp = vm.targetDomElement.children[0]
          vm.targetDomElement.replaceChild(vm.targetDomElement.children[2], vm.targetDomElement.children[0])
          vm.targetDomElement.replaceChild(temp, vm.targetDomElement.children[2])
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

          const temp = vm.targetDomElement.children[0]
          vm.targetDomElement.replaceChild(vm.targetDomElement.children[3], vm.targetDomElement.children[0])
          vm.targetDomElement.appendChild(temp)
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
        // component
        const items = ['a', 'b', 'c', 'd'];
        const { wrapper: _w, vm: _v } = create({
          props: { list: items, itemKey: key => key },
          attrs: { swap: true },
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

      describe('when drop first into third', () => {
        beforeEach(async () => {
          item1 = wrapperItems[0];

          // start drag from first item
          const startEvent = { item: item1.element };
          onStart(startEvent);
          await nextTick();

          // console.log(Array.from(vm.targetDomElement.children))
          const temp = vm.targetDomElement.children[1]
          vm.targetDomElement.replaceChild(vm.targetDomElement.children[3], vm.targetDomElement.children[1])
          vm.targetDomElement.replaceChild(temp, vm.targetDomElement.children[3])
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
          const temp = vm.targetDomElement.children[1]
          vm.targetDomElement.replaceChild(vm.targetDomElement.children[4], vm.targetDomElement.children[1])
          vm.targetDomElement.appendChild(temp)
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

    describe('using modelValue', () => {
      beforeEach(() => {
        // component
        const items = ['a', 'b', 'c', 'd'];
        const { wrapper: _w, vm: _v } = create({
          props: {
            modelValue: items,
            itemKey: key => key,
            // deliberately add a slight delay to ensure the updates are not
            // reliant on immediate state updates
            'onUpdate:modelValue': modelValue => nextTick(() => _w.setProps({ modelValue }))
          },
          attrs: { swap: true },
        });
        wrapper = _w;
        vm = _v;
        wrapperItems = wrapper.findAll('[data-draggable]');

        onStart = vm._sortable.options.onStart;
        onUpdate = vm._sortable.options.onUpdate;
        onAdd = vm._sortable.options.onAdd;
        onRemove = vm._sortable.options.onRemove;
      });

      describe('when drop first into third', () => {
        beforeEach(async () => {
          item1 = wrapperItems[0];

          // start drag from first item
          const startEvent = { item: item1.element };
          onStart(startEvent);
          await nextTick();

          // console.log(Array.from(vm.targetDomElement.children))
          const temp = vm.targetDomElement.children[0]
          vm.targetDomElement.replaceChild(vm.targetDomElement.children[2], vm.targetDomElement.children[0])
          vm.targetDomElement.replaceChild(temp, vm.targetDomElement.children[2])
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
          expect(vm.modelValue).toEqual(['c', 'b', 'a', 'd']);
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
          const temp = vm.targetDomElement.children[0]
          vm.targetDomElement.replaceChild(vm.targetDomElement.children[3], vm.targetDomElement.children[0])
          vm.targetDomElement.appendChild(temp)
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
          expect(vm.modelValue).toEqual(['d', 'b', 'c', 'a']);
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

    describe('multiple lists', () => {
      let group1, group2
      beforeEach(() => {
        group1 = { list: ['a', 'b', 'c'] };
        group2 = { list: ['x', 'y', 'z'] };
        const { wrapper: _w1, vm: _v1 } = create({
          props: { list: group1.list, itemKey: key => key },
          attrs: { swap: true },
        });
        group1.wrapper = _w1;
        group1.vm = _v1;
        group1.wrapperItems = group1.wrapper.findAll('[data-draggable]');
        group1.onStart = group1.vm._sortable.options.onStart;
        group1.onAdd = group1.vm._sortable.options.onAdd;
        group1.onRemove = group1.vm._sortable.options.onRemove;

        const { wrapper: _w2, vm: _v2 } = create({
          props: { list: group2.list, itemKey: key => key },
          attrs: { swap: true },
        });
        group2.wrapper = _w2;
        group2.vm = _v2;
        group2.wrapperItems = group2.wrapper.findAll('[data-draggable]');
        group2.onAdd = group2.vm._sortable.options.onAdd;
        group2.onRemove = group2.vm._sortable.options.onRemove;
      });

      describe('swap first items', () => {
        beforeEach(async () => {
          item1 = group1.wrapperItems[0];
          const startEvent = { item: item1.element };
          group1.onStart(startEvent);
          await nextTick();

          const temp = group2.vm.targetDomElement.children[0]
          group2.vm.targetDomElement.replaceChild(group1.vm.targetDomElement.children[0], group2.vm.targetDomElement.children[0])
          group1.vm.targetDomElement.insertBefore(temp, group1.vm.targetDomElement.children[0])
          const addEvent = {
            from: group1.wrapper.element,
            to: group2.wrapper.element,
            newIndex: 0,
            oldIndex: 0,
            item: item1.element
          };
          group2.onAdd(addEvent);
          const removeEvent = {
            to: group1.wrapper.element,
            from: group2.wrapper.element,
            newIndex: 0,
            oldIndex: 0,
            item: item1.element
          };
          group1.onRemove(removeEvent);
          await nextTick();
        });

        it('should change', () => {
          expect(group1.list).toEqual(['x', 'b', 'c']);
          expect(group2.list).toEqual(['a', 'y', 'z']);
        });

        it('should send events', () => {
          const expectedEvent1 = {
            removed: { element: 'a', oldIndex: 0 },
          };
          const emit1 = group1.wrapper.emitted();
          expect(emit1.start).toHaveLength(1);
          expect(emit1.add).toBeUndefined();
          expect(emit1.remove).toHaveLength(1);
          expect(emit1.change).toHaveLength(1);
          expect(emit1.change).toEqual([[expectedEvent1]]);

          const expectedEvent2 = {
            added: { element: 'a', newIndex: 0 },
          };
          const emit2 = group2.wrapper.emitted();
          expect(emit2.start).toBeUndefined();
          expect(emit2.add).toHaveLength(1);
          expect(emit2.remove).toBeUndefined();
          expect(emit2.change).toHaveLength(1);
          expect(emit2.change).toEqual([[expectedEvent2]]);
        });
      });
    });

    describe('multiple lists with modelValue', () => {
      let group1, group2
      beforeEach(() => {
        group1 = { modelValue: ['a', 'b', 'c'] };
        group2 = { modelValue: ['x', 'y', 'z'] };
        const { wrapper: _w1, vm: _v1 } = create({
          props: {
            modelValue: group1.modelValue,
            itemKey: key => key,
            // deliberately add a slight delay to ensure the updates are not
            // reliant on immediate state updates
            'onUpdate:modelValue': modelValue => nextTick(() => _w1.setProps({ modelValue }))
          },
          attrs: { swap: true },
        });
        group1.wrapper = _w1;
        group1.vm = _v1;
        group1.wrapperItems = group1.wrapper.findAll('[data-draggable]');
        group1.onStart = group1.vm._sortable.options.onStart;
        group1.onAdd = group1.vm._sortable.options.onAdd;
        group1.onRemove = group1.vm._sortable.options.onRemove;

        const { wrapper: _w2, vm: _v2 } = create({
          props: {
            modelValue: group2.modelValue,
            itemKey: key => key,
            // deliberately add a slight delay to ensure the updates are not
            // reliant on immediate state updates
            'onUpdate:modelValue': modelValue => nextTick(() => _w2.setProps({ modelValue }))
          },
          attrs: { swap: true },
        });
        group2.wrapper = _w2;
        group2.vm = _v2;
        group2.wrapperItems = group2.wrapper.findAll('[data-draggable]');
        group2.onAdd = group2.vm._sortable.options.onAdd;
        group2.onRemove = group2.vm._sortable.options.onRemove;
      });

      describe('swap first items', () => {
        beforeEach(async () => {
          item1 = group1.wrapperItems[0];
          const startEvent = { item: item1.element };
          group1.onStart(startEvent);
          await nextTick();

          const temp = group2.vm.targetDomElement.children[0]
          group2.vm.targetDomElement.replaceChild(group1.vm.targetDomElement.children[0], group2.vm.targetDomElement.children[0])
          group1.vm.targetDomElement.insertBefore(temp, group1.vm.targetDomElement.children[0])
          const addEvent = {
            from: group1.wrapper.element,
            to: group2.wrapper.element,
            newIndex: 0,
            oldIndex: 0,
            item: item1.element
          };
          group2.onAdd(addEvent);
          const removeEvent = {
            to: group1.wrapper.element,
            from: group2.wrapper.element,
            newIndex: 0,
            oldIndex: 0,
            item: item1.element
          };
          group1.onRemove(removeEvent);
          await nextTick();
        });

        it('should change', async () => {
          expect(group2.wrapper.props('modelValue')).toEqual(['a', 'y', 'z']);
          expect(group1.wrapper.props('modelValue')).toEqual(['x', 'b', 'c']);
        });

        it('should send events', () => {
          const expectedEvent1 = {
            removed: { element: 'a', oldIndex: 0 },
          };
          const emit1 = group1.wrapper.emitted();
          expect(emit1.start).toHaveLength(1);
          expect(emit1.add).toBeUndefined();
          expect(emit1.remove).toHaveLength(1);
          expect(emit1.change).toHaveLength(1);
          expect(emit1.change).toEqual([[expectedEvent1]]);

          const expectedEvent2 = {
            added: { element: 'a', newIndex: 0 },
          };
          const emit2 = group2.wrapper.emitted();
          expect(emit2.start).toBeUndefined();
          expect(emit2.add).toHaveLength(1);
          expect(emit2.remove).toBeUndefined();
          expect(emit2.change).toHaveLength(1);
          expect(emit2.change).toEqual([[expectedEvent2]]);
        });
      });
    });
  });
});
