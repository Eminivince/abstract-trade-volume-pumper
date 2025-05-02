import { useState, useEffect } from "react";
import { Link as RouterLink, useLocation } from "react-router-dom";
import { motion } from "framer-motion";

// Import MUI Components
import {
  Paper,
  BottomNavigation,
  BottomNavigationAction,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import { alpha } from "@mui/material/styles";

// Icons
import DashboardIcon from "@mui/icons-material/Dashboard";
import AccountBalanceWalletIcon from "@mui/icons-material/AccountBalanceWallet";
import TokenIcon from "@mui/icons-material/Token";
import ShoppingCartIcon from "@mui/icons-material/ShoppingCart";
import MonetizationOnIcon from "@mui/icons-material/MonetizationOn";
import AccountBalanceIcon from "@mui/icons-material/AccountBalance";

// Navigation Links with icons
const navLinks = [
  {
    title: "Dashboard",
    path: "/",
    icon: <DashboardIcon />,
  },
  {
    title: "Wallets",
    path: "/wallet-groups",
    icon: <AccountBalanceWalletIcon />,
  },
  {
    title: "View Wal.",
    path: "/wallet-group/view",
    icon: <AccountBalanceIcon />,
  },
  {
    title: "Tokens",
    path: "/tokens",
    icon: <TokenIcon />,
  },
  {
    title: "Trading",
    path: "/trade",
    icon: <ShoppingCartIcon />,
  },
  {
    title: "Collect",
    path: "/collect",
    icon: <MonetizationOnIcon />,
  },
];

function MobileFooterNav() {
  const theme = useTheme();
  const location = useLocation();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const isSmallMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const [navValue, setNavValue] = useState(0);

  // Update nav value based on current route
  useEffect(() => {
    const currentPath = location.pathname;
    const linkIndex = navLinks.findIndex(
      (link) =>
        currentPath === link.path ||
        (link.path !== "/" && currentPath.startsWith(link.path))
    );

    if (linkIndex !== -1) {
      setNavValue(linkIndex);
    }
  }, [location.pathname]);

  // Don't render navigation on desktop
  if (!isMobile) return null;

  return (
    <Paper
      sx={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 1100,
        borderTop: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
        boxShadow: "0px -2px 10px rgba(0, 0, 0, 0.2)",
      }}
      elevation={4}
      component={motion.div}
      initial={{ y: 100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.3 }}>
      <BottomNavigation
        showLabels
        value={navValue}
        onChange={(event, newValue) => {
          setNavValue(newValue);
        }}
        sx={{
          background: "linear-gradient(to top, #121212, #1e1e3f)",
          height: isSmallMobile ? 65 : 70,
          width: "100%",
          "& .MuiBottomNavigationAction-root": {
            color: alpha(theme.palette.common.white, 0.6),
            minWidth: 0,
            padding: "6px 8px",
            "&.Mui-selected": {
              color: theme.palette.primary.main,
            },
          },
        }}>
        {navLinks.map((link) => (
          <BottomNavigationAction
            key={link.title}
            component={RouterLink}
            to={link.path}
            label={link.title}
            icon={link.icon}
            sx={{
              "& .MuiBottomNavigationAction-label": {
                fontSize: "0.7rem",
                mt: 0.5,
                transition: "font-size 0.15s ease-in-out",
                "&.Mui-selected": {
                  fontSize: "0.75rem",
                },
              },
            }}
          />
        ))}
      </BottomNavigation>
    </Paper>
  );
}

export default MobileFooterNav;
