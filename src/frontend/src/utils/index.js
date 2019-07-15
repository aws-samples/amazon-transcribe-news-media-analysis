export const scrollToDiv = el =>
  (el.scrollTop = el.scrollHeight - el.clientHeight);

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

export const refreshPage = e => {
  e.preventDefault();
  window.location.reload();
};

export const sortByKey = (array, key) =>
  array
    .concat()
    .sort((a, b) => (a[key] > b[key] ? 1 : a[key] < b[key] ? -1 : 0));

export const toObj = (arr, key) =>
  arr.reduce((obj, el) => ((obj[el[key].trim()] = el), obj), {});