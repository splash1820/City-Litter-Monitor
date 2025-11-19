import { motion, useMotionValue, useTransform, animate, useInView } from "framer-motion"
import { MapPin, Camera, BarChart3, Leaf, Users, Check } from "lucide-react"
import { Link } from "react-router-dom"
import Header from "../components/Header" // <-- Restored original import
import Footer from "../components/Footer" // <-- Restored original import
import { useEffect, useRef } from "react"
import WasteManagementImage from "../public/waste-management-pana.svg"

// --- AnimatedCounter Component ---
// This component counts up from 0 to the target number.
const AnimatedCounter = ({ to }) => {
  const count = useMotionValue(0)
  const rounded = useTransform(count, (latest) => Math.round(latest))
  const ref = useRef(null)
  const inView = useInView(ref, { once: true })

  useEffect(() => {
    if (inView) {
      animate(count, to, { duration: 1.5, ease: "easeOut" })
    }
  }, [inView, count, to])

  return <motion.span ref={ref}>{rounded}</motion.span>
}

// --- FeatureCard Component ---
// We extract the feature card to make the marquee code cleaner.
const FeatureCard = ({ feature }) => {
  const IconComponent = feature.icon
  return (
    <div className="shrink-0 w-80 md:w-96 p-8 bg-background rounded-xl border border-muted mx-4">
      <div className="mb-4 inline-block p-3 bg-accent-green/10 rounded-lg">
        <IconComponent className="w-8 h-8 text-accent-green" />
      </div>
      <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
      <p className="text-muted-foreground leading-relaxed">{feature.description}</p>
    </div>
  )
}

const LandingPage = () => {
  const features = [
    {
      icon: Camera,
      title: "Smart Capture",
      description: "Report waste directly from your camera with automatic location tagging",
    },
    {
      icon: MapPin,
      title: "Live Hotspots",
      description: "View litter-prone zones on interactive city maps in real-time",
    },
    {
      icon: BarChart3,
      title: "Analytics Dashboard",
      description: "Track cleanup trends, efficiency metrics, and community impact",
    },
    {
      icon: Users,
      title: "Community Driven",
      description: "Collaborate with citizens and officials for cleaner cities",
    },
    {
      icon: Leaf,
      title: "Eco Impact",
      description: "Monitor environmental improvements and celebrate achievements",
    },
    {
      icon: Check,
      title: "Verification System",
      description: "Official approval and before-after documentation",
    },
  ]
  
  // --- Animation Variants ---
  
  // For letter-by-letter title animation
  const titleVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  }
  
  const letterVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 100 } },
  }
  const title = "Prakriti"

  // For word-by-word subtitle animation
  const subtitleVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.08,
      },
    },
  }
  const subtitleWordVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } },
  }
  const subtitle = "Smart Waste Monitoring for Cleaner Cities"

  return (
    // --- Static gradient to prevent flash ---
    <div className="text-foreground bg-linear-to-b from-background to-surface">
      <Header />

      {/* Hero Section */}
      <section className="min-h-screen flex items-center justify-center px-4 md:px-8 overflow-hidden">
        <div className="grid lg:grid-cols-2 gap-12 items-center max-w-6xl mx-auto">
        <motion.div
          className="text-center lg:text-left max-w-4xl mx-auto -mt-30"
          initial="hidden"
          animate="visible"
        >
          <motion.div
            className="mb-8"
            variants={{
              hidden: { scale: 0.9, opacity: 0 },
              visible: { scale: 1, opacity: 1, transition: { duration: 0.8, delay: 0.2 } }
            }}
          >
            <motion.div 
              className="flex items-center justify-center lg:justify-start mb-6"
              animate={{ y: [0, -10, 0] }} // Floating animation
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            >
              <Leaf className="w-16 h-16 text-accent-green" />
            </motion.div>
            
            {/* Letter-by-letter Title Animation */}
            <motion.h1 
              className="text-5xl md:text-7xl font-bold text-pretty leading-tight mb-6"
              variants={titleVariants}
            >
              {title.split("").map((char, index) => (
                <motion.span 
                  key={index} 
                  className="inline-block"
                  variants={letterVariants}
                >
                  {char}
                </motion.span>
              ))}
            </motion.h1>
            
            {/* Word-by-word Subtitle Animation */}
            <motion.p 
              className="text-xl md:text-2xl text-muted-foreground text-pretty mb-8"
              variants={subtitleVariants}
            >
              {subtitle.split(" ").map((word, index) => (
                <motion.span 
                  key={index} 
                  className="inline-block mr-2"
                  variants={subtitleWordVariants}
                >
                  {word}
                </motion.span>
              ))}
            </motion.p>
          </motion.div>

          <motion.p
            className="text-lg md:text-xl text-muted-foreground mb-12 max-w-2xl mx-auto leading-relaxed"
            variants={subtitleWordVariants} // Re-use variant
          >
            Empower citizens to report waste hotspots, help officials track cleanup efforts, and build a cleaner
            community together through crowdsourced data and real-time collaboration.
          </motion.p>
          
          <motion.div
            variants={subtitleWordVariants}
          >
            <motion.div
              className="inline-block"
              whileHover={{ scale: 1.05 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <Link
                to="/auth"
                className="px-8 py-4 bg-accent-green text-background rounded-lg font-semibold hover:bg-accent-green-dark transition-all"
              >
                Get Started
              </Link>
            </motion.div>
          </motion.div>
        </motion.div>

                        {/* --- NEW: Image Content --- */}
          <motion.div 
            className="hidden lg:block" // Only show on large screens
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.4 }}
          >
            {/* --- FIX: Use correct public path. --- 
              Make sure your file is at /public/waste-management-pana.svg
            */}
            <img 
              src={WasteManagementImage}
              alt="Waste Management Illustration" 
              className="w-full h-auto"
            />
          </motion.div>
      </div>
      </section>

      {/* --- Features Section (Marquee) --- */}
      <section className="py-20 md:py-22 px-0 md:px-0 bg-surface overflow-hidden">
        <div className="max-w-6xl mx-auto text-center mb-16 px-4">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-4">Powerful Features</h2>
            <p className="text-muted-foreground text-lg">Everything you need to make an impact</p>
          </motion.div>
        </div>

        {/* --- Single Marquee Row --- */}
        <div className="w-full overflow-hidden mb-8">
          <motion.div
            className="flex"
            animate={{ x: [0, "-100%"] }}
            transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
          >
            {/* Render full list twice for seamless loop */}
            {[...features, ...features].map((feature, index) => (
              <FeatureCard feature={feature} key={`feature-${index}`}/>
            ))}
          </motion.div>
        </div>
        
      </section>

      {/* --- Impact Section (Animated Counter) --- */}
      <section className="py-20 md:py-32 px-4 md:px-8 ">
        <div className="max-w-6xl mx-auto">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-4">Our Impact</h2>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              { value: 50, label: "K+ Reports Filed" },
              { value: 15, label: "K+ Cleanups Completed" },
              { value: 200, label: "+ Active Citizens" },
            ].map((stat, index) => (
              <motion.div
                key={index}
                className="text-center p-8 rounded-xl bg-background border border-surface"
                initial={{ scale: 0.9, opacity: 0 }}
                whileInView={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
              >
                <p className="text-5xl md:text-6xl font-bold text-accent-green mb-2">
                  <AnimatedCounter to={stat.value} />
                  {/* Suffix is added here */}
                  {stat.label.split(" ")[0].replace(/[0-9]/g, '')} 
                </p>
                <p className="text-muted-foreground text-lg">
                  {stat.label.substring(stat.label.indexOf(" ") + 1)}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}

export default LandingPage