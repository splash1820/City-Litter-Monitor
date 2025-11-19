import { useState, useRef, useEffect, useContext } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { MapPin, Camera, Send, Loader, Check, X, Sun, Moon, Info } from "lucide-react"
import Map from "../components/Map"
import { ThemeContext } from "../contexts/ThemeContext"
import apiClient from "../api/apiClient" // Import the new apiClient
import { useAuth } from "../contexts/AuthContext" // Import useAuth

// Import New Reusable Components
import Analytics from "../components/Analytics"
import ReportSection from "../components/ReportSection"

// --- HELPER FUNCTION 1 ---
const getDistanceInMeters = (loc1, loc2) => {
  if (!loc1 || !loc2) return Infinity
  const R = 6371e3 // metres
  const φ1 = (loc1.lat * Math.PI) / 180 // φ, λ in radians
  const φ2 = (loc2.lat * Math.PI) / 180
  const Δφ = ((loc2.lat - loc1.lat) * Math.PI) / 180
  const Δλ = ((loc2.lng - loc1.lng) * Math.PI) / 180

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))

  return R * c // in metres
}

/**
 * --- HELPER FUNCTION: Data Transformer ---
 * Transforms flat backend data into the nested { beforeReport, afterReport }
 * object that <ReportCardPaired> expects.
 */
const transformToPair = (row) => ({
  id: row.id,
  beforeReport: {
    id: row.id,
    before_image_base64: row.before_image_base64,
    description: row.description,
    timestamp: row.created_at,
    location: { lat: row.lat, lon: row.lon },
  },
  afterReport: {
    id: row.cleanup_id,
    cleanup_image_base64: row.cleanup_image_base64,
    timestamp: row.cleanup_at,
  }
});

