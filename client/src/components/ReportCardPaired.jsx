import { motion } from "framer-motion"

const ReportCardPaired = ({ pair, statusText, statusColor }) => {

  const colorClasses = {
    blue: {
      border: "hover:border-accent-blue",
      dot: "bg-accent-blue",
      text: "text-accent-blue-dark"
    },
    green: {
      border: "hover:border-accent-green",
      dot: "bg-accent-green",
      text: "text-accent-green-dark"
    }
  }

  const colors = colorClasses[statusColor] || colorClasses.blue

  return (
    <motion.div
      key={pair.id}
      className={`bg-surface rounded-xl overflow-hidden border border-muted ${colors.border}`}
      whileHover={{ translateY: -5 }}
    >
      <div className="flex w-full h-40">
        <div className="w-1/2 relative">
          <span className="absolute top-2 left-2 bg-black/50 text-white text-xs px-2 py-1 rounded">BEFORE</span>
          <img src={pair.beforeReport.before_image_base64} alt="Before" className="w-full h-full object-cover" />
        </div>
        <div className="w-1/2 relative border-l-2 border-surface">
          <span className="absolute top-2 left-2 bg-black/50 text-white text-xs px-2 py-1 rounded">AFTER</span>
          <img src={pair.afterReport.cleanup_image_base64} alt="After" className="w-full h-full object-cover" />
        </div>
      </div>
      <div className="p-4">
        <p className="text-sm text-muted-foreground mb-2">{new Date(pair.beforeReport.timestamp).toLocaleString()}</p>
        <p className="text-foreground line-clamp-2 mb-3">{pair.beforeReport.description}</p>
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${colors.dot}`}></div>
          <span className={`text-sm font-semibold capitalize ${colors.text}`}>{statusText}</span>
        </div>
      </div>
    </motion.div>
  )
}

export default ReportCardPaired