export const sortByKey = (array, key) =>
  array.sort((a, b) => (a[key] > b[key] ? 1 : a[key] < b[key] ? -1 : 0));

export const toObj = (arr, key) => {
  const obj = {};
  arr.forEach(el => (obj[el[key].trim()] = el));
  return obj;
};
