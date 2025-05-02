// frontend/src/pages/SellPage.jsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ethers } from "ethers";
import { motion, AnimatePresence } from "framer-motion";

import { useAuth } from "../context/AuthContext";
import { getActiveWalletGroup } from "../api/walletGroups";
import { getActiveToken } from "../api/tokens";
import TransactionStateManager from "../components/TransactionStateManager";
import { config, IS_PRODUCTION } from "../config";

// MUI Components
import {
  Container,
  Paper,
  Typography,
  TextField,
  Button,
  CircularProgress,
  Alert,
  AlertTitle,
  Box,
  Grid,
  List,
  ListItem,
  ListItemText,
  Chip,
  Divider,
  Card,
  CardContent,
  CardActions,
  IconButton,
  Tooltip,
  useTheme,
  useMediaQuery,
  Skeleton,
} from "@mui/material";

// Icons
import SellIcon from "@mui/icons-material/Sell";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import RefreshIcon from "@mui/icons-material/Refresh";
import InfoIcon from "@mui/icons-material/Info";
import CloseIcon from "@mui/icons-material/Close";
import TimerIcon from "@mui/icons-material/Timer";
import AccountBalanceWalletIcon from "@mui/icons-material/AccountBalanceWallet";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import MonetizationOnIcon from "@mui/icons-material/MonetizationOn";
import { io } from "socket.io-client";

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

