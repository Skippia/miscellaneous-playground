var str = 'ab'

/**
 * How we access to index when deal with string?
 * We have such operation under the hood when use [] operator for string:
 * 1. String 'ab' is converted to new String('ab') which is object { '0': 'a', '1': 'b', 'length': 2 }
 * 2. By index get element
 * 3. Return it
 * */ 
console.log(str[0]) // is run above code 


