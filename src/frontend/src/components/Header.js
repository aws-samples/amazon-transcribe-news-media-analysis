import React from "react";
import { Container, Nav, Navbar } from "react-bootstrap";

import { GENERIC } from "../utils/strings";

export default () => (
  <Navbar
    style={{ backgroundColor: "#000", marginBottom: "20px" }}
    variant="dark"
  >
    <Container>
      <Navbar.Brand>{GENERIC.SOLUTION_TITLE}</Navbar.Brand>
      <Navbar.Toggle />
      <Navbar.Collapse>
        <Nav>
          <Nav.Link
            eventKey={1}
            href="https://github.com/aws-samples/amazon-transcribe-news-media-analysis"
            target="_blank"
          >
            {GENERIC.FORK_GITHUB}
          </Nav.Link>
        </Nav>
        <Nav style={{ paddingTop: "8px" }} />
      </Navbar.Collapse>
    </Container>
  </Navbar>
);
