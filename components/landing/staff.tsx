"use client"

import { motion } from "framer-motion"
import { Crown, Shield, Briefcase, Phone, Award, GraduationCap, User } from "lucide-react"

const team = [
  {
    name: "Mada Nadiya",
    role: "Director",
    phone: "8464993624",
    icon: Crown,
    color: "text-amber-600 dark:text-amber-400",
    bg: "bg-amber-500/10",
    featured: true,
  },
  {
    name: "Mada Eswararao",
    role: "Manager",
    phone: "8143248778",
    icon: Shield,
    color: "text-blue-600 dark:text-blue-400",
    bg: "bg-blue-500/10",
    featured: false,
  },
  {
    name: "Ganta Madhav Rao",
    role: "Faculty",
    phone: "8790745614",
    icon: Briefcase,
    color: "text-emerald-600 dark:text-emerald-400",
    bg: "bg-emerald-500/10",
    featured: false,
  },
]

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1 } },
}

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
}

export function Staff() {
  const director = team.find((m) => m.featured)
  const others = team.filter((m) => !m.featured)

  return (
    <section id="staff" className="py-16 sm:py-24 bg-muted/20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <motion.span
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-xs font-semibold uppercase tracking-widest text-primary sm:text-sm"
          >
            Our Team
          </motion.span>
          <motion.h2
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.08 }}
            className="mt-2 text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl lg:text-4xl"
          >
            Meet the People Behind TNGC
          </motion.h2>
        </div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-60px" }}
          className="mt-10 sm:mt-12"
        >
          {/* Director - Featured Card */}
          {director && (
            <motion.div
              variants={cardVariants}
              className="mx-auto mb-8 max-w-5xl overflow-hidden rounded-2xl border border-primary/20 bg-card ring-1 ring-primary/10"
            >
              <div className="flex flex-col md:flex-row">
                <div className="relative flex items-center justify-center bg-gradient-to-b from-primary/8 via-primary/5 to-primary/10 md:w-56 lg:w-64 min-h-[320px] md:min-h-[400px]">
                  <div className="flex size-28 items-center justify-center rounded-full bg-primary/10 text-primary ring-4 ring-primary/10 sm:size-32 lg:size-36">
                    <User className="size-14 sm:size-16" />
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-gradient-to-r from-primary via-primary/80 to-primary/40" />
                </div>

                <div className="flex-1 p-6 sm:p-8 lg:p-10">
                  <div className="flex items-center gap-2">
                    <div className="flex size-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
                      <Award className="size-5" />
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-primary sm:text-xs">
                      {director.role}
                    </span>
                  </div>

                  <h3 className="mt-4 text-2xl font-extrabold text-foreground sm:text-3xl">
                    {director.name}
                  </h3>

                  <div className="mt-4 flex flex-wrap gap-2">
                    {["24+ Years Experience", "Institutional Leadership"].map((q) => (
                      <span
                        key={q}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-muted px-3 py-1.5 text-[11px] font-semibold text-muted-foreground sm:text-xs"
                      >
                        <GraduationCap className="size-3.5 text-primary" />
                        {q}
                      </span>
                    ))}
                  </div>

                  <a
                    href={`tel:${director.phone}`}
                    className="mt-5 inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground sm:text-base"
                  >
                    <Phone className="size-4 text-primary" />
                    {director.phone}
                  </a>
                </div>
              </div>
            </motion.div>
          )}

          {/* Other Members */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-2">
            {others.map((member) => (
              <motion.div
                key={member.name}
                variants={cardVariants}
                className="group flex items-center gap-5 rounded-2xl border border-border/60 bg-card p-5 transition-all duration-200 hover:border-primary/20 hover:shadow-md sm:p-6"
              >
                <div className={`flex size-14 shrink-0 items-center justify-center rounded-2xl ${member.bg} ${member.color} sm:size-16`}>
                  <member.icon className="size-7 sm:size-8" />
                </div>
                <div>
                  <h3 className="text-lg font-extrabold text-foreground sm:text-xl">
                    {member.name}
                  </h3>
                  <p className="mt-0.5 text-sm font-semibold text-primary">
                    {member.role}
                  </p>
                  <a
                    href={`tel:${member.phone}`}
                    className="mt-1.5 inline-flex items-center gap-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground sm:text-sm"
                  >
                    <Phone className="size-3.5" />
                    {member.phone}
                  </a>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  )
}
