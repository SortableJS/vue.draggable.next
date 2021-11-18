<template>
  <div>
    <button class="btn btn-secondary" @click="onClick">LevelChange</button>
    <component :is="slotName" :list="list"> </component>
  </div>
</template>

<script>
import DefaultSlot from "./multi-layer-slot/default-slot.vue";
import LevelOneSlot from "./multi-layer-slot/level-one.vue";
import LevelTwoSlot from "./multi-layer-slot/level-two.vue";
import LevelThreeSlot from "./multi-layer-slot/level-three.vue";
export default {
  name: "multi-layer-slot-example",
  display: "Multi layer slot",
  order: 16,
  components: {
    DefaultSlot,
    LevelOneSlot,
    LevelTwoSlot,
    LevelThreeSlot
  },
  computed: {
    slotName() {
      const num = this.levelNum % 4;
      switch (num) {
        case 0:
          return "DefaultSlot";
        case 1:
          return "LevelOneSlot";
        case 2:
          return "LevelTwoSlot";
        case 3:
          return "LevelThreeSlot";
      }
      return "DefaultSlot";
    }
  },
  data() {
    return {
      list: [
        { name: "John", id: 0 },
        { name: "Joao", id: 1 },
        { name: "Jean", id: 2 }
      ],
      dragging: false,
      levelNum: 0
    };
  },
  methods: {
    onClick() {
      this.levelNum++;
    }
  }
};
</script>
<style scoped>
.btn {
  margin-bottom: 35px;
}

.ghost {
  opacity: 0.5;
  background: #c8ebfb;
}

.not-draggable {
  cursor: no-drop;
}
</style>
