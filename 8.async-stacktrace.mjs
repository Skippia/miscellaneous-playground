import fs from 'fs'
import fsPromises from 'fs/promises'

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function f1() {
  // return f2()
  return await f2()
}

async function f2() {
  // return f3NotWorked()
  // return f3SolvedWithoutAwaits()
  return await f3SolvedFullyAwaits()
}

/**
 * #1 (f3NotWorked)
 * But if we run function within (setTimeout) we get empty stack trace (no matter what what was before):
 */
function f3NotWorked() {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      fs.readFile('not-existing-path', (err, data) => {
        if (err) reject(err)
        resolve(data)
      })
    }, 1000)
  })
}

/**
 * #2 (f3Solved without awaits)
    at async open (node:internal/fs/promises:639:25)
    at async Object.readFile (node:internal/fs/promises:1249:14)
 * If we remove setTimeout and invoke fs.readFile (without await in returns) in f3Solved(or without delay), we get partial stack trace:   
 */
async function f3SolvedWithoutAwaits() {
  // function returns unresolved promise
  return new Promise((resolve, reject) => {
    delay(1000)
      .then(() => resolve(fsPromises.readFile('not-existing-path')))
      .catch(reject)
  })
  // Fully equal (no matter delete we async from function or not)
  /* try {
    await delay(2000)
    return fs.readFile('not-existing-path')
  } catch(err){
    throw err
  } */
}
/**
 * #3 (f3Solved with all awaits)
 * If we remove setTimeout and invoke fs.readFile in f3Solved(or without delay), we get great stack trace: 
 */
async function f3SolvedFullyAwaits() {
  /**
    at async open (node:internal/fs/promises:639:25)
    at async Object.readFile (node:internal/fs/promises:1249:14)
    at async f2 (file:///home/skippy/CURRENT_PROJECTS/[playgrounds]/random-playground/8.async-stacktrace.mjs:15:10)
    at async f1 (file:///home/skippy/CURRENT_PROJECTS/[playgrounds]/random-playground/8.async-stacktrace.mjs:9:10)
   */
 /*  return new Promise((resolve, reject) => {
    delay(1000)
      .then(() => fsPromises.readFile('not-existing-path'))
      .then(resolve)
      .catch(reject)
  }) */
  /**
     at async open (node:internal/fs/promises:639:25)
     at async Object.readFile (node:internal/fs/promises:1249:14)
     at async f3SolvedFullyAwaits (file:///home/skippy/CURRENT_PROJECTS/[playgrounds]/random-playground/8.async-stacktrace.mjs:88:12)
     at async f2 (file:///home/skippy/CURRENT_PROJECTS/[playgrounds]/random-playground/8.async-stacktrace.mjs:15:10)
     at async f1 (file:///home/skippy/CURRENT_PROJECTS/[playgrounds]/random-playground/8.async-stacktrace.mjs:9:10)
   */
  /* return new Promise((resolve, reject) => {
    delay(1000)
    .then(async () => await fsPromises.readFile('not-existing-path'))
    .catch(reject)
    }) */
  // ! Fully equal previous one
  try {
    await delay(1000)
    return await fsPromises.readFile('not-existing-path')
  } catch (err) {
    throw err
  }
};

f1().catch(err => {
  console.log('stack:', err.stack)
})


// #####################################################################

/* const f1 = async () => {
  await delay(1000)
  return await f2()
}

const f2 = async () => {
  await delay(1000)
  return await f3Alternative()
  // return await f3()
}

const f3 = async () => {
  await delay(1000)
  throw new Error('heh')
}

const f3Alternative = () => {
  const err = new Error('heh')
  return new Promise((_, reject) => delay(1000).then(() => reject(err)))
};


f1().catch(err => {
  console.log('stack:', err.stack)
}) */

// #####################################################################

/* const _f1 = async () => (await delay(1000), await _f2())

const _f2 = async () => (await delay(1000), _f3())

const _f3 = async () => {
  await delay(1000)
  throw new Error('heh')
};

_f1().catch(err => {
  console.log('stack:', err.stack)
}) */
