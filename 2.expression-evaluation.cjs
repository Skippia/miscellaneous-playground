var thing = 0

var list = [
  1,
  (false) && (thing = 10),
  2,
  thing
] // 1, false, 2, 0


console.log(list)

console.log('-----------------------------------')

var thing2 = 0
var list2 = [
  1,
  (false) && (thing2 = 10) || (thing2 = 20),
  thing2,
  (false) || (thing2 = 10) && (thing2 = 20),
  thing2,
] // 1, 20, 20, 20, 20

console.log(list2) 


console.log('-----------------------------------')

var thing3 = 0
var list3 = [
  1,
  (false) && (thing3 = 10) || (thing3 = 20),
  thing3,
  (false) || (thing3 = 10) || (thing3 = 30),
  thing3
] // 1, 20, 20, 10, 10

console.log(list3) 
