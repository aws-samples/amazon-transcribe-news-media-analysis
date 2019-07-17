export const contains = (obj, key) => !!obj[key.trim()];

export const formatDate = ts => new Date(ts).toString();

export const getCurrentLocation = () => window.location.href;

export const getUTCTimestamp = () => Math.floor(new Date().getTime());

export const getUrlParameter = name => {
  name = name.replace(/[[]/, "\\[").replace(/[\]]/, "\\]");
  const regex = new RegExp(`[\\?&]${name}=([^&#]*)`);
  const results = regex.exec(window.location.search);

  return results === null
    ? ""
    : decodeURIComponent(results[1].replace(/\+/g, " "));
};

export const isEmpty = s => s.trim() === "";

export const isUrl = s => s.match(/^https?:\/\//i) !== null;

export const refreshPage = e => {
  e.preventDefault();
  window.location.reload();
};

export const scrollToDiv = el =>
  el ? (el.scrollTop = el.scrollHeight - el.clientHeight) : {};

export const sortByKey = (array, key) =>
  array
    .concat()
    .sort((a, b) => (a[key] > b[key] ? 1 : a[key] < b[key] ? -1 : 0));

export const toObj = (arr, key) =>
  arr.reduce((obj, el) => (obj[el[key].trim()] = el) && obj, {});
