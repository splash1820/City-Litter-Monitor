import { useEffect, useRef } from "react"
import L from "leaflet"
import "leaflet/dist/leaflet.css"

const Map = ({ submissions, location }) => {
  const mapRef = useRef(null)
  const mapInstanceRef = useRef(null)
  const markersRef = useRef([])

  useEffect(() => {
    if (!mapRef.current) return

    // 1. Initialize Map (only once)
    if (!mapInstanceRef.current) {
      mapInstanceRef.current = L.map(mapRef.current).setView([28.6139, 77.209], 12) // Default view

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "© OpenStreetMap contributors",
        maxZoom: 19,
      }).addTo(mapInstanceRef.current)
    }

    const map = mapInstanceRef.current

    // 2. Clear all previous markers
    markersRef.current.forEach((marker) => map.removeLayer(marker))
    markersRef.current = []

    // 3. Add user location marker
    if (location) {
      const userMarker = L.circleMarker([location.lat, location.lng], {
        radius: 8,
        fillColor: "#3B82F6", // Blue for user
        color: "#1F2937",
        weight: 2,
        opacity: 1,
        fillOpacity: 0.8, // User marker can stay semi-transparent
      })
        .bindPopup("Your Location")
        .addTo(map)

      markersRef.current.push(userMarker)
      map.setView([location.lat, location.lng], 14) // Re-center map on user
    }

    // 4. Add submission markers (Now only 'before' reports)
    submissions.forEach((submission) => {
      if (submission.location) {
        
        // --- SIMPLIFIED LOGIC ---
        // We only get 'before' reports now, so no 'if' check is needed
        const markerColor = "#F59E0B"; // Yellow (matches "Pending Reports" section)
        const reportType = "Pending Waste Report";

        const popupContent = `
          <div style="width: 280px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 14px; border-radius: 8px; overflow: hidden;">
            <img 
              src="${submission.image}" 
              alt="Report" 
              style="width: 100%; height: 160px; object-fit: cover; border-bottom: 1px solid #eee;" 
            />
            <div style="padding: 12px; background: #fff; color: #111;">
              <p style="font-weight: 600; font-size: 16px; margin: 0 0 4px 0;">${reportType}</p>
              <p style="font-size: 12px; color: #555; margin: 0 0 10px 0;">
                ${new Date(submission.created_at).toLocaleString()}
              </p>
              <p style="font-size: 14px; color: #333; margin: 0; line-height: 1.4; max-height: 60px; overflow-y: auto;">
                ${submission.description || "No description."}
              </p>
            </div>
          </div>
        `;

        const marker = L.circleMarker([submission.location.lat, submission.location.lng], {
          radius: 7,
          fillColor: markerColor,
          color: "#1F2937",
          weight: 2,
          opacity: 1,
          fillOpacity: 1, // --- FIX: Changed from 0.8 to 1 ---
        })
          .bindPopup(popupContent, {
            className: 'report-popup' // Custom class for styling
          })
          .addTo(map)

        markersRef.current.push(marker)
      }
    })
  }, [submissions, location])

  return <div ref={mapRef} className="w-full h-full rounded-lg" />
}

export default Map