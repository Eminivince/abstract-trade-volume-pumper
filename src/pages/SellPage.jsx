// frontend/src/pages/SellPage.js
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ethers } from "ethers";

import { startSell } from "../api/transactions"; // Ensure this function accepts sellDetails and timeRange
import { useAuth } from "../context/AuthContext";
import { getActiveWalletGroup } from "../api/walletGroups"; // Using wallet groups for sell amounts
import { getActiveToken } from "../api/tokens";
import TransactionStateManager from "../components/TransactionStateManager";

// MUI Components
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
} from "@mui/material";
import SellIcon from "@mui/icons-material/Sell";
import { io } from "socket.io-client";

const SOCKET_SERVER_URL = "http://localhost:5080";
// const SOCKET_SERVER_URL = "https://bknd-node-deploy-d242c366d3a5.herokuapp.com";

// Minimal ERC20 ABI to read balance and decimals
const ERC20_ABI = [
  "function balanceOf(address) view returns (uint256)",
  "function decimals() view returns (uint8)",
];

// Create an ethers provider using your RPC URL
const provider = new ethers.JsonRpcProvider("https://api.mainnet.abs.xyz");

function SellPage() {
  const [walletGroup, setWalletGroup] = useState(null);
  const [sellAmounts, setSellAmounts] = useState({});
  const [walletBalances, setWalletBalances] = useState({});
  const [activeToken, setActiveToken] = useState(null);
  const [timeRange, setTimeRange] = useState({
    minDelayMinutes: 2,
    maxDelayMinutes: 30,
  }); // in minutes
  const [result, setResult] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [transactions, setTransactions] = useState([]);

  const navigate = useNavigate();

  const handleTransactionResume = (result) => {
    // Handle the resumed transaction result
    setTransactions([]);
    setResult(`Transaction resumed. Result: ${JSON.stringify(result)}`);
  };

  const { user, token } = useAuth();

  // Initialize Socket.IO and fetch wallet group on mount
  useEffect(() => {
    let socket;
    const initialize = async () => {
      if (!user) return;
      try {
        // Initialize Socket.IO client with authentication
        socket = io(SOCKET_SERVER_URL, { auth: { token } });

        socket.on("connect_error", (err) => {
          console.error("Socket connection error:", err.message);
        });

        // Join the room with the user's chatId
        socket.emit("join", user.chatId);

        // Listen for sell transaction updates
        socket.on("sellTransactionUpdate", (data) => {
          setTransactions((prev) => [...prev, data]);
        });

        // Listen for sell process completion
        socket.on("sellProcessCompleted", (data) => {
          setResult(
            `Sell process completed.\nSuccess: ${data.successCount}, Fail: ${data.failCount}`
          );
          setIsLoading(false);
        });

        // Fetch wallet group and active token
        await fetchWalletGroup();
        await fetchActiveToken();
      } catch (err) {
        console.error("Initialization error:", err);
        setResult("Initialization error occurred.");
      }
    };

    initialize();
    return () => {
      if (socket) socket.disconnect();
    };
  }, [user, token]);

  // After walletGroup and activeToken are loaded, fetch balances for each wallet.
  useEffect(() => {
    if (walletGroup && activeToken) {
      fetchWalletBalances();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [walletGroup, activeToken]);

  // Fetch the active wallet group and initialize sellAmounts
  const fetchWalletGroup = async () => {
    if (!user?.chatId) return;
    try {
      const group = await getActiveWalletGroup(user.chatId);
      setWalletGroup(group);

      // Initialize sellAmounts with empty strings for each wallet
      const initialAmounts = {};
      group.wallets.forEach((wallet) => {
        initialAmounts[wallet.address] = "";
      });
      setSellAmounts(initialAmounts);
    } catch (err) {
      console.error("Error fetching wallet group:", err);
      setResult("Error fetching wallet group.");
    }
  };

  // Fetch the active token details
  const fetchActiveToken = async () => {
    try {
      const tokenData = await getActiveToken(user.chatId);
      setActiveToken(tokenData);
    } catch (err) {
      console.error("Error fetching active token:", err);
      setResult("Error fetching active token.");
    }
  };

  // For each wallet, fetch its token balance from the blockchain
  const fetchWalletBalances = async () => {
    const balances = {};
    try {
      const tokenContract = new ethers.Contract(
        activeToken.address,
        ERC20_ABI,
        provider
      );
      // Use activeToken.decimals if available, or fetch from the contract
      const decimals =
        activeToken.decimals || Number(await tokenContract.decimals());
      // Loop through each wallet in the group and fetch its balance
      for (const wallet of walletGroup.wallets) {
        const balBN = await tokenContract.balanceOf(wallet.address);
        const bal = ethers.formatUnits(balBN, decimals);
        balances[wallet.address] = bal;
      }
      setWalletBalances(balances);
    } catch (err) {
      console.error("Error fetching wallet balances:", err);
    }
  };

  // Handle sell amount change for a specific wallet
  const handleAmountChange = (address, value) => {
    setSellAmounts((prev) => ({
      ...prev,
      [address]: value,
    }));
  };

  // Handle setting the input to the maximum balance for a wallet
  const handleMax = (address) => {
    if (walletBalances[address]) {
      setSellAmounts((prev) => ({
        ...prev,
        [address]: walletBalances[address],
      }));
    }
  };

  // Handle setting the input to 50% of the wallet balance
  const handleHalf = (address) => {
    if (walletBalances[address]) {
      const half = (parseFloat(walletBalances[address]) / 2).toString();
      setSellAmounts((prev) => ({
        ...prev,
        [address]: half,
      }));
    }
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

    // Validate sell amounts: each must be a positive number
    // const amounts = Object.values(sellAmounts);
    // if (amounts.some((amt) => !amt.trim() || isNaN(amt))) {
    //   setResult("Please enter valid sell amounts for all wallets.");
    //   return;
    // }

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
      // Prepare payload: an array of { walletAddress, amount }
      const sellDetails = walletGroup.wallets.map((wallet) => ({
        walletAddress: wallet.address,
        amount: sellAmounts[wallet.address],
      }));

      // Initiate the sell process using authenticated user data.
      await startSell(
        user.chatId,
        sellDetails,
        {
          minDelayMinutes,
          maxDelayMinutes,
        },
        token
      );

      // No need to set result here; updates will arrive via Socket.IO
    } catch (err) {
      if (
        err.code != "ERR_NETWORK" ||
        err.message != "Network Error" ||
        err.name != "AxiosError"
      ) {
        console.error("Error starting sell:", err);
        setResult(
          err.response?.data?.error ||
            "An error occurred while starting the sell process."
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
            Sell Tokens
          </Typography>
          <Typography variant="body1" gutterBottom>
            Please log in to execute sell operations.
          </Typography>
          <Button
            variant="contained"
            color="primary"
            onClick={() => navigate("/login")}
            startIcon={<SellIcon />}>
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
          Start Sell Process
        </Typography>

        {result && (
          <Alert
            severity={
              result.startsWith("Sell process completed") ? "success" : "info"
            }
            sx={{ mb: 2, whiteSpace: "pre-wrap" }}>
            {result}
          </Alert>
        )}

        {walletGroup ? (
          <Box component="form" onSubmit={handleSubmit} noValidate>
            <Typography variant="h6" gutterBottom>
              Sell Amounts per Wallet:
            </Typography>
            <Grid container spacing={2}>
              {walletGroup.wallets.map((wallet) => (
                <Grid item xs={12} sm={6} key={wallet.address}>
                  <TextField
                    label={`${wallet.address.toString().slice(0, 6)}... (${
                      walletBalances[wallet.address]
                        ? Number(walletBalances[wallet.address]).toFixed(5)
                        : "loading..."
                    } ${activeToken?.symbol || ""})`}
                    type="number"
                    inputProps={{ step: "0.0001", min: "0" }}
                    value={sellAmounts[wallet.address]}
                    onChange={(e) =>
                      handleAmountChange(wallet.address, e.target.value)
                    }
                    placeholder={
                      sellAmounts[wallet.address] ? "" : "Enter amount"
                    }
                    fullWidth
                    disabled={isLoading}
                    InputLabelProps={{
                      shrink: !!sellAmounts[wallet.address], // This ensures the label does not overlap with the input text
                    }}
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="end">
                          <Button
                            size="small"
                            onClick={() => handleMax(wallet.address)}>
                            Max
                          </Button>
                          <Button
                            size="small"
                            onClick={() => handleHalf(wallet.address)}>
                            50%
                          </Button>
                        </InputAdornment>
                      ),
                    }}
                  />
                </Grid>
              ))}
            </Grid>

            <Typography variant="h6" gutterBottom sx={{ mt: 4 }}>
              Transaction Time Range (between sells):
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
                {isLoading ? "Starting Sell Process..." : "Start Sell"}
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
                        ? `✅ Success: Sold tokens. Tx Hash: ${tx.txHash.slice(
                            0,
                            10
                          )}...`
                        : tx.status === "failed"
                        ? `❌ Failed to sell tokens.`
                        : tx.status === "error"
                        ? `❗ Error: Transaction reverted.`
                        : `⚠️ ${tx.status.replace("_", " ").toUpperCase()}`
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
                </ListItem>
              ))}
            </List>
          </Box>
        )}
      </Paper>
    </Container>
  );
}

export default SellPage;
