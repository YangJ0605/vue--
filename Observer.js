class Watcher {
  constructor(vm, expr, cb){
    this.vm = vm
    this.expr = expr
    this.cb = cb
    // 保存旧值
    this.oldVal = this.getOldVal()
  }
  getOldVal() {
    Dep.target = this
    const oldVal = compileUtil.getValue(this.expr, this.vm)
    Dep.target = null
    return oldVal
  }
  update () {
    const newVal = compileUtil.getValue(this.expr, this.vm)
    if(newVal !== this.oldVal){
      this.cb(newVal)
    }
  }
}

class Dep {
  constructor() {
    this.subs = []
  }
  //收集观察者
  addSub(watcher){
    this.subs.push(watcher)
  }
  notify() {
    //通知观察者更新
    console.log('观察者', this.subs)
    this.subs.forEach(w => w.update())
  }
}

class Observer {
  constructor(data) {
    this.observe(data)
  }
  observe(data) {
    if(data && typeof data === 'object') {
      // console.log(Object.keys(data))
      Object.keys(data).forEach(key => {
        this.defineReactive(data, key, data[key])
      })
    }
  }
  defineReactive(obj, key, value) {
    this.observe(value)
    const dep = new Dep()
    Object.defineProperty(obj, key, {
      enumerable: true,
      configurable: true,
      get(){
        Dep.target && dep.addSub(Dep.target)
        return value
      },
      set:(newVal) => {
        this.observe(newVal)
        if(newVal !== value) {
          console.log('set 赋值')
          value = newVal
        }
        dep.notify()
      }
    })
  }
}