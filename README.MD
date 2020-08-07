# 手动实现promise

```js
const p1 = MyPromise.resolve(1)
    p1.then(res => console.log('p1执行完毕，resolve的值:', res))

    const p2 = MyPromise.reject(2)

    const p3 = new MyPromise((resolve, reject) => {
      setTimeout(() => resolve(3), 3000)
    })
      .then(res => console.log('p3执行完毕，resolve的值:', res))

    const p4 = new MyPromise((resolve, reject) => {
      setTimeout(() => reject(4), 1000)
    })
      .then(null, e => console.log('p4执行完毕，reject的值:', e))

    const p5 = new MyPromise((resolve, reject) => {
      setTimeout(() => reject(5), 2000)
    }).catch(e => console.log('p5执行完毕，reject的值:', e))

    const p6 = new MyPromise((resolve, reject) => {
      setTimeout(() => reject(6), 5000)
    }).finally(() => { console.log('p6 complete') })

    const p11 = new MyPromise(resolve => {
      setTimeout(() => resolve(1), 3000)
    })
    const p12 = new MyPromise(resolve => {
      setTimeout(() => resolve(2), 1000)
    })
    const p13 = new MyPromise(resolve => {
      setTimeout(() => resolve(3), 2000)
    })

    MyPromise.all([p11, p12, p13]).then(res => console.log('promise.all:', res))
```

![image](https://github.com/Gengar-666/my-promise/blob/master/test.jpg)