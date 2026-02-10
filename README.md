# miscellaneous-playground

Набор из 10 примеров, демонстрирующих неочевидное поведение JavaScript — quirks, edge-cases, особенности рантайма. Каждый пример — самостоятельный файл, который можно запустить и увидеть результат.

Цель — собрать в одном месте вещи, которые стоит знать при работе с JS.

## Требования

- Node.js v18+

## Запуск

```bash
node <filename>
```

Например:

```bash
node 1.undefined-is-not-literal.cjs
node 5.trail-operator.mjs
```

## Оглавление

| # | Файл(ы) | Тема |
|---|---------|------|
| 1 | `1.undefined-is-not-literal.cjs`, `.mjs` | `undefined` — не ключевое слово |
| 2 | `2.expression-evaluation.cjs` | Short-circuit evaluation с побочными эффектами |
| 3 | `3.index-string-accessor.mjs` | Autoboxing при доступе к символу строки по индексу |
| 4 | `4.string-and-number-not-primitive.mjs` | Мутация `String.prototype` и доступ по индексу |
| 5 | `5.trail-operator.mjs` | Comma operator в `return` |
| 6 | `6.broken-async-stacktrace.mjs` | Ложный async stack trace в отладчике |
| 7 | `7-impact-GC-in-copy-of-objects/` | Влияние GC при копировании объектов vs flyweight |
| 8 | `8.async-stacktrace.mjs` | `return await` vs `return` — сохранение stack trace |
| 9 | `9.make-any-object-serializable.cjs` | Сериализация объектов с non-enumerable свойствами |
| 10 | `10. race-condition.js` | Race condition при конкурентных async-операциях |

---

## Примеры

### 1. `undefined` — не ключевое слово

**Файлы:** `1.undefined-is-not-literal.cjs`, `1.undefined-is-not-literal.mjs`

`undefined` в JavaScript — не зарезервированное слово, а свойство глобального объекта. Его можно затенить через `var` внутри области видимости (в т.ч. модульной):

```js
const obj = {}
console.log(obj['a'] === undefined) // true

var undefined = 1
console.log(obj['a'] === undefined) // false
```

**Вывод:**
```
true
false
```

После `var undefined = 1` идентификатор `undefined` указывает на `1`, а `obj['a']` по-прежнему возвращает настоящий `undefined`. Сравнение даёт `false`.

**На практике:** в сторонних скриптах или legacy-коде `undefined` может быть переопределён. Надёжная проверка — `typeof x === 'undefined'` или сравнение с `void 0`.

---

### 2. Short-circuit evaluation с побочными эффектами

**Файл:** `2.expression-evaluation.cjs`

Операторы `&&` и `||` вычисляют операнды лениво и могут запускать (или не запускать) побочные эффекты — присвоения переменных. Это становится неочевидным при использовании внутри литералов массива.

```js
var thing = 0
var list = [
  1,
  (false) && (thing = 10),
  2,
  thing
]
```

**Вывод:** `[ 1, false, 2, 0 ]`

`thing = 10` не выполнится: `&&` замыкается на `false`.

Более сложные цепочки — важно помнить, что `&&` имеет приоритет выше `||`:

```js
var thing2 = 0
var list2 = [
  1,
  (false) && (thing2 = 10) || (thing2 = 20),
  thing2,
  (false) || (thing2 = 10) && (thing2 = 20),
  thing2,
]
```

**Вывод:** `[ 1, 20, 20, 20, 20 ]`

```js
var thing3 = 0
var list3 = [
  1,
  (false) && (thing3 = 10) || (thing3 = 20),
  thing3,
  (false) || (thing3 = 10) || (thing3 = 30),
  thing3
]
```

**Вывод:** `[ 1, 20, 20, 10, 10 ]`

В последнем случае `(false) || (thing3 = 10) || (thing3 = 30)` — первый `||` получает `10` (truthy), второй `||` замыкается и `thing3 = 30` не выполняется. Итого `thing3` остаётся `10`.

**На практике:** побочные эффекты внутри short-circuit выражений — частый источник багов, особенно в цепочках с `&&`/`||`.

---

### 3. Autoboxing при доступе к символу строки

**Файл:** `3.index-string-accessor.mjs`

Когда к примитивной строке обращаются через `[]`, движок выполняет autoboxing:

1. Примитив `'ab'` оборачивается во временный `new String('ab')` — объект вида `{ '0': 'a', '1': 'b', length: 2 }`
2. По указанному индексу извлекается свойство
3. Результат возвращается, временный объект отбрасывается

```js
var str = 'ab'
console.log(str[0]) // 'a'
```

**Вывод:**
```
a
```

Сам по себе результат ожидаемый, но механизм важен — он играет роль в следующем примере.

---

### 4. Мутация `String.prototype` и доступ по индексу

**Файл:** `4.string-and-number-not-primitive.mjs`

Продолжение предыдущего примера. Поскольку `str[i]` проходит через autoboxing и prototype chain, можно «внедрить» несуществующие символы через `String.prototype`:

```js
String.prototype['1'] = 'b'
var str = 'a'
"heheheh".constructor.prototype['2'] = "c"

console.log(str[0]) // 'a'  — реальный символ
console.log(str[1]) // 'b'  — из String.prototype!
console.log(str[2]) // 'c'  — из String.prototype!
```

**Вывод:**
```
a
b
c
```

Строка `'a'` имеет длину 1. У временного объекта `new String('a')` нет собственного свойства `'1'`, но оно находится в прототипе. Поэтому `str[1]` возвращает `'b'` вместо `undefined`.

