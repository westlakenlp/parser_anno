// 去除首位空格
function trimStr(str) {
    return str.replace(/(^\s*)|(\s*$)/g, "");
}

// 是否是叶节点
function isLeaf(str) {
    return str.indexOf('(') === -1 && str.indexOf(')') === -1;
}

// 匹配对称括号
function pattern(str, start = 0) {
    if (isLeaf(str))
        return str;
    let _start = start;
    if (str[start] !== '(') throw new Error('parse Error!');
    let num = 1;
    for (let _end = _start + 1; _end < str.length; _end++) {
        if (str[_end] === ')')
            num--;
        else if (str[_end] === '(')
            num++;
        if (num === 0)
            return str.substring(_start, _end + 1);
    }
}

//分组函数
function groupBy(array, f) {
    let groups = {};
    array.forEach(function (o) {
        let group = JSON.stringify(f(o));
        groups[group] = groups[group] || [];
        groups[group].push(o);
    });
    return Object.keys(groups).map(function (group) {
        return groups[group];
    });
}

// 分割
function splitByFirst(str, split = ' ') {
    let result = [];
    let s = 0;
    for (s = 0; s < str.length; s++) {
        if (split.indexOf(str[s]) !== -1) {
            result.push(str.substring(1, s));
            break;
        }
    }
    for (let ss = s + 1; ss < str.length; ss++) {
        if (split.indexOf(str[ss]) === -1) {
            result.push(str.substring(ss, str.length - 1));
            break;
        }
    }
    return result;
}

let index = 0;
// let temp = pattern('(TOP (S (NP (PRP He)) (VP (VBD deserved) (NP (NN respect)))))', 0);
// console.log(temp)
export default class Tree {

    constructor() {
        this.property = '';
        this.second = '';
        this.isLeaf = false;
        this.text = '';
        this.textLen = 0;
        this.start = -1;
        this.end = -1;
        this.child = [];
        this.father = null;
        this.isFocus = false;
    }

    static _parse(text, split = ' ') {
        text = pattern(trimStr(text));
        let temp = splitByFirst(text, split);
        let result = new Tree();
        result.property = temp[0];
        result.second = temp[1];
        result.isLeaf = isLeaf(result.second);

        if (!isLeaf(result.second)) {
            let index = 0;
            while (index !== result.second.length) {
                let t = pattern(result.second, index);
                result.child.push(Tree._parse(t, split));
                index += t.length;
                while (split.indexOf(result.second[index]) !== -1) index++;
            }
            result.child.forEach(item => item.father = result);
        } else {
            result.text = result.second;
            result.start = index;
            result.end = index;
            result.textLen = 1;
            index++;
        }
        return result;
    }

    static parse(text, split = ' ') {
        index = 0;
        let result = Tree._parse(text, split);
        result._initText();
        result._initIndex();
        return result;
    }

    _initText() {
        if (this.text === '')
            this.text = trimStr(this.child.map((item) => {
                return item._initText();
            }).reduce((total, item) => {
                return total += ' ' + item;
            }));
        if (this.isLeaf)
            this.text += '(' + this.start + ')';
        return this.text;
    }

    _initIndex() {
        if (!this.isLeaf) {
            this.start = this.child[0]._initIndex()[0];
            this.end = this.child[this.child.length - 1]._initIndex()[1];
            this.textLen = this.end - this.start + 1;
            for (let i = 1; i < this.child.length - 1; i++)
                this.child[i]._initIndex();
        }
        return [this.start, this.end]
    }

    // 深度遍历获取所有的节点
    getAllNodeByDepth() {
        let result = [this];
        if (!this.isLeaf)
            this.child.map(item => {
                return item.getAllNodeByDepth();
            }).forEach(item => {
                result = result.concat(item);
            });
        return result;
    }

    //广度遍历获取所有的节点
    getAllNodeBySpan() {
        let result = [this];
        for (let i = 0; i < result.length; i++) {
            if (!this.isLeaf)
                result = result.concat(result[i].child);
        }
        return result;
    }

    // 删除一个节点
    delNode(current) {
        let currentFather = current.father;
        currentFather.child.splice(currentFather.child.indexOf(current), 1, ...current.child);
        current.child.forEach(item => item.father = currentFather);
    }

