import { motion } from "framer-motion"

const PendingReports = ({ submission }) => {
  return (
    <motion.div
      key={submission.id}
      className="bg-surface rounded-xl overflow-hidden border border-muted hover:border-accent-yellow"
      whileHover={{ translateY: -5 }}
    >
      <img
        src={submission.image}
        alt="Submission"
        className="w-full h-40 object-cover"
      />
      <div className="p-4">
        <p className="text-sm text-muted-foreground mb-2">{submission.created_at.toLocaleString()}</p>
        <p className="text-foreground line-clamp-2 mb-3">{submission.description}</p>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-accent-yellow"></div>
          <span className="text-sm font-semibold capitalize text-accent-yellow-dark">Pending Cleanup</span>
        </div>
      </div>
    </motion.div>
  )
}

export default PendingReports;