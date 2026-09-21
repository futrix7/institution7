"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { MapPin, Phone, Clock } from "lucide-react"
import { supabase } from "@/lib/supabase"

interface Branch {
  name: string
  tag?: string
  address: string
  city: string
  note?: string
  primary: boolean
}

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1 } },
}

const cardVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
}

export function Branches() {
  const [branches, setBranches] = useState<Branch[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchBranches() {
      const { data } = await supabase
        .from("branches")
        .select("name, tag, address, city, note, primary")
      setBranches(data ?? [])
      setLoading(false)
    }
    fetchBranches()
  }, [])

  return (
    <section id="branches" className="py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <span className="text-sm font-semibold uppercase tracking-widest text-primary">
              Our Branches
            </span>
            <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl lg:text-5xl">
              Visit us{" "}
              <span className="text-primary">near you</span>
            </h2>
          </motion.div>
        </div>

        {loading ? (
          <div className="mt-14 grid gap-5 sm:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-48 animate-pulse rounded-2xl border border-border/60 bg-muted/50" />
            ))}
          </div>
        ) : (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-60px" }}
            className="mt-14 grid gap-5 sm:grid-cols-3"
          >
            {branches.map((branch) => (
              <motion.div
                key={branch.name}
                variants={cardVariants}
                className={`group relative overflow-hidden rounded-2xl border bg-card p-7 text-card-foreground transition-all duration-300 hover:shadow-lg hover:-translate-y-1 ${
                  branch.primary
                    ? "border-primary/30 ring-1 ring-primary/10"
                    : "border-border/60 hover:border-primary/20"
                }`}
              >
                {branch.primary && (
                  <div className="absolute top-0 left-0 h-1 w-full bg-gradient-to-r from-primary to-primary/60" />
                )}

                <div className="flex items-center gap-3">
                  <div
                    className={`flex size-11 items-center justify-center rounded-xl ${
                      branch.primary
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary"
                    } transition-colors`}
                  >
                    <MapPin className="size-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-extrabold text-foreground">
                      {branch.name}
                    </h3>
                    {branch.tag && (
                      <span className="text-xs font-bold uppercase tracking-wider text-primary">
                        {branch.tag}
                      </span>
                    )}
                  </div>
                </div>

                <div className="mt-4 space-y-1">
                  <p className="text-sm text-muted-foreground">
                    {branch.address}
                  </p>
                  <p className="text-sm font-medium text-foreground">
                    {branch.city}
                  </p>
                  {branch.note && (
                    <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Clock className="size-3" />
                      {branch.note}
                    </p>
                  )}
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>
    </section>
  )
}
