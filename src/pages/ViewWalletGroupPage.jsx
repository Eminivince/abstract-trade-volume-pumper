// frontend/src/pages/ViewWalletGroupPage.js
import { useEffect, useState, useCallback, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ethers } from "ethers";
import { motion, AnimatePresence } from "framer-motion";

import { viewWalletGroup, viewWalletGroupById } from "../api/walletGroups";
import { getActiveToken } from "../api/tokens";
import { useAuth } from "../context/AuthContext";
import { IS_PRODUCTION, config } from "../config";

// Import MUI Components
import {
  Container,
  Paper,
  Typography,
  Button,
  Alert,
  List,
  Box,
  IconButton,
  Tooltip,
  Snackbar,
  Chip,
  Skeleton,
  AlertTitle,
  ListItemIcon,
} from "@mui/material";
import GroupIcon from "@mui/icons-material/Group";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import AccountBalanceWalletIcon from "@mui/icons-material/AccountBalanceWallet";
import TokenIcon from "@mui/icons-material/Token";
import ErrorIcon from "@mui/icons-material/Error";
import RefreshIcon from "@mui/icons-material/Refresh";
import tokenABI from "../assets/TokenABI";
import ExportPrivateKeys from "../components/ExportPrivateKeys";

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { duration: 0.5 },
  },
};

const listItemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.3 },
  },
};

const staggerVariants = {
  visible: {
    transition: {
      staggerChildren: 0.1,
    },
  },
};

