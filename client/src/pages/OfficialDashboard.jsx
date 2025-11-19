import { useState, useRef, useEffect, useContext } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { CheckCircle, AlertCircle, Users, Sun, Moon, X, Eye, Info } from "lucide-react"
import { ThemeContext } from "../contexts/ThemeContext"
import Map from "../components/Map"
import apiClient from "../api/apiClient" // Import apiClient
import { useAuth } from "../contexts/AuthContext" // Import useAuth

// Import New Reusable Components
import Analytics from "../components/Analytics" // Renamed to match component
import ReportSection from "../components/ReportSection"
import ReportCardPaired from "../components/ReportCardPaired"

/**
 * --- HELPER FUNCTION: Data Transformer ---
 */
const transformToPair = (row) => ({
  id: row.id,
  beforeReport: {
    id: row.id,
    before_image_base64: row.before_image_base64,
    description: row.description,
    timestamp: row.created_at,
    location: { lat: row.lat, lon: row.lon },
    contributor: row.contributor, // Assuming contributor is on litter_reports
  },
  afterReport: {
    id: row.cleanup_id,
    cleanup_image_base64: row.cleanup_image_base64,
    timestamp: row.created_at,
  }
});

const OfficialDashboard = () => {
  // --- AUTH & THEME ---
  const { isDark, toggleTheme } = useContext(ThemeContext)
  const { user, logout } = useAuth(); // Get the logged-in user and logout function

  const [activeTab, setActiveTab] = useState("pending")
  
  // --- API-Driven State ---
  const [analytics, setAnalytics] = useState(null);
  const [pendingReports, setPendingReports] = useState([]); // For single cards
  const [completedPairs, setCompletedPairs] = useState([]); // For paired cards
  const [verifiedPairs, setVerifiedPairs] = useState([]);   // For paired cards

  const [selectedPair, setSelectedPair] = useState(null)
  const [showComparison, setShowComparison] = useState(false)
  const [sliderPosition, setSliderPosition] = useState(50)

  // --- NEW: Message Modal State ---
  const [message, setMessage] = useState(null);
  const showMessage = (text, type = "info") => {
    setMessage({ text, type });
    setTimeout(() => {
      setMessage(null);
    }, 4000);
  };
  
  // --- NEW: Data Loading Function ---
  const loadDashboardData = async () => {
    try {
      const [
        analyticsRes,
        pendingRes,
        completedRes,
        verifiedRes
      ] = await Promise.all([
        apiClient.get("/analytics"),
        apiClient.get("/reports/pending"),
        apiClient.get("/reports/completed"),
        apiClient.get("/reports/verified")
      ]);

      setAnalytics(analyticsRes.data);
      setPendingReports(pendingRes.data);
      setCompletedPairs(completedRes.data.map(transformToPair));
      setVerifiedPairs(verifiedRes.data.map(transformToPair));
      console.log("verified res:", verifiedRes.data);
    } catch (error) {
      console.error("Error loading dashboard data:", error);
      showMessage("Could not load dashboard data. Is the backend server running?", "error");
    }
  };

  // --- Load data on component mount ---
  useEffect(() => {
    loadDashboardData();
  }, []);


  // --- UPDATED VERIFICATION LOGIC ---
  const handleApprove = async (pair) => {
    try {
      const payload = {
        report_id: pair.id,
        action: "approve",
        username: user?.username // <-- USE LOGGED-IN USER
      };
      await apiClient.post("/reports/verify", payload);
      
      showMessage("Report successfully verified!", "success");
      setShowComparison(false);
      setSelectedPair(null);
      loadDashboardData(); // Refresh all lists
    } catch (error) {
      console.error("Error approving report:", error);
      showMessage(error.response?.data?.error || "Failed to approve report.", "error");
    }
  }

  const handleReject = async (pair) => {
    try {
      const payload = {
        report_id: pair.id,
        action: "disapprove",
        username: user?.username // <-- USE LOGGED-IN USER
      };
      await apiClient.post("/reports/verify", payload);
      
      showMessage("Report has been rejected.", "info");
      setShowComparison(false);
      setSelectedPair(null);
      loadDashboardData(); // Refresh all lists
    } catch (error) {
      console.error("Error rejecting report:", error);
      showMessage(error.response?.data?.error || "Failed to reject report.", "error");
    }
  }

  const handleOpenComparison = (pair) => {
    setSelectedPair(pair)
    setShowComparison(true)
    setSliderPosition(50)
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <motion.header
        className="bg-surface border-b border-muted sticky top-0 z-50"
        initial={{ y: -100 }}
        animate={{ y: 0 }}
      >
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Prakriti - Official Dashboard</h1>
            <p className="text-sm text-muted-foreground mt-1">Verify waste cleanup reports</p>
          </div>
          <div className="flex items-center gap-4">
            <button onClick={toggleTheme} className="p-2 hover:bg-muted rounded-lg transition-all">
              {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
            <button
              onClick={logout} // Use logout from useAuth
              className="px-4 py-2 bg-accent-red text-white rounded-lg hover:bg-accent-red-dark transition-all"
            >
              Logout
            </button>
          </div>
        </div>
      </motion.header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-8">
        
        {/* --- ROW 1: ANALYTICS (Wired to API) --- */}
        <Analytics
          pendingCount={analytics?.pending_count || 0}
          completedCount={analytics?.completed_count || 0}
          verifiedCount={analytics?.verified_count || 0}
        />

        {/* Map Section (Full Width) */}
        <motion.div
          className="mt-12 mb-8 relative z-10" // z-10 fix
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
        >
          <div className="bg-surface rounded-2xl p-8 border border-muted">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4">
              <h2 className="text-2xl font-bold mb-2 sm:mb-0">Pending Hotspots Map</h2>
              <div className="text-sm sm:text-right">
                <p className="font-semibold">
                  Total Pending Reports: {(analytics?.pending_count || 0) + (analytics?.completed_count || 0)}
                </p>
                <p className="text-xs text-muted-foreground">Showing all 'pending' and 'awaiting verification' reports.</p>
              </div>
            </div>
            <div className="h-[600px] rounded-lg overflow-hidden border border-muted">
              <Map 
                // Format data for map
                submissions={[
                  ...pendingReports.map(r => ({...r, location: { lat: r.lat, lng: r.lon }})), 
                  ...completedPairs.map(p => ({...p.beforeReport, location: { lat: p.beforeReport.location.lat, lng: p.beforeReport.location.lon }}))
                ]} 
                location={null} 
              />
            </div>
          </div>
        </motion.div>

        {/* Reports Section (Full Width) */}
        <motion.div
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
        >
          <div className="bg-surface rounded-2xl border border-muted overflow-hidden">
            {/* --- TABS --- */}
            <div className="p-8 border-b border-muted">
              <div className="flex gap-4">
                <button
                  onClick={() => setActiveTab("pending")}
                  className={`px-6 py-2 rounded-lg font-semibold transition-all ${
                    activeTab === "pending"
                      ? "bg-accent-green text-background"
                      : "bg-muted text-foreground hover:bg-muted-dark"
                  }`}
                >
                  Verification Queue
                </button>
                <button
                  onClick={() => setActiveTab("verified")}
                  className={`px-6 py-2 rounded-lg font-semibold transition-all ${
                    activeTab === "verified"
                      ? "bg-accent-green text-background"
                      : "bg-muted text-foreground hover:bg-muted-dark"
                  }`}
                >
                  All Verified Reports
                </button>
              </div>
            </div>

            {/* --- TAB CONTENT (Full Height) --- */}
            <div>
              <AnimatePresence mode="wait">
                {/* --- PENDING TAB --- */}
                {activeTab === "pending" && (
                  <motion.div
                    key="pending"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="p-8"
                  >
                   {/* --- Awaiting Verification Section --- */}
                    <h2 className="text-2xl font-bold mb-6">Awaiting Verification</h2>
                    <p className="text-muted-foreground mb-4 -mt-4">
                      These reports have 'before' and 'after' photos. Click to verify.
                    </p>
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {completedPairs.map(pair => (
                        <div 
                          key={pair.id} 
                          className="cursor-pointer" 
                          onClick={() => handleOpenComparison(pair)}
                        >
                          <ReportCardPaired 
                            pair={pair} 
                            statusText="Click to Verify" 
                            statusColor="blue"
                     />
                        </div>
                      ))}
                      {completedPairs.length === 0 && (
                        <p className="p-4 text-muted-foreground md:col-span-3">No reports are awaiting verification.</p>
                      )}
                    </div>

                    <div className="my-8 border-t border-muted"></div>

                    {/* --- Pending Reports Section --- */}
                    <ReportSection
                      title="Pending Reports"
                      subtitle="These reports are awaiting an 'after' photo from a citizen. (Status: 'active')"
                      reports={pendingReports}
                      cardType="single"
                 />
                  </motion.div>
                )}

                {/* --- VERIFIED TAB --- */}
                {activeTab === "verified" && (
                 <motion.div
                    key="verified"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="p-8"
                  >
                    <ReportSection
                      title="Verified Cleanups"
                      subtitle="All reports that have been successfully verified."
                      reports={verifiedPairs}
                      cardType="paired"
                      statusText="Verified"
                      statusColor="green"
                    />
             </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </motion.div>
      </div>

      {/* --- MODAL --- */}
      <AnimatePresence>
        {showComparison && selectedPair && (
          <motion.div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="bg-surface rounded-2xl border border-muted max-w-4xl w-full max-h-[90vh] overflow-y-auto"
           initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
            >
              {/* Modal Header */}
              <div className="sticky top-0 bg-surface p-8 border-b border-muted flex items-center justify-between z-10">
                <div>
                  <h2 className="text-2xl font-bold">Verify Cleanup Report</h2>
                  <p className="text-muted-foreground text-sm mt-1">{selectedPair.beforeReport.description}</p>
           </div>
                <button
                  onClick={() => setShowComparison(false)}
                  className="p-2 hover:bg-muted rounded-lg transition-all"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* Modal Content */}
              <div className="p-8">
                <div className="mb-8">
                  <h3 className="text-lg font-bold mb-4">Before & After Cleanup Comparison</h3>
             <div className="relative bg-background rounded-xl overflow-hidden border border-muted">
                    <div className="relative w-full aspect-video">
                      {/* Before Image */}
                      <img
                        src={selectedPair.beforeReport.before_image_base64 || "/placeholder.svg"}
                        alt="Before cleanup"
                        className="w-full h-full object-cover"
                 />
                      {/* After Image Overlay with Slider */}
                      <div
                        className="absolute top-0 right-0 h-full overflow-hidden"
                        style={{ width: `${100 - sliderPosition}%` }}
                      >
                      <img
                        src={selectedPair.afterReport.cleanup_image_base64 || "/placeholder.svg"}
                        alt="After cleanup"
                        className="w-full h-full object-cover"  // image fills its container
                      />
                    </div>
                      {/* Slider Handle */}
                      <motion.input
                        type="range"
                        min="0"
                        max="100"
                   value={sliderPosition}
                        onChange={(e) => setSliderPosition(Number(e.target.value))}
                        className="absolute top-0 left-0 w-full h-full opacity-0 cursor-col-resize z-10"
                      />
                      <div
                        className="absolute top-0 bottom-0 w-1 bg-accent-green cursor-col-resize pointer-events-none"
                 style={{ left: `${sliderPosition}%` }}
                      >
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-accent-green text-white p-2 rounded-full whitespace-nowrap text-xs font-semibold">
               Drag
                        </div>
                      </div>
                      {/* Labels */}
                      <div className="absolute top-4 left-4 px-3 py-1 bg-black/50 text-white rounded-lg text-sm font-semibold">
                 Before
                      </div>
                      <div className="absolute top-4 right-4 px-3 py-1 bg-black/50 text-white rounded-lg text-sm font-semibold">
                        After
                      </div>
                    </div>
                  </div>
                </div>

                {/* Report Details */}
                <div className="grid md:grid-cols-2 gap-6 mb-8">
             <div className="bg-background rounded-lg p-4 border border-muted">
                    <p className="text-sm text-muted-foreground mb-1">Contributor</p>
                    <p className="text-lg font-semibold">{selectedPair.beforeReport.contributor}</p>
             </div>
                   <div className="bg-background rounded-lg p-4 border border-muted">
                    <p className="text-sm text-muted-foreground mb-1">Reported</p>
                    <p className="text-lg font-semibold">{new Date(selectedPair.beforeReport.timestamp).toLocaleString()}</p>
                  </div>
                </div>

                {/* Action Buttons */}
               <div className="flex gap-4">
                  <motion.button
                    onClick={() => handleApprove(selectedPair)}
                    className="flex-1 py-3 px-4 bg-accent-green text-white rounded-lg font-semibold hover:bg-accent-green-dark transition-all"
                  >
                    <CheckCircle className="w-5 h-5 inline mr-2" />
               Approve & Mark Verified
                  </motion.button>
                  <motion.button
                    onClick={() => handleReject(selectedPair)}
                    className="flex-1 py-3 px-4 bg-accent-red text-white rounded-lg font-semibold hover:bg-accent-red-dark transition-all"
                  >
                    Reject Report
                  </motion.button>
                  <button
                    onClick={() => setShowComparison(false)}
             className="px-6 py-3 bg-muted text-foreground rounded-lg font-semibold hover:bg-muted"
                  >
                    Close
                  </button>
             </div>
           </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* --- NEW: MESSAGE MODAL --- */}
      <AnimatePresence>
        {message && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-10 left-1/2 -translate-x-1/2 z-50"
          >
            <div className={`flex items-center gap-3 bg-surface border rounded-lg shadow-xl p-4 ${
              message.type === 'error' ? 'border-accent-red' : 'border-muted'
            }`}>
              <Info className={`w-5 h-5 ${
                message.type === 'error' ? 'text-accent-red' : 'text-accent-blue'
              }`} />
              <p className="text-foreground font-medium">{message.text}</p>
              <button onClick={() => setMessage(null)} className="ml-2">
                <X className="w-5 h-5 text-muted-foreground hover:text-foreground" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default OfficialDashboard