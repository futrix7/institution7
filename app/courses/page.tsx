"use client"

import { fetchCourses, type Course } from "@/lib/courses"
import { useEffect, useState } from "react"
import {
  Clock,
  IndianRupee,
  GraduationCap,
  Star,
  ArrowRight,
  BookOpen,
  Award,
  Users,
  Wrench,
  ArrowLeft,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"

function CourseCard({ course }: { course: Course }) {
  return (
    <Link
      href={`/courses/${course.slug}`}
      className="group flex flex-col rounded-xl border bg-card p-6 transition-all hover:shadow-md hover:border-primary/30 min-h-[260px]"
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <h3 className="text-lg font-bold text-foreground leading-tight group-hover:text-primary transition-colors">
          {course.name}
        </h3>
        {course.popular && (
          <Badge className="shrink-0 bg-amber-500/10 text-amber-700 border-amber-500/20 text-[10px]">
            <Star className="size-2.5 fill-current mr-0.5" />
            Popular
          </Badge>
        )}
      </div>

      <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
        {course.description}
      </p>

      <div className="flex flex-wrap gap-x-5 gap-y-2 mb-4">
        <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Clock className="size-3.5 text-primary shrink-0" />
          {course.duration}
        </span>
        <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <IndianRupee className="size-3.5 text-primary shrink-0" />
          {course.fees}
        </span>
        <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <GraduationCap className="size-3.5 text-primary shrink-0" />
          {course.eligibility}
        </span>
        <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Users className="size-3.5 text-primary shrink-0" />
          {course.batchSize}
        </span>
      </div>

      <div className="flex flex-wrap gap-1.5 mb-4">
        {course.topics.slice(0, 5).map((topic) => (
          <span
            key={topic}
            className="rounded-md bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground"
          >
            {topic}
          </span>
        ))}
        {course.topics.length > 5 && (
          <span className="rounded-md bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
            +{course.topics.length - 5} more
          </span>
        )}
      </div>

      <div className="mt-auto flex items-center justify-between border-t pt-3">
        <span
          className="relative text-xs text-muted-foreground max-w-[60%] truncate"
          title={course.certification}
        >
          <span className="inline-flex items-center gap-1.5">
            <Award className="size-3.5 text-primary shrink-0" />
            {course.certification.length > 25
              ? course.certification.slice(0, 25) + "..."
              : course.certification}
          </span>
        </span>
        <span className="inline-flex items-center gap-1 text-xs font-semibold text-primary group-hover:gap-2 transition-all">
          View Details
          <ArrowRight className="size-3.5" />
        </span>
      </div>
    </Link>
  )
}

export default function CoursesPage() {
  const [courses, setCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchCourses()
      .then(setCourses)
      .finally(() => setLoading(false))
  }, [])

  const longTerm = courses.filter((c) => c.type === "long-term")
  const shortTerm = courses.filter((c) => c.type === "short-term")

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Loading courses...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground mb-6"
        >
          <ArrowLeft className="size-4" />
          Back to Home
        </Link>

        <div className="mb-8">
          <h1 className="text-3xl font-extrabold text-foreground sm:text-4xl">
            Our Courses
          </h1>
          <p className="mt-2 text-muted-foreground">
            {courses.length} courses across {longTerm.length} long-term and {shortTerm.length} short-term programmes
          </p>
        </div>

        <div className="mb-12">
          <div className="flex items-center gap-2 mb-5">
            <div className="rounded-lg bg-primary/10 p-1.5">
              <BookOpen className="size-4 text-primary" />
            </div>
            <h2 className="text-xl font-bold text-foreground">Long-Term Courses</h2>
            <Badge variant="secondary" className="ml-1">{longTerm.length}</Badge>
          </div>
          <div className="grid gap-5 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {longTerm.map((course) => (
              <CourseCard key={course.slug} course={course} />
            ))}
          </div>
        </div>

        <div>
          <div className="flex items-center gap-2 mb-5">
            <div className="rounded-lg bg-primary/10 p-1.5">
              <Wrench className="size-4 text-primary" />
            </div>
            <h2 className="text-xl font-bold text-foreground">Short-Term Courses</h2>
            <Badge variant="secondary" className="ml-1">{shortTerm.length}</Badge>
          </div>
          <div className="grid gap-5 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {shortTerm.map((course) => (
              <CourseCard key={course.slug} course={course} />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
