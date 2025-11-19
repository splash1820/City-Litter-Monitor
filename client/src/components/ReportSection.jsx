import { motion } from "framer-motion"
import PendingReports from "./PendingReports"
import ReportCardPaired from "./ReportCardPaired"

const ReportSection = ({ title, subtitle, reports, cardType, statusText, statusColor }) => {
  const isEmpty = reports.length === 0;

  return (
    <motion.div
      className="mb-12"
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
    >
      {/* --- THIS LINE IS FIXED --- */}
      <h2 className="text-2xl font-bold mb-6">{title}</h2>
      {subtitle && (
        <p className="text-muted-foreground mb-4 -mt-4">
          {subtitle}
        </p>
      )}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isEmpty ? (
          <p className="p-4 text-muted-foreground md:col-span-3">No reports in this category yet.</p>
        ) : (
          reports.map(item =>
            cardType === 'single' ? (
              <PendingReports key={item.id} submission={item} />
            ) : (
              <ReportCardPaired 
                key={item.id} 
                pair={item} 
                statusText={statusText} 
                statusColor={statusColor} 
              />
            )
          )
        )}
      </div>
    </motion.div>
  )
}

export default ReportSection