<template>
  <div>
    <LevelOne :list="list">
      <template #item="{ element }">
        <slot name="item" :element="element">
          <div class="list-group-item">{{ name }} - {{ element.name }}</div>
        </slot>
      </template>
    </LevelOne>
  </div>
</template>

<script>
import LevelOne from "./level-one.vue";
const levelName = "levelTwo";
export default {
  name: levelName,
  components: {
    LevelOne
  },
  data() {
    return {
      name: levelName
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
