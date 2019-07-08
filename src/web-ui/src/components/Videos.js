import React from "react";
import { OverlayTrigger, Table, Tooltip } from "react-bootstrap";

import AddVideo from "./AddVideo";
import DeleteVideo from "./DeleteVideo";
import WatchUrlTextbox from "./WatchUrlTextbox";

const { maxTasks } = window.mediaAnalysisSettings;

const statusTooltips = {
  ERROR:
    "The task for processing the video is in a faulty state and waiting for being re-allocated",
  INITIALIZING:
    "The task for processing the video has been allocated, and the job will start processing soon",
  PROCESSING: "The video is being processed",
  TERMINATING:
    "The task for processing the video has been scheduled for termination",
  WAITING:
    "The video is waiting for a task to be allocated, in order to start processing"
};

export default ({ addTask, deleteTask, onTasksChange, tasks }) => (
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
              href={task.videoUrl}
              target="_blank"
              rel="noopener noreferrer"
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
              <DeleteVideo
                onConfirm={() => deleteTask(task.videoUrl)}
                onDeleted={onTasksChange}
              />
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
            <AddVideo
              onAdded={onTasksChange}
              onSubmit={addTask}
              tasks={tasks}
            />
          </td>
        </tr>
      )}
    </tbody>
  </Table>
);