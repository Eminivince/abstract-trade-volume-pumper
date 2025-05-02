// frontend/src/pages/TradePage.jsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import io from "socket.io-client";

// MUI Components
import {
  Container,
  Paper,
  Typography,
  Box,
  Button,
  Grid,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  AlertTitle,
  CircularProgress,
  List,
  Chip,
  Card,
  CardContent,
  IconButton,
  Tooltip,
  useTheme,
  useMediaQuery,
  Skeleton,
} from "@mui/material";

// Icons
import SwapHorizIcon from "@mui/icons-material/SwapHoriz";
import StopIcon from "@mui/icons-material/Stop";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import RefreshIcon from "@mui/icons-material/Refresh";
import InfoIcon from "@mui/icons-material/Info";
import AutorenewIcon from "@mui/icons-material/Autorenew";
import ShoppingCartIcon from "@mui/icons-material/ShoppingCart";
import SellIcon from "@mui/icons-material/Sell";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import LoopIcon from "@mui/icons-material/Loop";
import PercentIcon from "@mui/icons-material/Percent";
import TimerIcon from "@mui/icons-material/Timer";
import CloseIcon from "@mui/icons-material/Close";
import GroupIcon from "@mui/icons-material/Group";

// API and Context
import { getWalletGroups } from "../api/walletGroups";
import { startBuy, startSell } from "../api/transactions";
import { useAuth } from "../context/AuthContext";
import TransactionStateManager from "../components/TransactionStateManager";
import { config, IS_PRODUCTION } from "../config";

// Constants
// const SOCKET_SERVER_URL = "http://localhost:5080";
const SOCKET_SERVER_URL = "https://abstract-pump-109a297e2430.herokuapp.com";

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      duration: 0.5,
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
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4 },
  },
  exit: {
    opacity: 0,
    y: -20,
    transition: { duration: 0.2 },
  },
};

const cardVariants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.4 },
  },
};

const transactionVariants = {
  hidden: { opacity: 0, x: -20 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.3 },
  },
};

