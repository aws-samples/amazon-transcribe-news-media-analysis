import React, { useRef, useState } from "react";
import { Button, Form, OverlayTrigger, Tooltip } from "react-bootstrap";

import { GENERIC } from "../utils/strings";
import { RESET_CLIPBOARDCOPY_REF } from "../utils/timers";

import Icon from "./Icon";

export default ({ mediaUrl }) => {
  const [copied, setCopied] = useState(false);
  const textbox = useRef(null);

  const watchUrl = `${window.location.href}?watchUrl=${encodeURIComponent(
    mediaUrl
  )}`;

  const copyToClipboard = e => {
    e.preventDefault();
    textbox.current.select();
    document.execCommand("copy");
    setCopied(true);
    setTimeout(() => setCopied(false), RESET_CLIPBOARDCOPY_REF);
  };

  const openInNewWindow = e => {
    e.preventDefault();
    window.open(watchUrl);
  };

  return (
    <nobr>
      <Form.Group>
        <Form.Control
          onClick={e => e.target.select()}
          readOnly
          ref={e => (textbox.current = e)}
          size="sm"
          style={{ width: "80%", float: "left" }}
          value={watchUrl}
        />
        <OverlayTrigger
          key="copy"
          placement="bottom"
          overlay={
            <Tooltip id="tooltip-copy">
              {GENERIC[copied ? "COPIED" : "COPY_TO_CLIPBOAD"]}
            </Tooltip>
          }
        >
          <Button onClick={copyToClipboard} variant="outline-dark">
            <Icon type="copy" />
          </Button>
        </OverlayTrigger>
        <OverlayTrigger
          key="new-window"
          placement="bottom"
          overlay={
            <Tooltip id="tooltip-new-window">{GENERIC.OPEN_NEW_WINDOW}</Tooltip>
          }
        >
          <Button onClick={openInNewWindow} variant="outline-dark">
            <Icon type="new-window" />
          </Button>
        </OverlayTrigger>
      </Form.Group>
    </nobr>
  );
};
