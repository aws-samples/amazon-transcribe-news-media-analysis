import React, { useEffect, useRef, useState } from "react";
import { Alert, Col, Container, Row, Spinner } from "react-bootstrap";
import videojs from "video.js";
import "videojs-youtube";

import getPlayerSettings from "../utils/getPlayerSettings";
import { TASKSTATUS_MESSAGE } from "../utils/strings";
import { FETCH_TASKSTATUS_RETRY } from "../utils/timers";

import ErrorAlert from "./ErrorAlert";
import Transcript from "./Transcript";

export default ({ getTask, poll, mediaUrl }) => {
  const videoNode = useRef(null);
  const [errorShown, showError] = useState(false);
  const [taskStatus, setTaskStatus] = useState("LOADING");
  const [videoShown, showVideo] = useState(false);

  const playerSettings = getPlayerSettings(mediaUrl);

  useEffect(() => {
    const notProcessing = s =>
      s === "ERROR" || s === "WAITING" || s === "INITIALIZING";
    const shouldShowVideo = s => s !== "TERMINATING";

    const fetchStatusAndShowVideo = () =>
      getTask()
        .then(task => {
          setTaskStatus(task.taskStatus);
          if (notProcessing(task.taskStatus)) {
            setTimeout(fetchStatusAndShowVideo, FETCH_TASKSTATUS_RETRY);
          }

          showVideo(shouldShowVideo(task.taskStatus));
        })
        .catch(e => showError(true));

    fetchStatusAndShowVideo();
  }, [getTask]);

  useEffect(() => {
    if (videoShown) {
      let player;
      const element = videoNode.current;
      setTimeout(() => (player = videojs(element, playerSettings)), 1000);
      return () => (player ? player.dispose() : {});
    }
  }, [playerSettings, videoShown]);

  return (
    <div data-vjs-player>
      <Container>
        <Row>
          <Col sm={12}>
            <Alert variant="dark">{mediaUrl}</Alert>
            <ErrorAlert show={errorShown} />
            {taskStatus === "TERMINATING" && (
              <Alert variant="danger">{TASKSTATUS_MESSAGE.TERMINATING}</Alert>
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
                <span>{TASKSTATUS_MESSAGE.LOADING}</span>
              </>
            )}
            {taskStatus === "PROCESSING" && (
              <Transcript
                poll={poll}
                showError={showError}
                mediaUrl={mediaUrl}
              />
            )}
            {taskStatus === "ERROR" && (
              <Alert variant="danger">
                <Spinner animation="border" />
                <br />
                {TASKSTATUS_MESSAGE.ERROR}
              </Alert>
            )}
            {(taskStatus === "WAITING" || taskStatus === "INITIALIZING") && (
              <Alert variant="warning">
                <Spinner animation="border" />
                <br />
                {TASKSTATUS_MESSAGE.WAITING}
              </Alert>
            )}
          </Col>
        </Row>
      </Container>
    </div>
  );
};