Запись `"heheheh".constructor.prototype['2']` — то же самое, что `String.prototype['2']`: у строкового литерала `constructor` — это `String`.

**На практике:** prototype pollution может приводить к неожиданному поведению даже в базовых операциях вроде индексного доступа к строке.

---

### 5. Comma operator в `return`

**Файл:** `5.trail-operator.mjs`

Comma operator (`,`) вычисляет все операнды слева направо, но возвращает только последний:

```js
var doThing = () => {
  let a = 15, b = 10
  return (a *= b),(a *= b), a - b
}

console.log(doThing()) // 1490
```

Порядок вычислений:
1. `a *= b` → `a = 15 × 10 = 150`
2. `a *= b` → `a = 150 × 10 = 1500`
3. `a - b` → `1500 - 10 = 1490` — это и есть возвращаемое значение

**На практике:** comma operator легко спутать с разделителем аргументов или элементов массива. В `return` он может привести к неожиданному результату, если не знать, что возвращается только последнее выражение.

---

### 6. Ложный async stack trace в отладчике

**Файл:** `6.broken-async-stacktrace.mjs`

При использовании `debugger` внутри вложенных `Promise` + `setTimeout` можно наблюдать, как функция `main` «возвращается» в call stack, хотя она уже завершилась:

```js
function main() {
  new Promise((res1) => {
    setTimeout(() => {
      return new Promise(res2 => {
        setTimeout(() => {
          console.log('Heh')
          debugger // main снова видна в call stack?
          res1('Heh1')
          res2('Heh2')
        }, 1)
      })
    }, 1)
  }).then(console.log)

  debugger // main ещё реально на стеке
}

main()
```

**Вывод:**
```
Heh
Heh1
```

Первый `debugger` срабатывает, когда `main` действительно на стеке. Второй `debugger` (внутри setTimeout) срабатывает уже после выхода из `main`, но V8 показывает `main` в async stack trace. Это полезно для отладки, но может вводить в заблуждение о реальном состоянии call stack.

---

### 7. Влияние GC при копировании объектов (placeholder)

**Директория:** `7-impact-GC-in-copy-of-objects/`

Файлы `1.dummy-copy.js` и `2.flyweight-pattern.js` зарезервированы для сравнения наивного глубокого копирования объектов vs паттерна flyweight с точки зрения нагрузки на сборщик мусора. Пока не реализованы.

---

### 8. `return await` vs `return` — сохранение async stack trace

**Файл:** `8.async-stacktrace.mjs`

Демонстрирует разницу между `return f()` и `return await f()` для сохранения полного async stack trace при ошибке. Цепочка вызовов: `f1 → f2 → f3`, где `f3` пытается прочитать несуществующий файл.

Три варианта `f3`:

**`f3NotWorked`** — `setTimeout` + callback-based `fs.readFile`. Stack trace теряется полностью: setTimeout разрывает async-цепочку.

**`f3SolvedWithoutAwaits`** — promise-based API, но без `await` на каждом уровне возврата. Stack trace частичный — видны только внутренности Node.js, но не `f1`/`f2`.

**`f3SolvedFullyAwaits`** — `return await` на каждом уровне вызовов. Полный stack trace:
```
at async f3SolvedFullyAwaits (...)
at async f2 (...)
at async f1 (...)
```

Ключевое правило: `return await` сохраняет текущую функцию в async stack trace, потому что функция остаётся в цепочке ожидания. Простой `return` — нет, потому что функция завершается до разрешения промиса.

**На практике:** `return await` внутри `try/catch` или для диагностики — не избыточность, а необходимость для нормальной отладки в production.

---

### 9. Сериализация объектов с non-enumerable свойствами

**Файл:** `9.make-any-object-serializable.cjs`

`JSON.stringify()` сериализует только enumerable-свойства. У `Error` свойства `message` и `stack` — non-enumerable:

```js
const err = new Error('Hello world')

console.log(Object.keys(err))       // []
console.log(JSON.stringify(err))     // {}
```

Решение — перевести все own-свойства в enumerable через `Object.getOwnPropertyNames`:

```js
function toEnumerable(obj) {
  return Object.fromEntries(
    Object.getOwnPropertyNames(obj).map(prop => [prop, obj[prop]])
  );
}

const errSerializable = toEnumerable(err)
console.log(JSON.stringify(errSerializable))
// {"stack":"Error: Hello world\n    at ...","message":"Hello world"}
```

**На практике:** при логировании или отправке ошибок в мониторинг `JSON.stringify(error)` отдаёт `{}`. Нужна явная конвертация.

---

### 10. Race condition при конкурентных async-операциях

**Файл:** `10. race-condition.js`

Классический пример race condition: две async-функции конкурентно читают, модифицируют и записывают общий счётчик:

```js
let counter = 0;

async function increment() {
  counter = await db.getCounter();  // читает 0
  counter++;
  await db.setCounter(counter);     // пишет 1
}

async function decrement() {
  counter = await db.getCounter();  // тоже читает 0 (до записи increment)
  counter--;
  await db.setCounter(counter);     // пишет -1
}

increment();
decrement();
```

**Вывод:**
```
Counter: -1
```

Ожидаемо `0` (increment + decrement), но обе функции прочитали `counter = 0` до того, как другая записала результат. Последняя записавшая (`decrement`) побеждает, итог — `-1`.

**На практике:** даже в однопоточном JS race conditions возникают при конкурентных async-операциях без синхронизации (мьютексов, очередей, транзакций).
