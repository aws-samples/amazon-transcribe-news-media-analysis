import React, { useEffect, useReducer, useRef, useState } from "react";
import { Alert, Col, Container, Row, Spinner } from "react-bootstrap";
import videojs from "video.js";
import "videojs-youtube";

import ErrorAlert from "./ErrorAlert";
import Transcript from "./Transcript";

import { getUTCTimestamp, sortByKey } from "../utils";
const POLL_INTERVAL = 1000;

export default ({ getTask, poll, videoUrl }) => {
  const videoNode = useRef(null);
  const [taskStatus, setTaskStatus] = useState("LOADING");
  const [errorShown, showError] = useState(false);
  const [videoShown, showVideo] = useState(false);
  const [watermark, setWatermark] = useState(0);
  const [transcript, addTranscriptions] = useReducer(
    (transcriptions, newTranscriptions) => {
      const withoutPartials = transcriptions.filter(el => !el.isPartial);
      return [...withoutPartials, ...newTranscriptions];
    },
    []
  );

  useEffect(() => {
    const fetchSubtitles = () =>
      poll(videoUrl, watermark, getUTCTimestamp())
        .then(r => {
          const serialized = sortByKey(r.fragments, "timestamp");
          const fullFragments = serialized.filter(el => !el.isPartial);
          addTranscriptions(serialized);

          if (fullFragments.length > 0) {
            const lastTimestamp =
              fullFragments[fullFragments.length - 1].timestamp;
            setTimeout(() => setWatermark(lastTimestamp + 1), POLL_INTERVAL);
          } else setTimeout(fetchSubtitles, POLL_INTERVAL);
        })
        .catch(() => showError(true));

    const fetchStatusAndShowVideo = () =>
      getTask()
        .then(task => {
          setTaskStatus(task.taskStatus);
          if (
            task.taskStatus === "ERROR" ||
            task.taskStatus === "WAITING" ||
            task.taskStatus === "INITIALIZING"
          ) {
            setTimeout(fetchStatusAndShowVideo, 3000);
          }

          if (task.taskStatus !== "TERMINATING") {
            showVideo(true);
          }

          if (task.taskStatus === "PROCESSING") {
            fetchSubtitles();
          }
        })
        .catch(() => showError(true));

    fetchStatusAndShowVideo();
  }, [getTask, poll, watermark, videoUrl]);

  useEffect(() => {
    if (videoShown) {
      const options = {
        autoplay: true,
        controls: true,
        sources: [{ src: videoUrl }]
      };

      const isYouTube = videoUrl.indexOf("https://www.youtube") === 0;
      if (isYouTube) options.sources[0].type = "video/youtube";
      let player;

      setTimeout(() => (player = videojs(videoNode.current, options)), 1000);
      return () => (player ? player.dispose() : {});
    }
  }, [videoShown, videoUrl]);

  return (
    <div data-vjs-player>
      <Container>
        <Row>
          <Col sm={12}>
            <Alert variant="dark">{videoUrl}</Alert>
            <ErrorAlert show={errorShown} />
            {taskStatus === "TERMINATING" && (
              <Alert variant="danger">
                This media is not available anymore.
              </Alert>
            )}
          </Col>
        </Row>
        <Row>
          <Col sm={8}>
            {videoShown && (
              <video
                ref={x => (videoNode.current = x)}
                className="video-js"
                autoPlay
                style={{ width: "100%", height: "480px" }}
              />
            )}
          </Col>
          <Col sm={4}>
            {taskStatus === "LOADING" && (
              <>
                <Spinner animation="border" />
                <br />
                <span>Loading...</span>
              </>
            )}
            {taskStatus === "PROCESSING" && (
              <Transcript transcript={transcript} />
            )}
            {taskStatus === "ERROR" && (
              <Alert variant="danger">
                <Spinner animation="border" />
                <br />
                Unfortunately, there are some issues with the transcription
                process. Please wait...
              </Alert>
            )}
            {(taskStatus === "WAITING" || taskStatus === "INITIALIZING") && (
              <Alert variant="warning">
                <Spinner animation="border" />
                <br />
                The transcription process is going to start soon. Please wait...
              </Alert>
            )}
          </Col>
        </Row>
      </Container>
    </div>
  );
};
