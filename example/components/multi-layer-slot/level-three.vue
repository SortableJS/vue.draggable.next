<template>
  <div>
    <LevelTwo :list="list">
      <template #item="{ element }">
        <slot name="item" :element="element">
          <div class="list-group-item">{{ name }} - {{ element.name }}</div>
        </slot>
      </template>
    </LevelTwo>
  </div>
</template>

<script>
import LevelTwo from "./level-two.vue";
const levelName = "levelThree";
export default {
  name: levelName,
  components: {
    LevelTwo
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
