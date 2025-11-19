import axios from "axios";

// Create an axios instance configured to talk to your Flask backend
const apiClient = axios.create({
  baseURL: "http://localhost:5000/api/",
});

export default apiClient;