const CitizenDashboard = () => {
  // Testing mode
const [testingMode, setTestingMode] = useState(false);

// Manual GPS inputs for BEFORE
const [latBefore, setLatBefore] = useState("");
const [lonBefore, setLonBefore] = useState("");

// Manual GPS inputs for AFTER
const [latAfter, setLatAfter] = useState("");
const [lonAfter, setLonAfter] = useState("");

  const fileInputRef = useRef();

  // --- AUTH & THEME ---
  const { isDark, toggleTheme } = useContext(ThemeContext)
  const { user, logout } = useAuth(); // Get the logged-in user and logout function
  
  // --- STATE FOR FORMS ---
  const [hasLocationBefore, setHasLocationBefore] = useState(false)
  const [locationBefore, setLocationBefore] = useState(null)
  const [imageBefore, setImageBefore] = useState(null)
  const [descriptionBefore, setDescriptionBefore] = useState("")
  const [isSubmittingBefore, setIsSubmittingBefore] = useState(false)
  const [submissionStatus, setSubmissionStatus] = useState("Submit Report");

  const [hasLocationAfter, setHasLocationAfter] = useState(false)
  const [locationAfter, setLocationAfter] = useState(null)
  const [imageAfter, setImageAfter] = useState(null)
  const [descriptionAfter, setDescriptionAfter] = useState("")
  const [isSubmittingAfter, setIsSubmittingAfter] = useState(false)
  const [selectedReportId, setSelectedReportId] = useState("");

  // --- API DATA STATE ---
  const [analytics, setAnalytics] = useState(null);
  const [pendingBeforeReports, setPendingBeforeReports] = useState([]);
  const [completedPairs, setCompletedPairs] = useState([]);
  const [verifiedPairs, setVerifiedPairs] = useState([]);
  
  // --- CAMERA STATE & REFS ---
  const [cameraOpen, setCameraOpen] = useState(false)
  const [cameraType, setCameraType] = useState(null)
  const [stream, setStream] = useState(null)
  const videoRef = useRef(null)
  const canvasRef = useRef(null)
  const streamRef = useRef(null)
  
  // --- MESSAGE MODAL STATE ---
  const [message, setMessage] = useState(null);

  const showMessage = (text, type = "info") => {
    setMessage({ text, type });
    setTimeout(() => {
      setMessage(null);
    }, 4000);
  };

  // --- DATA LOADING LOGIC ---
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
      setPendingBeforeReports(pendingRes.data);
      setCompletedPairs(completedRes.data.map(transformToPair));
      setVerifiedPairs(verifiedRes.data.map(transformToPair));
    } catch (error) {
      console.error("Error loading dashboard data:", error);
      showMessage("Could not load dashboard data.", "error");
    }
  };

  useEffect(() => {
    // Load data on component mount
    loadDashboardData();
  }, []);

  // --- EFFECT FOR CAMERA STREAM ---
  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream
      videoRef.current.onloadedmetadata = () => {
        videoRef.current.play().catch((err) => console.error("[v0] Play error:", err))
      }
    }
  }, [stream]) 

  // --- LOCATION & CAMERA LOGIC ---
  const requestLocation = (type) => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const newLoc = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          }
          if (type === 'before') {
            setLocationBefore(newLoc)
            setHasLocationBefore(true)
          } else {
            setLocationAfter(newLoc)
            setHasLocationAfter(true)
          }
        },
        () => showMessage("Failed to get location. Please enable location services.", "error"),
      )
    }
  }

  const startCamera = (type) => {
    setCameraType(type)
    setCameraOpen(true)
    if (!navigator.mediaDevices?.getUserMedia) {
      showMessage("Your browser does not support camera access.", "error")
      setCameraOpen(false)
      return
    }
    navigator.mediaDevices
      .getUserMedia({
        video: { facingMode: "environment", width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      })
      .then((stream) => {
        streamRef.current = stream
        setStream(stream)
      })
      .catch((err) => {
        console.error("[v0] Camera error:", err)
        showMessage(`Camera access denied. Please check browser permissions.`, "error")
        setCameraOpen(false)
      })
  }

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return
    const video = videoRef.current
    const canvas = canvasRef.current
    const ctx = canvas.getContext("2d")
    if (video.videoWidth === 0 || video.videoHeight === 0) return

    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    ctx.drawImage(video, 0, 0)
    const imageData = canvas.toDataURL("image/jpeg", 0.9); 

    if (cameraType === "before") {
      setImageBefore(imageData)
    } else if (cameraType === "after") {
      setImageAfter(imageData)
    }
    stopCamera()
  }

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop())
      streamRef.current = null
    }
    setStream(null)
    setCameraOpen(false)
    setCameraType(null)
  }

  // --- SUBMIT LOGIC FOR FORM 1 (Calls Backend) ---
