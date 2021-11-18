<template>
  <div class="row">
    <div class="col-6">
      <draggable
        :list="list"
        item-key="name"
        class="list-group"
        ghost-class="ghost"
        @start="dragging = true"
        @end="dragging = false"
      >
        <!-- <template #item="{ element }">
        <div class="list-group-item">
          {{ element.name }}
        </div>
      </template> -->
        <template #item="{element}">
          <slot name="item" :element="element">
            <div class="list-group-item">{{ name }} - {{ element.name }}</div>
          </slot>
        </template>
      </draggable>
    </div>
    <rawDisplayer class="col-3" :value="list" title="List" />
  </div>
</template>

<script>
import draggable from "@/vuedraggable";
const levelName = "levelOne";
export default {
  name: levelName,
  components: {
    draggable
  },
  data() {
    return {
      name: levelName,
      dragging: false
    };
  },
  props: {
    list: {
      type: Array,
      default: () => []
    }
  },
  methods: {}
};
</script>
<style scoped>
.buttons {
  margin-top: 35px;
}

.ghost {
  opacity: 0.5;
  background: #c8ebfb;
}

.not-draggable {
  cursor: no-drop;
}
</style>
