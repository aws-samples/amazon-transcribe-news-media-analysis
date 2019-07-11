import React, { useRef, useEffect } from "react";
import { Alert, Col, Container, Row } from "react-bootstrap";
import videojs from "video.js";
import "videojs-youtube";

export default ({ videoUrl }) => {
  const videoNode = useRef(null);

  useEffect(() => {
    const options = {
      autoplay: true,
      controls: true,
      sources: [
        {
          src: videoUrl,
          type: "video/youtube"
        }
      ]
    };

    let player;
    setTimeout(() => (player = videojs(videoNode.current, options)), 1000);
    return () => (player ? player.dispose() : {});
  });

  return (
    <div data-vjs-player>
      <Container>
        <Row>
          <Col sm={12}>
            <Alert variant="dark">{videoUrl}</Alert>
          </Col>
        </Row>
        <Row>
          <Col sm={8}>
            <video
              ref={x => (videoNode.current = x)}
              className="video-js"
              autoPlay
              style={{ width: "100%", height: "480px" }}
            />
          </Col>
          <Col sm={4}>INFO (TODO)</Col>
        </Row>
      </Container>
    </div>
  );
};
