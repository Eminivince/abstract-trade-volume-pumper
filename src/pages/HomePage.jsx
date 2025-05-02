// frontend/src/pages/HomePage.js
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Container,
  Typography,
  Grid,
  Paper,
  CircularProgress,
  Alert,
  Box,
  Button,
  Chip,
  Card,
  CardContent,
  Divider,
  Skeleton,
  IconButton,
  Tooltip,
  useTheme,
  AlertTitle,
  useMediaQuery,
} from "@mui/material";
import { getActiveWalletGroup } from "../api/walletGroups";
import { getActiveToken } from "../api/tokens";
import MainMenu from "../components/MainMenu";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import AccountBalanceWalletIcon from "@mui/icons-material/AccountBalanceWallet";
import TokenIcon from "@mui/icons-material/Token";
import DashboardIcon from "@mui/icons-material/Dashboard";
import RefreshIcon from "@mui/icons-material/Refresh";
import ViewListIcon from "@mui/icons-material/ViewList";
import PowerSettingsNewIcon from "@mui/icons-material/PowerSettingsNew";
import ShoppingCartIcon from "@mui/icons-material/ShoppingCart";
import SellIcon from "@mui/icons-material/Sell";
import LocalFireDepartmentIcon from "@mui/icons-material/LocalFireDepartment";
import { IS_PRODUCTION } from "../config";

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { duration: 0.5 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4 },
  },
};

const staggerChildrenVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

