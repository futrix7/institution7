"use client";

import { useState, useEffect } from "react";
import {
  CalendarCheck,
  Search,
  CheckCircle2,
  XCircle,
  Clock,
  Download,
  Filter,
  Users,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
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
import { supabase } from "@/lib/supabase";

interface AttendanceRecord {
  studentId: string;
  name: string;
  course: string;
  timeIn: string;
  timeOut: string;
  status: "Present" | "Absent" | "Late" | "Leave";
  hours: number;
}

const statusConfig: Record<string, { variant: "default" | "secondary" | "destructive" | "outline"; className: string }> = {
  Present: { variant: "default", className: "bg-green-600 text-white hover:bg-green-600" },
  Absent: { variant: "destructive", className: "" },
  Late: { variant: "secondary", className: "bg-yellow-500 text-white hover:bg-yellow-500" },
  Leave: { variant: "outline", className: "bg-blue-100 text-blue-700" },
};

export default function AttendancePage() {
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [branch, setBranch] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [attendanceData, setAttendanceData] = useState<AttendanceRecord[]>([]);
  const [summaryStats, setSummaryStats] = useState([
    { label: "Total Students", value: 0, icon: Users, color: "text-blue-500" },
    { label: "Present", value: 0, icon: CheckCircle2, color: "text-green-500" },
    { label: "Absent", value: 0, icon: XCircle, color: "text-red-500" },
    { label: "Late", value: 0, icon: Clock, color: "text-yellow-500" },
  ]);

  useEffect(() => {
    fetchAttendance();
  }, [date]);

  async function fetchAttendance() {
    setLoading(true);

    const { data: attendanceRows, error } = await supabase
      .from("attendance")
      .select("*, students!inner(full_name), courses!inner(name), branches(name)")
      .eq("date", date)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Error fetching attendance:", error);
      setLoading(false);
      return;
    }

    const records: AttendanceRecord[] = (attendanceRows ?? []).map((row: any) => ({
      studentId: row.student_id,
      name: row.students?.full_name ?? "Unknown",
      course: row.courses?.name ?? row.course_slug ?? "N/A",
      timeIn: row.time_in ?? "",
      timeOut: row.time_out ?? "",
      status: row.status,
      hours: row.hours ?? 0,
    }));

    setAttendanceData(records);

    const totalStudents = records.length;
    const presentCount = records.filter((r) => r.status === "Present").length;
    const absentCount = records.filter((r) => r.status === "Absent").length;
    const lateCount = records.filter((r) => r.status === "Late").length;

    setSummaryStats([
      { label: "Total Students", value: totalStudents, icon: Users, color: "text-blue-500" },
      { label: "Present", value: presentCount, icon: CheckCircle2, color: "text-green-500" },
      { label: "Absent", value: absentCount, icon: XCircle, color: "text-red-500" },
      { label: "Late", value: lateCount, icon: Clock, color: "text-yellow-500" },
    ]);

    setLoading(false);
  }

  const filteredData = attendanceData.filter((student) => {
    const matchesSearch =
      student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.studentId.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <CalendarCheck className="h-6 w-6 text-primary" />
            <h1 className="text-2xl font-bold tracking-tight">Attendance</h1>
          </div>
          <p className="text-sm text-muted-foreground">
            Track daily attendance records
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
          <Button size="sm">
            <CheckCircle2 className="mr-2 h-4 w-4" />
            Mark Attendance
          </Button>
        </div>
      </div>

      <div className="grid gap-2 grid-cols-2 lg:grid-cols-4">
        {summaryStats.map((stat) => (
          <Card key={stat.label}>
            <CardContent className="flex items-center justify-between">
              <p className="text-[11px] text-muted-foreground truncate">{stat.label}</p>
              <p className="text-sm font-bold shrink-0">{stat.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold">Attendance Records</h2>
              <p className="text-sm text-muted-foreground">
                Showing records for{" "}
                {new Date(date).toLocaleDateString("en-IN", {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </p>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search students..."
                  className="pl-8 sm:w-[200px]"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <Input
                type="date"
                className="sm:w-[170px]"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
              <div className="relative">
                <Filter className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <select
                  className="flex h-9 w-full rounded-md border border-input bg-transparent pl-8 pr-4 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  value={branch}
                  onChange={(e) => setBranch(e.target.value)}
                >
                  <option value="all">All Branches</option>
                  <option value="cse">CSE</option>
                  <option value="ece">ECE</option>
                  <option value="me">ME</option>
                  <option value="it">IT</option>
                  <option value="bca">BCA</option>
                  <option value="mca">MCA</option>
                </select>
              </div>
            </div>
          </div>
        </CardContent>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Clock className="mr-2 h-5 w-5 animate-spin text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Loading attendance data...</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student ID</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Course</TableHead>
                  <TableHead>Time In</TableHead>
                  <TableHead>Time Out</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Hours</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredData.map((student) => (
                  <TableRow key={student.studentId}>
                    <TableCell className="font-medium">
                      {student.studentId}
                    </TableCell>
                    <TableCell>{student.name}</TableCell>
                    <TableCell>{student.course}</TableCell>
                    <TableCell>
                      {student.timeIn || "-"}
                    </TableCell>
                    <TableCell>
                      {student.timeOut || "-"}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={statusConfig[student.status]?.variant ?? "outline"}
                        className={statusConfig[student.status]?.className ?? ""}
                      >
                        {student.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      {student.hours > 0 ? student.hours.toFixed(2) : "-"}
                    </TableCell>
                  </TableRow>
                ))}
                {filteredData.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="h-24 text-center">
                      <p className="text-muted-foreground">No attendance records found for this date.</p>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
