import React, { useEffect, useRef, useState } from "react";
import { Alert, Container } from "react-bootstrap";

import gateway from "./utils/gateway";
import { getUrlParameter, sortByKey } from "./utils";

import Header from "./components/Header";
import Video from "./components/Video";
import Videos from "./components/Videos";

export default () => {
  const [tasks, setTasks] = useState([]);
  const [errorShown, showError] = useState(false);
  const tasksUpdated = useRef(false);

  const updateTasks = () => {
    tasksUpdated.current = true;
    gateway
      .getTasks()
      .then(r => setTasks(sortByKey(r.tasks, "videoUrl")))
      .catch(() => showError(true));
  };

  useEffect(() => {
    if (!tasksUpdated.current) {
      updateTasks();
    }
  });

  const currentLocation = window.location.href;
  const videoUrl = getUrlParameter("watchUrl");
  const watchMode = videoUrl !== "";

  return (
    <div className="App">
      <Header />
      <Container>
        {errorShown && (
          <Alert variant="danger">
            <strong>Oh snap!</strong> Something wrong happened. Please{" "}
            <a
              onClick={e => {
                e.preventDefault();
                window.location.reload();
              }}
              href={currentLocation}
            >
              refresh
            </a>{" "}
            and retry.
          </Alert>
        )}
        {watchMode ? (
          <Video videoUrl={videoUrl} />
        ) : (
          <Videos
            addTask={gateway.createTask}
            deleteTask={gateway.deleteTask}
            onError={() => showError(true)}
            tasks={tasks}
            updateTasks={updateTasks}
          />
        )}
      </Container>
    </div>
  );
};