const handleSubmitBefore = async () => {
  if (!imageBefore) {
    showMessage("Please capture or upload an image.", "error");
    return;
  }

  if (!descriptionBefore.trim()) {
    showMessage("Please enter a description.", "error");
    return;
  }

  // If NOT testing mode, ensure GPS is granted
  if (!testingMode && !hasLocationBefore) {
    showMessage("Please allow location access.", "error");
    return;
  }

  setIsSubmittingBefore(true);
  setSubmissionStatus("Validating Image...");

  try {
    // Extract BASE64 content
    const base64Data = imageBefore.includes(",")
      ? imageBefore.split(",")[1]
      : imageBefore;

    // --------------------------------------
    // CHOOSE LOCATION SOURCE
    // --------------------------------------
    const latToSend = testingMode
      ? Number(latBefore)      // Manual latitude (testing)
      : locationBefore?.lat;   // Live GPS

    const lonToSend = testingMode
      ? Number(lonBefore)      // Manual longitude (testing)
      : locationBefore?.lng;   // Live GPS

    if (!latToSend || !lonToSend) {
      showMessage("Please enter valid latitude and longitude.", "error");
      setIsSubmittingBefore(false);
      setSubmissionStatus("Submit Report");
      return;
    }

    // --------------------------------------
    // PAYLOAD
    // --------------------------------------
    const payload = {
      image: base64Data,
      lat: latToSend,
      lon: lonToSend,
      description: descriptionBefore,
      username: user?.username,
    };

    const response = await apiClient.post("/report", payload);

    // --------------------------------------
    // HANDLE REJECTION
    // --------------------------------------
    if (response.data.message === "rejected") {
      showMessage(
        `Report rejected: ${response.data.reason}. Try a clearer outdoor photo.`,
        "error"
      );
      setIsSubmittingBefore(false);
      setSubmissionStatus("Submit Report");
      return;
    }

    // --------------------------------------
    // HANDLE ACCEPTANCE
    // --------------------------------------
    if (response.data.message === "accepted") {
      setSubmissionStatus("Submitting...");

      // Reset UI fields
      setImageBefore(null);
      setDescriptionBefore("");
      setTestingMode(false);

      showMessage("Waste report submitted successfully!", "success");

      // Refresh dashboard
      await loadDashboardData();

      setIsSubmittingBefore(false);
      setSubmissionStatus("Submit Report");
    }
  } catch (error) {
    console.error("Submission failed:", error);
    showMessage(
      error.response?.data?.detail ||
      error.response?.data?.error ||
      "Something went wrong.",
      "error"
    );
    setIsSubmittingBefore(false);
    setSubmissionStatus("Submit Report");
  }
};

