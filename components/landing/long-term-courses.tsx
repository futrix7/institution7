"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Clock, ArrowRight, Star, Eye, IndianRupee } from "lucide-react"
import { buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import Link from "next/link"
import { supabase } from "@/lib/supabase"

interface Course {
  slug: string
  name: string
  duration: string
  description: string
  topics: string[]
  fees?: number
  popular?: boolean
}

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.05 } },
}

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.35 } },
}

const priceMap: Record<string, number> = {
  DCA: 3500,
  ADCA: 6500,
  "Tally Prime": 3500,
  "C Language": 4500,
  PGDCA: 7000,
  "Core Java": 5000,
  "Adv Java": 5000,
  "Core Python": 4500,
  "Adv Python": 5000,
  DSA: 6000,
  "Java Full Stack": 30000,
  "Python Full Stack": 30000,
  "Data Science": 9000,
}

function getFees(course: Course): number {
  if (course.fees != null && course.fees > 0) return course.fees
  return priceMap[course.name] ?? 0
}

export function LongTermCourses() {
  const [courses, setCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchCourses() {
      const { data } = await supabase
        .from("courses")
        .select("slug, name, duration, description, topics, fees, popular")
        .eq("type", "long-term")
      setCourses(data ?? [])
      setLoading(false)
    }
    fetchCourses()
  }, [])

  return (
    <section id="courses" className="py-16 sm:py-24 bg-muted/20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <motion.span
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-xs font-semibold uppercase tracking-widest text-primary sm:text-sm"
          >
            Long-Term Professional Courses
          </motion.span>
          <motion.h2
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.08 }}
            className="mt-2 text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl lg:text-4xl"
          >
            Build strong careers with industry-ready programmes
          </motion.h2>
        </div>

        {loading ? (
          <div className="mt-10 grid grid-cols-1 gap-4 sm:mt-12 sm:grid-cols-2 sm:gap-5 lg:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-56 animate-pulse rounded-2xl border border-border/60 bg-muted/50" />
            ))}
          </div>
        ) : (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-60px" }}
            className="mt-10 grid grid-cols-1 gap-4 sm:mt-12 sm:grid-cols-2 sm:gap-5 lg:grid-cols-4"
          >
            {courses.map((course) => (
              <motion.div
                key={course.name}
                variants={cardVariants}
                className={`group relative flex flex-col rounded-2xl border bg-card p-5 transition-all duration-200 hover:shadow-md sm:p-6 ${
                  course.popular
                    ? "border-primary/25 ring-1 ring-primary/10"
                    : "border-border/60 hover:border-primary/15"
                }`}
              >
                {course.popular && (
                  <div className="mb-3 inline-flex items-center gap-1 self-start rounded-full bg-primary/10 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-primary">
                    <Star className="size-2.5 fill-current" />
                    Popular
                  </div>
                )}

                <h3 className="text-lg font-extrabold text-foreground">
                  {course.name}
                </h3>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {course.description}
                </p>

                <div className="mt-3 inline-flex items-center gap-1.5 self-start rounded-full bg-primary/10 px-2.5 py-1 text-[11px] font-semibold text-primary">
                  <Clock className="size-3" />
                  {course.duration}
                </div>

                <div className="mt-4 flex flex-wrap gap-1.5">
                  {course.topics.map((topic) => (
                    <span
                      key={topic}
                      className="rounded-lg bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground"
                    >
                      {topic}
                    </span>
                  ))}
                </div>

                <div className="mt-auto flex items-end justify-between pt-4">
                  <Link
                    href={`/courses/${course.slug}`}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary transition-colors hover:bg-primary/20"
                  >
                    <Eye className="size-3.5" />
                    View Details
                  </Link>

                  {getFees(course) > 0 && (
                    <div className="flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1.5 text-right">
                      <IndianRupee className="size-4 text-foreground" />
                      <span className="text-lg font-extrabold text-foreground sm:text-xl">
                        {new Intl.NumberFormat("en-IN").format(getFees(course))}
                      </span>
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}

        <motion.div
          initial={{ opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-8 text-center sm:mt-10"
        >
          <a
            href="#contact"
            className={cn(buttonVariants({ variant: "outline", size: "lg" }), "px-6 text-sm")}
          >
            Enquire About All Courses
            <ArrowRight className="size-4" />
          </a>
        </motion.div>
      </div>
    </section>
  )
}
