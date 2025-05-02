// frontend/src/api/transactions.js
import axios from "axios";
import { config, IS_PRODUCTION } from "../config";

const API_BASE = config.API_URL;

/**
 * Get the current transaction state for a user
 * @param {string} chatId - The user's Chat ID
 * @returns {Promise<Object>} - The transaction state object
 */
export async function getTransactionState(chatId) {
  if (!IS_PRODUCTION) {
    console.log(`[DEV] Getting transaction state for chatId: ${chatId}`);
  }

  const res = await axios.get(`${API_BASE}/transaction-state?chatId=${chatId}`);

  if (!IS_PRODUCTION) {
    console.log(`[DEV] Transaction state response:`, res.data);
  } else {
    console.log(`Transaction state retrieved for ${chatId}`);
  }

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
export async function startBuy(chatId, buyDetails, timeRange) {
  // Enhanced logging in development mode
  if (!IS_PRODUCTION) {
    console.log(`[DEV] Starting buy process for chatId: ${chatId}`);
    console.log(`[DEV] Buy details:`, JSON.stringify(buyDetails, null, 2));
    console.log(
      `[DEV] Time range: ${timeRange.minDelayMinutes}-${timeRange.maxDelayMinutes} minutes`
    );
  }

  const res = await axios.post(`${API_BASE}/buy`, {
    chatId,
    buyDetails,
    timeRange,
  });

  // Environment-specific logging
  if (!IS_PRODUCTION) {
    console.log(`[DEV] Buy process response:`, res.data);
  } else {
    console.log(
      `Buy process initiated for ${chatId}: ${res.data.successCount} wallets`
    );
  }

  return res.data;
}

/**
 * Fetches the most recent transactions for a given chat ID
 * @param {string} chatId - The chat ID to fetch transactions for
 * @param {number} [limit=40] - Optional limit for number of transactions to fetch
 * @returns {Promise<Object>} - Object containing array of transactions
 */
export const getRecentTransactions = async (chatId, limit = 40) => {
  try {
    const response = await fetch(
      `${API_BASE}/recent-transactions?chatId=${chatId}&limit=${limit}`
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Failed to fetch recent transactions");
    }

    return await response.json();
  } catch (error) {
    console.error("Error fetching recent transactions:", error);
    throw error;
  }
};

export async function stopBuyProcess(chatId) {
  console.log("Stopping buy process for chatId:", chatId);
  const res = await axios.post(`${API_BASE}/stop-buy`, { chatId });
  return res.data;
}

export async function startSell(chatId, sellDetails, timeRange) {
  const res = await axios.post(`${API_BASE}/sell`, {
    chatId,
    sellDetails,
    timeRange,
  });
  return res.data;
}
