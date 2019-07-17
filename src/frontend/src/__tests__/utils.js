import { isUrl } from "../utils";

test("urls are correctly detected", () => {
  [
    "http://www.youtube.com/abcdef",
    "https://youtube.com/abcdef",
    "https://www.youtube.com/abcdef",
    "https://youtu.be/abcdef"
  ].forEach(url => {
    const result = isUrl(url);
    expect(result).toEqual(true);
  });
});

test("non urls are correctly detected", () => {
  [
    "blabla.com/abcdef",
    "www.blabla.com/abcdef",
    "htps://www.foo.com/bar",
    "https:/www.foo.com/bar"
  ].forEach(url => {
    const result = isUrl(url);
    expect(result).toEqual(false);
  });
});
