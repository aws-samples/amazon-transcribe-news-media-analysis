import React, { useState } from "react";
import { Button, Modal, Spinner } from "react-bootstrap";

import { TASK_DELETE_CONFIRMATION } from "../utils/strings";

export default ({ onConfirm, onDeleted, onError }) => {
  const [confirmationShown, showConfirmation] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const hideModal = () => showConfirmation(false);
  const deleteVideo = () => {
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
        Remove
      </Button>
      <Modal
        size="lg"
        centered
        show={confirmationShown}
        onHide={hideModal}
        style={{ color: "black" }}
      >
        <Modal.Header closeButton>
          <Modal.Title>Are you sure?</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {TASK_DELETE_CONFIRMATION}
          <br />
          <br />
          <strong>Do you wish to continue?</strong>
        </Modal.Body>
        <Modal.Footer>
          <Button onClick={deleteVideo} variant="danger">
            {deleting ? (
              <Spinner animation="border" size="sm" />
            ) : (
              "Remove the video"
            )}
          </Button>
          <Button onClick={hideModal}>Cancel</Button>
        </Modal.Footer>
      </Modal>
    </>
  );
};
