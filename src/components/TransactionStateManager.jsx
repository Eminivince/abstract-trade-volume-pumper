import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
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
  CircularProgress,
  IconButton,
  Card,
  CardContent,
  Tooltip,
  Skeleton,
  useTheme,
  useMediaQuery,
  Alert,
  AlertTitle,
} from "@mui/material";
import RefreshIcon from "@mui/icons-material/Refresh";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import AutorenewIcon from "@mui/icons-material/Autorenew";
import ShoppingCartIcon from "@mui/icons-material/ShoppingCart";
import SellIcon from "@mui/icons-material/Sell";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";
import EqualizerIcon from "@mui/icons-material/Equalizer";
import InfoIcon from "@mui/icons-material/Info";
import CloseIcon from "@mui/icons-material/Close";
import PropTypes from "prop-types";
import { config } from "../config";
import { IS_PRODUCTION } from "../config";

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      duration: 0.4,
      when: "beforeChildren",
      staggerChildren: 0.1,
    },
  },
  exit: {
    opacity: 0,
    transition: { duration: 0.3 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.3 },
  },
  exit: {
    opacity: 0,
    y: -10,
    transition: { duration: 0.2 },
  },
};

const TransactionStateManager = ({
  chatId,
  onResume,
  onTradingStatusChange,
}) => {
  const [transactionState, setTransactionState] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [showAllTransactions, setShowAllTransactions] = useState(false);

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  const fetchTransactionState = async () => {
    try {
      setLoading(true);
      setRefreshing(true);

      if (!IS_PRODUCTION) {
        console.log(`[DEV] Fetching transaction state for chatId: ${chatId}`);
      }

      const [stateResponse, transactionsResponse] = await Promise.all([
        getTransactionState(chatId),
        getRecentTransactions(chatId, 50), // Fetch 50 transactions to ensure we have enough
      ]);

      if (stateResponse?.transactionState) {
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
        setTransactionState({
          type: "unknown",
          details: { currentPhase: "unknown" },
          successCount: 0,
          failCount: 0,
          processedWallets: [],
        });
        onTradingStatusChange?.(false);
      }

      if (transactionsResponse?.transactions) {
        const formattedTransactions = transactionsResponse.transactions.map(
          (tx) => ({
            ...tx,
            timestamp: new Date(tx.timestamp || Date.now()),
          })
        );

        // Calculate transaction statistics based on fetched transactions
        const successCount = formattedTransactions.filter(
          (tx) => tx.status === "success"
        ).length;

        const failCount = formattedTransactions.filter(
          (tx) => tx.status === "failed" || tx.status === "error"
        ).length;

        // Extract unique wallet addresses for processed count
        const processedWallets = [
          ...new Set(formattedTransactions.map((tx) => tx.wallet)),
        ];

        // Update transaction state with computed statistics
        setTransactionState((prevState) => ({
          ...prevState,
          successCount,
          failCount,
          processedWallets,
        }));

        setTransactions(formattedTransactions);
      }

      setError(null);
    } catch (err) {
      console.error("Error fetching data:", err);
      setError(err.message || "Unknown error occurred");
      onTradingStatusChange?.(false);

      // Set default transaction state to prevent errors
      if (!transactionState) {
        setTransactionState({
          type: "unknown",
          details: { currentPhase: "unknown" },
          successCount: 0,
          failCount: 0,
          processedWallets: [],
        });
      }
    } finally {
      setLoading(false);
      setTimeout(() => setRefreshing(false), 500); // Keep refresh animation for a bit
    }
  };

  useEffect(() => {
    let socketInstance;

    const initialize = async () => {
      if (!chatId) return;

      try {
        socketInstance = io(config.SOCKET_URL);
        socketInstance.emit("join", chatId);

        // Trading Process Events
        socketInstance.on("tradingStatsUpdate", (data) => {
          if (!IS_PRODUCTION) {
            console.log("[DEV] Trading Stats Update:", data);
          }
          setTransactionState((prevState) => {
            if (!prevState)
              return {
                type: "trading",
                details: {
                  currentPhase: data.currentPhase || "unknown",
                  cycleCount: data.cycleCount || 0,
                },
                successCount: data.successCount || 0,
                failCount: data.failCount || 0,
                processedWallets: data.processedWallets || [],
              };

            return {
              ...prevState,
              successCount: data.successCount,
              failCount: data.failCount,
              processedWallets: data.processedWallets,
              details: {
                ...prevState?.details,
                currentPhase: data.currentPhase,
                cycleCount: data.cycleCount,
              },
            };
          });
        });

        socketInstance.on("tradeCycleUpdate", (data) => {
          if (!IS_PRODUCTION) {
            console.log("[DEV] Trade Cycle Update:", data);
          }
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
          if (!IS_PRODUCTION) {
            console.log("[DEV] Buy Transaction Update:", data);
          }

          const newTransaction = {
            type: "buy",
            ...data,
            timestamp: new Date(),
          };

          setTransactions((prev) => {
            const updatedTransactions = [newTransaction, ...prev].slice(0, 50);

            // Update transaction stats whenever new transactions arrive
            updateTransactionStats(updatedTransactions);

            return updatedTransactions;
          });
        });

        socketInstance.on("sellTransactionUpdate", (data) => {
          if (!IS_PRODUCTION) {
            console.log("[DEV] Sell Transaction Update:", data);
          }

          const newTransaction = {
            type: "sell",
            ...data,
            timestamp: new Date(),
          };

          setTransactions((prev) => {
            const updatedTransactions = [newTransaction, ...prev].slice(0, 50);

            // Update transaction stats whenever new transactions arrive
            updateTransactionStats(updatedTransactions);

            return updatedTransactions;
          });
        });

        socketInstance.on("phaseChange", (data) => {
          if (!IS_PRODUCTION) {
            console.log("[DEV] Phase Change:", data);
          }
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
          if (!IS_PRODUCTION) {
            console.log("[DEV] Trade Process Stopped:", data);
          }
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

        // Helper function to update transaction statistics
        const updateTransactionStats = (transactionList) => {
          // Calculate transaction statistics
          const successCount = transactionList.filter(
            (tx) => tx.status === "success"
          ).length;

          const failCount = transactionList.filter(
            (tx) => tx.status === "failed" || tx.status === "error"
          ).length;

          // Extract unique wallet addresses for processed count
          const processedWallets = [
            ...new Set(transactionList.map((tx) => tx.wallet)),
          ];

          // Update transaction state with computed statistics
          setTransactionState((prevState) => ({
            ...prevState,
            successCount,
            failCount,
            processedWallets,
          }));
        };

        await fetchTransactionState();
      } catch (err) {
        console.error("Socket initialization error:", err);
        setError("Failed to initialize socket connection");
        // Initialize with default values to prevent null pointer errors
        setTransactionState({
          type: "unknown",
          details: { currentPhase: "unknown" },
          successCount: 0,
          failCount: 0,
          processedWallets: [],
        });
      }
    };

    initialize();

    return () => {
      if (socketInstance) {
        socketInstance.disconnect();
      }
    };
  }, [chatId, onTradingStatusChange, onResume]);

  if (!transactionState) {
    return (
      <motion.div
        initial="hidden"
        animate="visible"
        exit="exit"
        variants={containerVariants}>
        <Paper
          elevation={3}
          sx={{
            p: 3,
            background: "linear-gradient(to bottom right, #1e1e3f, #121212)",
            borderRadius: 2,
            overflow: "hidden",
          }}>
          <Box
            display="flex"
            alignItems="center"
            justifyContent="center"
            flexDirection="column">
            <CircularProgress size={40} sx={{ mb: 2 }} />
            <Typography variant="h6">Loading transaction state...</Typography>
          </Box>
        </Paper>
      </motion.div>
    );
  }

  const getPhaseDisplay = (phase) => {
    if (!phase) return "Unknown";

    switch (phase) {
      case "alpha_buy":
        return "Alpha Group: Buying";
      case "beta_buy_alpha_sell":
        return "Beta Group: Buying | Alpha Group: Selling";
      case "alpha_buy_beta_sell":
        return "Alpha Group: Buying | Beta Group: Selling";
      case "cooldown":
        return "Cooldown Period";
      case "distribute":
        return "ETH Distribution";
      case "collect":
        return "Funds Collection";
      default:
        return phase.replace(/_/g, " ").toUpperCase() || "Unknown";
    }
  };

  const getPhaseColor = (phase) => {
    if (!phase) return "default";

    switch (phase) {
      case "alpha_buy":
      case "beta_buy_alpha_sell":
      case "alpha_buy_beta_sell":
        return "primary";
      case "cooldown":
        return "warning";
      case "stopped":
        return "error";
      case "distribute":
      case "collect":
        return "success";
      default:
        return "default";
    }
  };

  const getPhaseIcon = (phase) => {
    if (!phase) return <InfoIcon fontSize="small" />;

    switch (phase) {
      case "alpha_buy":
      case "beta_buy_alpha_sell":
      case "alpha_buy_beta_sell":
        return <ShoppingCartIcon fontSize="small" />;
      case "cooldown":
        return <AccessTimeIcon fontSize="small" />;
      case "stopped":
        return <ErrorOutlineIcon fontSize="small" />;
      case "distribute":
        return <SellIcon fontSize="small" />;
      case "collect":
        return <EqualizerIcon fontSize="small" />;
      default:
        return <AutorenewIcon fontSize="small" />;
    }
  };

  const formatTimeRemaining = (nextPhaseTime) => {
    if (!nextPhaseTime) return "Unknown";

    const now = new Date();
    const next = new Date(nextPhaseTime);
    const diffMs = next - now;

    if (diffMs <= 0) return "Imminent";

    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const mins = diffMins % 60;

    if (diffHours > 0) {
      return `${diffHours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      exit="exit"
      variants={containerVariants}>
      <Paper
        elevation={3}
        sx={{
          p: 3,
          background: "linear-gradient(to bottom right, #1e1e3f, #121212)",
          borderRadius: 2,
          overflow: "hidden",
          position: "relative",
        }}>
        {/* Header with title and actions */}
        <Box
          component={motion.div}
          variants={itemVariants}
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            mb: 3,
            gap: 2,
            flexDirection: isMobile ? "column" : "row",
          }}>
          <Box
            sx={{
              display: "flex",
              gap: 1,
              alignSelf: isMobile ? "flex-end" : "center",
            }}>
            {/* <Tooltip title="Resume transaction">
              <span>
                <Button
                  variant="outlined"
                  color="primary"
                  onClick={handleResume}
                  startIcon={<CachedIcon />}
                  disabled={!onResume || loading}
                  size="small"
                  sx={{ borderRadius: 2 }}>
                  Resume
                </Button>
              </span>
            </Tooltip> */}

            <Tooltip title="Refresh status">
              <IconButton
                color="primary"
                onClick={fetchTransactionState}
                disabled={loading}
                size="small"
                sx={{
                  border: `1px solid ${theme.palette.primary.main}`,
                  borderRadius: 2,
                }}>
                {refreshing ? (
                  <CircularProgress size={20} color="inherit" />
                ) : (
                  <RefreshIcon />
                )}
              </IconButton>
            </Tooltip>
          </Box>
        </Box>

        {/* Error display */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}>
              <Alert
                severity="error"
                sx={{ mb: 3, borderRadius: 2 }}
                action={
                  <IconButton
                    color="inherit"
                    size="small"
                    onClick={() => setError(null)}>
                    <CloseIcon fontSize="small" />
                  </IconButton>
                }>
                <AlertTitle>Error</AlertTitle>
                {error}
              </Alert>
            </motion.div>
          )}
        </AnimatePresence>

        <Grid container spacing={2}>
          {/* Phase Information */}
          <Grid item xs={12} md={6}>
            <motion.div variants={itemVariants}>
              <Card
                elevation={1}
                sx={{
                  borderRadius: 2,
                  background: "rgba(255, 255, 255, 0.03)",
                  border: "1px solid rgba(255, 255, 255, 0.1)",
                  height: "100%",
                }}>
                <CardContent>
                  <Typography
                    variant="h6"
                    gutterBottom
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      borderBottom: `1px solid ${theme.palette.divider}`,
                      pb: 1,
                    }}>
                    <InfoIcon sx={{ mr: 1 }} fontSize="small" />
                    Transaction Info
                  </Typography>

                  <Box sx={{ mt: 2 }}>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      gutterBottom
                      sx={{ display: "flex", alignItems: "center" }}>
                      <span style={{ width: "90px" }}>Type:</span>
                      <Chip
                        label={(
                          transactionState.type || "unknown"
                        ).toUpperCase()}
                        size="small"
                        color="primary"
                      />
                    </Typography>

                    <Typography
                      variant="body2"
                      color="text.secondary"
                      gutterBottom
                      sx={{ display: "flex", alignItems: "center", mt: 1 }}>
                      <span style={{ width: "90px" }}>Phase:</span>
                      <Chip
                        icon={getPhaseIcon(
                          transactionState.details?.currentPhase
                        )}
                        label={getPhaseDisplay(
                          transactionState.details?.currentPhase
                        )}
                        size="small"
                        color={getPhaseColor(
                          transactionState.details?.currentPhase
                        )}
                      />
                    </Typography>

                    {transactionState.details?.cycleCount && (
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        gutterBottom
                        sx={{ display: "flex", alignItems: "center", mt: 1 }}>
                        <span style={{ width: "90px" }}>Cycle:</span>
                        <Chip
                          label={`#${transactionState.details.cycleCount}`}
                          size="small"
                          variant="outlined"
                        />
                      </Typography>
                    )}

                    {transactionState.details?.nextPhaseTime && (
                      <Box sx={{ mt: 2 }}>
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          gutterBottom>
                          Next Phase in:
                          <Chip
                            label={formatTimeRemaining(
                              transactionState.details.nextPhaseTime
                            )}
                            size="small"
                            color="warning"
                            sx={{ ml: 1 }}
                          />
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {new Date(
                            transactionState.details.nextPhaseTime
                          ).toLocaleString()}
                        </Typography>
                      </Box>
                    )}

                    <Box
                      sx={{
                        mt: 2,
                        pt: 2,
                        borderTop: `1px solid ${theme.palette.divider}`,
                        display: "flex",
                        justifyContent: "space-between",
                      }}>
                      <Tooltip
                        title={`${
                          transactionState.successCount || 0
                        } successful transactions completed`}>
                        <Box sx={{ textAlign: "center" }}>
                          <CheckCircleIcon color="success" fontSize="small" />
                          <Typography variant="h6" color="success.main">
                            {transactionState.successCount || 0}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            Success
                          </Typography>
                        </Box>
                      </Tooltip>

                      <Tooltip
                        title={`${
                          transactionState.failCount || 0
                        } failed transactions (includes errors and skipped)`}>
                        <Box sx={{ textAlign: "center" }}>
                          <ErrorOutlineIcon color="error" fontSize="small" />
                          <Typography variant="h6" color="error.main">
                            {transactionState.failCount || 0}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            Failed
                          </Typography>
                        </Box>
                      </Tooltip>

                      <Tooltip
                        title={`${
                          transactionState.processedWallets?.length || 0
                        } unique wallet addresses processed`}>
                        <Box sx={{ textAlign: "center" }}>
                          <EqualizerIcon color="primary" fontSize="small" />
                          <Typography variant="h6" color="primary.main">
                            {transactionState.processedWallets?.length || 0}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            Wallets
                          </Typography>
                        </Box>
                      </Tooltip>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </motion.div>
          </Grid>

          {/* Recent Transactions */}
          <Grid item xs={12} md={6}>
            <motion.div variants={itemVariants}>
              <Card
                elevation={1}
                sx={{
                  borderRadius: 2,
                  background: "rgba(255, 255, 255, 0.03)",
                  border: "1px solid rgba(255, 255, 255, 0.1)",
                }}>
                <CardContent>
                  <Typography
                    variant="h6"
                    gutterBottom
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      borderBottom: `1px solid ${theme.palette.divider}`,
                      pb: 1,
                    }}>
                    <Box sx={{ display: "flex", alignItems: "center" }}>
                      <RefreshIcon sx={{ mr: 1 }} fontSize="small" />
                      Recent Transactions
                    </Box>
                    {transactions.length > 0 && (
                      <Chip
                        label={transactions.length}
                        size="small"
                        color="primary"
                      />
                    )}
                  </Typography>

                  {loading && transactions.length === 0 ? (
                    <Box sx={{ mt: 2 }}>
                      {[1, 2, 3].map((_, index) => (
                        <Box
                          key={index}
                          sx={{
                            mb: 2,
                            p: 1,
                            borderRadius: 1,
                            bgcolor: "rgba(255, 255, 255, 0.02)",
                          }}>
                          <Box
                            sx={{
                              display: "flex",
                              justifyContent: "space-between",
                              mb: 1,
                            }}>
                            <Skeleton
                              variant="rounded"
                              width={60}
                              height={24}
                            />
                            <Skeleton
                              variant="rounded"
                              width={60}
                              height={24}
                            />
                          </Box>
                          <Skeleton variant="text" width="60%" />
                          <Skeleton variant="text" width="40%" />
                        </Box>
                      ))}
                    </Box>
                  ) : transactions.length === 0 ? (
                    <Box
                      sx={{
                        mt: 2,
                        p: 2,
                        textAlign: "center",
                        bgcolor: "rgba(255, 255, 255, 0.02)",
                        borderRadius: 2,
                        border: "1px dashed rgba(255, 255, 255, 0.1)",
                      }}>
                      <InfoIcon color="disabled" sx={{ fontSize: 40, mb: 1 }} />
                      <Typography variant="body2" color="text.secondary">
                        No recent transactions found
                      </Typography>
                    </Box>
                  ) : (
                    <Box
                      sx={{
                        maxHeight: showAllTransactions ? 500 : 300,
                        overflow: "auto",
                        mt: 1,
                        transition: "max-height 0.3s ease",
                      }}>
                      <AnimatePresence initial={false}>
                        {(showAllTransactions
                          ? transactions
                          : transactions.slice(0, 10)
                        ).map((tx, index) => (
                          <motion.div
                            key={index}
                            variants={itemVariants}
                            initial="hidden"
                            animate="visible"
                            exit="exit"
                            layout>
                            <Card
                              elevation={0}
                              sx={{
                                mb: 2,
                                borderRadius: 1,
                                bgcolor: "rgba(255, 255, 255, 0.02)",
                                border: `1px solid ${
                                  tx.status === "success"
                                    ? "rgba(46, 125, 50, 0.3)"
                                    : tx.status === "failed" ||
                                      tx.status === "error"
                                    ? "rgba(211, 47, 47, 0.3)"
                                    : tx.status === "skipped"
                                    ? "rgba(255, 152, 0, 0.3)"
                                    : "rgba(255, 255, 255, 0.05)"
                                }`,
                                transition: "all 0.3s ease",
                              }}>
                              <CardContent
                                sx={{
                                  p: "12px",
                                  "&:last-child": { pb: "12px" },
                                }}>
                                <Box
                                  sx={{
                                    display: "flex",
                                    justifyContent: "space-between",
                                    alignItems: "center",
                                    mb: 0.5,
                                  }}>
                                  <Chip
                                    icon={
                                      tx.type === "buy" ? (
                                        <ShoppingCartIcon fontSize="small" />
                                      ) : tx.type === "sell" ? (
                                        <SellIcon fontSize="small" />
                                      ) : (
                                        <AutorenewIcon fontSize="small" />
                                      )
                                    }
                                    label={tx.type.toUpperCase()}
                                    color={
                                      tx.type === "buy"
                                        ? "primary"
                                        : "secondary"
                                    }
                                    size="small"
                                    sx={{ borderRadius: 1 }}
                                  />
                                  <Chip
                                    icon={
                                      tx.status === "success" ? (
                                        <CheckCircleIcon fontSize="small" />
                                      ) : tx.status === "skipped" ? (
                                        <AccessTimeIcon fontSize="small" />
                                      ) : (
                                        <ErrorOutlineIcon fontSize="small" />
                                      )
                                    }
                                    label={tx.status.toUpperCase()}
                                    color={
                                      tx.status === "success"
                                        ? "success"
                                        : tx.status === "skipped"
                                        ? "warning"
                                        : "error"
                                    }
                                    size="small"
                                    sx={{ borderRadius: 1 }}
                                  />
                                </Box>
                                <Typography
                                  variant="body2"
                                  sx={{ fontSize: "0.8rem" }}>
                                  {tx.wallet?.slice(0, 8)}...
                                  {tx.wallet?.slice(-6)}
                                </Typography>
                                {tx.amount && (
                                  <Typography
                                    variant="body2"
                                    sx={{ fontSize: "0.8rem" }}>
                                    <strong>Amount:</strong> {tx.amount}
                                    {tx.type === "sell" ? " Tokens" : " ETH"}
                                  </Typography>
                                )}
                                {tx.error && (
                                  <Typography
                                    variant="body2"
                                    color="error"
                                    sx={{ fontSize: "0.8rem" }}>
                                    <strong>Error:</strong>{" "}
                                    {tx.error.length > 40
                                      ? tx.error.substring(0, 40) + "..."
                                      : tx.error}
                                  </Typography>
                                )}
                                <Typography
                                  variant="caption"
                                  color="text.secondary"
                                  sx={{ display: "block", mt: 0.5 }}>
                                  <AccessTimeIcon
                                    sx={{
                                      fontSize: "0.75rem",
                                      mr: 0.5,
                                      verticalAlign: "middle",
                                    }}
                                  />
                                  {tx.timestamp.toLocaleTimeString()}
                                </Typography>
                              </CardContent>
                            </Card>
                          </motion.div>
                        ))}
                      </AnimatePresence>

                      {transactions.length > 10 && (
                        <Box sx={{ textAlign: "center", mt: 1 }}>
                          <Button
                            size="small"
                            variant="text"
                            onClick={() => {
                              if (!showAllTransactions) {
                                // Refresh data when expanding
                                fetchTransactionState();
                              }
                              setShowAllTransactions(!showAllTransactions);
                            }}
                            endIcon={
                              !showAllTransactions ? (
                                refreshing ? (
                                  <CircularProgress size={16} color="inherit" />
                                ) : (
                                  <RefreshIcon fontSize="small" />
                                )
                              ) : undefined
                            }
                            sx={{ fontSize: "0.8rem" }}>
                            {refreshing
                              ? "Loading transactions..."
                              : showAllTransactions
                              ? `Show fewer transactions`
                              : `View all ${transactions.length} transactions`}
                          </Button>
                        </Box>
                      )}
                    </Box>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </Grid>
        </Grid>
      </Paper>
    </motion.div>
  );
};

TransactionStateManager.propTypes = {
  chatId: PropTypes.string.isRequired,
  onResume: PropTypes.func,
  onTradingStatusChange: PropTypes.func,
};

export default TransactionStateManager;
