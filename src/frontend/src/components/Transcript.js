import React, { useEffect, useRef } from "react";

import { OverlayTrigger, Tooltip } from "react-bootstrap";

import { scrollToDiv } from "../utils";

const format = ts => new Date(ts).toString();

export default ({ transcript }) => {
  const textDiv = useRef(undefined);

  useEffect(() => {
    if (typeof textDiv !== "undefined") scrollToDiv(textDiv.current);
  }, [transcript]);
  return (
    <div
      style={{ maxHeight: "480px", overflow: "scroll" }}
      ref={x => (textDiv.current = x)}
    >
      {transcript.map((row, index) => (
        <OverlayTrigger
          key={`ot-t-${index}`}
          placement="left"
          overlay={
            <Tooltip id={`tooltip-t-${index}`}>{format(row.timestamp)}</Tooltip>
          }
        >
          <span className={row.isPartial ? "partial transcript" : "transcript"}>
            {row.transcript}
            {row.isPartial ? "..." : " "}
          </span>
        </OverlayTrigger>
      ))}
    </div>
  );
};
