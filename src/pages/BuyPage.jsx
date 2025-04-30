// frontend/src/pages/BuyPage.js

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { startBuy } from "../api/transactions";
import { useAuth } from "../context/AuthContext"; // Import AuthContext
import { getActiveWalletGroup } from "../api/walletGroups"; // Import API to fetch active wallet group
import TransactionStateManager from "../components/TransactionStateManager";

// Import MUI Components
import {
  Container,
  Paper,
  Typography,
  TextField,
  Button,
  CircularProgress,
  Alert,
  Box,
  Grid,
  List,
  ListItem,
  ListItemText,
  Chip,
  InputAdornment,
  FormControlLabel,
  Checkbox,
} from "@mui/material";

import { io } from "socket.io-client";

// const SOCKET_SERVER_URL = "http://localhost:5080";
// const SOCKET_SERVER_URL = "https://bknd-node-deploy-d242c366d3a5.herokuapp.com";
const SOCKET_SERVER_URL = "https://abstract-pump-109a297e2430.herokuapp.com";

function BuyPage() {
  const [walletGroup, setWalletGroup] = useState(null);
  const [buyAmounts, setBuyAmounts] = useState({});
  const [useFullBalance, setUseFullBalance] = useState(false);
  const [amountRange, setAmountRange] = useState({
    minPercentage: 1,
    maxPercentage: 10,
  }); // min/max percentage range for random distribution
  const [timeRange, setTimeRange] = useState({
    minDelayMinutes: 2,
    maxDelayMinutes: 30,
  }); // in minutes
  const [result, setResult] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [transactions, setTransactions] = useState([]);

  const navigate = useNavigate();
  const { user, token } = useAuth(); // Get the logged-in user and token from context

  const handleTransactionResume = (result) => {
    // Handle the resumed transaction result
    setTransactions([]);
    setResult(`Transaction resumed. Result: ${JSON.stringify(result)}`);
  };

  useEffect(() => {
    let socket;

    // Function to initialize Socket.IO and fetch wallet group
    const initialize = async () => {
      if (!user) return;

      try {
        // Initialize Socket.IO client
        socket = io(SOCKET_SERVER_URL, {
          auth: {
            token: token, // If your backend requires authentication
          },
        });

        // Listen for connection errors
        socket.on("connect_error", (err) => {
          console.error("Socket connection error:", err.message);
        });

        socket.on("connect", () => {
          console.log("connected socket");
          console.log("Socket connected.");
        });
        // Join the room with chatId
        socket.emit("join", user.chatId);

        // Listen for buy transaction updates
        socket.on("buyTransactionUpdate", (data) => {
          console.log("Received buy transaction update:");
          if (data.error) {
            let errorMessage = `Error: ${data.error}`;
            if (data.error.includes("Insufficient funds")) {
              errorMessage += ` (Balance: ${data.amount || "0.00"} ETH`;
            } else if (data.errorDetails?.requiredAmount) {
              errorMessage += ` (Required Amount: ${data.errorDetails.requiredAmount} ETH)`;
            }
            setResult(errorMessage);
            setIsLoading(false);
          }
          setTransactions((prev) => [...prev, data]);
        });

        // Listen for buy process completion
        socket.on("buyProcessCompleted", (data) => {
          console.log("Received buy process completion:");
          setResult(
            `Buy process completed.\nSuccess: ${data.successCount}, Fail: ${data.failCount}`
          );
          setIsLoading(false);
        });

        // Fetch the active wallet group
        await fetchWalletGroup();
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, token]);

  // Fetch the active wallet group
  const fetchWalletGroup = async () => {
    if (!user?.chatId) return;
    try {
      const group = await getActiveWalletGroup(user.chatId);
      setWalletGroup(group);

      // Initialize buyAmounts with empty strings for each wallet
      const initialAmounts = {};
      group.wallets.forEach((wallet) => {
        initialAmounts[wallet.address] = "";
      });
      setBuyAmounts(initialAmounts);
    } catch (err) {
      console.error("Error fetching wallet group:", err);
      setResult("Error fetching wallet group.");
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

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!walletGroup) {
      setResult("No active wallet group found.");
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

    setIsLoading(true);
    setResult("");
    setTransactions([]); // Reset previous transactions

    try {
      // Prepare payload with percentage range
      const buyDetails = {
        wallets: walletGroup.wallets.map((wallet) => wallet.address),
        percentageRange: {
          minPercentage: useFullBalance ? 99.9 : amountRange.minPercentage,
          maxPercentage: useFullBalance ? 100 : amountRange.maxPercentage,
        },
      };

      // Initiate the buy process using authenticated user data
      await startBuy(
        user.chatId,
        buyDetails,
        {
          minDelayMinutes: minDelayMinutes,
          maxDelayMinutes: maxDelayMinutes,
        },
        token
      );

      // No need to set result here; it will be updated via WebSocket
    } catch (err) {
      if (
        err.code != "ERR_NETWORK" ||
        err.message != "Network Error" ||
        err.name != "AxiosError"
      ) {
        console.error("Error starting buy:", err);
        setResult(
          err.response?.data?.error ||
            "An error occurred while starting the buy process."
        );
        setIsLoading(false);
      }
    }
  };

  // If user is not logged in, prompt to log in
  if (!user) {
    return (
      <Container maxWidth="sm" sx={{ mt: 8 }}>
        <Paper elevation={6} sx={{ p: 4, textAlign: "center" }}>
          <Typography variant="h5" gutterBottom>
            Start Buying
          </Typography>
          <Typography variant="body1" gutterBottom>
            Please log in to start buying tokens.
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
        />
      )}
      <Paper elevation={6} sx={{ p: 4 }}>
        <Typography variant="h4" gutterBottom>
          Start Buying
        </Typography>

        {result && (
          <Alert
            severity={
              result.startsWith("Buy process completed") ? "success" : "info"
            }
            sx={{ mb: 2, whiteSpace: "pre-wrap" }}>
            {result}
          </Alert>
        )}

        {walletGroup ? (
          <Box component="form" onSubmit={handleSubmit} noValidate>
            <Typography variant="h6" gutterBottom>
              Buy Percentage Range (Random percentage of wallet balance):
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={useFullBalance}
                      onChange={(e) => setUseFullBalance(e.target.checked)}
                      disabled={isLoading}
                    />
                  }
                  label="Use full wallet balance (saves 95-98% for gas)"
                />
              </Grid>
              {!useFullBalance && (
                <>
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
                      disabled={isLoading}
                      helperText="Minimum percentage of balance to buy"
                      InputProps={{
                        endAdornment: (
                          <InputAdornment position="end">%</InputAdornment>
                        ),
                      }}
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
                      disabled={isLoading}
                      helperText="Maximum percentage of balance to buy"
                      InputProps={{
                        endAdornment: (
                          <InputAdornment position="end">%</InputAdornment>
                        ),
                      }}
                    />
                  </Grid>
                </>
              )}
            </Grid>

            <Typography
              variant="body2"
              color="textSecondary"
              sx={{ mt: 1, mb: 3 }}>
              Each wallet will use a random percentage between min and max of
              its balance for buying.
            </Typography>

            <Typography variant="h6" gutterBottom sx={{ mt: 4 }}>
              Transaction Time Range (between buys):
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
                  disabled={isLoading}
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
                  disabled={isLoading}
                />
              </Grid>
            </Grid>

            <Box sx={{ mt: 4 }}>
              <Button
                type="submit"
                variant="contained"
                color="primary"
                fullWidth
                disabled={isLoading}
                startIcon={isLoading && <CircularProgress size={20} />}>
                {isLoading ? "Starting Buy Process..." : "Start Buy"}
              </Button>
            </Box>
          </Box>
        ) : (
          <Box
            display="flex"
            justifyContent="center"
            alignItems="center"
            minHeight="200px">
            <CircularProgress />
          </Box>
        )}

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
                    primary={`- Wallet: ${tx.wallet.slice(
                      0,
                      7
                    )}...${tx.wallet.slice(35)}`}
                    secondary={
                      tx.status === "success"
                        ? `✅ Success: Bought tokens. Tx Hash: ${tx.txHash?.slice(
                            0,
                            10
                          )}...`
                        : tx.status === "failed" || tx.status === "error"
                        ? `❌ Failed: ${tx.error || "Failed to buy tokens"}${
                            tx.error?.includes("Insufficient funds")
                              ? ` (Balance: ${
                                  tx.errorDetails.availableBalance || "0"
                                } ETH, Required: ${
                                  tx.errorDetails.requiredAmount || "unknown"
                                } ETH)`
                              : tx.requiredAmount
                              ? ` (Required Amount: ${tx.requiredAmount})`
                              : ""
                          }`
                        : `⚠️ ${tx.status.replace("_", " ").toUpperCase()}: ${
                            tx.message || ""
                          }`
                    }
                  />
                  {tx.status === "success" && (
                    <Chip label="Success" color="success" />
                  )}
                  {tx.status === "failed" && (
                    <Chip label="Failed" color="error" />
                  )}
                  {tx.status === "error" && (
                    <Chip label="Error" color="error" />
                  )}
                  {/* Add more chips if needed for other statuses */}
                </ListItem>
              ))}
            </List>
          </Box>
        )}
      </Paper>
    </Container>
  );
}

export default BuyPage;
