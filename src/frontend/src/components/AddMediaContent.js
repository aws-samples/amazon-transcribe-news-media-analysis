import React, { useState } from "react";
import { Button, Form, Modal, Spinner } from "react-bootstrap";

import { contains, isEmpty, isUrl } from "../utils";
import { BUTTONS, GENERIC, MEDIA_CONTENT } from "../utils/strings";

export default ({ onSubmit, onAdded, onError, tasks }) => {
  const [addModalShown, showAddModal] = useState(false);
  const [adding, setAdding] = useState(false);
  const [mediaDescription, setMediaDescription] = useState("");
  const [mediaTitle, setMediaTitle] = useState("");
  const [mediaUrl, setMediaUrl] = useState("");

  const hideModal = () => showAddModal(false);
  const addMediaItem = () => {
    setAdding(true);

    const afterAdding = () => {
      hideModal();
      setAdding(false);
      setMediaDescription("");
      setMediaTitle("");
      setMediaUrl("");
      onAdded();
    };

    const withError = () => {
      afterAdding();
      onError();
    };

    return onSubmit({ mediaDescription, mediaTitle, mediaUrl })
      .then(afterAdding)
      .catch(withError);
  };

  const isMediaTitleValid = !isEmpty(mediaTitle);
  const isMediaUrlValid = isUrl(mediaUrl) && !contains(tasks, mediaUrl);

  const validationAttributes = isValid =>
    isValid ? { isValid: true } : { isInvalid: true };

  const submitEnabled = isMediaUrlValid && isMediaTitleValid;

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
          <Form style={{ textAlign: "left" }}>
            <Form.Group controlId="mediaTitle">
              <Form.Label>{GENERIC.TITLE}</Form.Label>
              <Form.Control
                onChange={e => setMediaTitle(e.target.value)}
                type="text"
                {...validationAttributes(isMediaTitleValid)}
              />
            </Form.Group>
            <Form.Group controlId="mediaUrl">
              <Form.Label>{MEDIA_CONTENT.URL}</Form.Label>
              <Form.Control
                onChange={e => setMediaUrl(e.target.value)}
                type="text"
                {...validationAttributes(isMediaUrlValid)}
              />
              <Form.Text className="text-muted">
                {MEDIA_CONTENT.ADD_DESCRIPTION}
              </Form.Text>
            </Form.Group>
            <Form.Group controlId="mediaTitle">
              <Form.Label>{GENERIC.DESCRIPTION}</Form.Label>
              <Form.Control
                onChange={e => setMediaDescription(e.target.value)}
                as="textarea"
              />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button
            onClick={addMediaItem}
            variant="success"
            disabled={!submitEnabled}
          >
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
