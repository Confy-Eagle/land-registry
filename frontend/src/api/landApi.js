import axios from "axios";

const API_URL = "http://localhost:5000/land"; // backend URL

// --- USERS ---
export const registerUser = async (name) => {
  const res = await axios.post(`${API_URL}/user/register`, { name });
  return res.data;
};

export const verifyUser = async (userAddress) => {
  const res = await axios.post(`${API_URL}/user/verify`, { userAddress });
  return res.data;
};

export const getUser = async (address) => {
  const res = await axios.get(`${API_URL}/user/${address}`);
  return res.data;
};

// --- PROPERTIES ---
export const getAllProperties = async () => {
  const res = await axios.get(`${API_URL}/properties`);
  return res.data;
};

export const getProperty = async (id) => {
  const res = await axios.get(`${API_URL}/property/${id}`);
  return res.data;
};

export const addProperty = async (id, location, area, price) => {
  const res = await axios.post(`${API_URL}/property/add`, { id, location, area, price });
  return res.data;
};

export const markForSale = async (id, price) => {
  const res = await axios.post(`${API_URL}/property/sell`, { id, price });
  return res.data;
};

export const transferProperty = async (id, newOwner) => {
  const res = await axios.post(`${API_URL}/property/transfer`, { id, newOwner });
  return res.data;
};

// --- PURCHASE ---
export const buyProperty = async (id, amount) => {
  const res = await axios.post(`${API_URL}/property/buy`, { id, amount });
  return res.data;
};

export const confirmPurchase = async (id) => {
  const res = await axios.post(`${API_URL}/property/confirm`, { id });
  return res.data;
};
