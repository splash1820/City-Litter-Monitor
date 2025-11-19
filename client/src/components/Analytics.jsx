import { motion } from "framer-motion"
import { Clock, CheckSquare, Check } from "lucide-react"

// Helper component
const StatCard = ({ title, value, icon, color }) => (
  <motion.div
    className="bg-surface p-6 rounded-2xl border border-muted flex items-center gap-4"
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
  >
    <div className={`p-3 rounded-lg ${color}`}>
      {icon}
    </div>
    <div>
      <p className="text-sm font-semibold text-muted-foreground">{title}</p>
      <p className="text-3xl font-bold">{value}</p>
    </div>
  </motion.div>
)

const Analytics = ({ pendingCount, completedCount, verifiedCount }) => {
  return (
    <motion.div
      className="mb-8"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <h2 className="text-2xl font-bold mb-6">Total Activity</h2>
      <div className="grid md:grid-cols-3 gap-6">
        <StatCard
          title="Pending Reports"
          value={pendingCount}
          icon={<Clock className="w-6 h-6 text-accent-yellow-dark" />}
          color="bg-accent-yellow/20"
        />
        <StatCard
          title="Awaiting Verification"
          value={completedCount}
          icon={<CheckSquare className="w-6 h-6 text-accent-blue-dark" />}
          color="bg-accent-blue/20"
        />
        <StatCard
          title="Verified Cleanups"
          value={verifiedCount}
          icon={<Check className="w-6 h-6 text-accent-green-dark" />}
          color="bg-accent-green/20"
        />
      </div>
    </motion.div>
  )
}

export default Analytics;