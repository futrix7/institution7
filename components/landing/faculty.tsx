"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Award, Briefcase, GraduationCap, User } from "lucide-react"
import { supabase } from "@/lib/supabase"

interface Founder {
  name: string
  role: string
  qualifications: string[]
  description: string
}

interface FacultyMember {
  name: string
  role: string
  branch: string
}

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1 } },
}

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
}

export function Faculty() {
  const [founder, setFounder] = useState<Founder | null>(null)
  const [faculty, setFaculty] = useState<FacultyMember[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchFaculty() {
      const { data } = await supabase
        .from("faculty")
        .select("*")
      if (data) {
        const founderRow = data.find((f: any) => f.is_founder)
        if (founderRow) {
          setFounder({
            name: founderRow.name,
            role: founderRow.role,
            qualifications: founderRow.qualifications ?? [],
            description: founderRow.description ?? "",
          })
        }
        setFaculty(
          data
            .filter((f: any) => !f.is_founder)
            .map((f: any) => ({
              name: f.name,
              role: f.role,
              branch: f.branch ?? "",
            }))
        )
      }
      setLoading(false)
    }
    fetchFaculty()
  }, [])

  return (
    <section id="faculty" className="py-16 sm:py-24 bg-muted/20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <motion.span
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-xs font-semibold uppercase tracking-widest text-primary sm:text-sm"
          >
            Meet Our Team
          </motion.span>
          <motion.h2
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.08 }}
            className="mt-2 text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl lg:text-4xl"
          >
            About the Founder & Our Faculty
          </motion.h2>
        </div>

        {loading ? (
          <div className="mt-10 sm:mt-12 space-y-8">
            <div className="mx-auto max-w-5xl h-72 animate-pulse rounded-2xl border border-border/60 bg-muted/50" />
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-32 animate-pulse rounded-2xl border border-border/60 bg-muted/50" />
              ))}
            </div>
          </div>
        ) : (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-60px" }}
            className="mt-10 sm:mt-12"
          >
            {/* Founder Card - Portrait Style */}
            {founder && (
              <motion.div
                variants={cardVariants}
                className="mx-auto mb-8 max-w-5xl overflow-hidden rounded-2xl border border-primary/20 bg-card ring-1 ring-primary/10"
              >
                <div className="flex flex-col md:flex-row">
                  {/* Portrait Image Placeholder - Taller, narrower portrait style */}
                  <div className="relative flex items-center justify-center bg-gradient-to-b from-primary/8 via-primary/5 to-primary/10 md:w-56 lg:w-64 min-h-[320px] md:min-h-[400px]">
                    <div className="flex size-28 items-center justify-center rounded-full bg-primary/10 text-primary ring-4 ring-primary/10 sm:size-32 lg:size-36">
                      <User className="size-14 sm:size-16" />
                    </div>
                    <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-gradient-to-r from-primary via-primary/80 to-primary/40" />
                  </div>

                  {/* Content */}
                  <div className="flex-1 p-6 sm:p-8 lg:p-10">
                    <div className="flex items-center gap-2">
                      <div className="flex size-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
                        <Award className="size-5" />
                      </div>
                      <span className="text-[10px] font-bold uppercase tracking-widest text-primary sm:text-xs">
                        Founder
                      </span>
                    </div>

                    <h3 className="mt-4 text-2xl font-extrabold text-foreground sm:text-3xl">
                      {founder.name}
                    </h3>

                    <div className="mt-4 flex flex-wrap gap-2">
                      {founder.qualifications.map((q) => (
                        <span
                          key={q}
                          className="inline-flex items-center gap-1.5 rounded-lg bg-muted px-3 py-1.5 text-[11px] font-semibold text-muted-foreground sm:text-xs"
                        >
                          <GraduationCap className="size-3.5 text-primary" />
                          {q}
                        </span>
                      ))}
                    </div>

                    <p className="mt-5 text-sm leading-relaxed text-muted-foreground sm:text-base">
                      {founder.description}
                    </p>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Other Faculty */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-4">
              {faculty.map((member) => (
                <motion.div
                  key={member.name}
                  variants={cardVariants}
                  className="group rounded-2xl border border-border/60 bg-card p-4 transition-all duration-200 hover:border-primary/15 hover:shadow-sm sm:p-5"
                >
                  <div className="flex size-10 items-center justify-center rounded-xl bg-muted text-muted-foreground transition-colors group-hover:bg-primary/10 group-hover:text-primary sm:size-11">
                    <Briefcase className="size-5" />
                  </div>
                  <h3 className="mt-3 text-sm font-bold text-foreground sm:text-base">
                    {member.name}
                  </h3>
                  <p className="mt-0.5 text-xs font-semibold text-primary sm:text-sm">
                    {member.role}
                  </p>
                  <p className="mt-1 text-[11px] text-muted-foreground sm:text-xs">
                    {member.branch}
                  </p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </div>
    </section>
  )
}
