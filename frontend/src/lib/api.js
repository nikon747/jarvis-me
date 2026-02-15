import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export const api = {
  // Health check
  healthCheck: async () => {
    const response = await axios.get(`${API}/`);
    return response.data;
  },

  // Stats
  getStats: async () => {
    const response = await axios.get(`${API}/stats`);
    return response.data;
  },

  // Conversations
  createConversation: async (title) => {
    const response = await axios.post(`${API}/conversations`, { title });
    return response.data;
  },

  getConversations: async () => {
    const response = await axios.get(`${API}/conversations`);
    return response.data;
  },

  getConversation: async (id) => {
    const response = await axios.get(`${API}/conversations/${id}`);
    return response.data;
  },

  deleteConversation: async (id) => {
    const response = await axios.delete(`${API}/conversations/${id}`);
    return response.data;
  },

  // Chat
  sendMessage: async (conversationId, message, voice = 'onyx') => {
    const response = await axios.post(`${API}/chat`, {
      conversation_id: conversationId,
      message: message,
      voice: voice,
    });
    return response.data;
  },

  // Speech-to-text
  transcribeAudio: async (audioBlob) => {
    const formData = new FormData();
    formData.append('file', audioBlob, 'audio.webm');
    const response = await axios.post(`${API}/transcribe`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  // Text-to-speech
  textToSpeech: async (text, voice = 'nova', speed = 1.0) => {
    const response = await axios.post(`${API}/tts`, { text, voice, speed });
    return response.data;
  },

  // Tasks
  createTask: async (task) => {
    const response = await axios.post(`${API}/tasks`, task);
    return response.data;
  },

  getTasks: async (completed = undefined) => {
    const params = completed !== undefined ? { completed } : {};
    const response = await axios.get(`${API}/tasks`, { params });
    return response.data;
  },

  getTask: async (id) => {
    const response = await axios.get(`${API}/tasks/${id}`);
    return response.data;
  },

  updateTask: async (id, updates) => {
    const response = await axios.patch(`${API}/tasks/${id}`, updates);
    return response.data;
  },

  deleteTask: async (id) => {
    const response = await axios.delete(`${API}/tasks/${id}`);
    return response.data;
  },

  // Reminders
  createReminder: async (reminder) => {
    const response = await axios.post(`${API}/reminders`, reminder);
    return response.data;
  },

  getReminders: async (activeOnly = false) => {
    const params = activeOnly ? { active_only: true } : {};
    const response = await axios.get(`${API}/reminders`, { params });
    return response.data;
  },

  getDueReminders: async () => {
    const response = await axios.get(`${API}/reminders/due`);
    return response.data;
  },

  updateReminder: async (id, updates) => {
    const response = await axios.patch(`${API}/reminders/${id}`, updates);
    return response.data;
  },

  deleteReminder: async (id) => {
    const response = await axios.delete(`${API}/reminders/${id}`);
    return response.data;
  },

  // Weather
  getWeather: async (city = 'London', units = 'metric') => {
    const response = await axios.get(`${API}/weather`, { params: { city, units } });
    return response.data;
  },
};

export default api;
