import request from "./request";

export default {
  getTasks() {
    return request("/tasks");
  }
};
