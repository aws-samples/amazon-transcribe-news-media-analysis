import request from "./request";

const encoded = videoUrl => encodeURIComponent(videoUrl.trim());

export default {
  createTask(videoUrl) {
    return request(`/tasks/${encoded(videoUrl)}`, "put");
  },

  deleteTask(videoUrl) {
    return request(`/tasks/${encoded(videoUrl)}`, "del");
  },

  getTask(videoUrl) {
    return request(`/tasks/${encoded(videoUrl)}`);
  },

  getTasks() {
    return request("/tasks");
  },

  poll(videoUrl, from, to) {
    return request(`/poll?videoUrl=${encoded(videoUrl)}&from=${from}&to=${to}`);
  }
};
