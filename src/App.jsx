import { lazy, Suspense, useEffect } from "react";
import { BrowserRouter, Link, Navigate, Route, Routes, useLocation } from "react-router-dom";
import { AuthProvider, useAuth } from "./lib/auth.jsx";
import Header from "./components/Header.jsx";
import Home from "./pages/Home.jsx";
import { Login, Register } from "./pages/Auth.jsx";

const Dashboard = lazy(() => import("./pages/Dashboard.jsx"));
const PaymentReturn = lazy(() => import("./pages/PaymentReturn.jsx"));
const Admin = lazy(() => import("./pages/Admin.jsx"));
const BracketPage = lazy(() => import("./pages/BracketPage.jsx"));
const Privacy = lazy(() => import("./pages/Legal.jsx").then((m) => ({ default: m.Privacy })));
const Terms = lazy(() => import("./pages/Legal.jsx").then((m) => ({ default: m.Terms })));

const Loading = () => <main className="app"><div className="spinner" aria-label="Loading" /></main>;

function RequireAuth({ children, admin = false }) {
  const { player, loading } = useAuth();
  const location = useLocation();
  if (loading) return <Loading />;
  if (!player) return <Navigate to="/login" replace state={{ from: location.pathname + location.search }} />;
  if (admin && player.role !== "admin") return <Navigate to="/dashboard" replace />;
  return children;
}

function ScrollToTop() {
  const { pathname, hash } = useLocation();
  useEffect(() => {
    if (hash) {
      document.getElementById(hash.slice(1))?.scrollIntoView();
    } else {
      window.scrollTo(0, 0);
    }
  }, [pathname, hash]);
  return null;
}

function NotFound() {
  return (
    <main className="app">
      <h1 className="app-title">Page not found</h1>
      <p className="app-sub">That page doesn't exist.</p>
      <Link className="btn" style={{ marginTop: 24 }} to="/">Back to the tournament</Link>
    </main>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ScrollToTop />
        <Header />
        <Suspense fallback={<Loading />}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/register" element={<Register />} />
            <Route path="/bracket" element={<BracketPage />} />
            <Route path="/privacy" element={<Privacy />} />
            <Route path="/terms" element={<Terms />} />
            <Route path="/login" element={<Login />} />
            <Route path="/dashboard" element={<RequireAuth><Dashboard /></RequireAuth>} />
            <Route path="/payment/return" element={<RequireAuth><PaymentReturn /></RequireAuth>} />
            <Route path="/admin" element={<RequireAuth admin><Admin /></RequireAuth>} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </AuthProvider>
    </BrowserRouter>
  );
}
