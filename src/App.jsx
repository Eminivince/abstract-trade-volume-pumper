// frontend/src/App.js
import {
  BrowserRouter as Router,
  Routes,
  Route,
  useLocation,
} from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import HomePage from "./pages/HomePage";
import WalletGroupsPage from "./pages/WalletGroupsPage";
import CreateWalletGroupPage from "./pages/CreateWalletGroupPage";
import TokensPage from "./pages/TokensPage";
import DistributePage from "./pages/DistributePage";
import CollectFundsPage from "./pages/CollectFundsPage";
import BurnPage from "./pages/BurnPage";
import BuyPage from "./pages/BuyPage";
import SellPage from "./pages/SellPage";
import TradePage from "./pages/TradePage";
import UsageReportPage from "./pages/UsageReportPage";
import HelpPage from "./pages/HelpPage";
import LoginPage from "./pages/LoginPage";
import SignupPage from "./pages/SignupPage";
import ViewWalletGroupPage from "./pages/ViewWalletGroupPage";
import MobileFooterNav from "./components/MobileFooterNav";
import "./App.css";

// Animation variants
const pageVariants = {
  initial: {
    opacity: 0,
    y: 20,
  },
  in: {
    opacity: 1,
    y: 0,
  },
  out: {
    opacity: 0,
    y: -20,
  },
};

const pageTransition = {
  type: "tween",
  ease: "anticipate",
  duration: 0.5,
};

// Animated route wrapper
const AnimatedRoutes = () => {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route
          path="/login"
          element={
            <motion.div
              initial="initial"
              animate="in"
              exit="out"
              variants={pageVariants}
              transition={pageTransition}>
              <LoginPage />
            </motion.div>
          }
        />
        <Route
          path="/signup"
          element={
            <motion.div
              initial="initial"
              animate="in"
              exit="out"
              variants={pageVariants}
              transition={pageTransition}>
              <SignupPage />
            </motion.div>
          }
        />

        <Route
          path="/"
          element={
            <motion.div
              initial="initial"
              animate="in"
              exit="out"
              variants={pageVariants}
              transition={pageTransition}>
              <HomePage />
            </motion.div>
          }
        />

        <Route
          path="/wallet-group/view"
          element={
            <motion.div
              initial="initial"
              animate="in"
              exit="out"
              variants={pageVariants}
              transition={pageTransition}>
              <ViewWalletGroupPage />
            </motion.div>
          }
        />
        <Route
          path="/wallet-groups"
          element={
            <motion.div
              initial="initial"
              animate="in"
              exit="out"
              variants={pageVariants}
              transition={pageTransition}>
              <WalletGroupsPage />
            </motion.div>
          }
        />
        <Route
          path="/wallet-group/new"
          element={
            <motion.div
              initial="initial"
              animate="in"
              exit="out"
              variants={pageVariants}
              transition={pageTransition}>
              <CreateWalletGroupPage />
            </motion.div>
          }
        />
        <Route
          path="/tokens"
          element={
            <motion.div
              initial="initial"
              animate="in"
              exit="out"
              variants={pageVariants}
              transition={pageTransition}>
              <TokensPage />
            </motion.div>
          }
        />
        <Route
          path="/distribute"
          element={
            <motion.div
              initial="initial"
              animate="in"
              exit="out"
              variants={pageVariants}
              transition={pageTransition}>
              <DistributePage />
            </motion.div>
          }
        />
        <Route
          path="/collect"
          element={
            <motion.div
              initial="initial"
              animate="in"
              exit="out"
              variants={pageVariants}
              transition={pageTransition}>
              <CollectFundsPage />
            </motion.div>
          }
        />
        <Route
          path="/burn"
          element={
            <motion.div
              initial="initial"
              animate="in"
              exit="out"
              variants={pageVariants}
              transition={pageTransition}>
              <BurnPage />
            </motion.div>
          }
        />
        <Route
          path="/buy"
          element={
            <motion.div
              initial="initial"
              animate="in"
              exit="out"
              variants={pageVariants}
              transition={pageTransition}>
              <BuyPage />
            </motion.div>
          }
        />
        <Route
          path="/sell"
          element={
            <motion.div
              initial="initial"
              animate="in"
              exit="out"
              variants={pageVariants}
              transition={pageTransition}>
              <SellPage />
            </motion.div>
          }
        />
        <Route
          path="/trade"
          element={
            <motion.div
              initial="initial"
              animate="in"
              exit="out"
              variants={pageVariants}
              transition={pageTransition}>
              <TradePage />
            </motion.div>
          }
        />
        <Route
          path="/usage-report"
          element={
            <motion.div
              initial="initial"
              animate="in"
              exit="out"
              variants={pageVariants}
              transition={pageTransition}>
              <UsageReportPage />
            </motion.div>
          }
        />
        <Route
          path="/help"
          element={
            <motion.div
              initial="initial"
              animate="in"
              exit="out"
              variants={pageVariants}
              transition={pageTransition}>
              <HelpPage />
            </motion.div>
          }
        />
      </Routes>
    </AnimatePresence>
  );
};

function App() {
  return (
    <Router>
      <AnimatedRoutes />
      <MobileFooterNav />
    </Router>
  );
}

export default App;
