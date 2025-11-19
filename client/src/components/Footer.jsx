"use client"
import { motion } from "framer-motion"
import { Leaf } from "lucide-react"

const Footer = () => {
  return (
    <motion.footer
      className="bg-background border-b border-muted mt-20"
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      transition={{ duration: 0.8 }}
      viewport={{ once: true }}
    >
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-16">
        <div className="grid md:grid-cols-4 gap-12 mb-12">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <Leaf className="w-6 h-6 text-accent-green" />
              <h3 className="text-lg font-bold">Prakriti</h3>
            </div>
            <p className="text-muted-foreground">Smart waste monitoring for cleaner cities</p>
          </div>

          {[
            {
              title: "Product",
              links: ["Features", "Pricing", "Security", "Roadmap"],
            },
            {
              title: "Company",
              links: ["About", "Blog", "Careers", "Contact"],
            },
            {
              title: "Legal",
              links: ["Privacy", "Terms", "Cookie Policy", "Compliance"],
            },
          ].map((col, i) => (
            <div key={i}>
              <h4 className="font-semibold mb-4">{col.title}</h4>
              <ul className="space-y-2">
                {col.links.map((link, j) => (
                  <li key={j}>
                    <a href="#" className="text-muted-foreground hover:text-accent-green transition-colors">
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="border-t border-muted pt-8 text-center text-muted-foreground">
          <p>© 2025 Prakriti. Making cities cleaner, one report at a time.</p>
        </div>
      </div>
    </motion.footer>
  )
}

export default Footer
