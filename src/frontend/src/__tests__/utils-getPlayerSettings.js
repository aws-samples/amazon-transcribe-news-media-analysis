import getPlayerSettings from "../utils/getPlayerSettings";

test("youtube urls are correctly rendered", () => {
  [
    "http://www.youtube.com/abcdef",
    "https://youtube.com/abcdef",
    "https://www.youtube.com/abcdef",
    "https://youtu.be/abcdef"
  ].forEach(url => {
    const result = getPlayerSettings(url);
    expect(result.sources[0].type).toEqual("video/youtube");
  });
});

test("non youtube urls are correctly rendered", () => {
  ["https://www.blabla.com/abcdef", "https://www.foo.com/bar"].forEach(url => {
    const result = getPlayerSettings(url);
    expect(result.sources[0].type).toEqual(undefined);
  });
});
