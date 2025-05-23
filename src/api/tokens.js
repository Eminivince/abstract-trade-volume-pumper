// frontend/src/api/tokens.js
import axios from "axios";
import { config } from "../config";

const API_BASE = config.API_URL;

export async function getTokens(chatId) {
  const res = await axios.get(`${API_BASE}/tokens?chatId=${chatId}`);
  return res.data;
}

export async function getActiveToken(chatId) {
  const res = await axios.get(`${API_BASE}/tokens/active?chatId=${chatId}`);
  return res.data;
}

export async function addToken(chatId, tokenAddress) {
  const res = await axios.post(`${API_BASE}/add-token`, {
    chatId,
    tokenAddress,
  });
  return res.data;
}

export async function activateToken(chatId, tokenId) {
  const res = await axios.post(`${API_BASE}/activate-token`, {
    chatId,
    tokenId,
  });
  return res.data;
}
