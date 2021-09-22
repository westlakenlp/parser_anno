<template>
  <div class="node" :style="'background:' + (data.isFocus ? 'Khaki' : 'cornsilk')"
       @mousedown="isHighLight($event,data)">
    {{ data.text }}
    <div class="property">{{ data.property }}</div>
    <template v-if="!data.isLeaf">
      <div style="display: flex">
        <template v-for="(item,i) in data.child">
          <div :key="i" :style="'flex-grow:'+item.textLen">
            <tree-node :data="item" :is-click="isClick"></tree-node>
          </div>
        </template>
      </div>
    </template>
  </div>
</template>

<script>
import Tree from "../util/parse";

export default {
  name: "treeNode",
  props: {
    data: {
      type: Tree
    },
    isClick: {
      type: Boolean,
      default: true
    }
  },
  methods: {
    isHighLight($event, treeNode) {
      if (this.isClick) {
        $event.stopPropagation();
        treeNode.unFocusAll();
        treeNode.isFocus = true;
      }
    }
  }

}
</script>

<style scoped>
.node {
  height: 60px;
  position: relative;
  text-align: center;
  border: 1px solid;
  line-height: 60px;
  margin-top: 20px;
  padding-left: 10px;
  padding-right: 10px;
  min-width: 80px;
}

.property {
  position: absolute;
  right: 5px;
  bottom: 5px;
  border: 1px solid gray;
  border-radius: 5px;
  background: silver;
  height: 20px;
  line-height: 20px;
  padding-left: 5px;
  padding-right: 5px;
}
</style>