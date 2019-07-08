import React, { useEffect, useRef, useState } from "react";
import { Container } from "react-bootstrap";

import gateway from "./utils/gateway";
import { sortByKey } from "./utils";

import Header from "./components/Header";
import Videos from "./components/Videos";

export default () => {
  const [tasks, setTasks] = useState([]);
  const tasksUpdated = useRef(false);

  const updateTasks = () => {
    tasksUpdated.current = true;
    gateway.getTasks().then(r => {
      setTasks(sortByKey(r.tasks, "videoUrl"));
    });
  };

  useEffect(() => {
    if (!tasksUpdated.current) {
      updateTasks();
    }
  });

  return (
    <div className="App">
      <Header />
      <Container>
        <Videos
          tasks={tasks}
          addTask={gateway.createTask}
          deleteTask={gateway.deleteTask}
          updateTasks={updateTasks}
        />
      </Container>
    </div>
  );
};
