import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { useState } from "react";
import Register from "./components/Register";
import Login from "./components/Login";
import Dashboard from "./components/Dashboard";
import AddProperty from "./components/AddProperty";
import SellProperty from "./components/SellProperty";
import UploadDoc from "./components/UploadDoc";
import { getAuth, clearAuth, setAuth } from "./auth";

function App() {
  const { token: initialToken, user: initialUser } = getAuth();
  const [token, setToken] = useState(initialToken);
  const [user, setUser] = useState(initialUser);

  const handleLogin = (token, user) => {
    setAuth(token, user);
    setToken(token);
    setUser(user);
  };

  const handleLogout = () => {
    clearAuth();
    setToken(null);
    setUser(null);
  };

  // ProtectedRoute wrapper
  const ProtectedRoute = ({ children }) => {
    if (!token || !user) return <Navigate to="/login" replace />;
    return children;
  };

  return (
    <Router>
      <Routes>
        {/* Root route */}
        <Route
          path="/"
          element={token ? <Navigate to="/dashboard" /> : <Navigate to="/login" />}
        />

        {/* Authentication */}
        <Route
          path="/register"
          element={token ? <Navigate to="/dashboard" replace /> : <Register onLogin={handleLogin} />}
        />
        <Route
          path="/login"
          element={token ? <Navigate to="/dashboard" replace /> : <Login onLogin={handleLogin} />}
        />

        {/* Protected Routes */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard user={user} onLogout={handleLogout} />
            </ProtectedRoute>
          }
        />
        <Route
          path="/add-property"
          element={
            <ProtectedRoute>
              <AddProperty user={user} />
            </ProtectedRoute>
          }
        />
        <Route
          path="/sell-property"
          element={
            <ProtectedRoute>
              <SellProperty user={user} />
            </ProtectedRoute>
          }
        />
        <Route
          path="/upload-doc"
          element={
            <ProtectedRoute>
              <UploadDoc user={user} />
            </ProtectedRoute>
          }
        />

        {/* Catch-all */}
        <Route
          path="*"
          element={<Navigate to={token ? "/dashboard" : "/login"} replace />}
        />
      </Routes>
    </Router>
  );
}

export default App;
