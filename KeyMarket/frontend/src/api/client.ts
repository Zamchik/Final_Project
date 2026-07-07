import axios from 'axios';

const apiClient = axios.create({
  baseURL: '/api',
  withCredentials: true, // браузер будет отправлять куки с запросами
});

export default apiClient;