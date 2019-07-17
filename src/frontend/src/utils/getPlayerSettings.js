export default videoUrl => {
  const settings = {
    autoplay: true,
    controls: true,
    sources: [{ src: videoUrl }]
  };

  const isYouTube = videoUrl.match(/^(https?:\/\/)?(www.)?(youtube.com|youtu.?be)\/.+$/) !== null;
  if (isYouTube) settings.sources[0].type = "video/youtube";

  return settings;
};
