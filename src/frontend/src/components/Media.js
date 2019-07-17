import React from "react";
import { Button, OverlayTrigger, Table, Tooltip } from "react-bootstrap";

import { BUTTONS, GENERIC, TASKSTATUS_TOOLTIPS } from "../utils/strings";
import { toObj } from "../utils";

import AddMediaContent from "./AddMediaContent";
import DeleteMediaContent from "./DeleteMediaContent";
import WatchUrlTextbox from "./WatchUrlTextbox";

const { maxTasks } = window.mediaAnalysisSettings;

export default ({ addTask, deleteTask, onError, tasks, updateTasks }) => (
  <Table variant="dark">
    <thead>
      <tr>
        <th>{GENERIC.MEDIA_URL}</th>
        <th>{GENERIC.STATUS}</th>
        <th>{GENERIC.WATCH_URL}</th>
        <th>
          <Button onClick={updateTasks} size="sm" variant="warning">
            {BUTTONS.REFRESH}
          </Button>
        </th>
      </tr>
    </thead>
    <tbody>
      {tasks.map((task, index) => (
        <tr key={index}>
          <td className="dont-break-out" style={{ maxWidth: "120px" }}>
            <a
              href={task.mediaUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: "white", textDecoration: "underline" }}
            >
              {task.mediaUrl}
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
            <WatchUrlTextbox mediaUrl={task.mediaUrl} />
          </td>
          <td>
            {task.taskStatus === "PROCESSING" && (
              <DeleteMediaContent
                onConfirm={() => deleteTask(task.mediaUrl)}
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
            <AddMediaContent
              onAdded={updateTasks}
              onError={onError}
              onSubmit={addTask}
              tasks={toObj(tasks, "mediaUrl")}
            />
          </td>
        </tr>
      )}
    </tbody>
  </Table>
);
