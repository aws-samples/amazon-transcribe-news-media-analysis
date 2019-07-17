import React, { useState } from "react";
import { Button, Form, Modal, Spinner } from "react-bootstrap";

import { BUTTONS, MEDIA_CONTENT } from "../utils/strings";

export default ({ onSubmit, onAdded, onError, tasks }) => {
  const [addModalShown, showAddModal] = useState(false);
  const [adding, setAdding] = useState(false);
  const [mediaUrl, setMediaUrl] = useState("");

  const hideModal = () => showAddModal(false);
  const addMediaItem = () => {
    setAdding(true);

    const afterAdding = () => {
      hideModal();
      setAdding(false);
      onAdded();
    };

    const withError = () => {
      afterAdding();
      onError();
    };

    return onSubmit(mediaUrl)
      .then(afterAdding)
      .catch(withError);
  };

  const mediaAlreadyPresent = !!tasks[mediaUrl.trim()];
  const isValid = mediaUrl.indexOf("http") === 0 && !mediaAlreadyPresent;

  const textboxValidationAttributes = isValid
    ? { isValid: true }
    : { isInvalid: true };

  return (
    <>
      <Button size="sm" variant="success" onClick={() => showAddModal(true)}>
        {BUTTONS.ADD}
      </Button>
      <Modal
        size="lg"
        centered
        show={addModalShown}
        onHide={hideModal}
        style={{ color: "black" }}
      >
        <Modal.Header closeButton>
          <Modal.Title>{MEDIA_CONTENT.NEW_TITLE}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group controlId="mediaUrl">
              <Form.Label>{MEDIA_CONTENT.URL}</Form.Label>
              <Form.Control
                onChange={e => setMediaUrl(e.target.value)}
                required
                type="text"
                {...textboxValidationAttributes}
              />
              <Form.Text className="text-muted">
                {MEDIA_CONTENT.ADD_DESCRIPTION}
              </Form.Text>
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button onClick={addMediaItem} variant="success" disabled={!isValid}>
            {adding ? (
              <Spinner animation="border" size="sm" />
            ) : (
              BUTTONS.ADD_CONFIRM
            )}
          </Button>
          <Button onClick={hideModal}>{BUTTONS.CANCEL}</Button>
        </Modal.Footer>
      </Modal>
    </>
  );
};
