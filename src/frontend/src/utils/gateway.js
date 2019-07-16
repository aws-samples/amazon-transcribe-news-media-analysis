import request from "./request";

const encoded = mediaUrl => encodeURIComponent(mediaUrl.trim());

export default {
  createTask(mediaUrl) {
    return request(`/tasks/${encoded(mediaUrl)}`, "put");
  },

  deleteTask(mediaUrl) {
    return request(`/tasks/${encoded(mediaUrl)}`, "del");
  },

  getTask(mediaUrl) {
    return request(`/tasks/${encoded(mediaUrl)}`);
  },

  getTasks() {
    return request("/tasks");
  },

  poll(mediaUrl, from, to) {
    return request(`/poll?mediaUrl=${encoded(mediaUrl)}&from=${from}&to=${to}`);
  }
};
