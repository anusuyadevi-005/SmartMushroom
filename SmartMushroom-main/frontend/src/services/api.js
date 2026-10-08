import axios from "axios";

const api = axios.create({
  baseURL: "import axios from "axios";

const api = axios.create({
  baseURL: "import axios from "axios";

const api = axios.create({
  baseURL: "https://smartmushroom-backend.onrender.com",
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

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      console.warn("Unauthorized! Clearing token...");
      localStorage.removeItem("token");
      localStorage.removeItem("role");
      // Optional: window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

export default api;",
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

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      console.warn("Unauthorized! Clearing token...");
      localStorage.removeItem("token");
      localStorage.removeItem("role");
      // Optional: window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

export default api;",
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

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      console.warn("Unauthorized! Clearing token...");
      localStorage.removeItem("token");
      localStorage.removeItem("role");
      // Optional: window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

export default api;
