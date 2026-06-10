import axios from 'axios';

const apiClient = axios.create({
  baseURL: 'http://localhost:3000',
  withCredentials: true, // браузер будет отправлять куки с запросами
});

export default apiClient;