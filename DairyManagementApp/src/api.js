import axios from 'axios';

const API_BASE_URL = 'http://192.168.21.241:8081';

const api = axios.create({
  baseURL: API_BASE_URL,
});

export const registerUser = (formData) => {
  return api.post('/auth/register', formData);
};

export const loginUser = (formData) => {
  return api.post('/auth/login', formData);
};

export const getCowsList = () => {
  return api.get('/cows/list');
};

export const getBuffaloesList = () => {
  return api.get('/buffaloes/list');
};

export const submitCowInfo = (formData) => {
  return api.post('/cows/info', formData);
};

export const submitBuffaloInfo = (formData) => api.post('/buffaloes/info', formData);

export const getUsersList = () => api.get('/auth/user/list');
