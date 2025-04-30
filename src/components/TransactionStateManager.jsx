import { useEffect, useState } from "react";
import {
  getTransactionState,
  getRecentTransactions,
} from "../api/transactions";
import io from "socket.io-client";
import {
  Button,
  Box,
  Typography,
  Paper,
  Grid,
  Chip,
  Divider,
  CircularProgress,
} from "@mui/material";
import RefreshIcon from "@mui/icons-material/Refresh";
import PropTypes from "prop-types";

const TransactionStateManager = ({ chatId, onTradingStatusChange }) => {
  const [transactionState, setTransactionState] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [transactions, setTransactions] = useState([]);

  const fetchTransactionState = async () => {
    try {
      setLoading(true);
      const [stateResponse, transactionsResponse] = await Promise.all([
        getTransactionState(chatId),
        getRecentTransactions(chatId),
      ]);

      if (stateResponse.transactionState) {
        const updatedState = {
          ...stateResponse.transactionState,
          details: {
            ...stateResponse.transactionState?.details,
            currentPhase:
              stateResponse.transactionState?.type === "trading"
                ? stateResponse.transactionState?.details?.currentPhase
                : stateResponse.transactionState?.type || "unknown",
          },
        };
        setTransactionState(updatedState);

        // Notify parent component about trading status
        const isActiveTrading =
          stateResponse.transactionState.type === "trading" &&
          stateResponse.transactionState.details?.isRunning &&
          stateResponse.transactionState.status !== "stopped";

        onTradingStatusChange?.(isActiveTrading);
      } else {
        setTransactionState(null);
        onTradingStatusChange?.(false);
      }

      if (transactionsResponse.transactions) {
        const formattedTransactions = transactionsResponse.transactions.map(
          (tx) => ({
            ...tx,
            timestamp: new Date(tx.timestamp),
          })
        );
        setTransactions(formattedTransactions);
      }

      setError(null);
    } catch (err) {
      console.error("Error fetching data:", err);
      setError(err.message);
      onTradingStatusChange?.(false);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let socketInstance;

    const initialize = async () => {
      if (!chatId) return;

      try {
        socketInstance = io("https://abstract-pump-109a297e2430.herokuapp.com");
        // socketInstance = io("http://localhost:5080");
        socketInstance.emit("join", chatId);

        // Trading Process Events
        socketInstance.on("tradingStatsUpdate", (data) => {
          console.log("Trading Stats Update:", data);
          setTransactionState((prevState) => ({
            ...prevState,
            successCount: data.successCount,
            failCount: data.failCount,
            processedWallets: data.processedWallets,
            details: {
              ...prevState?.details,
              currentPhase: data.currentPhase,
              cycleCount: data.cycleCount,
            },
          }));
        });

        socketInstance.on("tradeCycleUpdate", (data) => {
          console.log("Trade Cycle Update:", data);
          setTransactionState((prevState) => ({
            ...prevState,
            type: "trading",
            details: {
              ...prevState?.details,
              currentPhase: data.phase,
              cycleCount: data.cycle,
              message: data.message,
            },
          }));
          setError(data.message);
        });

        socketInstance.on("buyTransactionUpdate", (data) => {
          console.log("Buy Transaction Update:", data);
          setTransactions((prev) => {
            const newTransaction = {
              type: "buy",
              ...data,
              timestamp: new Date(),
            };
            return [newTransaction, ...prev].slice(0, 40);
          });
        });

        socketInstance.on("sellTransactionUpdate", (data) => {
          console.log("Sell Transaction Update:", data);
          setTransactions((prev) => {
            const newTransaction = {
              type: "sell",
              ...data,
              timestamp: new Date(),
            };
            return [newTransaction, ...prev].slice(0, 40);
          });
        });

        socketInstance.on("phaseChange", (data) => {
          console.log("Phase Change:", data);
          setTransactionState((prevState) => ({
            ...prevState,
            details: {
              ...prevState?.details,
              currentPhase: data.newPhase,
              nextPhaseTime: data.nextPhaseTime,
              cooldownMinutes: data.cooldownMinutes,
            },
          }));
        });

        socketInstance.on("tradeProcessStopped", (data) => {
          console.log("Trade Process Stopped:", data);
          setTransactionState((prevState) => ({
            ...prevState,
            status: "stopped",
            details: {
              ...prevState?.details,
              currentPhase: "stopped",
              isRunning: false,
            },
          }));
          setError(data.message);
          onTradingStatusChange?.(false); // Notify parent when trading stops
        });

        await fetchTransactionState();
      } catch (err) {
        console.error("Socket initialization error:", err);
        setError("Failed to initialize socket connection");
      }
    };

    initialize();

    return () => {
      if (socketInstance) {
        socketInstance.disconnect();
      }
    };
  }, [chatId, onTradingStatusChange]);

  if (!transactionState) return null;

  const getPhaseDisplay = (phase) => {
    switch (phase) {
      case "alpha_buy":
        return "Alpha Group: Buying";
      case "beta_buy_alpha_sell":
        return "Beta Group: Buying | Alpha Group: Selling";
      case "alpha_buy_beta_sell":
        return "Alpha Group: Buying | Beta Group: Selling";
      case "cooldown":
        return "Cooldown Period";
      default:
        return phase?.replace(/_/g, " ").toUpperCase() || "Unknown";
    }
  };

  return (
    <Box sx={{ mb: 4 }}>
      <Paper elevation={3} sx={{ p: 3, bgcolor: "background.paper" }}>
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            mb: 2,
            gap: 2,
          }}>
          <Typography variant="h6">Trading Status</Typography>
          <Box sx={{ display: "flex", gap: 1 }}>
            <Button
              variant="outlined"
              color="primary"
              onClick={fetchTransactionState}
              startIcon={
                loading ? (
                  <CircularProgress size={20} color="inherit" />
                ) : (
                  <RefreshIcon />
                )
              }
              disabled={loading}>
              Refresh
            </Button>
          </Box>
        </Box>

        {error && (
          <Typography color="error" sx={{ mb: 2 }}>
            {error}
          </Typography>
        )}

        <Grid container spacing={2}>
          {/* Phase Information */}
          <Grid item xs={12}>
            <Paper sx={{ p: 2, bgcolor: "background.default" }}>
              <Typography variant="subtitle1" gutterBottom>
                Current Phase:{" "}
                {getPhaseDisplay(transactionState.details?.currentPhase)}
              </Typography>
              {transactionState.details?.cycleCount && (
                <Typography variant="body2">
                  Cycle: #{transactionState.details.cycleCount}
                </Typography>
              )}
              {transactionState.details?.nextPhaseTime && (
                <Typography variant="body2">
                  Next Phase:{" "}
                  {new Date(
                    transactionState.details.nextPhaseTime
                  ).toLocaleString()}
                </Typography>
              )}
            </Paper>
          </Grid>

          {/* Statistics
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 2, bgcolor: "background.default" }}>
              <Typography variant="subtitle1" gutterBottom>
                Statistics
              </Typography>
              <Grid container spacing={1}>
                <Grid item xs={6}>
                  <Typography variant="body2" color="success.main">
                    Successful: {transactionState.successCount || 0}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="error.main">
                    Failed: {transactionState.failCount || 0}
                  </Typography>
                </Grid>
              </Grid>
            </Paper>
          </Grid> */}

          {/* Progress
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 2, bgcolor: "background.default" }}>
              <Typography variant="subtitle1" gutterBottom>
                Progress
              </Typography>
              <Typography variant="body2">
                Processed: {transactionState.processedWallets?.length || 0}
              </Typography>
            </Paper>
          </Grid> */}

          {/* Recent Transactions */}
          <Grid item xs={12}>
            <Paper sx={{ p: 2, bgcolor: "background.default" }}>
              <Typography variant="subtitle1" gutterBottom>
                Recent Transactions
              </Typography>
              <Box sx={{ maxHeight: 300, overflow: "auto" }}>
                {transactions.slice().map((tx, index) => (
                  <Box
                    key={index}
                    sx={{
                      mb: 1,
                      p: 1,
                      borderRadius: 1,
                      bgcolor: "background.paper",
                    }}>
                    <Box
                      sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        mb: 1,
                      }}>
                      <Chip
                        label={tx.type.toUpperCase()}
                        color={tx.type === "buy" ? "primary" : "secondary"}
                        size="small"
                      />
                      <Chip
                        label={tx.status.toUpperCase()}
                        color={tx.status === "success" ? "success" : "error"}
                        size="small"
                      />
                    </Box>
                    <Typography variant="body2">
                      Wallet: {tx.wallet?.slice(0, 6)}...
                      {tx.wallet?.slice(-4)}
                    </Typography>
                    {tx.amount && (
                      <Typography variant="body2">
                        Amount: {tx.amount} ETH
                      </Typography>
                    )}
                    {tx.error && (
                      <Typography variant="body2" color="error">
                        Error: {tx.error}
                      </Typography>
                    )}
                    <Typography variant="caption" color="text.secondary">
                      {tx.timestamp.toLocaleTimeString()}
                    </Typography>
                    <Divider sx={{ my: 1 }} />
                  </Box>
                ))}
              </Box>
            </Paper>
          </Grid>
        </Grid>
      </Paper>
    </Box>
  );
};

TransactionStateManager.propTypes = {
  chatId: PropTypes.string.isRequired,
  onTradingStatusChange: PropTypes.func,
};

export default TransactionStateManager;
