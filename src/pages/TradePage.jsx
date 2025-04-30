// frontend/src/pages/TradePage.jsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
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
  CircularProgress,
  List,
  ListItem,
  ListItemText,
  Chip,
  Divider,
} from "@mui/material";

// Icons
import SwapHorizIcon from "@mui/icons-material/SwapHoriz";
import StopIcon from "@mui/icons-material/Stop";

// API and Context
import { getWalletGroups } from "../api/walletGroups";
import { startBuy, startSell } from "../api/transactions";
import { useAuth } from "../context/AuthContext";
import TransactionStateManager from "../components/TransactionStateManager";

// Constants
const SOCKET_SERVER_URL = "http://localhost:5080";

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

  const navigate = useNavigate();
  const { user, token } = useAuth();

  // Handle transaction resume
  const handleTransactionResume = (result) => {
    setTransactions([]);
    setResult(`Transaction resumed. Result: ${JSON.stringify(result)}`);
  };

  // Add this handler
  const handleTradingStatusChange = (status) => {
    setIsTrading(status);
  };

  useEffect(() => {
    let socket;

    // Function to initialize Socket.IO and fetch wallet groups
    const initialize = async () => {
      if (!user) return;

      try {
        // Initialize Socket.IO client
        socket = io(SOCKET_SERVER_URL, {
          auth: {
            token: token,
          },
        });

        // Listen for connection errors
        socket.on("connect_error", (err) => {
          console.error("Socket connection error:", err.message);
        });

        socket.on("connect", () => {
          console.log("Socket connected.");
        });

        // Join the room with chatId
        socket.emit("join", user.chatId);

        // Listen for buy transaction updates
        socket.on("buyTransactionUpdate", (data) => {
          console.log("Received buy transaction update:", data);
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
          console.log("Received sell transaction update:", data);
          setTransactions((prev) => [...prev, { ...data, type: "sell" }]);
        });

        // Listen for trade cycle updates
        socket.on("tradeCycleUpdate", (data) => {
          console.log("Received trade cycle update:", data);
          setResult(`Trade Cycle Update: ${data.message}`);
        });

        // Listen for trade process stopped
        socket.on("tradeProcessStopped", (data) => {
          console.log("Trade process stopped:", data);
          setResult(`Trading stopped. ${data.message}`);
          setIsTrading(false);
          setIsLoading(false);
        });

        // Fetch wallet groups
        await fetchWalletGroups();
      } catch (err) {
        console.error("Initialization error:", err);
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
      const groups = await getWalletGroups(user.chatId);
      setWalletGroups(groups);
    } catch (err) {
      console.error("Error fetching wallet groups:", err);
      setResult("Error fetching wallet groups.");
    }
  };

  // Handle amount range change
  const handleAmountRangeChange = (e) => {
    const { name, value } = e.target;
    setAmountRange((prev) => ({
      ...prev,
      [name]: Number(value),
    }));
  };

  // Handle time range change
  const handleTimeRangeChange = (e) => {
    const { name, value } = e.target;
    setTimeRange((prev) => ({
      ...prev,
      [name]: Number(value),
    }));
  };

  // Handle cooldown period change
  const handleCooldownChange = (e) => {
    setCooldownPeriod(Number(e.target.value));
  };

  // Handle form submission to start trading
  const handleStartTrading = async (e) => {
    e.preventDefault();

    if (!alphaWalletGroup || !betaWalletGroup) {
      setResult("Please select both Alpha and Beta wallet groups.");
      return;
    }

    if (alphaWalletGroup === betaWalletGroup) {
      setResult("Alpha and Beta wallet groups must be different.");
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
      setResult(
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
      setResult("Please enter a valid time range (min ≤ max, both > 0).");
      return;
    }

    // Validate cooldown period
    if (isNaN(cooldownPeriod) || cooldownPeriod <= 0) {
      setResult("Please enter a valid cooldown period (> 0).");
      return;
    }

    setIsLoading(true);
    setResult("");
    setTransactions([]); // Reset previous transactions

    try {
      // Start the continuous trading process
      const response = await fetch(`${SOCKET_SERVER_URL}/api/start-trading`, {
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
      } else {
        setResult(`Error: ${data.error || "Failed to start trading"}`);
        setIsLoading(false);
      }
    } catch (err) {
      console.error("Error starting trading:", err);
      setResult("An error occurred while starting the trading process.");
      setIsLoading(false);
    }
  };

  // Handle stopping the trading process
  const handleStopTrading = async () => {
    try {
      const response = await fetch(`${SOCKET_SERVER_URL}/api/stop-trading`, {
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
      } else {
        setResult(`Error: ${data.error || "Failed to stop trading"}`);
      }
    } catch (err) {
      console.error("Error stopping trading:", err);
      setResult("An error occurred while stopping the trading process.");
    } finally {
      setIsLoading(false);
    }
  };

  // If user is not logged in, prompt to log in
  if (!user) {
    return (
      <Container maxWidth="sm" sx={{ mt: 8 }}>
        <Paper elevation={6} sx={{ p: 4, textAlign: "center" }}>
          <Typography variant="h5" gutterBottom>
            Automated Trading
          </Typography>
          <Typography variant="body1" gutterBottom>
            Please log in to start automated trading.
          </Typography>
          <Button
            variant="contained"
            color="primary"
            onClick={() => navigate("/login")}>
            Go to Login
          </Button>
        </Paper>
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
      {user?.chatId && (
        <TransactionStateManager
          chatId={user.chatId}
          onResume={handleTransactionResume}
          onTradingStatusChange={handleTradingStatusChange}
        />
      )}
      <Paper elevation={6} sx={{ p: 4 }}>
        <Typography variant="h4" gutterBottom>
          Automated Trading
        </Typography>

        {result && (
          <Alert
            severity={
              result.includes("started")
                ? "success"
                : result.includes("Error")
                ? "error"
                : "info"
            }
            sx={{ mb: 2, whiteSpace: "pre-wrap" }}>
            {result}
          </Alert>
        )}

        <Box component="form" onSubmit={handleStartTrading} noValidate>
          <Typography variant="h6" gutterBottom>
            Select Wallet Groups:
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth required disabled={isLoading || isTrading}>
                <InputLabel>Alpha Wallet Group</InputLabel>
                <Select
                  value={alphaWalletGroup}
                  onChange={(e) => setAlphaWalletGroup(e.target.value)}
                  label="Alpha Wallet Group">
                  {walletGroups.map((group) => (
                    <MenuItem key={`alpha-${group._id}`} value={group._id}>
                      {group.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth required disabled={isLoading || isTrading}>
                <InputLabel>Beta Wallet Group</InputLabel>
                <Select
                  value={betaWalletGroup}
                  onChange={(e) => setBetaWalletGroup(e.target.value)}
                  label="Beta Wallet Group">
                  {walletGroups.map((group) => (
                    <MenuItem key={`beta-${group._id}`} value={group._id}>
                      {group.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          </Grid>

          <Typography variant="h6" gutterBottom sx={{ mt: 4 }}>
            Buy/Sell Percentage Range (Random percentage of wallet balance):
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
                helperText="Minimum percentage of balance to use"
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
                helperText="Maximum percentage of balance to use"
              />
            </Grid>
          </Grid>

          <Typography variant="h6" gutterBottom sx={{ mt: 4 }}>
            Transaction Time Range (between transactions):
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Min (minutes)"
                name="minDelayMinutes"
                type="number"
                inputProps={{ min: "1" }}
                value={timeRange.minDelayMinutes}
                onChange={handleTimeRangeChange}
                required
                fullWidth
                disabled={isLoading || isTrading}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Max (minutes)"
                name="maxDelayMinutes"
                type="number"
                inputProps={{ min: "1" }}
                value={timeRange.maxDelayMinutes}
                onChange={handleTimeRangeChange}
                required
                fullWidth
                disabled={isLoading || isTrading}
              />
            </Grid>
          </Grid>

          <Typography variant="h6" gutterBottom sx={{ mt: 4 }}>
            Cooldown Period (between cycles):
          </Typography>
          <Grid container spacing={2}>
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
                helperText="Time to wait between trading cycles"
              />
            </Grid>
          </Grid>

          <Box sx={{ mt: 4 }}>
            {!isTrading ? (
              <Button
                type="submit"
                variant="contained"
                color="primary"
                fullWidth
                disabled={isLoading}
                startIcon={
                  isLoading ? <CircularProgress size={20} /> : <SwapHorizIcon />
                }>
                {isLoading ? "Starting Trading..." : "Start Trading"}
              </Button>
            ) : (
              <Button
                variant="contained"
                color="error"
                fullWidth
                onClick={handleStopTrading}
                startIcon={<StopIcon />}>
                Stop Trading
              </Button>
            )}
          </Box>
        </Box>

        <Button
          variant="outlined"
          color="secondary"
          fullWidth
          onClick={() => navigate("/")}
          sx={{ mt: 4 }}>
          Back to Home
        </Button>

        {transactions.length > 0 && (
          <Box mt={4}>
            <Typography variant="h6" gutterBottom>
              Transaction Updates
            </Typography>
            <List>
              {transactions.map((tx, index) => (
                <ListItem key={index} divider>
                  <ListItemText
                    primary={`${
                      tx.type === "buy" ? "Buy" : "Sell"
                    } - Wallet: ${tx.wallet?.slice(0, 7)}...${tx.wallet?.slice(
                      35
                    )}`}
                    secondary={
                      tx.status === "success"
                        ? `✅ Success: ${
                            tx.type === "buy" ? "Bought" : "Sold"
                          } tokens. Tx Hash: ${tx.txHash?.slice(0, 10)}...`
                        : tx.status === "failed" || tx.status === "error"
                        ? `❌ Failed: ${
                            tx.error ||
                            `Failed to ${
                              tx.type === "buy" ? "buy" : "sell"
                            } tokens`
                          }`
                        : `⚠️ ${tx.status?.replace("_", " ").toUpperCase()}: ${
                            tx.message || ""
                          }`
                    }
                  />
                  {tx.type === "buy" ? (
                    <Chip label="Buy" color="primary" sx={{ mr: 1 }} />
                  ) : (
                    <Chip label="Sell" color="secondary" sx={{ mr: 1 }} />
                  )}
                  {tx.status === "success" && (
                    <Chip label="Success" color="success" />
                  )}
                  {tx.status === "failed" && (
                    <Chip label="Failed" color="error" />
                  )}
                  {tx.status === "error" && (
                    <Chip label="Error" color="error" />
                  )}
                </ListItem>
              ))}
            </List>
          </Box>
        )}
      </Paper>
    </Container>
  );
}

export default TradePage;
