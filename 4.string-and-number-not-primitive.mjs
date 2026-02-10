String.prototype['1'] = 'b'

var str = 'a'
"heheheh".constructor.prototype['2'] = "c"

console.log(str[0]) // 'a'
console.log(str[1]) // expect undefined but get 'b'
console.log(str[2]) // expect undefined but get 'c'



