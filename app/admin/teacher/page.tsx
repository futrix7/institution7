"use client";

import { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import {
  Search,
  Plus,
  Filter,
  Download,
  Mail,
  Phone,
  Award,
  BookOpen,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { AddTeacherSheet } from "@/components/admin/add-teacher-sheet";
import { supabase } from "@/lib/supabase";

interface Teacher {
  id: string;
  name: string;
  role: string;
  branch: string;
  subjects: string[];
  experience: number;
  status: "Active" | "On Leave";
  email: string;
  phone: string;
}

export default function TeachersPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [addOpen, setAddOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [teachers, setTeachers] = useState<Teacher[]>([]);

  async function fetchTeachers() {
    setLoading(true);
    const { data: teachersData, error } = await supabase
      .from("teachers")
      .select("*, branches(name)")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching teachers:", error);
      setLoading(false);
      return;
    }

    const mapped: Teacher[] = (teachersData || []).map((t: any) => ({
      id: t.id,
      name: t.full_name,
      role: t.role,
      branch: t.branches?.name ?? "",
      subjects: t.subjects ?? [],
      experience: t.experience ?? 0,
      status: t.status ?? "Active",
      email: t.email,
      phone: t.phone,
    }));

    setTeachers(mapped);
    setLoading(false);
  }

  useEffect(() => {
    fetchTeachers();
  }, []);

  const filteredTeachers = teachers.filter(
    (teacher) =>
      teacher.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      teacher.role.toLowerCase().includes(searchQuery.toLowerCase()) ||
      teacher.subjects.some((s) =>
        s.toLowerCase().includes(searchQuery.toLowerCase())
      )
  );

  const stats = [
    { label: "Total Teachers", value: teachers.length, color: "text-accent-foreground" },
    { label: "Active", value: teachers.filter((t) => t.status === "Active").length, color: "text-emerald-600" },
    { label: "On Leave", value: teachers.filter((t) => t.status === "On Leave").length, color: "text-amber-600" },
    { label: "Total Subjects", value: teachers.reduce((sum, t) => sum + t.subjects.length, 0), color: "text-violet-600" },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Loading teachers...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Teachers</h1>
        <p className="text-muted-foreground">
          Manage faculty and instructors
        </p>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <CardContent className="flex items-center justify-between">
              <p className="text-[11px] text-muted-foreground truncate">{stat.label}</p>
              <p className={cn("text-sm font-bold shrink-0", stat.color)}>{stat.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search teachers..."
              className="w-64 pl-8"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Button variant="outline" size="icon">
            <Filter className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon">
            <Download className="h-4 w-4" />
          </Button>
        </div>
        <Button onClick={() => setAddOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Teacher
        </Button>
      </div>

      {/* Teacher Cards Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredTeachers.map((teacher) => (
          <Card key={teacher.id} className="transition-shadow hover:shadow-md">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-lg">{teacher.name}</CardTitle>
                  <CardDescription>{teacher.role}</CardDescription>
                </div>
                <Badge
                  variant={
                    teacher.status === "Active" ? "default" : "secondary"
                  }
                  className={cn(
                    teacher.status === "Active" &&
                      "bg-emerald-100 text-emerald-700 hover:bg-emerald-100",
                    teacher.status === "On Leave" &&
                      "bg-amber-100 text-amber-700 hover:bg-amber-100"
                  )}
                >
                  {teacher.status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground">{teacher.branch}</p>

              <div className="flex flex-wrap gap-1.5">
                {teacher.subjects.map((subject) => (
                  <Badge key={subject} variant="outline" className="text-xs">
                    {subject}
                  </Badge>
                ))}
              </div>

              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1.5">
                  <Award className="h-3.5 w-3.5" />
                  <span>{teacher.experience} yrs exp</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <BookOpen className="h-3.5 w-3.5" />
                  <span>{teacher.subjects.length} subjects</span>
                </div>
              </div>

              <div className="border-t pt-3 space-y-1.5">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Mail className="h-3.5 w-3.5" />
                  <span>{teacher.email}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Phone className="h-3.5 w-3.5" />
                  <span>{teacher.phone}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      <AddTeacherSheet open={addOpen} onOpenChange={setAddOpen} onSuccess={() => fetchTeachers()} />
    </div>
  );
}
