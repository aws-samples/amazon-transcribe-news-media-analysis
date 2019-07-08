import React, { useState } from "react";
import { Button, Form, Modal, Spinner } from "react-bootstrap";

export default ({ onSubmit, onAdded, tasks }) => {
  const [addModalShown, showAddModal] = useState(false);
  const [adding, setAdding] = useState(false);
  const [videoUrl, setVideoUrl] = useState("");

  const hideModal = () => showAddModal(false);
  const addVideo = () => {
    setAdding(true);

    const afterAdding = () => {
      hideModal();
      setAdding(false);
      onAdded();
    };

    return onSubmit(videoUrl)
      .then(afterAdding)
      .catch(afterAdding);
  };

  const videoAlreadyPresent = () =>
    !!tasks.find(x => x.videoUrl.trim() === videoUrl.trim());

  const isValid = videoUrl.indexOf("http") === 0 && !videoAlreadyPresent();

  const textboxValidationAttributes = isValid
    ? { isValid: true }
    : { isInvalid: true };

  return (
    <>
      <Button size="sm" variant="success" onClick={() => showAddModal(true)}>
        Add New...
      </Button>
      <Modal
        size="lg"
        centered
        show={addModalShown}
        onHide={hideModal}
        style={{ color: "black" }}
      >
        <Modal.Header closeButton>
          <Modal.Title>New Video</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group controlId="videoUrl">
              <Form.Label>Video Url</Form.Label>
              <Form.Control
                onChange={e => setVideoUrl(e.target.value)}
                required
                type="text"
                {...textboxValidationAttributes}
              />
              <Form.Text className="text-muted">
                Insert a link including the protocol, ex. https://foo.bar/baz
              </Form.Text>
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button onClick={addVideo} variant="success" disabled={!isValid}>
            {adding ? (
              <Spinner animation="border" size="sm" />
            ) : (
              "Add the video"
            )}
          </Button>
          <Button onClick={hideModal}>Cancel</Button>
        </Modal.Footer>
      </Modal>
    </>
  );
};
