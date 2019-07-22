export default mediaUrl => {
  const settings = {
    controls: true,
    sources: [{ src: mediaUrl }]
  };

  const isYouTube = mediaUrl.match(/^(https?:\/\/)?(www.)?(youtube.com|youtu.?be)\/.+$/) !== null;
  if (isYouTube) settings.sources[0].type = "video/youtube";

  return settings;
};
