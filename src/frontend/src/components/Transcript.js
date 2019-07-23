import React, { useEffect, useRef, useReducer, useState } from "react";
import { Alert, OverlayTrigger, Tooltip } from "react-bootstrap";

import { formatDate, scrollToDiv, sortByKey } from "../utils";
import { TRANSCRIPTION_STATUS } from "../utils/strings";
import { POLL_INITIAL_FETCH_PASTTIME, POLL_INTERVAL } from "../utils/timers";

export default ({
  getCurrentTimestamp,
  mediaUrl,
  poll,
  showError,
  videoStatus
}) => {
  const textDiv = useRef(undefined);

  const [watermark, setWatermark] = useState(undefined);

  const [transcript, addTranscriptions] = useReducer(
    (transcriptions, newTranscriptions) => {
      const withoutPartials = transcriptions.filter(el => !el.isPartial);
      return [...withoutPartials, ...newTranscriptions];
    },
    []
  );

  const isPlaying = videoStatus === "PLAYING";

  useEffect(() => {
    let timer;

    const fetchSubtitles = () => {
      if (!isPlaying) return;

      return poll(mediaUrl, watermark, getCurrentTimestamp())
        .then(r => {
          if (!isPlaying) return;

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

    if (!isPlaying) return;
    else if (!watermark)
      setWatermark(getCurrentTimestamp() - POLL_INITIAL_FETCH_PASTTIME);
    else fetchSubtitles();

    return () => clearTimeout(timer);
  }, [getCurrentTimestamp, isPlaying, mediaUrl, poll, showError, watermark]);

  useEffect(() => {
    scrollToDiv(textDiv.current);
  });

  const transcriptionMaxHeight = 480 - (!isPlaying ? 104 : 0);

  return (
    <>
      {!isPlaying && (
        <Alert variant="warning">{TRANSCRIPTION_STATUS[videoStatus]}</Alert>
      )}
      <div
        style={{
          maxHeight: `${transcriptionMaxHeight}px`,
          overflow: "scroll",
          textAlign: "left"
        }}
        ref={x => (textDiv.current = x)}
      >
        {transcript.map((row, index) => {
          const fdate = formatDate(row.timestamp);
          const isFirst = index === 0;
          const isLast = index === transcript.length - 1;
          const otkey = `ot-t-${index}`;
          const ttid = `tooltip-t-${index}`;
          const textStyle = {};

          if (row.isPartial) textStyle.fontStyle = "italic";
          if (!isFirst && isLast) textStyle.marginTop = "20px";

          return (
            <OverlayTrigger
              key={otkey}
              placement="bottom"
              overlay={<Tooltip id={ttid}>{fdate}</Tooltip>}
              popperConfig={{
                modifiers: { preventOverflow: { enabled: false } }
              }}
            >
              <div className="transcript" style={textStyle}>
                {row.transcript}
                {row.isPartial && "..."}
              </div>
            </OverlayTrigger>
          );
        })}
      </div>
    </>
  );
};
