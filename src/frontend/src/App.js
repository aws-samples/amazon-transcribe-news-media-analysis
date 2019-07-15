import React, { useEffect, useRef, useState } from "react";
import { Container } from "react-bootstrap";

import gateway from "./utils/gateway";
import { getUrlParameter, sortByKey } from "./utils";

import ErrorAlert from "./components/ErrorAlert";
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

  const videoUrl = getUrlParameter("watchUrl");
  const watchMode = videoUrl !== "";

  useEffect(() => {
    if (!watchMode && !tasksUpdated.current) {
      updateTasks();
    }
  });

  return (
    <div className="App">
      <Header />
      <Container>
        <ErrorAlert show={errorShown} />
        {watchMode ? (
          <Video
            getTask={() => gateway.getTask(videoUrl)}
            poll={gateway.poll}
            videoUrl={videoUrl}
          />
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
