"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  ArrowLeft,
  Save,
  Camera,
  Shield,
  Bell,
  Lock,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/lib/supabase";
import type { Database } from "@/types/database";

type Admin = Database["public"]["Tables"]["admins"]["Row"];
type Branch = Database["public"]["Tables"]["branches"]["Row"];

interface ToggleProps {
  label: string;
  description: string;
  enabled: boolean;
  onToggle: () => void;
}

function Toggle({ label, description, enabled, onToggle }: ToggleProps) {
  return (
    <div className="flex items-center justify-between rounded-lg border p-4">
      <div className="space-y-0.5">
        <p className="text-sm font-medium">{label}</p>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={enabled}
        onClick={onToggle}
        className={cn(
          "relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
          enabled ? "bg-primary" : "bg-input"
        )}
      >
        <span
          className={cn(
            "pointer-events-none block h-5 w-5 rounded-full bg-background shadow-lg ring-0 transition-transform",
            enabled ? "translate-x-5" : "translate-x-0"
          )}
        />
      </button>
    </div>
  );
}

export default function AdminProfileSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [admin, setAdmin] = useState<Admin | null>(null);
  const [branches, setBranches] = useState<Branch[]>([]);

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [branchId, setBranchId] = useState("");
  const [bio, setBio] = useState("");

  const [notifications, setNotifications] = useState({
    email: true,
    sms: false,
    whatsapp: true,
  });

  useEffect(() => {
    async function fetchData() {
      setLoading(true);

      const { data: { user } } = await supabase.auth.getUser();

      const [adminRes, branchesRes] = await Promise.all([
        supabase.from("admins").select("*").eq("user_id", user?.id || "").single(),
        supabase.from("branches").select("*").order("name"),
      ]);

      if (adminRes.data) {
        const a = adminRes.data;
        setAdmin(a);
        setFullName(a.full_name || "");
        setEmail(a.email || "");
        setPhone(a.phone || "");
        setBranchId(a.branch_id || "");
        setBio(a.bio || "");
        setNotifications({
          email: a.notify_email ?? true,
          sms: a.notify_sms ?? false,
          whatsapp: a.notify_whatsapp ?? true,
        });
      }

      if (branchesRes.data) setBranches(branchesRes.data);

      setLoading(false);
    }
    fetchData();
  }, []);

  async function handleSave() {
    if (!admin) return;
    setSaving(true);

    await supabase
      .from("admins")
      .update({
        full_name: fullName,
        email,
        phone,
        branch_id: branchId || null,
        bio,
        notify_email: notifications.email,
        notify_sms: notifications.sms,
        notify_whatsapp: notifications.whatsapp,
      })
      .eq("id", admin.id);

    setSaving(false);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const initials = fullName
    ? fullName
        .split(" ")
        .map((w) => w[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "AD";

  return (
    <div className="min-h-screen bg-background p-6 lg:p-8">
      <div className="mx-auto max-w-3xl space-y-8">
        {/* Page Header */}
        <div className="space-y-4">
          <Link
            href="/admin/profile"
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Profile
          </Link>
          <div className="space-y-1">
            <h1 className="text-3xl font-bold tracking-tight">Profile Settings</h1>
            <p className="text-muted-foreground">
              Update your personal information and preferences
            </p>
          </div>
        </div>

        {/* Avatar Section */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-6">
              <div className="relative">
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-muted text-2xl font-bold text-muted-foreground">
                  {initials}
                </div>
                <button className="absolute bottom-0 right-0 rounded-full bg-primary p-1.5 text-primary-foreground shadow-md transition-colors hover:bg-primary/90">
                  <Camera className="h-3.5 w-3.5" />
                </button>
              </div>
              <div>
                <p className="font-medium">Profile Photo</p>
                <p className="text-sm text-muted-foreground">
                  JPG, PNG or GIF. Max size 2MB.
                </p>
                <Button variant="outline" size="sm" className="mt-2 gap-1.5">
                  <Camera className="h-3.5 w-3.5" />
                  Upload Photo
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Personal Information Form */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted">
                <Shield className="h-4 w-4 text-muted-foreground" />
              </div>
              <div>
                <CardTitle>Personal Information</CardTitle>
                <CardDescription>Your basic account details</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <label htmlFor="fullName" className="text-sm font-medium">
                  Full Name
                </label>
                <Input
                  id="fullName"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-medium">
                  Email
                </label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <label htmlFor="phone" className="text-sm font-medium">
                  Phone
                </label>
                <Input
                  id="phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="branch" className="text-sm font-medium">
                  Branch
                </label>
                <select
                  id="branch"
                  value={branchId}
                  onChange={(e) => setBranchId(e.target.value)}
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                >
                  <option value="">Select Branch</option>
                  {branches.map((branch) => (
                    <option key={branch.id} value={branch.id}>
                      {branch.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="space-y-2">
              <label htmlFor="bio" className="text-sm font-medium">
                Bio
              </label>
              <textarea
                id="bio"
                rows={4}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              />
            </div>
          </CardContent>
        </Card>

        {/* Change Password */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted">
                <Lock className="h-4 w-4 text-muted-foreground" />
              </div>
              <div>
                <CardTitle>Change Password</CardTitle>
                <CardDescription>Update your account password</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="currentPassword" className="text-sm font-medium">
                Current Password
              </label>
              <Input id="currentPassword" type="password" placeholder="Enter current password" />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <label htmlFor="newPassword" className="text-sm font-medium">
                  New Password
                </label>
                <Input id="newPassword" type="password" placeholder="Enter new password" />
              </div>
              <div className="space-y-2">
                <label htmlFor="confirmPassword" className="text-sm font-medium">
                  Confirm Password
                </label>
                <Input id="confirmPassword" type="password" placeholder="Confirm new password" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Notification Preferences */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted">
                <Bell className="h-4 w-4 text-muted-foreground" />
              </div>
              <div>
                <CardTitle>Notification Preferences</CardTitle>
                <CardDescription>Manage how you receive notifications</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <Toggle
              label="Email Notifications"
              description="Receive notifications via email"
              enabled={notifications.email}
              onToggle={() =>
                setNotifications((prev) => ({ ...prev, email: !prev.email }))
              }
            />
            <Toggle
              label="SMS Notifications"
              description="Receive notifications via SMS"
              enabled={notifications.sms}
              onToggle={() =>
                setNotifications((prev) => ({ ...prev, sms: !prev.sms }))
              }
            />
            <Toggle
              label="WhatsApp Notifications"
              description="Receive notifications via WhatsApp"
              enabled={notifications.whatsapp}
              onToggle={() =>
                setNotifications((prev) => ({ ...prev, whatsapp: !prev.whatsapp }))
              }
            />
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3">
          <Link href="/admin/profile">
            <Button variant="outline">Cancel</Button>
          </Link>
          <Button className="gap-2" onClick={handleSave} disabled={saving}>
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            {saving ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </div>
    </div>
  );
}
