export const TASK_DELETE_CONFIRMATION =
  "After deletion, the processing task will be scheduled for removal. The process may take a couple of minutes. ";

export const TASKSTATUS_MESSAGE = {
  ERROR:
    "Unfortunately, there is an issue with the transcription process. Please wait...",
  LOADING: "Loading...",
  WAITING: "The transcription process is going to start soon. Please wait...",
  TERMINATING: "This media is not available anymore."
};

export const TASKSTATUS_TOOLTIPS = {
  ERROR:
    "The task for processing the media item is in a faulty state and waiting for being re-allocated",
  INITIALIZING:
    "The task for processing the media item has been allocated, and the job will start processing soon",
  PROCESSING: "The media item is being processed",
  TERMINATING:
    "The task for processing the media item has been scheduled for termination",
  WAITING:
    "The media item is waiting for a task to be allocated, in order to start processing"
};
