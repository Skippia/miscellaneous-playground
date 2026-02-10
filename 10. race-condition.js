let counter = 0;

const db = {
  getCounter: () => Promise.resolve(counter),
  setCounter: (value) => (counter = value, Promise.resolve()),
}

async function increment() {
  counter = await db.getCounter();
  counter++;
  await db.setCounter(counter);
}

async function decrement() {
  counter = await db.getCounter();
  counter--;
  await db.setCounter(counter);
}

// Calling functions concurrently
increment();
decrement();

setTimeout(() => {
  console.log('Counter:', counter)
  // Expected counter: 0
  // Actual counter: could be 0, 1, or -1, depending on the order of execution
}, 1000)
