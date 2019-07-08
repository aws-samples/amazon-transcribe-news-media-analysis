import React, { useEffect, useState } from "react";
import { Container } from "react-bootstrap";

import gateway from "./utils/gateway";

import Header from "./components/Header";
import Videos from "./components/Videos";

export default () => {
  const [tasks, setTasks] = useState([]);
  
  useEffect(() => {
    gateway.getTasks().then(r => setTasks(r.tasks));
  });

  return (
    <div className="App">
      <Header />
      <Container>
        <Videos tasks={tasks} />
      </Container>
    </div>
  );
};
