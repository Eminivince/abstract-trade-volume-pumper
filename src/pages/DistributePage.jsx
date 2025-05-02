// frontend/src/pages/DistributePage.js

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { distributeETH } from "../api/transactions";
import { useAuth } from "../context/AuthContext";
import { IS_PRODUCTION } from "../config";

// Import MUI Components
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
  List,
  Chip,
  Tooltip,
  useTheme,
  useMediaQuery,
  IconButton,
  InputAdornment,
  Card,
  CardContent,
  Skeleton,
} from "@mui/material";
import MonetizationOnIcon from "@mui/icons-material/MonetizationOn";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import RefreshIcon from "@mui/icons-material/Refresh";
import InfoIcon from "@mui/icons-material/Info";
import AttachMoneyIcon from "@mui/icons-material/AttachMoney";
import SendIcon from "@mui/icons-material/Send";
import CloseIcon from "@mui/icons-material/Close";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ErrorIcon from "@mui/icons-material/Error";
import LoopIcon from "@mui/icons-material/Loop";

import { io } from "socket.io-client";
import { config } from "../config";

import TransactionStateManager from "../components/TransactionStateManager";

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

const transactionVariants = {
  hidden: { opacity: 0, x: -20 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.3 },
  },
};

function DistributePage() {
  const [amount, setAmount] = useState("");
  const [result, setResult] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [transactions, setTransactions] = useState([]);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const navigate = useNavigate();
  const { user, token } = useAuth();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  const handleTransactionResume = (result) => {
    // Handle the resumed transaction result
    setTransactions([]);
    setResult(`Transaction resumed. Result: ${JSON.stringify(result)}`);
  };

  useEffect(() => {
    let socket;

    // Function to initialize Socket.IO and setup event listeners
    const initializeSocket = () => {
      if (user) {
        // Initialize Socket.IO client
        socket = io(config.SOCKET_URL, {
          auth: {
            token: token,
          },
        });

        // Handle connection errors
        socket.on("connect_error", (err) => {
          console.error("Socket connection error:", err.message);
        });

        socket.on("connect", () => {
          if (!IS_PRODUCTION) {
            console.log("[DEV] Socket connected for distribute page");
          }
        });

        // Join the room with chatId
        socket.emit("join", user.chatId);

        // Listen for distribute transaction updates
        socket.on("distributeTransactionUpdate", (data) => {
          if (!IS_PRODUCTION) {
            console.log("[DEV] Distribute transaction update:", data);
          }
          setTransactions((prev) => [...prev, data]);
        });

        // Listen for distribute process completion
        socket.on("distributeProcessCompleted", (data) => {
          if (!IS_PRODUCTION) {
            console.log("[DEV] Distribute process completed:", data);
          }
          setResult(
            `Distribution process completed.\nSuccess: ${data.successCount}, Fail: ${data.failCount}`
          );
          setIsLoading(false);
        });
      }
    };

    initializeSocket();

    // Cleanup on component unmount
    return () => {
      if (socket) {
        socket.disconnect();
      }
    };
  }, [user, token]);

  // Handle amount change
  const handleAmountChange = (e) => {
    setAmount(e.target.value);
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!user) {
      setResult("Please log in to distribute ETH.");
      return;
    }

    if (!amount.trim() || parseFloat(amount) <= 0) {
      setResult("Please enter a valid amount greater than 0.");
      return;
    }

    setIsLoading(true);
    setResult("");
    setTransactions([]);

    try {
      // Initiate the distribute process
      if (!IS_PRODUCTION) {
        console.log(
          "[DEV] Distributing ETH...",
          amount,
          "to user:",
          user.chatId
        );
      }
      await distributeETH(user.chatId, amount.trim(), token);
    } catch (err) {
      console.error("Error distributing ETH:", err);

      if (
        err.code === "ERR_NETWORK" ||
        err.message === "Network Error" ||
        err.name === "AxiosError"
      ) {
        setResult("Network error. Please check your connection and retry.");
      } else {
        setResult(
          err.response?.data?.error ||
            "An error occurred while distributing ETH."
        );
      }
      setIsLoading(false);
    }
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    // Reset the transactions list and result
    setTransactions([]);
    setResult("");
    // Simulate refresh delay
    setTimeout(() => {
      setIsRefreshing(false);
    }, 800);
  };

  const clearForm = () => {
    setAmount("");
    setResult("");
  };

  // If user is not logged in, prompt them to log in
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
              <MonetizationOnIcon color="primary" sx={{ fontSize: 60 }} />
              <Typography variant="h4" component="h1" fontWeight="bold">
                Distribute ETH
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                Please log in to distribute ETH to your wallet groups.
              </Typography>
              <Button
                variant="contained"
                color="primary"
                onClick={() => navigate("/login")}
                startIcon={<MonetizationOnIcon />}
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
    <Container maxWidth="md" sx={{ my: 4 }}>
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
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5 }}
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
              <Tooltip title="Refresh">
                <IconButton
                  color="primary"
                  onClick={handleRefresh}
                  disabled={isLoading || isRefreshing}>
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

          {/* Status messages */}
          <AnimatePresence mode="wait">
            {result && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}>
                <Alert
                  severity={
                    result.startsWith("Distribution process completed") ||
                    result.startsWith("Transaction resumed")
                      ? "success"
                      : "error"
                  }
                  sx={{
                    mb: 3,
                    borderRadius: 2,
                  }}
                  onClose={() => setResult("")}
                  action={
                    <IconButton
                      aria-label="close"
                      color="inherit"
                      size="small"
                      onClick={() => setResult("")}>
                      <CloseIcon fontSize="small" />
                    </IconButton>
                  }>
                  <AlertTitle>
                    {result.startsWith("Distribution process completed") ||
                    result.startsWith("Transaction resumed")
                      ? "Success"
                      : "Error"}
                  </AlertTitle>
                  {result}
                </Alert>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Form section */}
          <Box
            component={motion.section}
            variants={itemVariants}
            sx={{ mb: 4 }}>
            <Box
              sx={{
                borderRadius: 2,
                p: 3,
                mb: 3,
                background: "rgba(255, 255, 255, 0.03)",
                border: "1px solid rgba(255, 255, 255, 0.1)",
              }}>
              <Typography
                variant="h6"
                gutterBottom
                sx={{
                  display: "flex",
                  alignItems: "center",
                  mb: 2,
                }}>
                <MonetizationOnIcon sx={{ mr: 1 }} />
                Distribution Amount
              </Typography>

              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Specify how much ETH should be sent to each wallet in your
                active wallet group. The total amount distributed will depend on
                the number of wallets in your group.
              </Typography>

              <Box component="form" onSubmit={handleSubmit} noValidate>
                <TextField
                  required
                  fullWidth
                  id="amount"
                  label="Amount (ETH per wallet)"
                  name="amount"
                  type="number"
                  placeholder="0.01"
                  inputProps={{
                    step: "0.0001",
                    min: "0",
                  }}
                  variant="outlined"
                  value={amount}
                  onChange={handleAmountChange}
                  disabled={isLoading}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <AttachMoneyIcon color="primary" />
                      </InputAdornment>
                    ),
                    endAdornment: amount && (
                      <InputAdornment position="end">
                        <IconButton
                          onClick={clearForm}
                          edge="end"
                          size="small"
                          disabled={isLoading}>
                          <CloseIcon fontSize="small" />
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                  sx={{
                    mb: 3,
                    "& .MuiOutlinedInput-root": {
                      borderRadius: 2,
                    },
                  }}
                />

                <Box sx={{ display: "flex", gap: 2 }}>
                  <Button
                    type="submit"
                    fullWidth
                    variant="contained"
                    color="primary"
                    disabled={
                      isLoading || !amount.trim() || parseFloat(amount) <= 0
                    }
                    startIcon={isLoading ? null : <SendIcon />}
                    sx={{
                      py: 1.5,
                      borderRadius: 2,
                      position: "relative",
                    }}>
                    {isLoading ? (
                      <>
                        <CircularProgress
                          size={24}
                          color="inherit"
                          sx={{ mr: 1 }}
                        />
                        Distributing...
                      </>
                    ) : (
                      "Distribute ETH"
                    )}
                  </Button>
                </Box>

                <Box sx={{ display: "flex", alignItems: "center", mt: 2 }}>
                  <InfoIcon color="action" fontSize="small" sx={{ mr: 1 }} />
                  <Typography variant="caption" color="text.secondary">
                    The distribution process may take some time depending on
                    network conditions and the number of wallets.
                  </Typography>
                </Box>
              </Box>
            </Box>
          </Box>

          {/* Transaction Update List */}
          <AnimatePresence>
            {(isLoading || transactions.length > 0) && (
              <motion.div
                variants={itemVariants}
                initial="hidden"
                animate="visible"
                exit="exit">
                <Box
                  sx={{
                    borderRadius: 2,
                    p: 3,
                    mb: 3,
                    background: "rgba(255, 255, 255, 0.03)",
                    border: "1px solid rgba(255, 255, 255, 0.1)",
                  }}>
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
                      {transactions.length > 0 && (
                        <Chip
                          label={transactions.length}
                          size="small"
                          color="primary"
                          sx={{ ml: 1 }}
                        />
                      )}
                    </Typography>

                    {isLoading && (
                      <Box sx={{ display: "flex", alignItems: "center" }}>
                        <CircularProgress size={16} sx={{ mr: 1 }} />
                        <Typography variant="body2" color="text.secondary">
                          Processing...
                        </Typography>
                      </Box>
                    )}
                  </Box>

                  {transactions.length === 0 && isLoading ? (
                    <Box>
                      {[1, 2, 3].map((_, index) => (
                        <Card
                          key={index}
                          sx={{
                            mb: 2,
                            borderRadius: 2,
                            background: "rgba(255, 255, 255, 0.02)",
                          }}>
                          <CardContent sx={{ p: 2, "&:last-child": { pb: 2 } }}>
                            <Box
                              display="flex"
                              alignItems="center"
                              justifyContent="space-between">
                              <Box>
                                <Skeleton
                                  variant="text"
                                  width={240}
                                  height={24}
                                />
                                <Skeleton
                                  variant="text"
                                  width={180}
                                  height={20}
                                />
                              </Box>
                              <Skeleton
                                variant="circular"
                                width={24}
                                height={24}
                              />
                            </Box>
                          </CardContent>
                        </Card>
                      ))}
                    </Box>
                  ) : (
                    <List sx={{ maxHeight: 400, overflow: "auto" }}>
                      <AnimatePresence initial={false}>
                        {transactions.map((tx, index) => (
                          <motion.div
                            key={tx.txHash || `tx-${index}`}
                            variants={transactionVariants}
                            initial="hidden"
                            animate="visible"
                            exit="exit"
                            layout>
                            <Card
                              elevation={1}
                              sx={{
                                mb: 2,
                                borderRadius: 2,
                                background:
                                  tx.status === "success"
                                    ? "rgba(46, 125, 50, 0.1)"
                                    : tx.status === "failed" ||
                                      tx.status === "error"
                                    ? "rgba(211, 47, 47, 0.1)"
                                    : "rgba(255, 255, 255, 0.05)",
                                border: `1px solid ${
                                  tx.status === "success"
                                    ? "rgba(46, 125, 50, 0.3)"
                                    : tx.status === "failed" ||
                                      tx.status === "error"
                                    ? "rgba(211, 47, 47, 0.3)"
                                    : "rgba(255, 255, 255, 0.1)"
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
                                      {tx.status === "success" ? (
                                        <CheckCircleIcon
                                          fontSize="small"
                                          color="success"
                                        />
                                      ) : tx.status === "failed" ||
                                        tx.status === "error" ? (
                                        <ErrorIcon
                                          fontSize="small"
                                          color="error"
                                        />
                                      ) : (
                                        <LoopIcon
                                          fontSize="small"
                                          color="warning"
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
                                        ? `Distributed ${tx.amount} ETH successfully`
                                        : tx.status === "failed"
                                        ? `Failed to distribute ETH`
                                        : tx.status === "error"
                                        ? `Error: ${tx.error}`
                                        : `${tx.status
                                            .replace("_", " ")
                                            .toUpperCase()}`}
                                    </Typography>

                                    {tx.txHash && tx.status === "success" && (
                                      <Typography
                                        variant="caption"
                                        color="text.secondary"
                                        sx={{
                                          display: "block",
                                          mt: 0.5,
                                          opacity: 0.7,
                                        }}>
                                        Tx: {tx.txHash.substring(0, 10)}...
                                        {tx.txHash.substring(
                                          tx.txHash.length - 8
                                        )}
                                      </Typography>
                                    )}
                                  </Box>

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
                              </CardContent>
                            </Card>
                          </motion.div>
                        ))}
                      </AnimatePresence>
                    </List>
                  )}
                </Box>
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

export default DistributePage;
