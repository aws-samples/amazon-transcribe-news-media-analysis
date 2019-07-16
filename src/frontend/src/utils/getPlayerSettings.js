export default videoUrl => {
  const settings = {
    autoplay: true,
    controls: true,
    sources: [{ src: videoUrl }]
  };

  const isYouTube = videoUrl.indexOf("https://www.youtube") === 0;
  if (isYouTube) settings.sources[0].type = "video/youtube";

  return settings;
};
