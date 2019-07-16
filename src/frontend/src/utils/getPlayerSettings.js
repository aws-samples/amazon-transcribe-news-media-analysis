const youtubeRegex = new RegExp(
  "^(https?://)?(www.)?(youtube.com|youtu.?be)/.+$"
);

export default mediaUrl => {
  const settings = {
    autoplay: true,
    controls: true,
    sources: [{ src: mediaUrl }]
  };

  const isYouTube = youtubeRegex.test(mediaUrl);
  if (isYouTube) settings.sources[0].type = "video/youtube";

  return settings;
};
