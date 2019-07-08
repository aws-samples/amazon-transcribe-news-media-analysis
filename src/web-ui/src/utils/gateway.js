import request from "./request";

export default {
  createTask(videoUrl){
    const encodedVideoUrl = encodeURIComponent(videoUrl.trim());
    return request(`/tasks/${encodedVideoUrl}`, 'put')
  },


  deleteTask(videoUrl){
    const encodedVideoUrl = encodeURIComponent(videoUrl.trim());
    return request(`/tasks/${encodedVideoUrl}`, 'del')
  },
  
  getTasks() {
    return request("/tasks");
  }
};
