<template>
  <div id="compare" class="border">
    <el-row>
      <el-col :span="9">
        <div style="display: flex;">
          <div style="flex-grow: 1">
            <el-input v-model="text1"></el-input>
          </div>
        </div>
        <div style="height: 800px;overflow: auto;" class="border secondLine">
          <div style="padding-top: 10px;display: flex">
            <div>
              <tree-node :data="tree1" :is-click="false"></tree-node>
            </div>
          </div>
        </div>
      </el-col>
      <el-col :span="6">
        <el-button type="primary" @click="compare">Compare</el-button>
        <div style="padding-top: 10px">
          <el-table border :data="tableData">
            <el-table-column
                prop="name"
                label="">
            </el-table-column>
            <el-table-column
                prop="LP"
                label="precision">
            </el-table-column>
            <el-table-column
                prop="LR"
                label="recall">
            </el-table-column>
            <el-table-column
                prop="f1"
                label="f1-score">
            </el-table-column>
            <el-table-column
                prop="support"
                label="support">
            </el-table-column>
          </el-table>
        </div>

      </el-col>
      <el-col :span="9">
        <div style="display: flex;">
          <div style="flex-grow: 1">
            <el-input v-model="text2"></el-input>
          </div>
        </div>
        <div style="height: 800px;overflow: auto;" class="border secondLine">
          <div style="padding-top: 10px;display: flex">
            <div>
              <tree-node :data="tree2" :is-click="false"></tree-node>
            </div>
          </div>
        </div>
      </el-col>
    </el-row>
  </div>
</template>

<script>
import Tree from '../util/parse';
import treeNode from "../components/treeNode";

export default {
  name: 'compare',
  components: {treeNode},
  data() {
    return {
      text1: '',
      text2: '',
      tree1: new Tree(),
      tree2: new Tree(),
      tableData: []
    }
  },
  methods: {
    compare() {
      try {
        this.tree1 = Tree.parse(this.text1);
        this.tree2 = Tree.parse(this.text2);
      } catch (e) {
        alert(e.message)
      }
      let nodes1 = this.tree1.getCmpNode();
      let nodes2 = this.tree2.getCmpNode();
      nodes1.forEach(n1 => n1.isFocus = true);
      nodes2.forEach(n2 => n2.isFocus = true);
      nodes1.forEach(n1 =>
          nodes2.forEach(n2 => {
            if (n1.compare(n2)) {
              n1.isFocus = false;
              n2.isFocus = false;
            }
          }));
      this.tableData = this.tree1.report(this.tree2);
    }
  },
}
</script>

<style>
#compare {
  margin: 20px;
  padding: 10px;
}

#compare .el-col {
  padding: 5px;
}

.border {
  border: 1px solid;
}

.secondLine {
  margin-top: 10px;
}
</style>