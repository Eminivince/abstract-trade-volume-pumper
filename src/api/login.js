// frontend/src/api/login.js
import axios from "axios";
import { config } from "../config";

const API_BASE = config.API_URL;

/**
 * POST /api/login
 */
export async function loginUser(username, password) {
  console.log("Logging in...", username);
  const res = await axios.post(`${API_BASE}/login`, { username, password });
  return res.data; // { message, user: { _id, username, activeWalletGroupId, activeTokenId } }
}
