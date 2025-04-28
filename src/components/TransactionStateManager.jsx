import React, { useEffect, useState } from "react";
import { getTransactionState, resumeTransaction } from "../api/transactions";
import { motion } from "framer-motion";
import io from "socket.io-client";

const TransactionStateManager = ({ chatId, onResume }) => {
  const [transactionState, setTransactionState] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchTransactionState = async () => {
    try {
      setLoading(true);
      const response = await getTransactionState(chatId);
      setTransactionState(response.transactionState);

      // Initialize Socket.IO connection
      const socket = io("http://localhost:5080");
      // const socket = io("https://bknd-node-deploy-d242c366d3a5.herokuapp.com");

      // Join the room with chatId
      socket.emit("join", chatId);

      // Listen for transaction updates with immediate state updates
      socket.on("transactionUpdate", (data) => {
        setTransactionState((prevState) => {
          const updatedState = {
            ...prevState,
            ...data,
            processedWallets:
              data.processedWallets || prevState?.processedWallets || [],
            successCount: data.successCount ?? prevState?.successCount ?? 0,
            failCount: data.failCount ?? prevState?.failCount ?? 0,
            totalWallets: data.totalWallets ?? prevState?.totalWallets ?? 0,
            lastUpdated: new Date(),
            status: data.status || prevState?.status || "in_progress",
          };
          // Force immediate UI update
          return { ...updatedState };
        });
      });

      // Listen for transaction completion
      socket.on("transactionCompleted", (data) => {
        setTransactionState((prevState) => ({
          ...prevState,
          ...data,
          successCount: data.successCount ?? prevState?.successCount ?? 0,
          failCount: data.failCount ?? prevState?.failCount ?? 0,
          processedWallets:
            data.processedWallets || prevState?.processedWallets || [],
          totalWallets: data.totalWallets ?? prevState?.totalWallets ?? 0,
          status: "completed",
          lastUpdated: new Date(),
        }));
      });

      // Listen for transaction errors
      socket.on("transactionError", (data) => {
        setTransactionState((prevState) => ({
          ...prevState,
          error: data.error,
          status: "error",
          lastUpdated: new Date(),
        }));
      });
    } catch (err) {
      console.error("Error fetching transaction state:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let socket;

    if (chatId) {
      fetchTransactionState();
    }

    // Cleanup socket connection on unmount
    return () => {
      if (socket) {
        socket.disconnect();
      }
    };
  }, [chatId]);

  const handleResume = async () => {
    try {
      setLoading(true);
      const result = await resumeTransaction(chatId);
      if (onResume) {
        onResume(result);
      }
      // Clear the transaction state after successful resume
      setTransactionState(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!transactionState) return null;

  // Calculate progress percentage for the progress bar
  const progressPercentage =
    transactionState && transactionState.totalWallets
      ? Math.round(
          ((Array.isArray(transactionState.processedWallets)
            ? transactionState.processedWallets.length
            : 0) /
            transactionState.totalWallets) *
            100
        )
      : 0;

  // Check if transaction is completed
  const isCompleted =
    transactionState &&
    transactionState.totalWallets &&
    Array.isArray(transactionState.processedWallets) &&
    transactionState.processedWallets.length === transactionState.totalWallets;

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
        when: "beforeChildren",
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, x: -10 },
    visible: { opacity: 1, x: 0 },
  };

  const progressVariants = {
    hidden: { width: 0 },
    visible: {
      width: `${progressPercentage}%`,
      transition: { duration: 0.8, ease: "easeOut" },
    },
  };

  return (
    <motion.div
      className="bg-gradient-to-r from-blue-600 to-purple-600 shadow-xl rounded-xl p-6 mb-6 text-black overflow-hidden"
      variants={containerVariants}
      initial="hidden"
      animate="visible">
      <motion.div
        className="flex items-center justify-between mb-4"
        variants={itemVariants}>
        <h3 className="text-xl font-bold">Prev/On-going TX</h3>
        <div className="flex items-center space-x-2">
          <motion.button
            onClick={fetchTransactionState}
            className="bg-white bg-opacity-20 hover:bg-opacity-30 p-2 rounded-full transition-all duration-300"
            disabled={loading}
            whileHover={{ scale: loading ? 1 : 1.1 }}
            whileTap={{ scale: loading ? 1 : 0.9 }}>
            <svg
              className={`w-4 h-4 ${loading ? "animate-spin" : ""}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
          </motion.button>
          {isCompleted && (
            <div className="bg-green-500 px-3 py-1 rounded-full text-sm font-medium text-white">
              Completed
            </div>
          )}
          <div className="bg-white bg-opacity-20 px-3 py-1 rounded-full text-sm font-medium">
            {transactionState.type === "distribute"
              ? "Distribute ETH"
              : transactionState.type === "buy"
              ? "Buy"
              : transactionState.type === "sell"
              ? "Sell"
              : transactionState.type === "collect"
              ? "Collect"
              : transactionState.type === "burn"
              ? "Burn"
              : ""}
          </div>
        </div>
      </motion.div>

      {loading ? (
        <motion.div
          className="flex justify-center py-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}>
          <div className="animate-pulse flex space-x-2">
            <div className="h-3 w-3 bg-white rounded-full"></div>
            <div className="h-3 w-3 bg-white rounded-full"></div>
            <div className="h-3 w-3 bg-white rounded-full"></div>
          </div>
        </motion.div>
      ) : error ? (
        <motion.p
          className="bg-red-500 bg-opacity-70 p-3 rounded-lg text-white"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}>
          {error}
        </motion.p>
      ) : (
        <motion.div variants={itemVariants}>
          <div className="space-y-4 mb-5">
            <motion.div variants={itemVariants} className="mb-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-blue-100">Progress</span>
                <span className="text-sm font-medium">
                  {Array.isArray(transactionState.processedWallets)
                    ? transactionState.processedWallets.length
                    : 0}
                  /{transactionState.totalWallets || 0} wallets
                  {isCompleted && " • All wallets processed"}
                </span>
              </div>
              <div className="h-2 bg-blue-900 bg-opacity-50 rounded-full overflow-hidden">
                <motion.div
                  className={`h-full rounded-full ${
                    isCompleted
                      ? "bg-green-500"
                      : "bg-gradient-to-r from-green-300 to-green-500"
                  }`}
                  variants={progressVariants}></motion.div>
              </div>
            </motion.div>

            <motion.div
              variants={itemVariants}
              className="grid grid-cols-2 gap-4">
              <div className="bg-white bg-opacity-10 p-3 rounded-lg">
                <p className="text-xs text-blue-900 mb-1">Started</p>
                <p className="font-medium">
                  {new Date(transactionState.startTime).toLocaleString()}
                </p>
              </div>

              <div className="bg-white bg-opacity-10 p-3 rounded-lg">
                <p className="text-xs text-blue-900 mb-1">Last Updated</p>
                <p className="font-medium">
                  {new Date(transactionState.lastUpdated).toLocaleString()}
                </p>
              </div>
            </motion.div>

            {/* Transaction Type Specific Details */}
            {transactionState.type === "distribute" && (
              <motion.div
                variants={itemVariants}
                className="bg-white bg-opacity-10 p-3 rounded-lg">
                <p className="text-xs text-blue-100 mb-1">
                  Distribution Amount
                </p>
                <p className="font-medium text-lg">
                  {transactionState.details?.distributionAmount}{" "}
                  <span className="text-green-300">ETH</span> per wallet
                </p>
              </motion.div>
            )}

            {/* Transaction Summary Section */}
            <motion.div
              variants={itemVariants}
              className="bg-white bg-opacity-10 p-3 rounded-lg">
              <p className="text-xs text-blue-900 mb-2">Transaction Summary</p>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm">Status:</span>
                  <span
                    className={`text-sm font-medium ${
                      isCompleted ? "text-green-500" : "text-yellow-500"
                    }`}>
                    {isCompleted ? "Completed" : "In Progress"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Processed:</span>
                  <span className="text-sm font-medium">
                    {Array.isArray(transactionState.processedWallets)
                      ? transactionState.processedWallets.length
                      : 0}{" "}
                    wallets
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Remaining:</span>
                  <span className="text-sm font-medium">
                    {transactionState.totalWallets -
                      (Array.isArray(transactionState.processedWallets)
                        ? transactionState.processedWallets.length
                        : 0)}{" "}
                    wallets
                  </span>
                </div>
                {transactionState.successCount !== undefined && (
                  <div className="flex justify-between">
                    <span className="text-sm">Success:</span>
                    <span className="text-sm font-medium text-green-300">
                      {transactionState.successCount || 0} transactions
                    </span>
                  </div>
                )}
                {transactionState.failCount !== undefined && (
                  <div className="flex justify-between">
                    <span className="text-sm">Failed:</span>
                    <span className="text-sm font-medium text-red-300">
                      {transactionState.failCount || 0} transactions
                    </span>
                  </div>
                )}
              </div>
            </motion.div>
          </div>

          {/* <motion.button
            onClick={handleResume}
            className="w-full bg-white text-blue-600 hover:bg-blue-50 font-bold py-3 px-6 rounded-lg transition-all duration-300 transform hover:scale-[1.02] hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            disabled={loading}
            whileHover={{ scale: loading ? 1 : 1.02 }}
            whileTap={{ scale: loading ? 1 : 0.98 }}>
            {isCompleted ? "Clear Transaction History" : "Resume Transaction"}
          </motion.button> */}
        </motion.div>
      )}
    </motion.div>
  );
};

export default TransactionStateManager;
