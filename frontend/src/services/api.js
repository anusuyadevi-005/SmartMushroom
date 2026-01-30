import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:5000",
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  const present = !!token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  console.debug('API Request:', config.method.toUpperCase(), config.url, 'Auth header set:', present);
  return config;
});

export default api;
