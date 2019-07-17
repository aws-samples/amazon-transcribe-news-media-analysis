import React, { Fragment, useEffect, useRef, useState } from "react";
import { Alert, Col, Container, Row, Spinner } from "react-bootstrap";
import videojs from "video.js";
import "videojs-youtube";

import getPlayerSettings from "../utils/getPlayerSettings";
import { TASKSTATUS_MESSAGE } from "../utils/strings";
import { FETCH_TASKSTATUS_RETRY } from "../utils/timers";

import ErrorAlert from "./ErrorAlert";
import Transcript from "./Transcript";

const renderWithLineBreaks = text =>
  text.split("\n").map((item, key) => (
    <Fragment key={key}>
      {item}
      <br />
    </Fragment>
  ));

export default ({ getTask, poll, mediaUrl }) => {
  const videoNode = useRef(null);
  const [errorShown, showError] = useState(false);
  const [mediaDetails, setMediaDetails] = useState({
    mediaUrl,
    taskStatus: "LOADING"
  });
  const [videoShown, showVideo] = useState(false);

  const videoInitialized = useRef(false);

  const playerSettings = getPlayerSettings(mediaUrl);

  useEffect(() => {
    const notProcessing = s =>
      s === "ERROR" || s === "WAITING" || s === "INITIALIZING";
    const shouldShowVideo = s => s !== "TERMINATING";

    const fetchDetailsAndShowVideo = () =>
      getTask()
        .then(task => {
          setMediaDetails(task);
          if (notProcessing(task.taskStatus)) {
            setTimeout(fetchDetailsAndShowVideo, FETCH_TASKSTATUS_RETRY);
          }

          if (!videoShown) showVideo(shouldShowVideo(task.taskStatus));
        })
        .catch(e => showError(true));

    fetchDetailsAndShowVideo();
  }, [getTask, videoShown]);

  useEffect(() => {
    if (videoShown && !videoInitialized.current) {
      videoInitialized.current = true;
      const element = videoNode.current;
      setTimeout(() => videojs(element, playerSettings), 1000);
    }
  }, [playerSettings, videoShown]);

  return (
    <div data-vjs-player>
      <Container>
        <Row>
          <Col sm={12} style={{ textAlign: "left" }}>
            <Alert variant="dark">
              {mediaDetails.mediaTitle && (
                <div style={{ fontWeight: "bold" }}>
                  {mediaDetails.mediaTitle}
                </div>
              )}
              <a
                href={mediaUrl}
                target="_blank"
                rel="noopener noreferrer"
                style={{ textDecoration: "underline" }}
              >
                {mediaUrl}
              </a>
              {mediaDetails.mediaDescription && (
                <div style={{ marginTop: "10px" }}>
                  {renderWithLineBreaks(mediaDetails.mediaDescription)}
                </div>
              )}
            </Alert>
            <ErrorAlert show={errorShown} />
            {mediaDetails.taskStatus === "TERMINATING" && (
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
            {mediaDetails.taskStatus === "LOADING" && (
              <>
                <Spinner animation="border" />
                <br />
                <span>{TASKSTATUS_MESSAGE.LOADING}</span>
              </>
            )}
            {mediaDetails.taskStatus === "PROCESSING" && (
              <Transcript
                poll={poll}
                showError={showError}
                mediaUrl={mediaUrl}
              />
            )}
            {mediaDetails.taskStatus === "ERROR" && (
              <Alert variant="danger">
                <Spinner animation="border" />
                <br />
                {TASKSTATUS_MESSAGE.ERROR}
              </Alert>
            )}
            {(mediaDetails.taskStatus === "WAITING" ||
              mediaDetails.taskStatus === "INITIALIZING") && (
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
