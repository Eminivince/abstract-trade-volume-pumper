// frontend/src/components/MainMenu.js
import { useState } from "react";
import { Link as RouterLink, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";

// Import MUI Components
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Box,
  IconButton,
  useMediaQuery,
  useTheme,
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
} from "@mui/material";
import { alpha } from "@mui/material/styles";

// Icons
import MenuIcon from "@mui/icons-material/Menu";
import CloseIcon from "@mui/icons-material/Close";
import RocketLaunchIcon from "@mui/icons-material/RocketLaunch";
import AccountBalanceWalletIcon from "@mui/icons-material/AccountBalanceWallet";
import TokenIcon from "@mui/icons-material/Token";
import SyncAltIcon from "@mui/icons-material/SyncAlt";
import AccountBalanceIcon from "@mui/icons-material/AccountBalance";

// Animation variants
const menuItemVariants = {
  hidden: { opacity: 0, x: -20 },
  visible: (i) => ({
    opacity: 1,
    x: 0,
    transition: {
      delay: i * 0.05,
      duration: 0.3,
    },
  }),
  exit: { opacity: 0, x: -20, transition: { duration: 0.2 } },
};

const logoVariants = {
  initial: { scale: 0.9, opacity: 0 },
  animate: { scale: 1, opacity: 1, transition: { duration: 0.5 } },
  hover: { scale: 1.05, transition: { duration: 0.2 } },
};

// Navigation Links with icons
const navLinks = [
  {
    title: "Wallet Groups",
    path: "/wallet-groups",
    icon: <AccountBalanceWalletIcon />,
    mobileDisplay: true,
  },
  {
    title: "View Wallets",
    path: "/wallet-group/view",
    icon: <AccountBalanceIcon />,
    mobileDisplay: true,
  },
  {
    title: "Manage Tokens",
    path: "/tokens",
    icon: <TokenIcon />,
    mobileDisplay: true,
  },
  {
    title: "Distribute ETH",
    path: "/distribute",
    icon: <SyncAltIcon />,
    mobileDisplay: false,
  },
  {
    title: "Collect Funds",
    path: "/collect",
    icon: <AccountBalanceIcon />,
    mobileDisplay: false,
  },
];

function MainMenu() {
  const theme = useTheme();
  const location = useLocation();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  // State for mobile drawer
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Handle drawer toggling
  const toggleDrawer = (open) => (event) => {
    if (
      event.type === "keydown" &&
      (event.key === "Tab" || event.key === "Shift")
    ) {
      return;
    }
    setDrawerOpen(open);
  };

  return (
    <>
      {/* Main App Bar */}
      <AppBar
        position="sticky"
        elevation={1}
        sx={{
          background: "linear-gradient(90deg, #1a1a1a 0%, #2d2d2d 100%)",
          borderBottom: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
        }}
        component={motion.nav}
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}>
        <Toolbar sx={{ justifyContent: "space-between" }}>
          {/* Logo with Animation */}
          <motion.div
            variants={logoVariants}
            initial="initial"
            animate="animate"
            whileHover="hover">
            <Box
              display="flex"
              alignItems="center"
              component={RouterLink}
              to="/"
              sx={{ textDecoration: "none", color: "inherit" }}>
              <RocketLaunchIcon
                sx={{ mr: 1, color: theme.palette.primary.main }}
              />
              <Typography
                variant="h6"
                sx={{
                  fontWeight: 600,
                  background:
                    "linear-gradient(45deg, #90caf9 30%, #f48fb1 90%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                }}></Typography>
            </Box>
          </motion.div>

          {/* Desktop Navigation Menu */}
          {!isMobile && (
            <Box display="flex" alignItems="center" sx={{ ml: 2 }}>
              <AnimatePresence>
                {navLinks.map((link, index) => (
                  <motion.div
                    key={link.title}
                    custom={index}
                    variants={menuItemVariants}
                    initial="hidden"
                    animate="visible"
                    exit="exit">
                    <Button
                      component={RouterLink}
                      to={link.path}
                      color="inherit"
                      sx={{
                        mx: 1,
                        transition: "0.3s",
                        position: "relative",
                        "&::after": {
                          content: '""',
                          position: "absolute",
                          width:
                            location.pathname === link.path ? "100%" : "0%",
                          height: "2px",
                          bottom: 0,
                          left: 0,
                          backgroundColor: theme.palette.primary.main,
                          transition: "width 0.3s ease-in-out",
                        },
                        "&:hover::after": {
                          width: "100%",
                        },
                      }}>
                      {link.title}
                    </Button>
                  </motion.div>
                ))}
              </AnimatePresence>
            </Box>
          )}

          {/* Mobile Menu Button */}
          {isMobile && (
            <IconButton
              color="inherit"
              edge="end"
              onClick={toggleDrawer(true)}
              sx={{ ml: 2 }}>
              <MenuIcon />
            </IconButton>
          )}
        </Toolbar>
      </AppBar>

      {/* Mobile Drawer */}
      <Drawer
        anchor="left"
        open={drawerOpen}
        onClose={toggleDrawer(false)}
        PaperProps={{
          sx: {
            width: "70%",
            maxWidth: 280,
            background: "linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)",
            color: "white",
            borderTopRightRadius: 10,
            borderBottomRightRadius: 10,
          },
        }}>
        <Box
          sx={{
            p: 2,
            height: "100%",
            display: "flex",
            flexDirection: "column",
          }}
          role="presentation"
          onClick={toggleDrawer(false)}
          onKeyDown={toggleDrawer(false)}>
          {/* Drawer Header */}
          <Box
            display="flex"
            justifyContent="space-between"
            alignItems="center"
            mb={2}>
            <Box display="flex" alignItems="center">
              <RocketLaunchIcon
                sx={{ mr: 1, color: theme.palette.primary.main }}
              />
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                Booster
              </Typography>
            </Box>
            <IconButton color="inherit" onClick={toggleDrawer(false)}>
              <CloseIcon />
            </IconButton>
          </Box>

          {/* Drawer Navigation Links */}
          <List>
            <AnimatePresence>
              {navLinks.map((link, index) => (
                <motion.div
                  key={link.title}
                  custom={index}
                  variants={menuItemVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit">
                  <ListItem
                    button
                    component={RouterLink}
                    to={link.path}
                    selected={location.pathname === link.path}
                    sx={{
                      mb: 1,
                      borderRadius: 2,
                      backgroundColor:
                        location.pathname === link.path
                          ? alpha(theme.palette.primary.main, 0.2)
                          : "transparent",
                      "&:hover": {
                        backgroundColor: alpha(theme.palette.primary.main, 0.1),
                      },
                    }}>
                    <ListItemIcon sx={{ color: "inherit" }}>
                      {link.icon}
                    </ListItemIcon>
                    <ListItemText primary={link.title} />
                  </ListItem>
                </motion.div>
              ))}
            </AnimatePresence>
          </List>
        </Box>
      </Drawer>
    </>
  );
}

export default MainMenu;
