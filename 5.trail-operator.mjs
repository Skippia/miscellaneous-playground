var doThing = () => {
  let a = 15, b = 10
  // return (a *= b), a - b
  return (a *= b),(a *= b), a - b // run all operation before trail, but run something after trail
}

console.log(doThing()) // 1490
