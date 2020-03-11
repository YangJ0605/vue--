const compileUtil = {
  getValue(expr, vm) {
   const a = expr.split('.')
   return a.reduce((data, currentVal) => {
      console.log(currentVal)
      return data[currentVal]
    },vm.$data)
  },
  text(node,expr,vm) {
    let value;
    if(expr.indexOf('{{') !== -1) {
      value = expr.replace(/\{\{(.+?)\}\}/g, (...args) => {
        // console.log(args)
        return this.getValue(args[1], vm)
      })
    } else {
      value = this.getValue(expr, vm)
    }
    this.updater.textUpdater(node, value)
  },
  html(node,expr,vm) {
    const value = this.getValue(expr, vm)
    this.updater.htmlUpdater(node, value)
  },
  model(node,expr,vm) {
    const value = this.getValue(expr, vm)
    this.updater.modelUpdater(node, value)
  },
  on(node,expr,vm, event) {
    let fn = vm.$options.methods && vm.$options.methods[expr]
    // console.log(this)
    node.addEventListener(event, fn.bind(vm),false)
  },
  bind(node, expr, vm, attrName) {
    // console.log(expr);
    console.log(attrName)
    const value = this.getValue(expr, vm)
    // node[attrName] = value
    node.setAttribute(attrName, value)
  },
  updater: {
    modelUpdater(node, value) {
      node.value = value
    },
    htmlUpdater(node, value) {
      node.innerHTML = value
    },
     textUpdater(node, value) {
       node.textContent = value
     }
  }
}

class Compile {
  constructor(el, vm) {
    this.el = this.isElementNode(el) ? el : document.querySelector(el)
    console.log(this.el)
    this.vm = vm
    // 文档碎片，放入内存，减少重流重绘
    const fragment = this.nodeToFragment(this.el)
    console.log(fragment)
    //编译
    this.compile(fragment)
    //追加
    this.el.appendChild(fragment)
  }
  isElementNode(node) {
    return node.nodeType === 1
  }
  nodeToFragment(el) {
    let firstChild
    const fragment = document.createDocumentFragment()
    while(firstChild = el.firstChild) {
      fragment.appendChild(firstChild)
    }
    return fragment
  }
  compile(fragment) {
    const childNodes = fragment.childNodes;
    // console.log(childNodes);
    [...childNodes].forEach(child => {
      // console.log(child)
      if(this.isElementNode(child)) {
        // console.log('元素节点', child)
        this.compileElement(child)
      } else {
        // console.log('文本节点',child)
        this.compileText(child)
      }
      if(child.childNodes && child.childNodes.length) {
        this.compile(child)
      }
    })
  }
  compileElement(node) {
    // console.log(node)
    const attributes = node.attributes;
    // console.log(attributes)
    [...attributes].forEach(attr => {
      // console.log(attr.name)
      const {name, value} = attr
      if(this.isDirective(name)) {
        // console.log(name)
        const [,directive] = name.split('-')
        // console.log(directive)
        const [dirName, eventName] = directive.split(':')
        // console.log(dirName, eventName)
        console.log(dirName)
        compileUtil[dirName](node, value, this.vm, eventName)
        //删除指令
        node.removeAttribute('v-' + directive)
      }else if(this.isEventName(name)) { // 处理@click
        let [, eventName] = name.split('@')
        compileUtil['on'](node, value, this.vm, eventName)
      } else if(name.startsWith(':')) {
        let [, attrName] = name.split(':')
        compileUtil['bind'](node, value, this.vm, attrName)
      }
    })
  }
  compileText(node) {
    // console.log(node.textContent)
    const content = node.textContent
    if(/\{\{(.+?)\}\}/.test(content)){
      // console.log(content)
      compileUtil['text'](node, content, this.vm)

    }
  }
  isDirective(attrName) {
    return attrName.startsWith('v-')
  }
  isEventName(attrName) {
    return attrName.startsWith('@')
  }
}

class CVue {
  constructor(options) {
    this.$data = options.data
    this.$el = options.el
    this.$options = options
    if(this.$el) {
      //实现一个数据观察者
      //实现一个指令解析器
      new Compile(this.$el, this)
    }
  }
}