<template>
  <div id="home" class="border">
    <el-row>
      <el-col :span="16">
        <div style="display: flex;">
          <div style="flex-grow: 1">
            <el-input v-model="text"></el-input>
          </div>
          <div>
            <el-button-group>
              <el-button @click="parseText" type="primary">Analyze</el-button>
              <el-button @click="WriteFile" type="primary">Save</el-button>
            </el-button-group>
          </div>
        </div>
      </el-col>
      <el-col :span="8">
        <el-upload
            class="upload-demo"
            drag
            multiple
            action="https://jsonplaceholder.typicode.com/posts/"
            :before-upload="uploadFile"
        >
          <div class="el-upload__text">Drag the file here, or<em> click upload</em></div>
        </el-upload>
      </el-col>
      <el-col :span="16" style="position: relative">
        <div style="height: 800px;overflow: auto;border: 1px solid;display: block;">
          <div style="padding-top: 10px;display: flex">
            <div>
              <tree-node :data="showTree"></tree-node>
            </div>
          </div>
          <el-button style="position: absolute; left: 15px;bottom: 25px;"
                     type="danger"
                     icon="el-icon-delete" circle @click="clearTree">
          </el-button>
        </div>
      </el-col>
      <el-col :span="8">
        <div style="height: 800px;display: flex;flex-direction:column">
          <div style="height: 50%; width:100%; overflow: auto;border: 1px solid;">
            <div class="box">
              <template v-for="(item,i) in treeNode">
                <template v-if="!item.isLeaf">
                  <div :key="i" class="item" @mousedown="highLight(item)">
                    <el-tag type="info"
                            closable
                            @close="handleClose(item)"
                            :effect="item.isFocus?'dark':'light'">
                      ({{ item.property }},{{ item.start }},{{ item.end }})
                    </el-tag>
                  </div>
                </template>
              </template>
              <div class="addItem">
                <div v-if="inputVisible" style="display: flex;">
                  <el-input
                      v-model="inputValue"
                      ref="saveTagInput"
                      size="small"
                      style="max-width: 150px">
                  </el-input>
                  <el-button-group>
                    <el-button size="small" type="primary" @click="handleInputConfirm" icon="el-icon-circle-check"/>
                    <el-button size="small" type="primary" @click="cancelAdd" icon="el-icon-circle-close"/>
                  </el-button-group>
                </div>
                <el-button v-else size="small" type="info" @click="showInput">+ New Tag
                </el-button>
              </div>
            </div>
          </div>
          <div style="height: 10%; width:100%; border: 1px solid">
            <div style="height: 100%;
                        display: flex;
                        align-items: center;
                        margin-left: 5px;
                        margin-right: 5px;">
              <el-button-group style="margin-right: 5px">
                <el-button @click="undo" type="primary" :disabled="stack.length<1">Undo</el-button>
                <el-button @click="undoAll" type="primary" :disabled="stack.length<1">Undo all</el-button>
              </el-button-group>
              <el-tag style="flex-grow: 1;">F1: {{ score['f1'].toFixed(4) }}</el-tag>
              <el-tag style="flex-grow: 1;">LR: {{ score['LR'].toFixed(4) }}</el-tag>
              <el-tag style="flex-grow: 1;">LP: {{ score['LP'].toFixed(4) }}</el-tag>
            </div>
          </div>
          <div style="height: 50%; width:100%; overflow: auto;border: 1px solid;">
            <div class="box">
              <template v-for="(item, i) in treeProperty">
                <template v-if="item.isLeaf">
                  <div class="item" :key="i">
                    <el-input v-model="item.property" @keyup.enter.native="propertyChange" @blur="propertyChange">
                      <template slot="prepend">{{ item.text }}</template>
                    </el-input>
                  </div>
                </template>
              </template>
            </div>
          </div>
        </div>
      </el-col>
    </el-row>
  </div>
</template>

<script>
import Tree from '@/util/parse'
import treeNode from "@/components/treeNode";
import saveAs from "file-saver";

export default {
  name: 'home',
  components: {treeNode},
  data() {
    return {
      text: '',
      tree: new Tree(),
      oriTree: new Tree(),
      filename: '',
      treeNode: [],
      treeProperty: [],
      inputVisible: false,
      inputValue: '(,,)',
      stack: [],
      isHidden: false,
    }
  },
  computed: {
    showTree: function () {
      if (!this.isHidden)
        return this.tree;
      return new Tree();
    },
    score: function () {
      return this.tree.score(this.oriTree);
    }
  },
  methods: {
    updateTree() {
      this.treeNode = this.tree.getAllNodeBySpan();
      this.treeProperty = this.tree.getAllNodeByDepth();
      this.text = this.tree.toString();
    },
    parseText() {
      try {
        this.tree = Tree.parse(this.text);
        this.oriTree = Tree.parse(this.text);
        this.stack = [];
        this.updateTree();
      } catch (e) {
        alert(e.message);
      }
    },
    undo() {
      this.text = this.stack.pop();
      this.tree = Tree.parse(this.text);
      this.updateTree();
    },
    undoAll() {
      this.text = this.stack[0];
      this.tree = Tree.parse(this.text);
      this.stack = [];
      this.updateTree();
    },
    clearTree() {
      this.isHidden = !this.isHidden;
    },
    WriteFile() {
      let blob = new Blob([this.tree.toString()], {type: "text/plain;charset=utf-8"});
      saveAs(blob, this.filename + '_patch');
    },
    handleInputConfirm() {
      if (this.inputValue.match(/\(\w+,\d+,\d+\)/g) !== null) {
        let inputValue = this.inputValue.replaceAll(/[\s\\)(]/g, '').split(',');
        try {
          let ori = this.tree.toString();
          this.tree.addNode(inputValue[0], parseInt(inputValue[1], 10), parseInt(inputValue[2], 10));
          this.stack.push(ori);
        } catch (e) {
          alert(e.message)
        }
        this.updateTree();
      } else {
        alert('格式错误！');
      }
      this.inputVisible = false;
      this.inputValue = '(,,)';
    },
    cancelAdd() {
      this.inputVisible = false;
      this.inputValue = '(,,)';
    },
    propertyChange() {
      if (this.tree.toString() !== this.text) {
        this.stack.push(this.text);
      }
      this.updateTree();
    },
    showInput() {
      this.inputVisible = true;
      this.$nextTick(() => {
        this.$refs.saveTagInput.$refs.input.focus();
      });
    },
    handleClose(item) {
      let ori = this.tree.toString();
      this.tree.delNode(item);
      this.stack.push(ori);
      this.updateTree();
    },
    uploadFile(file) {
      let reader = new FileReader();
      reader.onload = () => {
        this.text = reader.result;
        this.filename = file.name;
        this.parseText();
      };
      reader.readAsText(file);
      return false;
    },
    highLight(treeNode) {
      this.tree.unFocusAll();
      treeNode.isFocus = true;
    }
  }
}
</script>

<style>
#home {
  font-family: 'Avenir', Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  /*text-align: center;*/
  /*color: #2c3e50;*/
  margin: 20px;
  padding: 10px;
}

#home .el-col {
  /*border: 1px solid #409EFF;*/
  padding: 5px;
}

.upload-demo .el-upload {
  width: 100%;
  display: block;
}

.border {
  border: 1px solid;
}

.upload-demo .el-upload-dragger {
  height: 40px;
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.box {
  display: flex;
  flex-direction: row;
  justify-content: space-around;
  flex-wrap: wrap;
}

.item {
  text-align: center;
  margin-top: 22px;
  max-width: 200px;
}

.addItem {
  text-align: center;
  margin-top: 22px;
}
</style>
