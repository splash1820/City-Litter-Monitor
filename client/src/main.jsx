import React from "react"
import ReactDOM from "react-dom/client"
import App from "./App"
import "./app/globals.css"
import { ThemeProvider } from "./contexts/ThemeContext"
import { AuthProvider } from "./contexts/AuthContext" // Import the new AuthProvider

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <ThemeProvider>
      <AuthProvider> {/* This is the fix */}
        <App />
      </AuthProvider>
    </ThemeProvider>
  </React.StrictMode>,
)