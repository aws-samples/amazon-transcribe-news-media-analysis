import React from "react";

export default ({ type }) => {
  if (type === "copy") {
    return (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 16 16"
        width="16"
        height="16"
      >
        <path
          d="M2 5h9v9H2z"
          stroke="white"
          fill="none"
          strokeWidth="2px"
          style={{ strokeLinejoin: "round" }}
        />
        <path
          d="M5 5V2h9v9h-3"
          stroke="white"
          fill="none"
          strokeWidth="2px"
          style={{ strokeLinejoin: "round" }}
        />
      </svg>
    );
  }

  if (type === "new-window")
    return (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 16 16"
        width="16"
        height="16"
      >
        <path
          d="M10 2h4v4"
          stroke="white"
          fill="none"
          strokeWidth="2px"
          style={{ strokeLinejoin: "square" }}
        />
        <path d="M6 10l8-8" stroke="white" fill="none" strokeWidth="2px" />
        <path
          d="M14 9.048V14H2V2h5"
          stroke="white"
          fill="none"
          strokeWidth="2px"
          style={{ strokeLinejoin: "square" }}
        />
      </svg>
    );

  return "";
};
