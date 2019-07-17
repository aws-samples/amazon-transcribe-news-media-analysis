import React from "react";
import { Button, OverlayTrigger, Table, Tooltip } from "react-bootstrap";

import { TASKSTATUS_TOOLTIPS } from "../utils/strings";
import { toObj } from "../utils";

import AddVideo from "./AddVideo";
import DeleteVideo from "./DeleteVideo";
import WatchUrlTextbox from "./WatchUrlTextbox";

const { maxTasks } = window.mediaAnalysisSettings;

export default ({ addTask, deleteTask, onError, tasks, updateTasks }) => (
  <Table variant="dark">
    <thead>
      <tr>
        <th>Video URL</th>
        <th>Status</th>
        <th>Watch URL</th>
        <th>
          <Button onClick={updateTasks} size="sm" variant="warning">
            Refresh
          </Button>
        </th>
      </tr>
    </thead>
    <tbody>
      {tasks.map((task, index) => (
        <tr key={index}>
          <td className="dont-break-out" style={{ maxWidth: "120px" }}>
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
                  {TASKSTATUS_TOOLTIPS[task.taskStatus]}
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
                onDeleted={updateTasks}
                onError={onError}
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
              onAdded={updateTasks}
              onError={onError}
              onSubmit={addTask}
              tasks={toObj(tasks, "videoUrl")}
            />
          </td>
        </tr>
      )}
    </tbody>
  </Table>
);
