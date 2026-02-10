const obj = {}

console.log(obj['a'] === undefined) // true

var undefined = 1

console.log(obj['a'] === undefined) // false

export default {}
