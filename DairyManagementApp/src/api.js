import axios from 'axios';

const API_BASE_URL = 'http://3.6.143.181:8501';

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

// New APIs for getting existing data
export const getCowsByUserId = (userId) => {
  return api.get(`/cows/user/${userId}`);
};

export const getBuffaloesByUserId = (userId) => {
  return api.get(`/buffaloes/user/${userId}`);
};

// Update APIs
export const updateCowInfo = (cowId, formData) => {
  return api.put(`/cows/info/${cowId}`, formData);
};

export const updateBuffaloInfo = (buffaloId, formData) => {
  return api.put(`/buffaloes/info/${buffaloId}`, formData);
};

// Score APIs
export const getAllScores = () => {
  return api.get('/api/scores');
};

export const getUserScores = (userId) => {
  return api.get(`/api/users/${userId}/scores`);
};

export const getUserSubsectionScores = (userId, subsectionId) => {
  return api.get(`/api/users/${userId}/subsections/${subsectionId}/scores`);
};

export const getSubsectionScoreDescriptions = (subsectionId) => {
  return api.get(`/api/subsections/${subsectionId}/score-descriptions`);
};

export const getSpecificScoreDescription = (subsectionId, scoreValue) => {
  return api.get(`/api/subsections/${subsectionId}/score-descriptions/${scoreValue}`);
};