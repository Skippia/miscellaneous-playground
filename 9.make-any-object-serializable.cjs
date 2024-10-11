function toEnumerable(obj) {
  return Object.fromEntries(
    Object.getOwnPropertyNames(obj).map(prop => [prop, obj[prop]])
  );
};

const err = new Error('Hello world')
const errSerializable = toEnumerable(err)

console.log("Not serializable:", Object.keys(err), JSON.stringify(err))
console.log("Serializable:", Object.keys(errSerializable), JSON.stringify(errSerializable))


