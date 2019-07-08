import React, { useState } from "react";
import {
  Button,
  Modal,
  OverlayTrigger,
  Spinner,
  Table,
  Tooltip
} from "react-bootstrap";

import WatchUrlTextbox from "./WatchUrlTextbox";

const { maxTasks } = window.mediaAnalysisSettings;

const statusTooltips = {
  ERROR:
    "The task for processing the video is in a faulty state and waiting for being re-allocated",
  INITIALIZING:
    "The task for processing the video has been allocated, and the job will start processing soon",
  PROCESSING: "The video is been processed",
  TERMINATING: "The task for processing the video is scheduled for termination",
  WAITING:
    "The video is waiting for a task to be allocated, in order to start processing"
};

const DeleteConfirmationModal = ({ onConfirm, onDeleted, onHide, show }) => {
  const [deleting, setDeleting] = useState(false);

  const deleteVideo = () => {
    setDeleting(true);

    const afterDeletion = () => {
      onHide();
      setDeleting(false);
      onDeleted();
    };

    onConfirm()
      .then(afterDeletion)
      .catch(afterDeletion);
  };

  return (
    <Modal
      size="lg"
      centered
      show={show}
      onHide={onHide}
      style={{ color: "black" }}
    >
      <Modal.Header closeButton>
        <Modal.Title>Are you sure?</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        After deletion, the processing task will be scheduled for being removed.
        The process may take a couple of minutes. <br />
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
        <Button onClick={onHide}>Cancel</Button>
      </Modal.Footer>
    </Modal>
  );
};

export default ({ deleteTask, onDeleted, tasks }) => {
  const [confirmationShown, showConfirmation] = useState(false);

  return (
    <Table variant="dark" style={{ marginTop: "20px" }}>
      <thead>
        <tr>
          <th>Video URL</th>
          <th>Status</th>
          <th>Watch URL</th>
          <th />
        </tr>
      </thead>
      <tbody>
        {tasks.map((task, index) => (
          <tr key={index}>
            <td>
              <a
                href="{task.videoUrl}"
                target="_blank"
                style={{ color: "white", textDecoration: "underline" }}
              >
                {task.videoUrl}
              </a>
            </td>
            <td>
              <OverlayTrigger
                key={`ot-${index}`}
                placement="bottom"
                overlay={
                  <Tooltip id={`tooltip-status-${index}`}>
                    {statusTooltips[task.taskStatus]}
                  </Tooltip>
                }
              >
                <span>{task.taskStatus}</span>
              </OverlayTrigger>
            </td>
            <td>
              <WatchUrlTextbox videoUrl={task.videoUrl} />
            </td>
            <td>
              {task.taskStatus === "PROCESSING" && (
                <>
                  <Button
                    size="sm"
                    variant="danger"
                    onClick={() => showConfirmation(true)}
                  >
                    Remove
                  </Button>
                  <DeleteConfirmationModal
                    onConfirm={() => deleteTask(task.videoUrl)}
                    onDeleted={onDeleted}
                    onHide={() => showConfirmation(false)}
                    show={confirmationShown}
                  />
                </>
              )}
            </td>
          </tr>
        ))}
        {tasks.length < maxTasks && (
          <tr key={tasks.length}>
            <td />
            <td />
            <td />
            <td>
              <Button size="sm" variant="success">
                Add New...
              </Button>
            </td>
          </tr>
        )}
      </tbody>
    </Table>
  );
};
