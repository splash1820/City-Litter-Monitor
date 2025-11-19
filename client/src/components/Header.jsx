import { motion } from "framer-motion"
import { Leaf } from "lucide-react"

const Header = () => {
  return (
    <motion.header
      className="bg-background border-b border-muted sticky top-0 z-50 backdrop-blur-md"
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-4 flex items-center justify-between">
        <motion.div className="flex items-center gap-3" whileHover={{ scale: 1.05 }}>
          <div className="p-2 bg-accent-green rounded-lg">
            <Leaf className="w-6 h-6 text-background" />
          </div>
          <h1 className="text-2xl font-bold">Prakriti</h1>
        </motion.div>
      </div>
    </motion.header>
  )
}

export default Header
