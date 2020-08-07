const PROMISE_STATUS_MAP = Object.create(null)
PROMISE_STATUS_MAP.PENDING = 'pending' // 待定的
PROMISE_STATUS_MAP.FULFILLED = 'pulfilled' // 成功
PROMISE_STATUS_MAP.REJECTED = 'rejected' // 失败

const PRIVATE = Object.create(null)
PRIVATE.STATUS = Symbol('PromiseStatus') // promise当前状态
PRIVATE.VALUE = Symbol('PromiseValue') // promise当前缓存的值
PRIVATE.ON_FULFILLED = Symbol('OnFulfilled') // 成功的回调函数
PRIVATE.ON_REJECTED = Symbol('OnRejected') // 失败的回调函数
PRIVATE.ON_COMPLETE = Symbol('OnComplete') // 完成的回调函数
PRIVATE.THROW_ERROR_TIMER = ('ThrowErrorTimer')

// reject抛出错误的定时器，需要用这个定时器来模拟reject被catch了就不抛出错误
let PROMISE_THROW_EOR_TIMER = void 0

// 判断是否为函数
const isFunction = func => typeof func === 'function'

// 函数等待一定时间后执行
const sleep = (func, timeout) => setTimeout(func, timeout)

// 自定义错误信息
class PromiseError extends Error {
  constructor(message) {
    super(message)
    this.name = "(in myPromise)"
  }
}

class MyPromise {
  constructor(func) {
    // 传入的参数必须是个callback
    if (!isFunction(func)) {
      throw new TypeError(`Promise resolver ${func} is not a function`)
    }
    // 初始化promise的状态和值
    this[PRIVATE.STATUS] = PROMISE_STATUS_MAP.PENDING
    this[PRIVATE.VALUE] = void 0
    this[PRIVATE.ON_FULFILLED] = void 0
    this[PRIVATE.ON_REJECTED] = void 0
    this[PRIVATE.ON_COMPLETE] = void 0
    this[PRIVATE.THROW_ERROR_TIMER] = void 0

    // 必须使用setTimeout 0秒实现异步调用,
    // 保证 then，catch，finally 先执行,
    // 缓存onFulfilled，onRejected，onComplete回调函数
    sleep(() => func(this.resolve.bind(this), this.reject.bind(this)), 0)
  }
  // promise的状态改为完成并返回自己
  resolve (value) {
    if (this[PRIVATE.STATUS] !== PROMISE_STATUS_MAP.PENDING) return
    this[PRIVATE.STATUS] = PROMISE_STATUS_MAP.FULFILLED
    this[PRIVATE.VALUE] = value

    if (this[PRIVATE.ON_FULFILLED]) {
      this[PRIVATE.ON_FULFILLED](value)
      this[PRIVATE.ON_FULFILLED] = void 0
      this[PRIVATE.ON_REJECTED] = void 0
      this[PRIVATE.VALUE] = void 0
    }

    if (this[PRIVATE.ON_COMPLETE]) {
      this[PRIVATE.ON_COMPLETE]()
    }
  }
  // promise的状态改为失败并返回自己
  reject (reason) {
    if (this[PRIVATE.STATUS] !== PROMISE_STATUS_MAP.PENDING) return
    this[PRIVATE.STATUS] = PROMISE_STATUS_MAP.REJECTED
    this[PRIVATE.VALUE] = reason

    // 清除上一个定时器，因为执行then的时候如果不catch还会在执行一遍setTimeout
    this[PRIVATE.THROW_ERROR_TIMER] && clearTimeout(this[PRIVATE.THROW_ERROR_TIMER])

    // 使用setTimeout 0秒 模拟promise reject后不catch会抛出一个错误，
    // 使用setTimeout将抛错任务放到异步队列里以达到先返回promise的效果
    this[PRIVATE.THROW_ERROR_TIMER] = sleep(() => { throw new PromiseError(reason) }, 0)

    // 如果有监听失败的回调函数，则清除抛出错误的定时任务，并将值清空，状态改为fulfilled
    if (this[PRIVATE.ON_REJECTED]) {
      clearTimeout(this[PRIVATE.THROW_ERROR_TIMER])
      this[PRIVATE.ON_REJECTED](reason)
      this[PRIVATE.ON_FULFILLED] = void 0
      this[PRIVATE.ON_REJECTED] = void 0
      this[PRIVATE.VALUE] = void 0
      this[PRIVATE.STATUS] = PROMISE_STATUS_MAP.FULFILLED
    }

    if (this[PRIVATE.ON_COMPLETE]) {
      this[PRIVATE.ON_COMPLETE]()
    }
  }
  then (onFulfilled, onRejected) {
    // 保存监听成功失败的回调函数
    this[PRIVATE.ON_FULFILLED] = onFulfilled
    this[PRIVATE.ON_REJECTED] = onRejected

    // 如果当前的promise状态为完成并且有监听成功的回调函数，就执行回调函数
    if (this[PRIVATE.STATUS] === PROMISE_STATUS_MAP.FULFILLED) {
      let value = this[PRIVATE.VALUE]
      this[PRIVATE.ON_FULFILLED] && this[PRIVATE.ON_FULFILLED](value)
    }

    // 如果当前的promise状态为失败并且有监听失败的回调函数，就执行回调函数
    if (this[PRIVATE.STATUS] === PROMISE_STATUS_MAP.REJECTED) {
      let value = this[PRIVATE.VALUE]
      this[PRIVATE.ON_REJECTED] && this[PRIVATE.ON_REJECTED](value)
    }

    return this
  }
  catch (onRejected) {
    return this.then(null, onRejected)
  }
  finally (onComplete) {
    this[PRIVATE.ON_COMPLETE] = onComplete
    return this
  }
}

MyPromise.resolve = val => new MyPromise(resolve => resolve(val))

MyPromise.reject = val => new MyPromise((_, reject) => reject(val))

MyPromise.all = (promiseList) => {
  return new MyPromise(resolve => {
    const result = []
    let fulfilledCount = 0

    promiseList.forEach((p, idx) => p.then(res => {
      result[idx] = res
      fulfilledCount++
      if (fulfilledCount === promiseList.length) {
        resolve(result)
      }
    }))
  })
}