// const SOCKET_SERVER_URL = "http://localhost:5080";
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
  const { user, token } = useAuth();
  const navigate = useNavigate();
  const [walletGroups, setWalletGroups] = useState([]);
  const [activeToken, setActiveToken] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState("");
  const [timeRange, setTimeRange] = useState({
    minDelayMinutes: 2,
    maxDelayMinutes: 30,
  });
  const [transactions, setTransactions] = useState([]);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  useEffect(() => {
    let socket;

    const fetchWalletGroupsAndToken = async () => {
      try {
        setLoading(true);
        setError("");

        if (!IS_PRODUCTION) {
          console.log(
            "[DEV] Fetching wallet groups and token for user:",
            user.chatId
          );
        }

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

    const initialize = async () => {
      if (!user) return;

      try {
        // Initialize Socket.IO client
        socket = io(config.SOCKET_URL || SOCKET_SERVER_URL, {
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
            console.log("[DEV] Socket connected for sell page");
          }
        });

        socket.emit("join", user.chatId);

        // Listen for sell transaction updates
        socket.on("sellTransactionUpdate", (data) => {
          if (!IS_PRODUCTION) {
            console.log("[DEV] Sell transaction update:", data);
          }

          setTransactions((prev) => [
            { ...data, timestamp: new Date() },
            ...prev,
          ]);

          if (data.status === "success") {
            setResult("Token sell completed successfully!");
          } else if (data.status === "failed" || data.status === "error") {
            setError(`Sell failed: ${data.error || "Unknown error"}`);
          }
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
  }, [user, token]);

  const updateWalletBalances = async (group, token) => {
    if (!group || !token) {
      setError("Missing wallet group or token information");
      return;
    }

    try {
      const tokenContract = new ethers.Contract(
        token.address,
        ERC20_ABI,
        provider
      );

      const walletsWithBalances = await Promise.all(
        group.wallets.map(async (wallet) => {
          try {
            const balance = await tokenContract.balanceOf(wallet.address);
            const formattedBalance = ethers.formatEther(balance);
            return {
              ...wallet,
              tokenBalance: formattedBalance,
              hasTokens: parseFloat(formattedBalance) > 0,
            };
          } catch (err) {
            console.error(`Error fetching balance for ${wallet.address}:`, err);
            return {
              ...wallet,
              tokenBalance: "0",
              hasTokens: false,
              error: true,
            };
          }
        })
      );

      const totalBalance = walletsWithBalances.reduce(
        (sum, wallet) => sum + parseFloat(wallet.tokenBalance || 0),
        0
      );

      const groupWithBalances = {
        ...group,
        wallets: walletsWithBalances,
        totalTokenBalance: totalBalance.toFixed(6),
        hasTokens: totalBalance > 0,
      };

      setWalletGroups([groupWithBalances]); // Set as array with single group
    } catch (err) {
      console.error("Error updating balances:", err);
      setError("Failed to fetch token balances.");
    }
  };

  const handleTimeRangeChange = (e) => {
    const { name, value } = e.target;
    const numValue = Number(value);

    setTimeRange((prev) => {
      const updated = { ...prev, [name]: numValue };

      // Auto-correct values to ensure min ≤ max

      return updated;
    });
  };

  const handleSellAll = async (groupId) => {
    try {
      setLoading(true);
      setError("");
      setResult("");
      setTransactions([]);

      if (!IS_PRODUCTION) {
        console.log("[DEV] Starting sell all process for group:", groupId);
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
        setLoading(false);
        return;
      }

      const response = await fetch(
        `${config.SOCKET_URL || SOCKET_SERVER_URL}/api/sell-all`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            chatId: user.chatId,
            groupId,
            timeRange,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to start sell process");
      }

      setResult(
        "Sell process initiated successfully! You'll see updates as transactions are processed."
      );
    } catch (err) {
      console.error("Error selling tokens:", err);
      setError(err.message || "Failed to start sell process");
    } finally {
      setLoading(false);
    }
  };

  // Handle refreshing wallet groups and token
  const handleRefresh = () => {
    setIsRefreshing(true);

    // Define a self-contained function that mimics fetchWalletGroupsAndToken
    const refreshData = async () => {
      try {
        setLoading(true);
        setError("");

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
        setIsRefreshing(false);
      }
    };

    refreshData();
  };

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
              <SellIcon color="primary" sx={{ fontSize: 60 }} />
              <Typography variant="h4" component="h1" fontWeight="bold">
                Sell All Tokens
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                Please log in to access the sell tokens feature.
              </Typography>
              <Button
                variant="contained"
                color="primary"
                onClick={() => navigate("/login")}
                startIcon={<AccountBalanceWalletIcon />}
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
            <TransactionStateManager chatId={user.chatId} />
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
            <Box display="flex" alignItems="center">
              <SellIcon color="primary" sx={{ fontSize: 40, mr: 2 }} />
              <Box>
                <Typography variant="h4" component="h1" fontWeight="bold">
                  Sell All Tokens
                </Typography>
                <Typography
                  variant="subtitle1"
                  color="primary.light"
                  sx={{ mt: 0.5 }}>
                  Sell all tokens from your active wallet group
                </Typography>
              </Box>
            </Box>

            <Box
              sx={{
                display: "flex",
                gap: 1,
                alignSelf: isMobile ? "flex-end" : "center",
              }}>
              <Tooltip title="Refresh wallet data">
                <IconButton
                  color="primary"
                  onClick={handleRefresh}
                  disabled={loading || isRefreshing}>
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
                disabled={loading}
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
                  severity={error ? "error" : "success"}
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
                        setError("");
                        setResult("");
                      }}>
                      <CloseIcon fontSize="small" />
                    </IconButton>
                  }>
                  <AlertTitle>{error ? "Error" : "Success"}</AlertTitle>
                  {error || result}
                </Alert>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Active token info */}
          <AnimatePresence mode="wait">
            {activeToken && (
              <motion.div
                variants={itemVariants}
                initial="hidden"
                animate="visible"
                exit="exit">
                <Card
                  elevation={1}
                  sx={{
                    mb: 3,
                    borderRadius: 2,
                    background: "rgba(30, 136, 229, 0.1)",
                    border: "1px solid rgba(30, 136, 229, 0.2)",
                  }}>
                  <CardContent sx={{ py: 2 }}>
                    <Box display="flex" alignItems="center">
                      <MonetizationOnIcon
                        sx={{ mr: 1, color: "primary.main" }}
                      />
                      <Typography variant="subtitle1" fontWeight="medium">
                        Active Token: <strong>{activeToken.name}</strong> (
                        {activeToken.symbol})
                        <Typography
                          component="span"
                          variant="caption"
                          sx={{ ml: 1 }}>
                          {activeToken.address.substring(0, 8)}...
                          {activeToken.address.substring(
                            activeToken.address.length - 6
                          )}
                        </Typography>
                      </Typography>
                    </Box>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Time Range Settings Card */}
          <Card
            component={motion.div}
            variants={cardVariants}
            elevation={1}
            sx={{
              mb: 3,
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
                <TimerIcon sx={{ mr: 1 }} />
                Time Range Settings
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
                    fullWidth
                    disabled={loading}
                    sx={{ mb: isMobile ? 2 : 0 }}
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
                    fullWidth
                    disabled={loading}
                  />
                </Grid>
              </Grid>

              <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                <InfoIcon
                  fontSize="small"
                  sx={{ verticalAlign: "middle", mr: 0.5 }}
                />
                Set time delays between transactions to avoid detection
              </Typography>
            </CardContent>
          </Card>

          {/* Wallet Groups */}
          <AnimatePresence>
            {loading && walletGroups.length === 0 ? (
              <Box sx={{ mb: 3 }}>
                <Skeleton
                  variant="rectangular"
                  height={100}
                  sx={{ borderRadius: 2, mb: 2 }}
                />
                <Skeleton
                  variant="rectangular"
                  height={150}
                  sx={{ borderRadius: 2 }}
                />
              </Box>
            ) : (
              <Grid container spacing={3}>
                {walletGroups.map((group) => (
                  <Grid item xs={12} key={group._id}>
                    <Card
                      component={motion.div}
                      variants={cardVariants}
                      elevation={1}
                      sx={{
                        borderRadius: 2,
                        background: "rgba(255, 255, 255, 0.03)",
                        border: "1px solid rgba(255, 255, 255, 0.1)",
                        position: "relative",
                      }}>
                      <CardContent>
                        <Box
                          sx={{
                            display: "flex",
                            flexDirection: isMobile ? "column" : "row",
                            justifyContent: "space-between",
                            alignItems: isMobile ? "flex-start" : "center",
                            mb: 2,
                            gap: 1,
                          }}>
                          <Typography
                            variant="h6"
                            fontWeight="bold"
                            sx={{ display: "flex", alignItems: "center" }}>
                            <AccountBalanceWalletIcon sx={{ mr: 1 }} />
                            {group.name}
                          </Typography>
                          <Chip
                            label={`Total: ${group.totalTokenBalance} ${activeToken?.symbol}`}
                            color={
                              parseFloat(group.totalTokenBalance) > 0
                                ? "primary"
                                : "default"
                            }
                            sx={{
                              fontWeight: "bold",
                              background:
                                parseFloat(group.totalTokenBalance) > 0
                                  ? "linear-gradient(45deg, #3f51b5, #2196f3)"
                                  : undefined,
                            }}
                          />
                        </Box>

                        <Divider sx={{ mb: 2 }} />

                        <List
                          sx={{
                            maxHeight: "300px",
                            overflow: "auto",
                            background: "rgba(0, 0, 0, 0.2)",
                            borderRadius: 1,
                          }}>
                          {group.wallets.map((wallet, index) => (
                            <ListItem
                              key={wallet.address}
                              divider={index < group.wallets.length - 1}
                              sx={{
                                p: 1.5,
                                borderBottom:
                                  index < group.wallets.length - 1
                                    ? "1px solid rgba(255, 255, 255, 0.05)"
                                    : "none",
                              }}>
                              <Box
                                sx={{
                                  display: "flex",
                                  flexDirection: isMobile ? "column" : "row",
                                  justifyContent: "space-between",
                                  alignItems: isMobile
                                    ? "flex-start"
                                    : "center",
                                  width: "100%",
                                  gap: 1,
                                }}>
                                <ListItemText
                                  primary={
                                    <Typography
                                      variant="body2"
                                      sx={{ wordBreak: "break-all" }}>
                                      {wallet.address.slice(0, 8)}...
                                      {wallet.address.slice(-8)}
                                    </Typography>
                                  }
                                  sx={{ my: 0 }}
                                />
                                <Chip
                                  label={`${wallet.tokenBalance} ${activeToken?.symbol}`}
                                  size="small"
                                  color={
                                    parseFloat(wallet.tokenBalance) > 0
                                      ? "primary"
                                      : "default"
                                  }
                                  sx={{
                                    minWidth: "120px",
                                    textAlign: "center",
                                  }}
                                />
                              </Box>
                            </ListItem>
                          ))}
                        </List>
                      </CardContent>
                      <CardActions sx={{ p: 2, pt: 0 }}>
                        <Button
                          variant="contained"
                          color="primary"
                          fullWidth
                          onClick={() => handleSellAll(group._id)}
                          disabled={
                            loading || parseFloat(group.totalTokenBalance) === 0
                          }
                          startIcon={
                            loading ? (
                              <CircularProgress size={20} />
                            ) : (
                              <SellIcon />
                            )
                          }
                          sx={{
                            py: 1.5,
                            borderRadius: 2,
                            background:
                              parseFloat(group.totalTokenBalance) > 0
                                ? "linear-gradient(45deg, #f44336, #ff9800)"
                                : undefined,
                          }}>
                          {loading ? "Processing..." : "Sell All Tokens"}
                        </Button>
                      </CardActions>
                    </Card>
                  </Grid>
                ))}

                {walletGroups.length === 0 && !loading && (
                  <Grid item xs={12}>
                    <Card
                      component={motion.div}
                      variants={cardVariants}
                      elevation={1}
                      sx={{
                        borderRadius: 2,
                        background: "rgba(255, 255, 255, 0.03)",
                        border: "1px solid rgba(255, 255, 255, 0.1)",
                        textAlign: "center",
                        p: 3,
                      }}>
                      <InfoIcon
                        sx={{ fontSize: 48, color: "text.secondary", mb: 2 }}
                      />
                      <Typography variant="h6" gutterBottom>
                        No Active Wallet Group
                      </Typography>
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{ mb: 2 }}>
                        You need to set an active wallet group first
                      </Typography>
                      <Button
                        variant="contained"
                        color="primary"
                        onClick={() => navigate("/wallet-groups")}
                        sx={{ borderRadius: 2 }}>
                        Manage Wallet Groups
                      </Button>
                    </Card>
                  </Grid>
                )}
              </Grid>
            )}
          </AnimatePresence>

          {/* Transaction Updates */}
          <AnimatePresence>
            {transactions.length > 0 && (
              <motion.div
                variants={itemVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                style={{ marginTop: "24px" }}>
                <Card
                  elevation={1}
                  sx={{
                    borderRadius: 2,
                    background: "rgba(255, 255, 255, 0.03)",
                    border: "1px solid rgba(255, 255, 255, 0.1)",
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
                        <SellIcon sx={{ mr: 1 }} />
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
                                      <SellIcon
                                        fontSize="small"
                                        color={
                                          tx.status === "success"
                                            ? "success"
                                            : "primary"
                                        }
                                      />
                                      {tx.wallet ? (
                                        <>
                                          Wallet: {tx.wallet.substring(0, 8)}...
                                          {tx.wallet.substring(
                                            tx.wallet.length - 6
                                          )}
                                        </>
                                      ) : (
                                        "Wallet address unavailable"
                                      )}
                                    </Typography>

                                    <Typography
                                      variant="body2"
                                      color="text.secondary"
                                      sx={{ wordBreak: "break-word", mt: 0.5 }}>
                                      {tx.status === "success"
                                        ? `Sold tokens successfully. ${
                                            tx.txHash
                                              ? `Tx: ${tx.txHash.substring(
                                                  0,
                                                  10
                                                )}...`
                                              : ""
                                          }`
                                        : tx.status === "failed"
                                        ? "Failed to sell tokens"
                                        : tx.status === "error"
                                        ? `Error: ${
                                            tx.error || "Unknown error"
                                          }`
                                        : `${tx.status
                                            ?.replace("_", " ")
                                            .toUpperCase()}`}
                                    </Typography>

                                    {tx.timestamp && (
                                      <Typography
                                        variant="caption"
                                        color="text.disabled">
                                        {new Date(
                                          tx.timestamp
                                        ).toLocaleString()}
                                      </Typography>
                                    )}
                                  </Box>

                                  <Chip
                                    size="small"
                                    label={tx.status.toUpperCase()}
                                    color={
                                      tx.status === "success"
                                        ? "success"
                                        : tx.status === "failed" ||
                                          tx.status === "error"
                                        ? "error"
                                        : "warning"
                                    }
                                    icon={
                                      tx.status === "success" ? (
                                        <CheckCircleIcon />
                                      ) : tx.status === "failed" ||
                                        tx.status === "error" ? (
                                        <ErrorOutlineIcon />
                                      ) : (
                                        <AccessTimeIcon />
                                      )
                                    }
                                    sx={{ fontSize: "0.7rem" }}
                                  />
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

export default SellPage;
