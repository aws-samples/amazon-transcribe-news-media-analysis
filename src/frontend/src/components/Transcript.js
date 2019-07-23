import React, { useEffect, useRef, useReducer, useState } from "react";
import { Alert, OverlayTrigger, Tooltip } from "react-bootstrap";

import { formatDate, scrollToDiv, sortByKey } from "../utils";
import { TRANSCRIPTION_STATUS } from "../utils/strings";
import { POLL_INTERVAL } from "../utils/timers";

export default ({ getCurrentTimestamp, mediaUrl, paused, poll, showError }) => {
  const textDiv = useRef(undefined);

  const [watermark, setWatermark] = useState(undefined);

  const [transcript, addTranscriptions] = useReducer(
    (transcriptions, newTranscriptions) => {
      const withoutPartials = transcriptions.filter(el => !el.isPartial);
      return [...withoutPartials, ...newTranscriptions];
    },
    []
  );

  useEffect(() => {
    let timer;

    const fetchSubtitles = () => {
      if (paused) return;

      return poll(mediaUrl, watermark, getCurrentTimestamp())
        .then(r => {
          if (paused) return;

          const serialized = sortByKey(r.fragments, "timestamp");
          const fullFragments = serialized.filter(el => !el.isPartial);
          addTranscriptions(serialized);

          if (fullFragments.length > 0) {
            const lastTimestamp =
              fullFragments[fullFragments.length - 1].timestamp;

            timer = setTimeout(
              () => setWatermark(lastTimestamp + 1),
              POLL_INTERVAL
            );
          } else timer = setTimeout(fetchSubtitles, POLL_INTERVAL);
        })
        .catch(e => showError(true));
    };

    if (!watermark) setWatermark(getCurrentTimestamp());
    else fetchSubtitles();

    return () => clearTimeout(timer);
  }, [getCurrentTimestamp, paused, poll, showError, mediaUrl, watermark]);

  useEffect(() => {
    scrollToDiv(textDiv.current);
  });

  const transcriptionMaxHeight = 480 - (paused ? 88 : 0);

  return (
    <>
      {paused && (
        <Alert variant="warning">
          {TRANSCRIPTION_STATUS[watermark ? "PAUSED" : "STARTING"]}
        </Alert>
      )}
      <div
        style={{
          maxHeight: `${transcriptionMaxHeight}px`,
          overflow: "scroll",
          textAlign: "left"
        }}
        ref={x => (textDiv.current = x)}
      >
        {transcript.map((row, index) => (
          <OverlayTrigger
            key={`ot-t-${index}`}
            placement="left"
            overlay={
              <Tooltip id={`tooltip-t-${index}`}>
                {formatDate(row.timestamp)}
              </Tooltip>
            }
          >
            <div
              className={row.isPartial ? "partial transcript" : "transcript"}
            >
              {row.transcript}
              {row.isPartial && "..."}
            </div>
          </OverlayTrigger>
        ))}
      </div>
    </>
  );
};
