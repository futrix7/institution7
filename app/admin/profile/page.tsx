"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  UserCircle,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Edit,
  Activity,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/lib/supabase";
import type { Database } from "@/types/database";

type Admin = Database["public"]["Tables"]["admins"]["Row"];
type ActivityLog = Database["public"]["Tables"]["activity_log"]["Row"];
type Branch = Database["public"]["Tables"]["branches"]["Row"];

const activityColors: Record<string, string> = {
  update: "bg-blue-500/10 text-blue-500",
  approval: "bg-emerald-500/10 text-emerald-500",
  report: "bg-amber-500/10 text-amber-500",
  create: "bg-violet-500/10 text-violet-500",
};

function formatTimestamp(ts: string) {
  const date = new Date(ts);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 60) return `${diffMins} minutes ago`;
  if (diffHours < 24) return `${diffHours} hours ago`;
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;
  return date.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

function getInitials(name: string) {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export default function AdminProfilePage() {
  const [loading, setLoading] = useState(true);
  const [admin, setAdmin] = useState<Admin | null>(null);
  const [branch, setBranch] = useState<Branch | null>(null);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);

      const { data: { user } } = await supabase.auth.getUser();

      const { data: adminData } = await supabase
        .from("admins")
        .select("*")
        .eq("user_id", user?.id || "")
        .single();

      if (adminData) {
        setAdmin(adminData);

        if (adminData.branch_id) {
          const { data: branchData } = await supabase
            .from("branches")
            .select("*")
            .eq("id", adminData.branch_id)
            .single();
          if (branchData) setBranch(branchData);
        }

        const { data: logs } = await supabase
          .from("activity_log")
          .select("*")
          .eq("admin_id", adminData.id)
          .order("timestamp", { ascending: false })
          .limit(10);

        if (logs) setActivityLogs(logs);
      }

      setLoading(false);
    }
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const displayName = admin?.full_name || "Admin User";
  const displayEmail = admin?.email || "admin@tngc.in";
  const displayPhone = admin?.phone || "N/A";
  const displayBranch = branch?.name || "N/A";
  const displayJoined = admin?.created_at
    ? new Date(admin.created_at).toLocaleDateString("en-IN", { month: "short", year: "numeric" })
    : "N/A";
  const displayRole = admin?.role || "Administrator";
  const initials = getInitials(displayName);

  const profileInfo = [
    { label: "Email", value: displayEmail, icon: Mail },
    { label: "Phone", value: displayPhone, icon: Phone },
    { label: "Branch", value: displayBranch, icon: MapPin },
    { label: "Joined", value: displayJoined, icon: Calendar },
  ];

  return (
    <div className="space-y-6">
        {/* Page Header */}
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight">Profile</h1>
          <p className="text-muted-foreground">View and manage your profile</p>
        </div>

        {/* Profile Header Card */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-start">
              <div className="relative">
                <div className="flex h-28 w-28 items-center justify-center rounded-full bg-muted text-3xl font-bold text-muted-foreground">
                  {initials}
                </div>
                <div className="absolute bottom-0 right-0 rounded-full bg-primary p-1.5 text-primary-foreground shadow-md">
                  <UserCircle className="h-4 w-4" />
                </div>
              </div>
              <div className="flex-1 text-center sm:text-left">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                  <h2 className="text-2xl font-bold">{displayName}</h2>
                  <Badge variant="default">{admin?.status || "Active"}</Badge>
                </div>
                <p className="mt-1 text-muted-foreground">{displayRole}</p>
                <div className="mt-1 flex items-center justify-center gap-1.5 text-sm text-muted-foreground sm:justify-start">
                  <MapPin className="h-3.5 w-3.5" />
                  <span>{displayBranch}{branch?.is_primary ? " (Main)" : ""}</span>
                </div>
              </div>
              <Link href="/admin/profile/settings">
                <Button className="gap-2">
                  <Edit className="h-4 w-4" />
                  Edit Profile
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Personal Information Card */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle>Personal Information</CardTitle>
              <CardDescription>Your account details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {profileInfo.map((info) => (
                <div key={info.label} className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted">
                    <info.icon className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">{info.label}</p>
                    <p className="text-sm font-medium">{info.value}</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Recent Activity Card */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Recent Activity</CardTitle>
                  <CardDescription>Your latest actions</CardDescription>
                </div>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-1">
                {activityLogs.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">No recent activity</p>
                )}
                {activityLogs.map((item, index) => (
                  <div
                    key={item.id}
                    className={cn(
                      "flex items-start gap-3 rounded-lg p-3 transition-colors hover:bg-muted/50",
                      index !== activityLogs.length - 1 && "border-b"
                    )}
                  >
                    <div
                      className={cn(
                        "mt-0.5 flex h-2 w-2 shrink-0 rounded-full",
                        activityColors[item.type]?.split(" ")[0] || "bg-gray-500/10 text-gray-500"
                      )}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm">{item.action}</p>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {formatTimestamp(item.timestamp)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
    </div>
  );
}
