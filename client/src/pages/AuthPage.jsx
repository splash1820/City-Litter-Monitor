import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mail, Lock, User, Loader } from "lucide-react"; 
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import loginFormPic from "../public/login-form-pic.svg"

// This component no longer accepts any props
const AuthPage = () => {
  // Use the new AuthContext
  const { login, signup } = useAuth();
  
  // Add username and error state
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("citizen");
  const [isSignUp, setIsSignUp] = useState(false);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      if (isSignUp) {
        // --- SIGNUP LOGIC ---
        if (!username || !email || !password) {
          throw new Error("All fields are required for signup.");
        }
        await signup(username, email, password, role);
        // On success, flip to login form
        setIsSignUp(false);
        setError("Signup successful! Please log in.");
        
      } else {
        // --- LOGIN LOGIC ---
        if (!username || !password) {
          throw new Error("Username and password are required.");
        }
        const loggedInUser = await login(username, password);
        // Navigate based on role from backend
        navigate(loggedInUser.role === "citizen" ? "/citizen" : "/official");
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-background via-surface to-background flex items-center justify-center px-4">
      {/* --- UPDATED: Wider container for 2 columns --- */}
      <motion.div
        className="w-full max-w-4xl" // Changed from max-w-md
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
      >
        {/* --- UPDATED: Grid layout, one card for both columns --- */}
        <div className="bg-surface border border-muted rounded-2xl shadow-2xl grid lg:grid-cols-2 overflow-hidden">

          {/* --- NEW: Column 1 - Image --- */}
          <motion.div 
            className="hidden lg:flex items-center justify-center p-6 bg-background/50"
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <img 
              src={loginFormPic} 
              alt="Login Illustration" 
              className="w-full h-auto max-w-sm"
            />
          </motion.div>

          {/* --- Column 2 - Form --- */}
          <div className="p-8 md:p-12">
            <motion.h2
              className="text-3xl font-bold mb-2 text-center"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              {isSignUp ? "Create Account" : "Welcome Back"}
            </motion.h2>

            <p className="text-muted-foreground text-center mb-8">
              {isSignUp ? "Join the waste management revolution" : "Continue your journey with Prakriti"}
            </p>

            <form onSubmit={handleSubmit} className="space-y-6">
              
              {/* --- NEW: USERNAME (Required for both) --- */}
              <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}>
                <label className="block text-sm font-semibold mb-2">Username</label>
                <div className="relative">
                  <User className="absolute left-4 top-4 w-5 h-5 text-muted-foreground pointer-events-none" />
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 bg-background border border-muted rounded-lg focus:outline-none focus:border-accent-green focus:ring-1 focus:ring-accent-green transition-all"
                    placeholder="e.g., citizen_john"
                  />
                </div>
              </motion.div>

              {/* Email Input (Sign up only) */}
              <AnimatePresence>
                {isSignUp && (
                  <motion.div 
                    initial={{ opacity: 0, x: -20, height: 0 }} 
                    animate={{ opacity: 1, x: 0, height: 'auto' }} 
                    exit={{ opacity: 0, x: 20, height: 0 }}
                    transition={{ delay: 0.1 }}
                  >
                    <label className="block text-sm font-semibold mb-2">Email Address</label>
                    <div className="relative">
                      <Mail className="absolute left-4 top-4 w-5 h-5 text-muted-foreground pointer-events-none" />
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full pl-12 pr-4 py-3 bg-background border border-muted rounded-lg focus:outline-none focus:border-accent-green focus:ring-1 focus:ring-accent-green transition-all"
                        placeholder="you@example.com"
                      />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Password Input */}
              <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }}>
                <label className="block text-sm font-semibold mb-2">Password</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-4 w-5 h-5 text-muted-foreground pointer-events-none" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 bg-background border border-muted rounded-lg focus:outline-none focus:border-accent-green focus:ring-1 focus:ring-accent-green transition-all"
                    placeholder="••••••••"
                  />
                </div>
              </motion.div>

              {/* Role Selection (Sign up only) */}
              <AnimatePresence>
                {isSignUp && (
                  <motion.div 
                    initial={{ opacity: 0, x: -20, height: 0 }} 
                    animate={{ opacity: 1, x: 0, height: 'auto' }} 
                    exit={{ opacity: 0, x: 20, height: 0 }}
                    transition={{ delay: 0.2 }}
                  >
                    <label className="block text-sm font-semibold mb-4">I am a</label>
                    <div className="flex gap-4">
                      {[
                        { value: "citizen", label: "Citizen", icon: User },
                  { value: "official", label: "Official", icon: User },
                      ].map((option) => {
                        const IconComponent = option.icon
                        return (
                          <button
                            key={option.value}
                 type="button"
                            onClick={() => setRole(option.value)}
                            className={`flex-1 py-3 px-4 rounded-lg font-semibold transition-all flex items-center justify-center gap-2 ${
                              role === option.value
                                ? "bg-accent-green text-background"
                       : "bg-background border border-muted hover:border-accent-green"
                            }`}
                          >
                            <IconComponent className="w-5 h-5" />
                   {option.label}
                          </button>
                        )
                      })}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

           {/* Error Message */}
              <AnimatePresence>
                {error && (
                  <motion.p
                    className="text-sm text-accent-red text-center"
             initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                  >
                    {error}
       </motion.p>
                )}
              </AnimatePresence>

              {/* Submit Button */}
              <motion.button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 bg-accent-green text-background font-bold rounded-lg hover:bg-accent-green-dark transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
           initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
             transition={{ delay: 0.5 }}
                whileHover={{ scale: 1.02 }}
           whileTap={{ scale: 0.98 }}
              >
                {isLoading ? (
                  <Loader className="w-5 h-5 animate-spin mx-auto" />
                ) : (
                  isSignUp ? "Create Account" : "Sign In"
                )}
              </motion.button>
            </form>

            <motion.div
              className="mt-8 pt-8 border-t border-muted text-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
            >
              <button 
                onClick={() => {
                  setIsSignUp(!isSignUp);
                  setError(null); // Clear errors on toggle
                }} 
                className="text-accent-green hover:underline font-semibold"
              >
                {isSignUp ? "Already have an account? Sign In" : "Don't have an account? Sign Up"}
              </button>
            </motion.div>
          </div>
        </div>
      </motion.div>
    </div>
  )
}

export default AuthPage