    // 添加一个节点
    addNode(_property, _start, _end) {
        let newNode = new Tree();
        newNode.property = _property;
        newNode.start = _start;
        newNode.end = _end;
        if (_start > _end)
            throw new Error("不能在这里添加节点");
        newNode.isLeaf = false;
        let startIndex = -1;
        let endIndex = -1;
        let insertNode = this.getAllNodeBySpan().find(item => {
            let flag1 = false;
            let flag2 = false;
            for (let i = 0; i < item.child.length; i++) {
                if (item.child[i].start === _start) {
                    flag1 = true;
                    startIndex = i;
                }
                if (item.child[i].end === _end) {
                    flag2 = true;
                    endIndex = i;
                }
                if (flag1 && flag2) return true;
            }
            return flag1 && flag2;
        });
        if (insertNode instanceof Tree) {
            let move = insertNode.child.slice(startIndex, endIndex + 1); //要移动的子节点
            insertNode.child.splice(startIndex, endIndex - startIndex + 1, newNode); // 删除子节点
            newNode.father = move[0].father;
            newNode.child = move;
            newNode.child.forEach(item => {
                item.father = newNode;
                newNode.text += item.text + ' ';
                newNode.textLen = newNode.end - newNode.start + 1;
                newNode.second += item.second + ' ';
            });
            newNode.text = trimStr(newNode.text);
            newNode.second = trimStr(newNode.second);
        } else {
            throw new Error("不能在这里添加节点");
        }
    }

    _unFocusAll() {
        this.getAllNodeBySpan().forEach(item => {
            item.isFocus = false;
        });
    }

    unFocusAll() {
        let root = this;
        // 回溯到根节点
        while (root.father !== null) root = root.father;
        root._unFocusAll();
    }

    toString() {
        let result = '(' + this.property + ' ';
        if (this.isLeaf)
            result += this.second;
        else
            for (let i = 0; i < this.child.length; i++) {
                result += this.child[i].toString() + ' ';
            }
        result = trimStr(result);
        result += ')';
        return result;
    }

    compare(o) {
        return this.property === o.property &&
            this.start === o.start &&
            this.end === o.end;
    }

    getCmpNode() {
        let nodes = this.getAllNodeByDepth();
        return nodes.filter((item) => !(item.father == null || item.isLeaf));
    }

    getSpanList() {
        let nodes = this.getAllNodeByDepth();
        return nodes.filter((item) => !(item.father == null || item.isLeaf)).map(item => {
            return '(' + item.property + ',' + item.start + ',' + item.end + ')';
        });
    }

    score(tree) {
        let l1 = this.getSpanList();
        let l2 = tree.getSpanList();
        let l3 = l1.filter((val) => new Set(l2).has(val));

        let nb_correct = l3.length;
        let nb_pred = l1.length;
        let nb_true = l2.length;

        let p = nb_pred > 0 ? nb_correct / nb_pred : 0;
        let r = nb_true > 0 ? nb_correct / nb_true : 0;
        let f1 = p + r > 0 ? 2 * p * r / (p + r) : 0;
        return {'LP': p, 'LR': r, 'f1': f1};
    }

    calLPLRF1(g1, g2) {
        let l1 = g1.map(item => '(' + item.property + ',' + item.start + ',' + item.end + ')');
        let l2 = g2.map(item => '(' + item.property + ',' + item.start + ',' + item.end + ')');
        let l3 = l1.filter((val) => new Set(l2).has(val));
        let nb_correct = l3.length;
        let nb_pred = l1.length;
        let nb_true = l2.length;
        let p = nb_pred > 0 ? nb_correct / nb_pred : 0;
        let r = nb_true > 0 ? nb_correct / nb_true : 0;
        let f1 = p + r > 0 ? 2 * p * r / (p + r) : 0;
        return {'LP': p, 'LR': r, 'f1': f1};
    }

    report(tree) {
        let l1 = this.getCmpNode();
        let l2 = tree.getCmpNode();
        let g1 = groupBy(l1, (item) => item.property);
        let g2 = groupBy(l2, (item) => item.property);
        let result = [];
        g1.forEach(i => {
            let searched = [];
            g2.forEach(i2 => {
                if (i2[0].property === i[0].property) {
                    searched = i2;
                }
            });
            result.push({'name': i[0].property, 'support': i.length, ...this.calLPLRF1(searched, i)});
        });
        let x = {'name': 'micro avg', 'support': l1.length, ...tree.score(this)};
        let maa = result.reduce((p, c) => {
            p['LP'] = p['LP'] + c['LP'] * c['support'] / l1.length;
            p['LR'] = p['LR'] + c['LR'] * c['support'] / l1.length;
            p['f1'] = p['f1'] + c['f1'] * c['support'] / l1.length;
            return p;
        }, {'LP': 0.0, 'LR': 0.0, 'f1': 0.0});
        result.push(x);
        result.push({'name': 'macro avg', 'support': l1.length, ...maa});

        result.forEach(i => {
            i['LP'] = i['LP'].toFixed(4);
            i['LR'] = i['LR'].toFixed(4);
            i['f1'] = i['f1'].toFixed(4);
        });
        return result;
    }
}