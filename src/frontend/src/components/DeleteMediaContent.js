import React, { useState } from "react";
import { Button, Modal, Spinner } from "react-bootstrap";

import { BUTTONS, GENERIC, MEDIA_CONTENT } from "../utils/strings";

export default ({ onConfirm, onDeleted, onError }) => {
  const [confirmationShown, showConfirmation] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const hideModal = () => showConfirmation(false);
  const deleteMediaItem = () => {
    setDeleting(true);

    const afterDeletion = () => {
      hideModal();
      setDeleting(false);
      onDeleted();
    };

    const withError = () => {
      afterDeletion();
      onError();
    };

    return onConfirm()
      .then(afterDeletion)
      .catch(withError);
  };

  return (
    <>
      <Button size="sm" variant="danger" onClick={() => showConfirmation(true)}>
        {BUTTONS.REMOVE}
      </Button>
      <Modal
        size="lg"
        centered
        show={confirmationShown}
        onHide={hideModal}
        style={{ color: "black" }}
      >
        <Modal.Header closeButton>
          <Modal.Title>{MEDIA_CONTENT.REMOVE_TITLE}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {MEDIA_CONTENT.REMOVE_DESCRIPTION}
          <br />
          <br />
          <strong>{GENERIC.CONTINUE_CONFIRMATION}</strong>
        </Modal.Body>
        <Modal.Footer>
          <Button onClick={deleteMediaItem} variant="danger">
            {deleting ? (
              <Spinner animation="border" size="sm" />
            ) : (
              BUTTONS.REMOVE_CONFIRM
            )}
          </Button>
          <Button onClick={hideModal}>{BUTTONS.CANCEL}</Button>
        </Modal.Footer>
      </Modal>
    </>
  );
};
