import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom"
import LandingPage from "./pages/LandingPage"
import AuthPage from "./pages/AuthPage"
import CitizenDashboard from "./pages/CitizenDashboard"
import OfficialDashboard from "./pages/OfficialDashboard"
import { useAuth } from "./contexts/AuthContext" // Import the useAuth hook

// This is a helper component to protect your routes
const PrivateRoute = ({ children, roleRequired }) => {
  const { user } = useAuth();

  if (!user) {
    // If no user, redirect to auth page
    return <Navigate to="/auth" replace />;
  }

  if (roleRequired && user.role !== roleRequired) {
    // If user has wrong role, redirect to their correct dashboard
    return <Navigate to={user.role === 'citizen' ? '/citizen' : '/official'} replace />;
  }

  return children; // If user exists and has correct role, show the page
};

function App() {
  // Get the user from the global context
  const { user } = useAuth(); 

  return (
    // ThemeProvider is now in main.jsx, so we don't need it here
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route
          path="/auth"
          element={
            // If user is logged in, redirect them away from the auth page
            user ? (
              <Navigate to={user.role === "citizen" ? "/citizen" : "/official"} replace />
            ) : (
              // No "onLogin" prop needed anymore
              <AuthPage /> 
            )
          }
        />
        <Route
          path="/citizen"
          element={
            // Use the PrivateRoute component for protection
            <PrivateRoute roleRequired="citizen">
              {/* No "onLogout" prop needed anymore */}
              <CitizenDashboard />
            </PrivateRoute>
          }
        />
        <Route
          path="/official"
          element={
            <PrivateRoute roleRequired="official">
              {/* No "onLogout" prop needed anymore */}
              <OfficialDashboard />
            </PrivateRoute>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  )
}

export default App