function HomePage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const theme = useTheme();

  const [activeGroup, setActiveGroup] = useState(null);
  const [activeToken, setActiveToken] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = async () => {
    try {
      setRefreshing(true);

      // Fetch active wallet group
      const group = await getActiveWalletGroup(user.chatId);
      setActiveGroup(group);

      // Fetch active token
      const token = await getActiveToken(user.chatId);
      setActiveToken(token);

      // Clear any previous errors
      setError(null);
    } catch (err) {
      console.error("Error fetching active group/token:", err);
      setError(`Could not fetch active group/token: ${err.message}`);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    // If user not logged in, navigate to /login
    if (!user) {
      navigate("/login");
      return;
    }

    fetchData();
  }, [user, navigate]);

  const handleRefresh = () => {
    if (!refreshing) {
      fetchData();
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/login");
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  const gradientBackground =
    "linear-gradient(to bottom right, #1e1e3f, #121212)";

  // Check if we're on mobile to add extra padding at the bottom
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  return (
    <Box
      sx={{
        pb: isMobile ? "80px" : 0, // Fixed padding to account for bottom navigation
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
      }}>
      <Container
        maxWidth="md"
        sx={{
          mt: 4,
          mb: 4,
          flexGrow: 1,
        }}>
        <motion.div
          initial="hidden"
          animate="visible"
          variants={containerVariants}>
          {/* Header */}
          <Box
            component={motion.div}
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5 }}
            sx={{ mb: 4 }}>
            <Box
              display="flex"
              alignItems="center"
              justifyContent="space-between"
              sx={{
                mb: 2,
                pb: 2,
                borderBottom: `1px solid ${theme.palette.divider}`,
              }}>
              <Box display="flex" alignItems="center">
                <DashboardIcon
                  sx={{
                    fontSize: 40,
                    mr: 2,
                    color: theme.palette.primary.main,
                  }}
                />
                <Typography
                  variant="h5"
                  component="h1"
                  fontWeight="600"
                  sx={{
                    display: { xs: "none", sm: "block" }, // Hide on extra small screens
                    background:
                      "linear-gradient(45deg, #90caf9 30%, #f48fb1 90%)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                  }}>
                  Crypto Dashboard
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
                    disabled={refreshing}
                    sx={{ mr: 1 }}>
                    <RefreshIcon />
                  </IconButton>
                </Tooltip>
                <Button
                  variant="outlined"
                  color="error"
                  onClick={handleLogout}
                  startIcon={<PowerSettingsNewIcon />}
                  size="small">
                  Logout
                </Button>
              </Box>
            </Box>

            <MainMenu />
          </Box>

          {/* Main Content */}
          <AnimatePresence mode="wait">
            {loading ? (
              <Box
                component={motion.div}
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                display="flex"
                flexDirection="column"
                alignItems="center"
                justifyContent="center"
                minHeight="300px">
                <CircularProgress size={60} thickness={4} />
                <Typography variant="h6" sx={{ mt: 2 }}>
                  Loading your dashboard...
                </Typography>
              </Box>
            ) : error ? (
              <motion.div
                key="error"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}>
                <Alert
                  severity="error"
                  sx={{
                    mb: 4,
                    borderRadius: 2,
                    "& .MuiAlert-message": { width: "100%" },
                  }}>
                  <AlertTitle>Setup Required</AlertTitle>
                  <Box component="div" sx={{ mt: 2 }}>
                    <Typography variant="body1" paragraph>
                      📌 Could not fetch Active Wallet Group/Token.
                    </Typography>
                    <Typography variant="body1" paragraph>
                      Please complete the following steps to set up your
                      account:
                    </Typography>
                    <Box
                      sx={{
                        pl: 2,
                        borderLeft: "3px solid",
                        borderColor: "error.light",
                        ml: 1,
                      }}>
                      <Typography variant="body1" paragraph>
                        1. First create a wallet group by clicking "Manage
                        Wallet Groups".
                      </Typography>
                      <Typography variant="body1" paragraph>
                        2. Add a token to trade by clicking "Manage Tokens".
                      </Typography>
                      <Typography variant="body1" paragraph>
                        3. Click on "View Wallet Group" to see list of currently
                        active wallets.
                      </Typography>
                      <Typography variant="body1" paragraph>
                        4. Make deposit into the first wallet in a wallet group.
                        Use "Distribute ETH" to disperse ETH to the remaining
                        wallets.
                      </Typography>
                    </Box>
                  </Box>
                </Alert>
              </motion.div>
            ) : (
              // Main Dashboard Content
              <motion.div
                key="content"
                variants={staggerChildrenVariants}
                initial="hidden"
                animate="visible">
                {/* Status Cards */}
                <Grid container spacing={3}>
                  {/* Active Wallet Group Card */}
                  <Grid item xs={12} md={6}>
                    <motion.div variants={itemVariants}>
                      <Card
                        elevation={3}
                        sx={{
                          height: "100%",
                          background: gradientBackground,
                          borderRadius: 2,
                          overflow: "hidden",
                          position: "relative",
                          transition: "transform 0.3s, box-shadow 0.3s",
                          "&:hover": {
                            transform: "translateY(-5px)",
                            boxShadow: theme.shadows[10],
                          },
                        }}>
                        <CardContent sx={{ p: 3 }}>
                          <Box display="flex" alignItems="center" mb={2}>
                            <AccountBalanceWalletIcon
                              color="primary"
                              sx={{ mr: 1, fontSize: 30 }}
                            />
                            <Typography variant="h5" fontWeight="medium">
                              Active Wallet Group
                            </Typography>
                          </Box>

                          <Divider sx={{ my: 2, opacity: 0.1 }} />

                          <Box
                            sx={{
                              minHeight: 80,
                              display: "flex",
                              flexDirection: "column",
                              justifyContent: "center",
                            }}>
                            {refreshing ? (
                              <Skeleton
                                variant="text"
                                width="70%"
                                height={30}
                              />
                            ) : activeGroup ? (
                              <Box>
                                <Typography
                                  variant="h6"
                                  color="primary"
                                  gutterBottom>
                                  {activeGroup.name}
                                </Typography>
                                <Chip
                                  icon={<ViewListIcon />}
                                  label={`${
                                    activeGroup.wallets?.length || 0
                                  } wallets`}
                                  color="primary"
                                  variant="outlined"
                                  size="small"
                                  sx={{ mt: 1 }}
                                />
                              </Box>
                            ) : (
                              <Typography
                                variant="body1"
                                color="text.secondary"
                                sx={{ fontStyle: "italic" }}>
                                No wallet group selected.
                              </Typography>
                            )}
                          </Box>

                          <Box display="flex" mt={3} gap={1}>
                            <Button
                              variant="contained"
                              color="primary"
                              fullWidth
                              onClick={() => navigate("/wallet-groups")}
                              startIcon={<AccountBalanceWalletIcon />}
                              sx={{ borderRadius: 2 }}>
                              Manage Groups
                            </Button>

                            {activeGroup && (
                              <Button
                                variant="outlined"
                                color="primary"
                                fullWidth
                                onClick={() => navigate("/wallet-group/view")}
                                startIcon={<ViewListIcon />}
                                sx={{ borderRadius: 2 }}>
                                View Details
                              </Button>
                            )}
                          </Box>
                        </CardContent>
                      </Card>
                    </motion.div>
                  </Grid>

                  {/* Active Token Card */}
                  <Grid item xs={12} md={6}>
                    <motion.div variants={itemVariants}>
                      <Card
                        elevation={3}
                        sx={{
                          height: "100%",
                          background: gradientBackground,
                          borderRadius: 2,
                          overflow: "hidden",
                          transition: "transform 0.3s, box-shadow 0.3s",
                          "&:hover": {
                            transform: "translateY(-5px)",
                            boxShadow: theme.shadows[10],
                          },
                        }}>
                        <CardContent sx={{ p: 3 }}>
                          <Box display="flex" alignItems="center" mb={2}>
                            <TokenIcon
                              color="secondary"
                              sx={{ mr: 1, fontSize: 30 }}
                            />
                            <Typography variant="h5" fontWeight="medium">
                              Active Token
                            </Typography>
                          </Box>

                          <Divider sx={{ my: 2, opacity: 0.1 }} />

                          <Box
                            sx={{
                              minHeight: 80,
                              display: "flex",
                              flexDirection: "column",
                              justifyContent: "center",
                            }}>
                            {refreshing ? (
                              <Skeleton
                                variant="text"
                                width="70%"
                                height={30}
                              />
                            ) : activeToken ? (
                              <Box>
                                <Typography
                                  variant="h6"
                                  color="secondary"
                                  gutterBottom>
                                  {activeToken.symbol}
                                </Typography>
                                <Typography
                                  variant="body1"
                                  color="text.secondary">
                                  {activeToken.name}
                                </Typography>
                                <Box mt={1}>
                                  <Chip
                                    size="small"
                                    variant="outlined"
                                    color="secondary"
                                    label={`${activeToken.address.slice(
                                      0,
                                      6
                                    )}...${activeToken.address.slice(-4)}`}
                                  />
                                </Box>
                              </Box>
                            ) : (
                              <Typography
                                variant="body1"
                                color="text.secondary"
                                sx={{ fontStyle: "italic" }}>
                                No token selected.
                              </Typography>
                            )}
                          </Box>

                          <Box display="flex" mt={3}>
                            <Button
                              variant="contained"
                              color="secondary"
                              fullWidth
                              onClick={() => navigate("/tokens")}
                              startIcon={<TokenIcon />}
                              sx={{ borderRadius: 2 }}>
                              Manage Tokens
                            </Button>
                          </Box>
                        </CardContent>
                      </Card>
                    </motion.div>
                  </Grid>
                </Grid>

                {/* Quick Actions */}
                <motion.div variants={itemVariants}>
                  <Box mt={5} mb={3}>
                    <Typography variant="h5" fontWeight="medium" gutterBottom>
                      Quick Actions
                    </Typography>
                    <Divider sx={{ mb: 3 }} />

                    <Grid container spacing={3}>
                      {/* Auto Trade Button */}
                      <Grid item xs={12} sm={4}>
                        <motion.div
                          whileHover={{ scale: 1.03 }}
                          whileTap={{ scale: 0.98 }}>
                          <Paper
                            elevation={2}
                            sx={{
                              p: 3,
                              background:
                                "linear-gradient(135deg, #2979ff30, #2979ff10)",
                              borderRadius: 2,
                              height: "100%",
                              display: "flex",
                              flexDirection: "column",
                              alignItems: "center",
                              justifyContent: "center",
                              textAlign: "center",
                              cursor: "pointer",
                              border: "1px solid #2979ff40",
                            }}
                            onClick={() => navigate("/trade")}>
                            <ShoppingCartIcon
                              sx={{
                                fontSize: 48,
                                color: theme.palette.primary.main,
                                mb: 2,
                              }}
                            />
                            <Typography variant="h6" gutterBottom>
                              Auto Trade
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              Buy tokens automatically with scheduled
                              transactions
                            </Typography>
                          </Paper>
                        </motion.div>
                      </Grid>

                      {/* Sell Tokens Button */}
                      <Grid item xs={12} sm={4}>
                        <motion.div
                          whileHover={{ scale: 1.03 }}
                          whileTap={{ scale: 0.98 }}>
                          <Paper
                            elevation={2}
                            sx={{
                              p: 3,
                              background:
                                "linear-gradient(135deg, #00c85330, #00c85310)",
                              borderRadius: 2,
                              height: "100%",
                              display: "flex",
                              flexDirection: "column",
                              alignItems: "center",
                              justifyContent: "center",
                              textAlign: "center",
                              cursor: "pointer",
                              border: "1px solid #00c85340",
                            }}
                            onClick={() => navigate("/sell")}>
                            <SellIcon
                              sx={{
                                fontSize: 48,
                                color: theme.palette.success.main,
                                mb: 2,
                              }}
                            />
                            <Typography variant="h6" gutterBottom>
                              Sell Tokens
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              Sell your tokens back to the market
                            </Typography>
                          </Paper>
                        </motion.div>
                      </Grid>

                      {/* Burn Tokens Button */}
                      <Grid item xs={12} sm={4}>
                        <motion.div
                          whileHover={{ scale: 1.03 }}
                          whileTap={{ scale: 0.98 }}>
                          <Paper
                            elevation={2}
                            sx={{
                              p: 3,
                              background:
                                "linear-gradient(135deg, #ff520030, #ff520010)",
                              borderRadius: 2,
                              height: "100%",
                              display: "flex",
                              flexDirection: "column",
                              alignItems: "center",
                              justifyContent: "center",
                              textAlign: "center",
                              cursor: "pointer",
                              border: "1px solid #ff520040",
                            }}
                            onClick={() => navigate("/burn")}>
                            <LocalFireDepartmentIcon
                              sx={{
                                fontSize: 48,
                                color: theme.palette.error.main,
                                mb: 2,
                              }}
                            />
                            <Typography variant="h6" gutterBottom>
                              Burn Tokens
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              Burn tokens to reduce supply
                            </Typography>
                          </Paper>
                        </motion.div>
                      </Grid>
                    </Grid>
                  </Box>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Footer */}
          <Box
            component={motion.div}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8, duration: 0.5 }}
            mt={4}
            textAlign="center">
            <Typography variant="body2" color="text.secondary">
              © {new Date().getFullYear()}
              {!IS_PRODUCTION && ` - Running in Development Mode`}
            </Typography>
          </Box>
        </motion.div>
      </Container>
    </Box>
  );
}

export default HomePage;
