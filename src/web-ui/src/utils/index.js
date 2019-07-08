export const sortByKey = (array, key) =>
  array.sort((a, b) => (a[key] > b[key] ? 1 : a[key] < b[key] ? -1 : 0));
