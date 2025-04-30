// frontend/src/pages/SellPage.js
import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
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
  Divider,
  Card,
  CardContent,
  CardActions,
} from "@mui/material";
import SellIcon from "@mui/icons-material/Sell";
import { io } from "socket.io-client";

// const SOCKET_SERVER_URL = "http://localhost:5080";
// const SOCKET_SERVER_URL = "https://bknd-node-deploy-d242c366d3a5.herokuapp.com";
const SOCKET_SERVER_URL = "https://abstract-pump-109a297e2430.herokuapp.com";

// Minimal ERC20 ABI to read balance and decimals
const ERC20_ABI = [
  "function balanceOf(address) view returns (uint256)",
  "function decimals() view returns (uint8)",
];

// Create an ethers provider using your RPC URL
const provider = new ethers.JsonRpcProvider("https://api.mainnet.abs.xyz");
// const provider = new ethers.JsonRpcProvider("https://network.ambrosus.io");

function SellPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [walletGroups, setWalletGroups] = useState([]);
  const [activeToken, setActiveToken] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [timeRange, setTimeRange] = useState({
    minDelayMinutes: 2,
    maxDelayMinutes: 30,
  });
  const [transactions, setTransactions] = useState([]);

  useEffect(() => {
    let socket;

    const initialize = async () => {
      if (!user) return;

      try {
        // Initialize Socket.IO client
        socket = io(SOCKET_SERVER_URL);
        socket.emit("join", user.chatId);

        // Listen for sell transaction updates
        socket.on("sellTransactionUpdate", (data) => {
          console.log("Received sell transaction update:", data);
          setTransactions((prev) => [
            { ...data, timestamp: new Date() },
            ...prev,
          ]);
        });

        await fetchWalletGroupsAndToken();
      } catch (err) {
        console.error("Initialization error:", err);
        setError("Failed to initialize. Please try again.");
      }
    };

    initialize();

    return () => {
      if (socket) {
        socket.disconnect();
      }
    };
  }, [user]);

  const fetchWalletGroupsAndToken = async () => {
    try {
      setLoading(true);
      const [groupsResponse, tokenResponse] = await Promise.all([
        getActiveWalletGroup(user.chatId),
        getActiveToken(user.chatId),
      ]);

      if (tokenResponse) {
        setActiveToken(tokenResponse);
        await updateWalletBalances(groupsResponse, tokenResponse);
      } else {
        setError("No active token set. Please set an active token first.");
      }
    } catch (err) {
      console.error("Error fetching data:", err);
      setError("Failed to fetch wallet groups and token information.");
    } finally {
      setLoading(false);
    }
  };

  const updateWalletBalances = async (group, token) => {
    try {
      const tokenContract = new ethers.Contract(
        token.address,
        ERC20_ABI,
        provider
      );

      const walletsWithBalances = await Promise.all(
        group.wallets.map(async (wallet) => {
          const balance = await tokenContract.balanceOf(wallet.address);
          return {
            ...wallet,
            tokenBalance: ethers.formatEther(balance),
          };
        })
      );

      const totalBalance = walletsWithBalances.reduce(
        (sum, wallet) => sum + parseFloat(wallet.tokenBalance),
        0
      );

      const groupWithBalances = {
        ...group,
        wallets: walletsWithBalances,
        totalTokenBalance: totalBalance.toFixed(6),
      };

      setWalletGroups([groupWithBalances]); // Set as array with single group
    } catch (err) {
      console.error("Error updating balances:", err);
      setError("Failed to fetch token balances.");
    }
  };

  const handleTimeRangeChange = (e) => {
    const { name, value } = e.target;
    setTimeRange((prev) => ({
      ...prev,
      [name]: Number(value),
    }));
  };

  const handleSellAll = async (groupId) => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(`${SOCKET_SERVER_URL}/api/sell-all`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          chatId: user.chatId,
          groupId,
          timeRange,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to start sell process");
      }

      // Clear previous transactions for this group
      setTransactions([]);
    } catch (err) {
      console.error("Error selling tokens:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <Container maxWidth="sm" sx={{ mt: 8 }}>
        <Paper elevation={6} sx={{ p: 4, textAlign: "center" }}>
          <Typography variant="h5" gutterBottom>
            Sell All Tokens
          </Typography>
          <Typography variant="body1" gutterBottom>
            Please log in to access the sell page.
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
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Paper elevation={6} sx={{ p: 4 }}>
        <Typography variant="h4" gutterBottom>
          Sell All Tokens
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {activeToken && (
          <Alert severity="info" sx={{ mb: 2 }}>
            Active Token: {activeToken.name} ({activeToken.symbol})
          </Alert>
        )}

        <Box sx={{ mb: 4 }}>
          <Typography variant="h6" gutterBottom>
            Time Range Settings:
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Min Delay (minutes)"
                name="minDelayMinutes"
                type="number"
                value={timeRange.minDelayMinutes}
                onChange={handleTimeRangeChange}
                fullWidth
                disabled={loading}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Max Delay (minutes)"
                name="maxDelayMinutes"
                type="number"
                value={timeRange.maxDelayMinutes}
                onChange={handleTimeRangeChange}
                fullWidth
                disabled={loading}
              />
            </Grid>
          </Grid>
        </Box>

        <Grid container spacing={3}>
          {walletGroups.map((group) => (
            <Grid item xs={12} key={group._id}>
              <Card>
                <CardContent>
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      mb: 2,
                    }}>
                    <Typography variant="h6">{group.name}</Typography>
                    <Typography variant="h6" color="primary">
                      Total Balance: {group.totalTokenBalance}{" "}
                      {activeToken?.symbol}
                    </Typography>
                  </Box>
                  <List>
                    {group.wallets.map((wallet, index) => (
                      <ListItem
                        key={wallet.address}
                        divider={index < group.wallets.length - 1}>
                        <ListItemText
                          primary={`Wallet: ${wallet.address.slice(
                            0,
                            6
                          )}...${wallet.address.slice(-4)}`}
                          secondary={`Balance: ${wallet.tokenBalance} ${activeToken?.symbol}`}
                        />
                      </ListItem>
                    ))}
                  </List>
                </CardContent>
                <CardActions>
                  <Button
                    variant="contained"
                    color="primary"
                    fullWidth
                    onClick={() => handleSellAll(group._id)}
                    disabled={
                      loading || parseFloat(group.totalTokenBalance) === 0
                    }>
                    {loading ? (
                      <CircularProgress size={24} />
                    ) : (
                      "Sell All Tokens"
                    )}
                  </Button>
                </CardActions>
                <Link to="/">
                  <Button
                    variant="contained"
                    color="primary"
                    fullWidth
                    onClick={() => handleSellAll(group._id)}>
                    Go to Home
                  </Button>
                </Link>
              </Card>
            </Grid>
          ))}
        </Grid>

        {transactions.length > 0 && (
          <Box mt={4}>
            <Typography variant="h6" gutterBottom>
              Recent Transactions
            </Typography>
            <List>
              {transactions.map((tx, index) => (
                <ListItem key={index} divider>
                  <ListItemText
                    primary={`Wallet: ${tx.wallet?.slice(
                      0,
                      6
                    )}...${tx.wallet?.slice(-4)}`}
                    secondary={
                      <>
                        <Typography component="span" variant="body2">
                          Status: {tx.status.toUpperCase()}
                        </Typography>
                        {tx.error && (
                          <Typography
                            component="span"
                            variant="body2"
                            color="error">
                            <br />
                            Error: {tx.error}
                          </Typography>
                        )}
                        <br />
                        <Typography
                          component="span"
                          variant="caption"
                          color="textSecondary">
                          {new Date(tx.timestamp).toLocaleString()}
                        </Typography>
                      </>
                    }
                  />
                  <Chip
                    label={tx.status.toUpperCase()}
                    color={tx.status === "success" ? "success" : "error"}
                    sx={{ ml: 2 }}
                  />
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
