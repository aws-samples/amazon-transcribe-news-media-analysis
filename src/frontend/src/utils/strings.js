export const BUTTONS = {
  ADD: "Add New...",
  ADD_CONFIRM: "Add the Media Content",
  CANCEL: "Cancel",
  REFRESH: "Refresh",
  REMOVE: "Remove",
  REMOVE_CONFIRM: "Remove the Media Content"
};

export const GENERIC = {
  CONTINUE_CONFIRMATION: "Do you wish to continue?",
  COPIED: "Copied!",
  COPY_TO_CLIPBOAD: "Copy to Clipboard",
  DESCRIPTION: "Description",
  FORK_GITHUB: "Fork me on Github",
  MEDIA_URL: "Media URL",
  OPEN_NEW_WINDOW: "Open in a new window",
  SOLUTION_TITLE: "Amazon Transcribe News Media Analysis",
  STATUS: "Status",
  TITLE: "Title",
  WATCH_URL: "Watch URL"
};

export const MEDIA_CONTENT = {
  ADD_DESCRIPTION:
    "Insert a link including the protocol, ex. https://foo.bar/baz",
  NEW_TITLE: "New Media Content",
  REMOVE_DESCRIPTION:
    "After deletion, the processing task will be scheduled for removal. The process may take a couple of minutes.",
  REMOVE_TITLE: "Delete Media Content",
  URL: "Media Content Url"
};

export const TASKSTATUS_MESSAGE = {
  ERROR:
    "Unfortunately, there is an issue with the transcription process. Please wait...",
  LOADING: "Loading...",
  WAITING: "The transcription process is going to start soon. Please wait...",
  TERMINATING: "This media is not available anymore."
};

export const TASKSTATUS_TOOLTIPS = {
  ERROR:
    "The task for processing the media content is in a faulty state and waiting for being re-allocated",
  INITIALIZING:
    "The task for processing the media content has been allocated, and the job will start processing soon",
  PROCESSING: "The media content is being processed",
  TERMINATING:
    "The task for processing the media content has been scheduled for termination",
  WAITING:
    "The media content is waiting for a task to be allocated, in order to start processing"
};

export const TRANSCRIPTION_STATUS = {
  PAUSED:
    "The video is paused. You may resume consuming the transcription service by clicking play",
  INIT:
    "The transcription will start when the video begins to play. Click play to start"
};
