// frontend/src/components/MainMenu.js
import React from "react";
import { Link as RouterLink } from "react-router-dom";
import { motion } from "framer-motion";

// Import MUI Components
import AppBar from "@mui/material/AppBar";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import Box from "@mui/material/Box";
import MenuItem from "@mui/material/MenuItem";
import Menu from "@mui/material/Menu";
import IconButton from "@mui/material/IconButton";
import MenuIcon from "@mui/icons-material/Menu";
import useMediaQuery from "@mui/material/useMediaQuery";
import { useTheme } from "@mui/material/styles";
import Fade from "@mui/material/Fade";
import RocketLaunchIcon from "@mui/icons-material/RocketLaunch";
import { alpha } from "@mui/material/styles";

// Animation variants
const menuItemVariants = {
  hidden: { opacity: 0, y: -10 },
  visible: (i) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: i * 0.05,
      duration: 0.3,
    },
  }),
};

const logoVariants = {
  initial: { scale: 0.9, opacity: 0 },
  animate: { scale: 1, opacity: 1, transition: { duration: 0.5 } },
  hover: { scale: 1.05, transition: { duration: 0.2 } },
};

function MainMenu() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  // State for mobile menu
  const [anchorEl, setAnchorEl] = React.useState(null);
  const handleMenu = (event) => {
    setAnchorEl(event.currentTarget);
  };
  const handleClose = () => {
    setAnchorEl(null);
  };

  // Navigation Links
  const navLinks = [
    { title: "Manage Wallet Groups", path: "/wallet-groups" },
    { title: "View Wallet Groups", path: "/wallet-group/view" },
    { title: "Manage Tokens", path: "/tokens" },
    { title: "Distribute ETH", path: "/distribute" },
    { title: "Collect Funds", path: "/collect" },
    // { title: "Burn Tokens", path: "/burn" },
    // { title: "Start Buy Process", path: "/buy" },
    // { title: "Start Sell Process", path: "/sell" },
    { title: "Automated Trading", path: "/trade" },
    // { title: "Get Usage Data", path: "/usage-report" },
    // { title: "Help", path: "/help" },
  ];

  return (
    <AppBar
      position="static"
      elevation={0}
      sx={{
        background: "linear-gradient(90deg, #1a1a1a 0%, #2d2d2d 100%)",
        borderBottom: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
      }}
      component={motion.nav}
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: "easeOut" }}>
      <Toolbar>
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
                flexGrow: 1,
                fontWeight: 600,
                background: "linear-gradient(45deg, #90caf9 30%, #f48fb1 90%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}>
              Booster
            </Typography>
          </Box>
        </motion.div>

        {/* Desktop Menu with Animation */}
        {!isMobile && (
          <Box sx={{ ml: "auto", display: "flex" }}>
            {navLinks.map((link, i) => (
              <motion.div
                key={link.title}
                custom={i}
                variants={menuItemVariants}
                initial="hidden"
                animate="visible"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}>
                <Button
                  color="primary"
                  component={RouterLink}
                  to={link.path}
                  sx={{
                    mx: 1,
                    px: 2,
                    borderRadius: "8px",
                    "&:hover": {
                      backgroundColor: alpha(theme.palette.primary.main, 0.1),
                    },
                  }}>
                  {link.title}
                </Button>
              </motion.div>
            ))}
          </Box>
        )}

        {/* Mobile Menu with Animation */}
        {isMobile && (
          <Box sx={{ ml: "auto" }}>
            <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
              <IconButton
                size="large"
                edge="end"
                color="primary"
                aria-label="menu"
                onClick={handleMenu}
                sx={{
                  border: `1px solid ${alpha(theme.palette.primary.main, 0.3)}`,
                  "&:hover": {
                    backgroundColor: alpha(theme.palette.primary.main, 0.1),
                  },
                }}>
                <MenuIcon />
              </IconButton>
            </motion.div>
            <Menu
              id="menu-appbar"
              anchorEl={anchorEl}
              anchorOrigin={{
                vertical: "top",
                horizontal: "right",
              }}
              keepMounted
              transformOrigin={{
                vertical: "top",
                horizontal: "right",
              }}
              open={Boolean(anchorEl)}
              onClose={handleClose}
              TransitionComponent={Fade}
              transitionDuration={300}
              PaperProps={{
                elevation: 3,
                sx: {
                  backgroundColor: "#1e1e1e",
                  borderRadius: 2,
                  border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
                  minWidth: "200px",
                  overflow: "hidden",
                },
              }}>
              {navLinks.map((link, i) => (
                <motion.div
                  key={link.title}
                  custom={i}
                  variants={menuItemVariants}
                  initial="hidden"
                  animate="visible">
                  <MenuItem
                    component={RouterLink}
                    to={link.path}
                    onClick={handleClose}
                    sx={{
                      py: 1.5,
                      "&:hover": {
                        backgroundColor: alpha(theme.palette.primary.main, 0.1),
                      },
                    }}>
                    {link.title}
                  </MenuItem>
                </motion.div>
              ))}
            </Menu>
          </Box>
        )}
      </Toolbar>
    </AppBar>
  );
}

export default MainMenu;