function TradePage() {
  const [walletGroups, setWalletGroups] = useState([]);
  const [alphaWalletGroup, setAlphaWalletGroup] = useState("");
  const [betaWalletGroup, setBetaWalletGroup] = useState("");
  const [amountRange, setAmountRange] = useState({
    minPercentage: 1,
    maxPercentage: 10,
  });
  const [timeRange, setTimeRange] = useState({
    minDelayMinutes: 2,
    maxDelayMinutes: 30,
  });
  const [cooldownPeriod, setCooldownPeriod] = useState(10); // in minutes
  const [result, setResult] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isTrading, setIsTrading] = useState(false);
  const [transactions, setTransactions] = useState([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const navigate = useNavigate();
  const { user, token } = useAuth();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  // Handle transaction resume
  const handleTransactionResume = (result) => {
    setTransactions([]);
    setResult(`Transaction resumed. Result: ${JSON.stringify(result)}`);
  };

  // Add this handler
  const handleTradingStatusChange = (status) => {
    setIsTrading(status);
  };

  // Handle refreshing wallet groups
  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchWalletGroups().finally(() => {
      setTimeout(() => {
        setIsRefreshing(false);
      }, 500);
    });
  };

  useEffect(() => {
    let socket;

    // Function to initialize Socket.IO and fetch wallet groups
    const initialize = async () => {
      if (!user) return;

      try {
        // Initialize Socket.IO client
        socket = io(config.SOCKET_URL, {
          auth: {
            token: token,
          },
        });

        // Listen for connection errors
        socket.on("connect_error", (err) => {
          console.error("Socket connection error:", err.message);
          setError(`Socket connection error: ${err.message}`);
        });

        socket.on("connect", () => {
          if (!IS_PRODUCTION) {
            console.log("[DEV] Socket connected for trading page");
          }
        });

        // Join the room with chatId
        socket.emit("join", user.chatId);

        // Listen for buy transaction updates
        socket.on("buyTransactionUpdate", (data) => {
          if (!IS_PRODUCTION) {
            console.log("[DEV] Buy transaction update:", data);
          }

          if (data.error) {
            let errorMessage = `Error: ${data.error}`;
            if (data.error.includes("Insufficient funds")) {
              errorMessage += ` (Balance: ${data.amount || "0.00"} ETH`;
            } else if (data.errorDetails?.requiredAmount) {
              errorMessage += ` (Required Amount: ${data.errorDetails.requiredAmount} ETH)`;
            }
            setResult(errorMessage);
          }
          setTransactions((prev) => [...prev, { ...data, type: "buy" }]);
        });

        // Listen for sell transaction updates
        socket.on("sellTransactionUpdate", (data) => {
          if (!IS_PRODUCTION) {
            console.log("[DEV] Sell transaction update:", data);
          }

          setTransactions((prev) => [...prev, { ...data, type: "sell" }]);
        });

        // Listen for trade cycle updates
        socket.on("tradeCycleUpdate", (data) => {
          if (!IS_PRODUCTION) {
            console.log("[DEV] Trade cycle update:", data);
          }

          setResult(`Trade Cycle Update: ${data.message}`);
        });

        // Listen for trade process stopped
        socket.on("tradeProcessStopped", (data) => {
          if (!IS_PRODUCTION) {
            console.log("[DEV] Trade process stopped:", data);
          }

          setResult(`Trading stopped. ${data.message}`);
          setIsTrading(false);
          setIsLoading(false);
        });

        // Fetch wallet groups
        await fetchWalletGroups();
      } catch (err) {
        console.error("Initialization error:", err);
        setError(
          "Initialization error occurred: " + (err.message || "Unknown error")
        );
        setResult("Initialization error occurred.");
      }
    };

    initialize();

    // Cleanup on component unmount
    return () => {
      if (socket) {
        socket.disconnect();
      }
    };
  }, [user, token]);

  // Fetch wallet groups
  const fetchWalletGroups = async () => {
    if (!user?.chatId) return;
    try {
      if (!IS_PRODUCTION) {
        console.log("[DEV] Fetching wallet groups for user:", user.chatId);
      }

      const groups = await getWalletGroups(user.chatId);
      setWalletGroups(groups);
      setError(null);
    } catch (err) {
      console.error("Error fetching wallet groups:", err);
      setError(
        "Error fetching wallet groups: " + (err.message || "Unknown error")
      );
      setResult("Error fetching wallet groups.");
    }
  };

  // Handle amount range change
  const handleAmountRangeChange = (e) => {
    const { name, value } = e.target;
    const numValue = Number(value);

    setAmountRange((prev) => {
      const updated = { ...prev, [name]: numValue };

      // // Auto-correct values to ensure min ≤ max
      // if (name === "minPercentage" && numValue > prev.maxPercentage) {
      //   updated.maxPercentage = numValue;
      // } else if (name === "maxPercentage" && numValue < prev.minPercentage) {
      //   updated.minPercentage = numValue;
      // }

      return updated;
    });
  };

  // Handle time range change
  const handleTimeRangeChange = (e) => {
    const { name, value } = e.target;
    const numValue = Number(value);

    setTimeRange((prev) => {
      const updated = { ...prev, [name]: numValue };

      // // Auto-correct values to ensure min ≤ max
      // if (name === "minDelayMinutes" && numValue > prev.maxDelayMinutes) {
      //   updated.maxDelayMinutes = numValue;
      // } else if (
      //   name === "maxDelayMinutes" &&
      //   numValue < prev.minDelayMinutes
      // ) {
      //   updated.minDelayMinutes = numValue;
      // }

      return updated;
    });
  };

  // Handle cooldown period change
  const handleCooldownChange = (e) => {
    setCooldownPeriod(Number(e.target.value));
  };

  // Reset form
  const resetForm = () => {
    setAlphaWalletGroup("");
    setBetaWalletGroup("");
    setAmountRange({
      minPercentage: 1,
      maxPercentage: 10,
    });
    setTimeRange({
      minDelayMinutes: 2,
      maxDelayMinutes: 30,
    });
    setCooldownPeriod(10);
    setError(null);
    setResult("");
  };

  // Handle form submission to start trading
  const handleStartTrading = async (e) => {
    e.preventDefault();

    if (!alphaWalletGroup || !betaWalletGroup) {
      setError("Please select both Alpha and Beta wallet groups.");
      return;
    }

    if (alphaWalletGroup === betaWalletGroup) {
      setError("Alpha and Beta wallet groups must be different.");
      return;
    }

    // Validate percentage range
    const { minPercentage, maxPercentage } = amountRange;
    if (
      isNaN(minPercentage) ||
      isNaN(maxPercentage) ||
      minPercentage < 1 ||
      maxPercentage > 100 ||
      minPercentage > maxPercentage
    ) {
      setError(
        "Please enter a valid percentage range (1% ≤ min ≤ max ≤ 100%)."
      );
      return;
    }

    // Validate time range
    const { minDelayMinutes, maxDelayMinutes } = timeRange;
    if (
      isNaN(minDelayMinutes) ||
      isNaN(maxDelayMinutes) ||
      minDelayMinutes <= 0 ||
      maxDelayMinutes <= 0 ||
      minDelayMinutes > maxDelayMinutes
    ) {
      setError("Please enter a valid time range (min ≤ max, both > 0).");
      return;
    }

    // Validate cooldown period
    if (isNaN(cooldownPeriod) || cooldownPeriod <= 0) {
      setError("Please enter a valid cooldown period (> 0).");
      return;
    }

    setIsLoading(true);
    setError(null);
    setResult("");
    setTransactions([]); // Reset previous transactions

    try {
      if (!IS_PRODUCTION) {
        console.log("[DEV] Starting trading with params:", {
          chatId: user.chatId,
          alphaGroupId: alphaWalletGroup,
          betaGroupId: betaWalletGroup,
          percentageRange: {
            minPercentage: amountRange.minPercentage,
            maxPercentage: amountRange.maxPercentage,
          },
          timeRange,
          cooldownPeriodMinutes: cooldownPeriod,
        });
      }

      // Start the continuous trading process
      const response = await fetch(`${config.SOCKET_URL}/api/start-trading`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          chatId: user.chatId,
          alphaGroupId: alphaWalletGroup,
          betaGroupId: betaWalletGroup,
          percentageRange: {
            minPercentage: amountRange.minPercentage,
            maxPercentage: amountRange.maxPercentage,
          },
          timeRange: {
            minDelayMinutes: timeRange.minDelayMinutes,
            maxDelayMinutes: timeRange.maxDelayMinutes,
          },
          cooldownPeriodMinutes: cooldownPeriod,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setResult(`Trading started: ${data.message}`);
        setIsTrading(true);
        setError(null);
      } else {
        setError(`Error: ${data.error || "Failed to start trading"}`);
        setResult(`Error: ${data.error || "Failed to start trading"}`);
        setIsLoading(false);
      }
    } catch (err) {
      console.error("Error starting trading:", err);
      setError(
        "An error occurred while starting the trading process: " +
          (err.message || "Unknown error")
      );
      setResult("An error occurred while starting the trading process.");
      setIsLoading(false);
    }
  };

  // Handle stopping the trading process
  const handleStopTrading = async () => {
    try {
      if (!IS_PRODUCTION) {
        console.log("[DEV] Stopping trading for user:", user.chatId);
      }

      const response = await fetch(`${config.SOCKET_URL}/api/stop-trading`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          chatId: user.chatId,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setResult(`Trading stopped: ${data.message}`);
        setIsTrading(false);
        setError(null);
      } else {
        setError(`Error: ${data.error || "Failed to stop trading"}`);
        setResult(`Error: ${data.error || "Failed to stop trading"}`);
      }
    } catch (err) {
      console.error("Error stopping trading:", err);
      setError(
        "An error occurred while stopping the trading process: " +
          (err.message || "Unknown error")
      );
      setResult("An error occurred while stopping the trading process.");
    } finally {
      setIsLoading(false);
    }
  };

  // If user is not logged in, prompt to log in
  if (!user) {
    return (
      <Container maxWidth="sm" sx={{ my: 4 }}>
        <motion.div
          initial="hidden"
          animate="visible"
          exit="exit"
          variants={containerVariants}>
          <Paper
            elevation={3}
            sx={{
              p: 4,
              textAlign: "center",
              borderRadius: 2,
              background: "linear-gradient(to bottom right, #1e1e3f, #121212)",
            }}>
            <Box
              component={motion.div}
              variants={itemVariants}
              sx={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 2,
              }}>
              <SwapHorizIcon color="primary" sx={{ fontSize: 60 }} />
              <Typography variant="h4" component="h1" fontWeight="bold">
                Automated Trading
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                Please log in to access the automated trading features.
              </Typography>
              <Button
                variant="contained"
                color="primary"
                onClick={() => navigate("/login")}
                startIcon={<AutorenewIcon />}
                size="large"
                sx={{ borderRadius: 2 }}>
                Go to Login
              </Button>
            </Box>
          </Paper>
        </motion.div>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ my: 4 }}>
      <motion.div
        initial="hidden"
        animate="visible"
        exit="exit"
        variants={containerVariants}>
        {user?.chatId && (
          <Box mb={3}>
            <TransactionStateManager
              chatId={user.chatId}
              onResume={handleTransactionResume}
              onTradingStatusChange={handleTradingStatusChange}
            />
          </Box>
        )}

        <Paper
          elevation={3}
          sx={{
            p: 3,
            borderRadius: 2,
            background: "linear-gradient(to bottom right, #1e1e3f, #121212)",
            position: "relative",
            overflow: "hidden",
          }}>
          {/* Header with title and actions */}
          <Box
            component={motion.div}
            variants={itemVariants}
            sx={{
              display: "flex",
              flexDirection: isMobile ? "column" : "row",
              justifyContent: "space-between",
              alignItems: isMobile ? "flex-start" : "center",
              mb: 3,
              gap: 2,
            }}>
            <Box
              sx={{
                display: "flex",
                gap: 1,
                alignSelf: isMobile ? "flex-end" : "center",
              }}>
              <Tooltip title="Refresh wallet groups">
                <IconButton
                  color="primary"
                  onClick={handleRefresh}
                  disabled={isLoading || isTrading || isRefreshing}>
                  {isRefreshing ? (
                    <CircularProgress size={24} />
                  ) : (
                    <RefreshIcon />
                  )}
                </IconButton>
              </Tooltip>
              <Button
                variant="outlined"
                color="secondary"
                onClick={() => navigate("/")}
                startIcon={<ArrowBackIcon />}
                disabled={isLoading}
                sx={{ borderRadius: 2 }}>
                Back
              </Button>
            </Box>
          </Box>

          {/* Status messages and errors */}
          <AnimatePresence mode="wait">
            {(error || result) && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}>
                <Alert
                  severity={
                    error
                      ? "error"
                      : result.includes("started") || result.includes("resumed")
                      ? "success"
                      : result.includes("stopped")
                      ? "warning"
                      : "info"
                  }
                  sx={{
                    mb: 3,
                    borderRadius: 2,
                    whiteSpace: "pre-wrap",
                  }}
                  action={
                    <IconButton
                      color="inherit"
                      size="small"
                      onClick={() => {
                        setError(null);
                        setResult("");
                      }}>
                      <CloseIcon fontSize="small" />
                    </IconButton>
                  }>
                  <AlertTitle>
                    {error
                      ? "Error"
                      : result.includes("started") || result.includes("resumed")
                      ? "Success"
                      : result.includes("stopped")
                      ? "Trading Stopped"
                      : "Information"}
                  </AlertTitle>
                  {error || result}
                </Alert>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Trading configuration form */}
          <Box
            component={motion.form}
            onSubmit={handleStartTrading}
            variants={itemVariants}
            noValidate
            sx={{ mb: 4 }}>
            <Grid container spacing={3}>
              {/* Wallet Groups Selection */}
              <Grid item xs={12}>
                <Card
                  elevation={1}
                  component={motion.div}
                  variants={cardVariants}
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
                        borderBottom: `1px solid ${theme.palette.divider}`,
                        pb: 1,
                        mb: 2,
                      }}>
                      <GroupIcon sx={{ mr: 1 }} />
                      Wallet Groups Configuration
                    </Typography>

                    <Grid container spacing={2}>
                      <Grid item xs={12} sm={6}>
                        <FormControl
                          fullWidth
                          required
                          disabled={isLoading || isTrading}
                          sx={{ mb: isMobile ? 2 : 0 }}>
                          <InputLabel>Alpha Wallet Group</InputLabel>
                          <Select
                            value={alphaWalletGroup}
                            onChange={(e) =>
                              setAlphaWalletGroup(e.target.value)
                            }
                            label="Alpha Wallet Group">
                            {walletGroups.map((group) => (
                              <MenuItem
                                key={`alpha-${group._id}`}
                                value={group._id}>
                                {group.name}
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <FormControl
                          fullWidth
                          required
                          disabled={isLoading || isTrading}>
                          <InputLabel>Beta Wallet Group</InputLabel>
                          <Select
                            value={betaWalletGroup}
                            onChange={(e) => setBetaWalletGroup(e.target.value)}
                            label="Beta Wallet Group">
                            {walletGroups.map((group) => (
                              <MenuItem
                                key={`beta-${group._id}`}
                                value={group._id}>
                                {group.name}
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                      </Grid>
                    </Grid>

                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ mt: 2 }}>
                      <InfoIcon
                        fontSize="small"
                        sx={{ verticalAlign: "middle", mr: 0.5 }}
                      />
                      Select different wallet groups for Alpha and Beta trading
                      phases
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>

              {/* Percentage Range */}
              <Grid item xs={12} md={6}>
                <Card
                  elevation={1}
                  component={motion.div}
                  variants={cardVariants}
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
                        mb: 2,
                      }}>
                      <PercentIcon sx={{ mr: 1 }} />
                      Trading Amount Configuration
                    </Typography>

                    <Grid container spacing={2}>
                      <Grid item xs={12} sm={6}>
                        <TextField
                          label="Minimum Percentage"
                          name="minPercentage"
                          type="number"
                          inputProps={{ step: "1", min: "1", max: "100" }}
                          value={amountRange.minPercentage}
                          onChange={handleAmountRangeChange}
                          required
                          fullWidth
                          disabled={isLoading || isTrading}
                          sx={{ mb: 2 }}
                        />
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <TextField
                          label="Maximum Percentage"
                          name="maxPercentage"
                          type="number"
                          inputProps={{ step: "1", min: "1", max: "100" }}
                          value={amountRange.maxPercentage}
                          onChange={handleAmountRangeChange}
                          required
                          fullWidth
                          disabled={isLoading || isTrading}
                          sx={{ mb: 2 }}
                        />
                      </Grid>
                    </Grid>

                    <Typography variant="body2" color="text.secondary">
                      <InfoIcon
                        fontSize="small"
                        sx={{ verticalAlign: "middle", mr: 0.5 }}
                      />
                      This defines the random percentage of wallet balance to
                      use for each transaction
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>

              {/* Time Configuration */}
              <Grid item xs={12} md={6}>
                <Card
                  elevation={1}
                  component={motion.div}
                  variants={cardVariants}
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
                        mb: 2,
                      }}>
                      <TimerIcon sx={{ mr: 1 }} />
                      Time Configuration
                    </Typography>

                    <Grid container spacing={2}>
                      <Grid item xs={12} sm={6}>
                        <TextField
                          label="Min Delay (minutes)"
                          name="minDelayMinutes"
                          type="number"
                          inputProps={{ min: "1" }}
                          value={timeRange.minDelayMinutes}
                          onChange={handleTimeRangeChange}
                          required
                          fullWidth
                          disabled={isLoading || isTrading}
                          sx={{ mb: 2 }}
                        />
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <TextField
                          label="Max Delay (minutes)"
                          name="maxDelayMinutes"
                          type="number"
                          inputProps={{ min: "1" }}
                          value={timeRange.maxDelayMinutes}
                          onChange={handleTimeRangeChange}
                          required
                          fullWidth
                          disabled={isLoading || isTrading}
                          sx={{ mb: 2 }}
                        />
                      </Grid>
                      <Grid item xs={12}>
                        <TextField
                          label="Cooldown Period (minutes)"
                          type="number"
                          inputProps={{ min: "1" }}
                          value={cooldownPeriod}
                          onChange={handleCooldownChange}
                          required
                          fullWidth
                          disabled={isLoading || isTrading}
                        />
                      </Grid>
                    </Grid>

                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ mt: 2 }}>
                      <InfoIcon
                        fontSize="small"
                        sx={{ verticalAlign: "middle", mr: 0.5 }}
                      />
                      Time between transactions and cycles. A cooldown period
                      helps avoid detection.
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>

            {/* Actions */}
            <Box
              component={motion.div}
              variants={itemVariants}
              sx={{
                mt: 4,
                display: "flex",
                flexDirection: isMobile ? "column" : "row",
                gap: 2,
              }}>
              {!isTrading ? (
                <Button
                  type="submit"
                  variant="contained"
                  color="primary"
                  fullWidth
                  disabled={isLoading}
                  startIcon={
                    isLoading ? (
                      <CircularProgress size={20} />
                    ) : (
                      <SwapHorizIcon />
                    )
                  }
                  sx={{
                    py: 1.5,
                    borderRadius: 2,
                    background: "linear-gradient(45deg, #3f51b5, #2196f3)",
                    position: "relative",
                  }}>
                  {isLoading ? "Starting Trading..." : "Start Trading"}
                </Button>
              ) : (
                <Button
                  variant="contained"
                  color="error"
                  fullWidth
                  onClick={handleStopTrading}
                  startIcon={<StopIcon />}
                  sx={{
                    py: 1.5,
                    borderRadius: 2,
                    position: "relative",
                  }}>
                  Stop Trading
                </Button>
              )}

              <Button
                variant="outlined"
                color="secondary"
                disabled={isLoading || isTrading}
                onClick={resetForm}
                sx={{ borderRadius: 2 }}>
                Reset Form
              </Button>
            </Box>
          </Box>

          {/* Transaction Updates */}
          <AnimatePresence>
            {transactions.length > 0 && (
              <motion.div
                variants={itemVariants}
                initial="hidden"
                animate="visible"
                exit="exit">
                <Card
                  elevation={1}
                  sx={{
                    borderRadius: 2,
                    background: "rgba(255, 255, 255, 0.03)",
                    border: "1px solid rgba(255, 255, 255, 0.1)",
                    mb: 3,
                  }}>
                  <CardContent>
                    <Box
                      sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        mb: 2,
                      }}>
                      <Typography
                        variant="h6"
                        sx={{ display: "flex", alignItems: "center" }}>
                        <LoopIcon sx={{ mr: 1 }} />
                        Transaction Updates
                        <Chip
                          label={transactions.length}
                          size="small"
                          color="primary"
                          sx={{ ml: 1 }}
                        />
                      </Typography>
                    </Box>

                    <List sx={{ maxHeight: 400, overflow: "auto" }}>
                      <AnimatePresence initial={false}>
                        {transactions.map((tx, index) => (
                          <motion.div
                            key={`tx-${index}`}
                            variants={transactionVariants}
                            initial="hidden"
                            animate="visible"
                            exit="exit"
                            layout>
                            <Card
                              elevation={0}
                              sx={{
                                mb: 2,
                                borderRadius: 1,
                                background: "rgba(255, 255, 255, 0.02)",
                                border: `1px solid ${
                                  tx.status === "success"
                                    ? "rgba(46, 125, 50, 0.3)"
                                    : tx.status === "failed" ||
                                      tx.status === "error"
                                    ? "rgba(211, 47, 47, 0.3)"
                                    : "rgba(255, 255, 255, 0.05)"
                                }`,
                                transition: "all 0.3s ease",
                              }}>
                              <CardContent
                                sx={{ p: 2, "&:last-child": { pb: 2 } }}>
                                <Box
                                  display="flex"
                                  justifyContent="space-between"
                                  alignItems="flex-start">
                                  <Box>
                                    <Typography
                                      variant="subtitle2"
                                      sx={{
                                        wordBreak: "break-all",
                                        fontWeight: 600,
                                        display: "flex",
                                        alignItems: "center",
                                        gap: 1,
                                      }}>
                                      {tx.type === "buy" ? (
                                        <ShoppingCartIcon
                                          fontSize="small"
                                          color="primary"
                                        />
                                      ) : (
                                        <SellIcon
                                          fontSize="small"
                                          color="secondary"
                                        />
                                      )}
                                      Wallet: {tx.wallet?.substring(0, 8)}...
                                      {tx.wallet?.substring(
                                        tx.wallet.length - 6
                                      )}
                                    </Typography>

                                    <Typography
                                      variant="body2"
                                      color="text.secondary"
                                      sx={{
                                        wordBreak: "break-word",
                                        mt: 0.5,
                                      }}>
                                      {tx.status === "success"
                                        ? `${
                                            tx.type === "buy"
                                              ? "Bought"
                                              : "Sold"
                                          } tokens successfully. 
                                          ${
                                            tx.txHash
                                              ? `Tx: ${tx.txHash.substring(
                                                  0,
                                                  10
                                                )}...`
                                              : ""
                                          }`
                                        : tx.status === "failed"
                                        ? `Failed to ${
                                            tx.type === "buy" ? "buy" : "sell"
                                          } tokens`
                                        : tx.status === "error"
                                        ? `Error: ${
                                            tx.error || "Unknown error"
                                          }`
                                        : `${tx.status
                                            ?.replace("_", " ")
                                            .toUpperCase()}`}
                                    </Typography>
                                  </Box>

                                  <Box
                                    display="flex"
                                    gap={1}
                                    alignItems="center">
                                    <Chip
                                      size="small"
                                      label={tx.type.toUpperCase()}
                                      color={
                                        tx.type === "buy"
                                          ? "primary"
                                          : "secondary"
                                      }
                                      sx={{ fontSize: "0.7rem" }}
                                    />
                                    <Chip
                                      size="small"
                                      label={tx.status}
                                      color={
                                        tx.status === "success"
                                          ? "success"
                                          : tx.status === "failed" ||
                                            tx.status === "error"
                                          ? "error"
                                          : "warning"
                                      }
                                      sx={{ fontSize: "0.7rem" }}
                                    />
                                  </Box>
                                </Box>
                              </CardContent>
                            </Card>
                          </motion.div>
                        ))}
                      </AnimatePresence>
                    </List>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Footer */}
          <Box
            component={motion.div}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.5 }}
            mt={4}
            textAlign="center"
            sx={{
              pt: 2,
              borderTop: `1px solid ${theme.palette.divider}`,
              opacity: 0.7,
            }}>
            <Typography variant="body2" color="text.secondary">
              © {new Date().getFullYear()}
              {!IS_PRODUCTION && ` - Running in Development Mode`}
            </Typography>
          </Box>
        </Paper>
      </motion.div>
    </Container>
  );
}

export default TradePage;
