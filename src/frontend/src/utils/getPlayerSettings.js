const youtubeRegex = new RegExp(
  "^(https?://)?(www.)?(youtube.com|youtu.?be)/.+$"
);

export default videoUrl => {
  const settings = {
    autoplay: true,
    controls: true,
    sources: [{ src: videoUrl }]
  };

  const isYouTube = youtubeRegex.test(videoUrl);
  if (isYouTube) settings.sources[0].type = "video/youtube";

  return settings;
};
