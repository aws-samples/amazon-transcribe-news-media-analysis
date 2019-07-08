import React, { useState } from "react";
import { Button, Modal, Spinner } from "react-bootstrap";

export default ({ onConfirm, onDeleted, onHide }) => {
  const [confirmationShown, showConfirmation] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const hideModal = () => showConfirmation(false);
  const deleteVideo = () => {
    setDeleting(true);

    const afterDeletion = () => {
      showConfirmation(false);
      setDeleting(false);
      onDeleted();
    };

    return onConfirm()
      .then(afterDeletion)
      .catch(afterDeletion);
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
          After deletion, the processing task will be scheduled for being
          removed. The process may take a couple of minutes. <br />
          <br /> <strong>Do you wish to continue?</strong>
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