const handleFileUpload = (e) => {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onloadend = () => {
    if (cameraType === "before") {
      setImageBefore(reader.result);
    } else if (cameraType === "after") {
      setImageAfter(reader.result);
    }
  };

  reader.readAsDataURL(file);
};


  
  // --- SUBMIT LOGIC FOR FORM 2 (Calls Backend) ---
 const handleSubmitAfter = async () => {
  if (!imageAfter) {
    showMessage("Please capture or upload an image.", "error");
    return;
  }

  // If NOT testing mode -> require GPS
  if (!testingMode && !hasLocationAfter) {
    showMessage("Please allow location access.", "error");
    return;
  }

  setIsSubmittingAfter(true);
  setSubmissionStatus("Submitting...");

  try {
    // Extract BASE64 string
    const base64Data = imageAfter.includes(",")
      ? imageAfter.split(",")[1]
      : imageAfter;

    // --------------------------------------
    // SELECT LOCATION SOURCE
    // --------------------------------------
    const latToSend = testingMode
      ? Number(latAfter)        // manual GPS for testing
      : locationAfter?.lat;     // live GPS

    const lonToSend = testingMode
      ? Number(lonAfter)
      : locationAfter?.lng;

    if (!latToSend || !lonToSend) {
      showMessage("Please enter valid latitude and longitude.", "error");
      setIsSubmittingAfter(false);
      return;
    }

    // --------------------------------------
    // PAYLOAD (no report_id needed now)
    // --------------------------------------
    const payload = {
      image: base64Data,
      lat: latToSend,
      lon: lonToSend,
      description: descriptionAfter,
      username: user?.username,
    };

    const response = await apiClient.post("/cleanup", payload);

    // --------------------------------------
    // SUCCESS FLOW
    // --------------------------------------
    setImageAfter(null);
    setDescriptionAfter("");
    setTestingMode(false);
    setSelectedReportId("");

    showMessage("Cleanup photo submitted successfully!", "success");

    await loadDashboardData();  // refresh UI

    setIsSubmittingAfter(false);
    setSubmissionStatus("Submit Cleanup");

  } catch (error) {
    console.error("Cleanup submission failed:", error);

    showMessage(
      error.response?.data?.detail ||
      error.response?.data?.error ||
      "An error occurred.",
      "error"
    );

    setIsSubmittingAfter(false);
    setSubmissionStatus("Submit Cleanup");
  }
};

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <motion.header
        className="bg-surface border-b border-muted sticky top-0 z-50"
        initial={{ y: -100 }}
        animate={{ y: 0 }}
      >
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold">Prakriti - Citizen Portal</h1>
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

        {/* --- ROW 1: ANALYTICS (now from API) --- */}
        <Analytics 
          pendingCount={analytics?.pending_count || 0}
          completedCount={analytics?.completed_count || 0}
          verifiedCount={analytics?.verified_count || 0}
        />

        {/* --- ROW 2: FORMS (INDEPENDENT) --- */}
        <div className="grid lg:grid-cols-2 gap-8 mb-12">
          
          {/* SECTION 1: REPORT WASTE (FORM 1) */}
          <motion.div initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }}>
            <div className="bg-surface rounded-2xl p-8 border border-muted sticky top-24">
              <h2 className="text-2xl font-bold mb-6">Report Waste</h2>
              {hasLocationBefore ? (
                <motion.div className="p-4 bg-accent-green/10 border border-accent-green rounded-lg flex items-center gap-3 mb-6">
                  <Check className="w-5 h-5 text-accent-green" />
                  <p className="font-semibold">Location Allowed</p>
                </motion.div>
              ) : (
                <button
                  onClick={() => requestLocation('before')}
                  className="w-full py-3 px-4 bg-muted hover:bg-muted rounded-lg font-semibold mb-6 flex items-center justify-center gap-2"
                >
                  <MapPin className="w-5 h-5" /> Allow Location Access
                </button>
              )}
              {cameraOpen && cameraType === "before" ? (
  <div className="mb-6">
    <div className="relative rounded-lg overflow-hidden border-2 border-accent-green bg-black">
      <video ref={videoRef} autoPlay playsInline muted className="w-full h-80 object-cover" />
      <div className="absolute bottom-4 left-0 right-0 flex gap-3 justify-center px-4">
        <button onClick={capturePhoto} className="px-8 py-3 bg-accent-green text-white rounded-lg font-bold flex items-center gap-2">
          <Camera className="w-6 h-6" /> Capture
        </button>
        <button onClick={stopCamera} className="px-8 py-3 bg-accent-red text-white rounded-lg font-bold">
          <X className="w-6 h-6" />
        </button>
      </div>
    </div>
  </div>
) : (
  <>
    <button
      onClick={() => startCamera("before")}
      className="w-full py-3 px-4 bg-muted hover:bg-muted rounded-lg font-semibold mb-4 flex items-center justify-center gap-2"
    >
      <Camera className="w-5 h-5" /> Take "Before" Photo
    </button>

    {/* Upload From Device (Testing Mode) */}
    <button
      onClick={() => {
        setTestingMode(true);
        setCameraType("before");
        fileInputRef.current.click();
      }}
      className="w-full py-3 px-4 bg-black rounded-lg font-semibold mb-6 flex items-center justify-center gap-2"
    >
      📁 Upload From Device (Testing)
    </button>

    <input
      type="file"
      accept="image/*"
      ref={fileInputRef}
      onChange={handleFileUpload}
      className="hidden"
    />
  </>
)}

              {imageBefore && !cameraOpen && (
                <motion.div className="mb-6 relative rounded-lg overflow-hidden border border-muted">
                  <img src={imageBefore} alt="Captured Before" className="w-full h-48 object-cover" />
                  <button onClick={() => setImageBefore(null)} className="absolute top-2 right-2 p-2 bg-accent-red rounded-lg">
                    <X className="w-4 h-4 text-white" />
                  </button>
                </motion.div>
              )}
              {/* Manual Location Inputs (Testing Mode) */}
{testingMode && (
  <div className="mb-6">
    <label className="block text-sm font-semibold mb-2">Manual Latitude</label>
    <input
      type="number"
      value={latBefore}
      onChange={(e) => setLatBefore(e.target.value)}
      placeholder="Enter latitude manually"
      className="w-full px-4 py-3 bg-background border border-muted rounded-lg mb-3"
    />

    <label className="block text-sm font-semibold mb-2">Manual Longitude</label>
    <input
      type="number"
      value={lonBefore}
      onChange={(e) => setLonBefore(e.target.value)}
      placeholder="Enter longitude manually"
      className="w-full px-4 py-3 bg-background border border-muted rounded-lg"
    />
  </div>
)}

              <div className="mb-6">
                <label className="block text-sm font-semibold mb-2">Description</label>
                <textarea
                  value={descriptionBefore}
                  onChange={(e) => setDescriptionBefore(e.target.value)}
                  placeholder="Describe the waste situation..."
                  className="w-full h-24 px-4 py-3 bg-background border border-muted rounded-lg focus:outline-none focus:border-accent-green"
                />
              </div>
              <motion.button
                onClick={handleSubmitBefore}
                disabled={isSubmittingBefore}
                className="w-full py-3 px-4 bg-accent-green hover:bg-accent-green-dark disabled:bg-muted text-white rounded-lg font-semibold flex items-center justify-center gap-2"
              >
                {isSubmittingBefore ? <Loader className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                {isSubmittingBefore ? submissionStatus : "Submit Report"}
              </motion.button>
            </div>
          </motion.div>

          {/* SECTION 2: AFTER CLEANUP PHOTO (FORM 2) - MODIFIED */}
          <motion.div initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }}>
            <div className="bg-surface rounded-2xl p-8 border border-muted sticky top-24">
              <h2 className="text-2xl font-bold mb-6">After Cleanup Photo</h2>
              

              {hasLocationAfter ? (
                <motion.div className="p-4 bg-accent-green/10 border border-accent-green rounded-lg flex items-center gap-3 mb-6">
                  <Check className="w-5 h-5 text-accent-green" />
                  <p className="font-semibold">Location Allowed</p>
                </motion.div>
              ) : (
                <button
                  onClick={() => requestLocation('after')}
                  className="w-full py-3 px-4 bg-muted hover:bg-muted rounded-lg font-semibold mb-6 flex items-center justify-center gap-2"
                >
                  <MapPin className="w-5 h-5" /> Allow Location Access
                </button>
              )}
              {cameraOpen && cameraType === "after" ? (
  <div className="mb-6">
    <div className="relative rounded-lg overflow-hidden border-2 border-accent-green bg-black">
      <video ref={videoRef} autoPlay playsInline muted className="w-full h-80 object-cover" />
      <div className="absolute bottom-4 left-0 right-0 flex gap-3 justify-center px-4">
        <button onClick={capturePhoto} className="px-8 py-3 bg-accent-green text-white rounded-lg font-bold flex items-center gap-2">
          <Camera className="w-6 h-6" /> Capture
        </button>
        <button onClick={stopCamera} className="px-8 py-3 bg-accent-red text-white rounded-lg font-bold">
          <X className="w-6 h-6" />
        </button>
      </div>
    </div>
  </div>
) : (
  <>
    <button
      onClick={() => startCamera("after")}
      className="w-full py-3 px-4 bg-muted hover:bg-muted rounded-lg font-semibold mb-4 flex items-center justify-center gap-2"
    >
      <Camera className="w-5 h-5" /> Take "After" Photo
    </button>

    {/* Upload From Device (Testing Mode) */}
    <button
      onClick={() => {
        setTestingMode(true);
        setCameraType("after");
        fileInputRef.current.click();
      }}
      className="w-full py-3 px-4 bg-black rounded-lg font-semibold mb-6 flex items-center justify-center gap-2"
    >
      📁 Upload From Device (Testing)
    </button>

    <input
      type="file"
      accept="image/*"
      ref={fileInputRef}
      onChange={handleFileUpload}
      className="hidden"
    />
  </>
)}
              {imageAfter && !cameraOpen && (
                <motion.div className="mb-6 relative rounded-lg overflow-hidden border border-muted">
                  <img src={imageAfter} alt="Captured After" className="w-full h-48 object-cover" />
                  <button onClick={() => setImageAfter(null)} className="absolute top-2 right-2 p-2 bg-accent-red rounded-lg">
                    <X className="w-4 h-4 text-white" />
                  </button>
                </motion.div>
              )}
              {/* Manual Location Inputs (Testing Mode) */}
{testingMode && (
  <div className="mb-6">
    <label className="block text-sm font-semibold mb-2">Manual Latitude</label>
    <input
      type="number"
      value={latAfter}
      onChange={(e) => setLatAfter(e.target.value)}
      placeholder="Enter latitude manually"
      className="w-full px-4 py-3 bg-background border border-muted rounded-lg mb-3"
    />

    <label className="block text-sm font-semibold mb-2">Manual Longitude</label>
    <input
      type="number"
      value={lonAfter}
      onChange={(e) => setLonAfter(e.target.value)}
      placeholder="Enter longitude manually"
      className="w-full px-4 py-3 bg-background border border-muted rounded-lg"
    />
  </div>
)}

              <div className="mb-6">
                <label className="block text-sm font-semibold mb-2">Description (Optional)</label>
                <textarea
                  value={descriptionAfter}
                  onChange={(e) => setDescriptionAfter(e.target.value)}
                  placeholder="Describe the cleanup (e.g., 'All clean now')..."
                  className="w-full h-24 px-4 py-3 bg-background border border-muted rounded-lg focus:outline-none focus:border-accent-green"
                />
              </div>
              <motion.button
                onClick={handleSubmitAfter}
                disabled={isSubmittingAfter}
                className="w-full py-3 px-4 bg-accent-blue hover:bg-accent-blue-dark disabled:bg-muted text-white rounded-lg font-semibold flex items-center justify-center gap-2"
              >
                {isSubmittingAfter ? <Loader className="w-5 h-5 animate-spin" /> : <Check className="w-5 h-5" />}
                {isSubmittingAfter ? "Submitting..." : "Submit Cleanup Photo"}
              </motion.button>
            </div>
          </motion.div>
        </div>

        {/* --- ROW 3: MAP --- */}
        <motion.div className="mb-12 relative z-10" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}>
          <div className="bg-surface rounded-2xl p-8 border border-muted">
            <h2 className="text-2xl font-bold mb-4">Waste Hotspots Map</h2>
            <p className="text-muted-foreground mb-4">
              Showing all 'Pending' status reports. Verified reports are removed.
            </p>
            <div className="h-[600px] rounded-lg overflow-hidden border border-muted">
              <Map 
                submissions={pendingBeforeReports.map(r => ({...r, location: { lat: r.lat, lng: r.lon }}))} // Format for Map
                location={locationBefore || locationAfter} // Pass last known location
              />
            </div>
          </div>
        </motion.div>

        {/* --- ROW 4: REPORT SECTIONS (now from API state) --- */}
        
        <ReportSection
          title="Pending Reports"
          subtitle='Waste reports awaiting an "After" cleanup photo.'
          reports={pendingBeforeReports}
          cardType="single"
        />
        
        <ReportSection
          title="Completed (Awaiting Verification)"
          subtitle='Paired "Before" and "After" photos that are waiting for an official to verify.'
          reports={completedPairs}
          cardType="paired"
          statusText="Awaiting Verification"
          statusColor="blue"
        />

        <ReportSection
          title="Verified by Officials"
          subtitle='Great work! These are your cleanup reports that have been officially verified.'
          reports={verifiedPairs}
          cardType="paired"
          statusText="Verified"
          statusColor="green"
        />

      </div>
      
      {/* This single canvas is used by both forms, depending on which one opens the camera */}
      <canvas ref={canvasRef} className="hidden" />

      {/* --- MESSAGE MODAL --- */}
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

export default CitizenDashboard