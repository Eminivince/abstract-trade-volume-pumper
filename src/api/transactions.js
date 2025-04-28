// frontend/src/api/transactions.js
import axios from "axios";

// const API_BASE = process.env.REACT_APP_API_BASE || "http://localhost:5080/api";

// const API_BASE = "http://localhost:5080/api";
const API_BASE = "https://abstract-pump-109a297e2430.herokuapp.com/api";

/**
 * Get the current transaction state for a user
 * @param {string} chatId - The user's Chat ID
 * @returns {Promise<Object>} - The transaction state object
 */
export async function getTransactionState(chatId) {
  const res = await axios.get(`${API_BASE}/transaction-state?chatId=${chatId}`);
  console.log(res);
  return res.data;
}

/**
 * Resume a paused transaction process
 * @param {string} chatId - The user's Chat ID
 * @returns {Promise<Object>} - The response containing success/failure info
 */
export async function resumeTransaction(chatId) {
  const res = await axios.post(`${API_BASE}/resume-transaction`, { chatId });
  return res.data;
}

export async function distributeETH(chatId, amount) {
  const res = await axios.post(`${API_BASE}/distribute`, {
    chatId,
    amount,
  });
  // console.log(res.data);
  return res.data;
}

export async function collectFunds(chatId) {
  const res = await axios.post(`${API_BASE}/collect`, { chatId });
  // console.log(res.data);
  return res.data;
}

export async function burnETH(chatId, burnAmount) {
  // const res = await axios.post(`${API_BASE}/burn`, {
  //   chatId,
  //   burnAmount,
  // });
  // return res.data;
  console.log("burning", burnAmount);
}

/**
 * Start the buy process for multiple wallets with specified amounts and time range.
 * @param {string} chatId - The user's Chat ID.
 * @param {Array} buyDetails - Array of { walletAddress, amount } objects.
 * @param {Object} timeRange - { minDelayMinutes, maxDelayMinutes }
 * @returns {Promise<Object>} - The response containing successCount and failCount.
 */
// export async function startBuy(chatId, buyDetails, timeRange) {
//   const res = await axios.post(`${API_BASE}/buy`, {
//     chatId,
//     buyDetails, // Array of { walletAddress, amount }
//     timeRange, // { minDelayMinutes, maxDelayMinutes }
//   });
//   return res.data; // e.g., { message, successCount, failCount }
// }

export async function startBuy(chatId, buyDetails, timeRange, token) {
  const res = await axios.post(`${API_BASE}/buy`, {
    chatId,
    buyDetails,
    timeRange,
  });
  return res.data;
}

export async function startSell(chatId, sellDetails, timeRange, token) {
  const res = await axios.post(`${API_BASE}/sell`, {
    chatId,
    sellDetails,
    timeRange,
  });
  return res.data;
}
