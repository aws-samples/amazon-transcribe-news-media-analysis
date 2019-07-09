export const sortByKey = (array, key) =>
  array.concat().sort((a, b) => (a[key] > b[key] ? 1 : a[key] < b[key] ? -1 : 0));

export const toObj = (arr, key) =>
  arr.reduce((obj, el) => ((obj[el[key].trim()] = el), obj), {});
