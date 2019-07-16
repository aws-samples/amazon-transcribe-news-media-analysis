import React, { useEffect, useRef, useReducer, useState } from "react";
import { OverlayTrigger, Tooltip } from "react-bootstrap";

import { formatDate, getUTCTimestamp, scrollToDiv, sortByKey } from "../utils";
import { POLL_INTERVAL } from "../utils/timers";

export default ({ poll, showError, videoUrl }) => {
  const textDiv = useRef(undefined);
  const [watermark, setWatermark] = useState(getUTCTimestamp());
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
        .catch(e => showError(true));

    fetchSubtitles();
  }, [poll, showError, videoUrl, watermark]);

  useEffect(() => {
    scrollToDiv(textDiv.current);
  });

  return (
    <div
      style={{ maxHeight: "480px", overflow: "scroll", textAlign: "left" }}
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
          <div className={row.isPartial ? "partial transcript" : "transcript"}>
            {row.transcript}
            {row.isPartial && "..."}
          </div>
        </OverlayTrigger>
      ))}
    </div>
  );
};
