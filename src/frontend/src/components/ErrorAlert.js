import React from "react";
import { Alert } from "react-bootstrap";

import { getCurrentLocation, refreshPage } from "../utils";

export default ({ show }) =>
  show ? (
    <Alert variant="danger">
      <strong>Oh snap!</strong> Something wrong happened. Please{" "}
      <a onClick={refreshPage} href={getCurrentLocation()}>
        refresh
      </a>{" "}
      and retry.
    </Alert>
  ) : (
    ""
  );
