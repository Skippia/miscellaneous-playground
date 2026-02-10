function main() {
  new Promise((res1) => {
    setTimeout(() => {
      return new Promise(res2 => {
        setTimeout(() => {
          console.log('Heh')
          debugger // 2. somehow main function again in call stack??

          res1('Heh1')
          res2('Heh2')
        }, 1)
      })
    }, 1)
  }).then(console.log)

  debugger // 1. first off all we go here, then end of the function and main not in call stack
}


main()
