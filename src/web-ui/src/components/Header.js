import React from "react";
import { Container, Nav, Navbar } from "react-bootstrap";

export default () => (
  <Navbar
    style={{ backgroundColor: "#000", marginBottom: "20px" }}
    variant="dark"
  >
    <Container>
      <Navbar.Brand>Amazon Transcribe News Media Analysis</Navbar.Brand>
      <Navbar.Toggle />
      <Navbar.Collapse>
        <Nav>
          <Nav.Link
            eventKey={1}
            href="https://github.com/aws-samples/amazon-transcribe-news-media-analysis"
            target="_blank"
          >
            Fork me on github
          </Nav.Link>
        </Nav>
        <Nav style={{ paddingTop: "8px" }} />
      </Navbar.Collapse>
    </Container>
  </Navbar>
);