function ViewWalletGroupPage() {
  const { user } = useAuth();
  const { groupId } = useParams();
  const navigate = useNavigate();

  const [groupData, setGroupData] = useState(null);
  const [walletBalances, setWalletBalances] = useState([]);
  const [isLoadingGroup, setIsLoadingGroup] = useState(true);
  const [activeToken, setActiveToken] = useState(null);
  const [errors, setErrors] = useState([]);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "info",
  });
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [balancesLoaded, setBalancesLoaded] = useState(false);
  const balancesLoadingRef = useRef(false);

  // Initialize wallet balances with loading state objects
  const initializeWalletBalances = useCallback((wallets) => {
    if (!wallets) return [];
    return wallets.map((wallet) => ({
      address: wallet.address,
      loading: true,
      tokenBalance: null,
      ethBalance: null,
      error: null,
    }));
  }, []);

  // Use provider based on environment
  const provider = new ethers.JsonRpcProvider(
    IS_PRODUCTION
      ? "https://api.mainnet.abs.xyz"
      : "https://api.mainnet.abs.xyz" // You can use a testnet URL here if needed for development
  );

  // Add debug info in non-production modes
  useEffect(() => {
    if (!IS_PRODUCTION) {
      console.log(`[DEV] Using API: ${config.API_URL}`);
      console.log(`[DEV] Using Socket: ${config.SOCKET_URL}`);
    }
  }, []);

  // Function to add an error to the errors array
  const addError = (message, source = "general") => {
    console.error(
      `[${IS_PRODUCTION ? "PROD" : "DEV"}] Error (${source}):`,
      message
    );
    setErrors((prev) => [...prev, { id: Date.now(), message, source }]);
  };

  // Function to remove an error from the errors array
  const removeError = (errorId) => {
    setErrors((prev) => prev.filter((error) => error.id !== errorId));
  };

  // Fetch wallet group data
  useEffect(() => {
    if (!user) {
      navigate("/login");
      return;
    }

    const fetchData = async () => {
      setIsLoadingGroup(true);
      setErrors([]);

      try {
        let data;
        if (groupId) {
          data = await viewWalletGroupById(user.chatId, groupId);
        } else {
          data = await viewWalletGroup(user.chatId);
        }

        setGroupData(data);
        setWalletBalances(initializeWalletBalances(data.wallets));
      } catch (err) {
        console.error("Error viewing wallet group:", err);
        addError(err.response?.data?.error || err.message);
      } finally {
        setIsLoadingGroup(false);
      }
    };

    fetchData();
  }, [user, groupId, navigate, initializeWalletBalances, refreshTrigger]);

  // Fetch wallet balances individually
  useEffect(() => {
    if (
      !groupData?.wallets ||
      !user ||
      balancesLoaded ||
      balancesLoadingRef.current
    )
      return;

    const fetchBalances = async () => {
      // Set loading ref to prevent concurrent fetches
      balancesLoadingRef.current = true;

      try {
        // Get active token info
        const tokenData = await getActiveToken(user.chatId);
        setActiveToken(tokenData);

        // Log environment info for debugging
        if (!IS_PRODUCTION) {
          console.log(
            `[DEV] Fetching balances for ${groupData.wallets.length} wallets`
          );
          console.log(
            `[DEV] Using token: ${tokenData.symbol} (${tokenData.address})`
          );
        }

        // Create token contract instance
        const tokenContract = new ethers.Contract(
          tokenData.address,
          tokenABI,
          provider
        );

        let completedWallets = 0;
        const totalWallets = groupData.wallets.length;

        // Process each wallet individually
        groupData.wallets.forEach(async (wallet, index) => {
          if (!IS_PRODUCTION) {
            console.log(
              `[DEV] Fetching balance for wallet ${
                index + 1
              }/${totalWallets}: ${wallet.address}`
            );
          }

          try {
            // Get token balance
            const tokenBalance = await tokenContract.balanceOf(wallet.address);
            const formattedTokenBalance = ethers.formatUnits(
              tokenBalance,
              tokenData.decimals
            );

            // Get ETH balance
            const ethBalance = await provider.getBalance(wallet.address);
            const formattedEthBalance = ethers.formatEther(ethBalance);

            // Update this specific wallet's balances
            setWalletBalances((prevBalances) => {
              const newBalances = [...prevBalances];
              newBalances[index] = {
                ...newBalances[index],
                loading: false,
                tokenBalance: formattedTokenBalance,
                ethBalance: formattedEthBalance,
                error: null,
              };
              return newBalances;
            });

            // Track completion
            completedWallets++;
            if (completedWallets === totalWallets) {
              setBalancesLoaded(true);
              balancesLoadingRef.current = false;
            }
          } catch (err) {
            console.error(
              `Error fetching balances for wallet ${wallet.address}:`,
              err
            );

            // Update this specific wallet with error
            setWalletBalances((prevBalances) => {
              const newBalances = [...prevBalances];
              newBalances[index] = {
                ...newBalances[index],
                loading: false,
                error: `Failed to load balances: ${err.message}`,
              };
              return newBalances;
            });

            // Track completion even for errors
            completedWallets++;
            if (completedWallets === totalWallets) {
              setBalancesLoaded(true);
              balancesLoadingRef.current = false;
            }
          }
        });
      } catch (err) {
        console.error("Error fetching active token:", err);
        addError(`Failed to fetch token information: ${err.message}`, "token");
        balancesLoadingRef.current = false;
      }
    };

    fetchBalances();
  }, [groupData, user, provider, balancesLoaded]);

  const handleCopy = (text, label) => {
    navigator.clipboard
      .writeText(text)
      .then(() => {
        setSnackbar({
          open: true,
          message: `${label} copied to clipboard!`,
          severity: "success",
        });
      })
      .catch((err) => {
        console.error("Could not copy text: ", err);
        setSnackbar({
          open: true,
          message: `Failed to copy ${label}.`,
          severity: "error",
        });
      });
  };

  const handleCloseSnackbar = () => {
    setSnackbar((prev) => ({ ...prev, open: false }));
  };

  const handleRefresh = () => {
    setBalancesLoaded(false);
    setRefreshTrigger((prev) => prev + 1);
    setSnackbar({
      open: true,
      message: `Refreshing wallet data... [${IS_PRODUCTION ? "PROD" : "DEV"}]`,
      severity: "info",
    });

    if (!IS_PRODUCTION) {
      console.log("[DEV] Manual refresh triggered");
    }
  };

  if (!user) return null;

  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 8 }}>
      <motion.div
        initial="hidden"
        animate="visible"
        variants={containerVariants}>
        <Paper
          elevation={3}
          sx={{
            p: 4,
            borderRadius: 2,
            background: "linear-gradient(to bottom right, #1e1e3f, #121212)",
            position: "relative",
            overflow: "hidden",
          }}>
          {/* Header */}
          <Box
            display="flex"
            alignItems="center"
            justifyContent="space-between"
            mb={3}
            component={motion.div}
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5 }}>
            <Box display="flex" alignItems="center">
              <GroupIcon color="primary" sx={{ fontSize: 40, mr: 2 }} />
              <Typography
                variant="h4"
                component="h1"
                sx={{ fontWeight: "bold" }}>
                {isLoadingGroup ? (
                  <Skeleton width={150} />
                ) : (
                  groupData?.name || "Wallet Group"
                )}
              </Typography>
              {/* {!IS_PRODUCTION && (
                <Chip
                  label="DEV MODE"
                  color="warning"
                  size="small"
                  sx={{ ml: 2 }}
                />
              )} */}
            </Box>

            <Box>
              <Tooltip title="Refresh Data">
                <IconButton
                  color="primary"
                  onClick={handleRefresh}
                  sx={{ mr: 1 }}>
                  <RefreshIcon />
                </IconButton>
              </Tooltip>
              <Button
                variant="outlined"
                color="secondary"
                onClick={() => navigate("/")}
                startIcon={<ArrowBackIcon />}>
                Back
              </Button>
            </Box>
          </Box>

          {/* Error alerts */}
          <AnimatePresence>
            {errors.length > 0 && (
              <Box mb={3}>
                {errors.map((error) => (
                  <motion.div
                    key={error.id}
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3 }}
                    style={{ marginBottom: 8 }}>
                    <Alert
                      severity="error"
                      onClose={() => removeError(error.id)}
                      sx={{ mb: 1 }}>
                      <AlertTitle>Error</AlertTitle>
                      {error.message}
                    </Alert>
                  </motion.div>
                ))}
              </Box>
            )}
          </AnimatePresence>

          {/* Token info */}
          {activeToken && (
            <Box
              mb={3}
              p={2}
              sx={{
                bgcolor: "rgba(255,255,255,0.05)",
                borderRadius: 2,
                border: "1px solid rgba(255,255,255,0.1)",
              }}
              component={motion.div}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3, duration: 0.5 }}>
              <Typography variant="h6" gutterBottom>
                <TokenIcon sx={{ mr: 1, verticalAlign: "middle" }} />
                Active Token
              </Typography>
              <Box display="flex" flexWrap="wrap" gap={2}>
                <Chip
                  label={`Name: ${activeToken.name}`}
                  color="primary"
                  variant="outlined"
                />
                <Chip
                  label={`Symbol: ${activeToken.symbol}`}
                  color="primary"
                  variant="outlined"
                />
                <Chip
                  label={`Address: ${activeToken.address.slice(
                    0,
                    6
                  )}...${activeToken.address.slice(-4)}`}
                  color="primary"
                  variant="outlined"
                  onClick={() =>
                    handleCopy(activeToken.address, "Token Address")
                  }
                  icon={<ContentCopyIcon fontSize="small" />}
                />
              </Box>
            </Box>
          )}

          {/* Wallets list */}
          <Typography
            variant="h5"
            component="h2"
            gutterBottom
            sx={{
              mt: 4,
              mb: 2,
              borderBottom: "1px solid rgba(255,255,255,0.1)",
              pb: 1,
            }}>
            <AccountBalanceWalletIcon sx={{ mr: 1, verticalAlign: "middle" }} />
            Wallets {walletBalances.length > 0 && `(${walletBalances.length})`}
          </Typography>

          {isLoadingGroup ? (
            // Loading skeletons
            <Box
              component={motion.div}
              variants={staggerVariants}
              initial="hidden"
              animate="visible">
              {[1, 2, 3].map((_, index) => (
                <motion.div key={index} variants={listItemVariants}>
                  <Paper
                    sx={{ p: 2, mb: 2, bgcolor: "rgba(255,255,255,0.03)" }}>
                    <Box display="flex" alignItems="center" mb={1}>
                      <Skeleton
                        variant="circular"
                        width={24}
                        height={24}
                        sx={{ mr: 2 }}
                      />
                      <Skeleton variant="text" width="80%" height={24} />
                    </Box>
                    <Box pl={5}>
                      <Skeleton variant="text" width="40%" height={20} />
                      <Skeleton variant="text" width="40%" height={20} />
                    </Box>
                  </Paper>
                </motion.div>
              ))}
            </Box>
          ) : (
            <List
              sx={{ p: 0 }}
              component={motion.ul}
              variants={staggerVariants}
              initial="hidden"
              animate="visible">
              <AnimatePresence>
                {walletBalances.map((wallet, index) => (
                  <motion.div
                    key={wallet.address}
                    variants={listItemVariants}
                    initial="hidden"
                    animate="visible"
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ delay: index * 0.05 }}>
                    <Paper
                      elevation={1}
                      sx={{
                        mb: 2,
                        p: 2,
                        borderRadius: 2,
                        bgcolor: wallet.error
                          ? "rgba(255,87,34,0.05)"
                          : "rgba(255,255,255,0.03)",
                        border: wallet.error
                          ? "1px solid rgba(255,87,34,0.2)"
                          : "1px solid rgba(255,255,255,0.05)",
                        transition: "all 0.3s ease",
                        "&:hover": {
                          bgcolor: "rgba(255,255,255,0.07)",
                          transform: "translateY(-2px)",
                          boxShadow: 3,
                        },
                      }}>
                      <Box
                        display="flex"
                        alignItems="center"
                        width="100%"
                        mb={1}>
                        <ListItemIcon sx={{ minWidth: 40 }}>
                          {wallet.error ? (
                            <ErrorIcon color="error" />
                          ) : (
                            <AccountBalanceWalletIcon color="primary" />
                          )}
                        </ListItemIcon>

                        <Typography
                          variant="subtitle1"
                          sx={{
                            fontFamily: "monospace",
                            fontWeight: "medium",
                            wordBreak: "break-all",
                          }}>
                          {wallet.address}
                        </Typography>

                        <Tooltip title="Copy Address">
                          <IconButton
                            size="small"
                            onClick={() =>
                              handleCopy(wallet.address, "Address")
                            }
                            sx={{ ml: 1 }}>
                            <ContentCopyIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Box>

                      {wallet.error ? (
                        <Alert severity="error" sx={{ mt: 1 }}>
                          {wallet.error}
                        </Alert>
                      ) : (
                        <Box
                          sx={{
                            pl: 5,
                            display: "flex",
                            flexWrap: "wrap",
                            gap: 2,
                          }}>
                          <Chip
                            icon={<TokenIcon fontSize="small" />}
                            label={
                              wallet.loading ? (
                                <Skeleton width={100} />
                              ) : (
                                `${activeToken?.symbol || "Token"}: ${Number(
                                  wallet.tokenBalance
                                ).toFixed(6)}`
                              )
                            }
                            size="small"
                            color="primary"
                            variant="outlined"
                          />

                          <Chip
                            icon={<AccountBalanceWalletIcon fontSize="small" />}
                            label={
                              wallet.loading ? (
                                <Skeleton width={100} />
                              ) : (
                                `ETH: ${Number(wallet.ethBalance).toFixed(6)}`
                              )
                            }
                            size="small"
                            color="secondary"
                            variant="outlined"
                          />

                          {wallet.loading && (
                            <Chip
                              icon={<RefreshIcon fontSize="small" />}
                              label="Loading balances..."
                              size="small"
                              color="default"
                            />
                          )}
                        </Box>
                      )}
                    </Paper>
                  </motion.div>
                ))}
              </AnimatePresence>
            </List>
          )}

          {/* Export Private Keys */}
          {groupData && groupData.wallets && (
            <Box
              mt={4}
              display="flex"
              justifyContent="center"
              component={motion.div}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.3 }}>
              <ExportPrivateKeys
                wallets={groupData.wallets}
                groupName={groupData.name}
              />
            </Box>
          )}
        </Paper>
      </motion.div>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}>
        <Alert severity={snackbar.severity} onClose={handleCloseSnackbar}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
}

export default ViewWalletGroupPage;
