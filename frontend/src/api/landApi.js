import axios from "axios";

const API_URL = "http://localhost:5000/land"; // backend URL

export const getAllProperties = async () => {
  const res = await axios.get(API_URL);
  return res.data;
};

export const getProperty = async (id) => {
  const res = await axios.get(`${API_URL}/${id}`);
  return res.data;
};

export const addProperty = async (plotId, location) => {
  const res = await axios.post(`${API_URL}/register`, { plotId, location });
  return res.data;
};

export const transferProperty = async (plotId, newOwner) => {
  const res = await axios.post(`${API_URL}/transfer`, { plotId, newOwner });
  return res.data;
};
