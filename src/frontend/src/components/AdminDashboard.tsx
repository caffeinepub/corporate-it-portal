import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AlertTriangle,
  CheckCircle,
  Clock,
  Loader2,
  LogOut,
  RefreshCw,
  Shield,
  Users,
  XCircle,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { useNexusActor } from "../hooks/useNexusActor";
import type {
  BookingRecord,
  BookingStats,
  FailedLog,
  RegistrationRecord,
  RegistrationStats,
  ServiceRating,
} from "../hooks/useNexusActor";

function getStatus(
  rec: RegistrationRecord,
): "pending" | "approved" | "rejected" {
  if ("pending" in rec.status) return "pending";
  if ("approved" in rec.status) return "approved";
  return "rejected";
}

function fmtTs(ts: bigint) {
  try {
    return new Date(Number(ts / 1_000_000n)).toLocaleString();
  } catch {
    return "—";
  }
}

const statusBadge = {
  pending: {
    label: "PENDING",
    style: {
      background: "rgba(250,200,0,0.15)",
      color: "#f5c400",
      border: "1px solid rgba(250,200,0,0.3)",
    },
  },
  approved: {
    label: "APPROVED",
    style: {
      background: "rgba(0,220,120,0.15)",
      color: "#00dc78",
      border: "1px solid rgba(0,220,120,0.3)",
    },
  },
  rejected: {
    label: "REJECTED",
    style: {
      background: "rgba(255,80,80,0.15)",
      color: "#ff6060",
      border: "1px solid rgba(255,80,80,0.3)",
    },
  },
};

interface Props {
  token: string;
  onLogout: () => void;
}

export function AdminDashboard({ token, onLogout }: Props) {
  const { actor } = useNexusActor();
  const [stats, setStats] = useState<RegistrationStats | null>(null);
  const [all, setAll] = useState<RegistrationRecord[]>([]);
  const [pending, setPending] = useState<RegistrationRecord[]>([]);
  const [failedLogs, setFailedLogs] = useState<FailedLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    "all" | "pending" | "approved" | "rejected"
  >("all");
  const [rejectReasons, setRejectReasons] = useState<Record<string, string>>(
    {},
  );
  const [actionLoading, setActionLoading] = useState<Record<string, boolean>>(
    {},
  );
  const prevPendingCount = useRef(0);
  const [bookingStats, setBookingStats] = useState<BookingStats | null>(null);
  const [allBookings, setAllBookings] = useState<BookingRecord[]>([]);
  const [pendingBookings, setPendingBookings] = useState<BookingRecord[]>([]);
  const [bookingRejectReasons, setBookingRejectReasons] = useState<
    Record<string, string>
  >({});
  const [bookingActionLoading, setBookingActionLoading] = useState<
    Record<string, boolean>
  >({});
  const [allRatings, setAllRatings] = useState<ServiceRating[]>([]);

  const fetchAll = useCallback(async () => {
    if (!actor) return;
    setLoading(true);
    const nb = actor;
    try {
      const [s, a, p, f, bs, ba, bp, rtgs] = await Promise.all([
        nb.getRegistrationStats(token),
        nb.getAllRegistrations(token),
        nb.getPendingRegistrations(token),
        nb.getFailedLogs(token),
        nb.getBookingStats(token).catch(() => null),
        nb.getAllBookings(token).catch(() => []),
        nb.getPendingBookings(token).catch(() => []),
        nb.getAllRatings(token).catch(() => []),
      ]);
      setStats(s);
      setAll(a);
      setPending(p);
      setFailedLogs(f);
      if (bs) setBookingStats(bs);
      setAllBookings(ba);
      setPendingBookings(bp);
      setAllRatings(rtgs);

      if (prevPendingCount.current > 0 && p.length > prevPendingCount.current) {
        toast.info(
          `${p.length - prevPendingCount.current} new registration(s) pending approval`,
        );
      }
      prevPendingCount.current = p.length;
    } catch (_e) {
      toast.error("Failed to load data");
    } finally {
      setLoading(false);
    }
  }, [actor, token]);

  useEffect(() => {
    fetchAll();
    const interval = setInterval(fetchAll, 30_000);
    return () => clearInterval(interval);
  }, [fetchAll]);

  async function handleApprove(regId: string) {
    if (!actor) return;
    setActionLoading((p) => ({ ...p, [regId]: true }));
    try {
      const nb = actor;
      const ok = await nb.approveRegistration(token, regId);
      if (ok) {
        toast.success("Registration approved successfully");
        fetchAll();
      } else {
        toast.error("Approval failed");
      }
    } catch {
      toast.error("Approval error");
    } finally {
      setActionLoading((p) => ({ ...p, [regId]: false }));
    }
  }

  async function handleReject(regId: string) {
    if (!actor) return;
    const reason = rejectReasons[regId]?.trim();
    if (!reason) {
      toast.error("Please enter a rejection reason");
      return;
    }
    setActionLoading((p) => ({ ...p, [regId]: true }));
    try {
      const nb = actor;
      const ok = await nb.rejectRegistration(token, regId, reason);
      if (ok) {
        toast.success("Registration rejected");
        setRejectReasons((p) => {
          const n = { ...p };
          delete n[regId];
          return n;
        });
        fetchAll();
      } else {
        toast.error("Rejection failed");
      }
    } catch {
      toast.error("Rejection error");
    } finally {
      setActionLoading((p) => ({ ...p, [regId]: false }));
    }
  }

  async function handleApproveBooking(bookingId: string) {
    if (!actor) return;
    setBookingActionLoading((p) => ({ ...p, [bookingId]: true }));
    try {
      const nb = actor;
      const ok = await nb.approveBooking(token, bookingId);
      if (ok) {
        toast.success("Booking approved");
        fetchAll();
      } else toast.error("Approval failed");
    } catch {
      toast.error("Approval error");
    } finally {
      setBookingActionLoading((p) => ({ ...p, [bookingId]: false }));
    }
  }

  async function handleRejectBooking(bookingId: string) {
    if (!actor) return;
    const reason = bookingRejectReasons[bookingId]?.trim();
    if (!reason) {
      toast.error("Please enter rejection reason");
      return;
    }
    setBookingActionLoading((p) => ({ ...p, [bookingId]: true }));
    try {
      const nb = actor;
      const ok = await nb.rejectBooking(token, bookingId, reason);
      if (ok) {
        toast.success("Booking rejected");
        setBookingRejectReasons((p) => {
          const n = { ...p };
          delete n[bookingId];
          return n;
        });
        fetchAll();
      } else toast.error("Rejection failed");
    } catch {
      toast.error("Rejection error");
    } finally {
      setBookingActionLoading((p) => ({ ...p, [bookingId]: false }));
    }
  }

  const filteredAll = all.filter((r) => {
    const s = getStatus(r);
    if (statusFilter !== "all" && s !== statusFilter) return false;
    if (filter) {
      const q = filter.toLowerCase();
      return (
        r.name.toLowerCase().includes(q) ||
        r.email.toLowerCase().includes(q) ||
        r.roleTitle.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="min-h-screen" style={{ paddingTop: "80px" }}>
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Dashboard header */}
        <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <div
              className="icon-tile"
              style={{
                background: "rgba(255,100,100,0.12)",
                borderColor: "rgba(255,100,100,0.35)",
              }}
            >
              <Shield size={22} color="#ff6b6b" />
            </div>
            <div>
              <h1 className="font-montserrat font-bold text-xl tracking-widest text-white uppercase">
                Admin Dashboard
              </h1>
              <p
                className="text-xs"
                style={{ color: "rgba(100,180,220,0.55)" }}
              >
                NEXUS IT PORTAL — Control Center
              </p>
            </div>
          </div>
          <div className="flex gap-3">
            <Button
              onClick={fetchAll}
              disabled={loading}
              data-ocid="admin.secondary_button"
              className="btn-cyan text-xs font-montserrat tracking-widest uppercase"
              style={{ height: "36px" }}
            >
              {loading ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <RefreshCw size={14} />
              )}
              <span className="ml-1.5">Refresh</span>
            </Button>
            <Button
              onClick={onLogout}
              data-ocid="admin.delete_button"
              className="text-xs font-montserrat tracking-widest uppercase"
              style={{
                height: "36px",
                background: "rgba(255,80,80,0.1)",
                border: "1px solid rgba(255,80,80,0.3)",
                color: "#ff8080",
              }}
            >
              <LogOut size={14} />
              <span className="ml-1.5">Logout</span>
            </Button>
          </div>
        </div>

        <Tabs
          defaultValue="overview"
          className="space-y-6"
          data-ocid="admin.tab"
        >
          <TabsList
            style={{
              background: "rgba(12,28,42,0.8)",
              border: "1px solid rgba(85,214,255,0.15)",
            }}
            className="flex flex-wrap h-auto gap-1 p-1"
          >
            {(
              [
                ["overview", "Overview"],
                ["all", "All Registrations"],
                [
                  "pending",
                  `Pending${pending.length ? ` (${pending.length})` : ""}`,
                ],
                ["failed", "Failed Logs"],
                [
                  "bookings",
                  `Bookings${pendingBookings.length ? ` (${pendingBookings.length})` : ""}`,
                ],
                ["images", "Images"],
              ] as const
            ).map(([v, label]) => (
              <TabsTrigger
                key={v}
                value={v}
                data-ocid={`admin.${v}.tab`}
                className="text-xs font-montserrat tracking-widest uppercase"
                style={{ color: "rgba(100,180,220,0.6)" }}
              >
                {v === "pending" && pending.length > 0 ? (
                  <span className="flex items-center gap-1.5">
                    {label}
                    <span
                      className="inline-block px-1.5 py-0.5 rounded text-xs font-bold"
                      style={{
                        background: "rgba(250,200,0,0.3)",
                        color: "#f5c400",
                      }}
                    >
                      NEW
                    </span>
                  </span>
                ) : (
                  label
                )}
              </TabsTrigger>
            ))}
          </TabsList>

          {/* OVERVIEW */}
          <TabsContent value="overview" className="space-y-6">
            {/* Stats cards */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {stats
                ? [
                    {
                      label: "Total",
                      value: stats.total,
                      icon: <Users size={20} />,
                      color: "#55d6ff",
                    },
                    {
                      label: "Pending",
                      value: stats.pending,
                      icon: <Clock size={20} />,
                      color: "#f5c400",
                    },
                    {
                      label: "Approved",
                      value: stats.approved,
                      icon: <CheckCircle size={20} />,
                      color: "#00dc78",
                    },
                    {
                      label: "Rejected",
                      value: stats.rejected,
                      icon: <XCircle size={20} />,
                      color: "#ff6060",
                    },
                    {
                      label: "Failed",
                      value: stats.failed,
                      icon: <AlertTriangle size={20} />,
                      color: "#f97316",
                    },
                  ].map((s) => (
                    <div
                      key={s.label}
                      className="glass-card p-5 flex flex-col items-center gap-2"
                      data-ocid={`admin.${s.label.toLowerCase()}.card`}
                    >
                      <span style={{ color: s.color }}>{s.icon}</span>
                      <span
                        className="font-montserrat font-bold text-2xl"
                        style={{ color: s.color }}
                      >
                        {s.value.toString()}
                      </span>
                      <span
                        className="text-xs font-montserrat tracking-widest uppercase"
                        style={{ color: "rgba(100,180,220,0.55)" }}
                      >
                        {s.label}
                      </span>
                    </div>
                  ))
                : Array.from({ length: 5 }, (_, i) => String(i)).map((sk) => (
                    <div
                      key={sk}
                      className="glass-card p-5 animate-pulse"
                      style={{ height: "100px" }}
                    />
                  ))}
            </div>

            {/* Booking stats */}
            {bookingStats && (
              <div>
                <h3
                  className="font-montserrat font-bold text-sm tracking-widest uppercase mb-3"
                  style={{ color: "rgba(85,214,255,0.8)" }}
                >
                  Room Booking Stats
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {[
                    {
                      label: "Total Bookings",
                      value: bookingStats.total,
                      color: "#55d6ff",
                    },
                    {
                      label: "Pending",
                      value: bookingStats.pending,
                      color: "#f5c400",
                    },
                    {
                      label: "Approved",
                      value: bookingStats.approved,
                      color: "#00dc78",
                    },
                    {
                      label: "Rejected",
                      value: bookingStats.rejected,
                      color: "#ff6060",
                    },
                  ].map((s) => (
                    <div
                      key={s.label}
                      className="glass-card p-4 flex flex-col items-center gap-1"
                      data-ocid={`admin.booking_${s.label.toLowerCase().replace(" ", "_")}.card`}
                    >
                      <span
                        className="font-montserrat font-bold text-xl"
                        style={{ color: s.color }}
                      >
                        {s.value.toString()}
                      </span>
                      <span
                        className="text-xs font-montserrat tracking-widest uppercase"
                        style={{ color: "rgba(100,180,220,0.55)" }}
                      >
                        {s.label}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Recent pending */}
            <div className="glass-card p-6">
              <h3
                className="font-montserrat font-bold text-sm tracking-widest uppercase mb-4"
                style={{ color: "rgba(85,214,255,0.8)" }}
              >
                Recent Pending Registrations
              </h3>
              {pending.length === 0 ? (
                <p
                  data-ocid="admin.pending.empty_state"
                  className="text-sm"
                  style={{ color: "rgba(100,180,220,0.45)" }}
                >
                  No pending registrations at this time.
                </p>
              ) : (
                <div className="space-y-3">
                  {pending.slice(0, 5).map((r, i) => (
                    <div
                      key={r.id}
                      data-ocid={`admin.pending.item.${i + 1}`}
                      className="flex items-center justify-between p-3 rounded-xl flex-wrap gap-2"
                      style={{
                        background: "rgba(250,200,0,0.05)",
                        border: "1px solid rgba(250,200,0,0.15)",
                      }}
                    >
                      <div>
                        <p className="text-sm font-semibold text-white">
                          {r.name}
                        </p>
                        <p
                          className="text-xs"
                          style={{ color: "rgba(100,180,220,0.6)" }}
                        >
                          {r.email} — {r.roleTitle}
                        </p>
                      </div>
                      <span
                        className="text-xs"
                        style={{ color: "rgba(100,180,220,0.4)" }}
                      >
                        {fmtTs(r.timestamp)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>

          {/* ALL REGISTRATIONS */}
          <TabsContent value="all" className="space-y-4">
            <div className="flex gap-3 flex-wrap">
              <Input
                data-ocid="admin.search_input"
                placeholder="Search by name, email, or role..."
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="max-w-xs"
                style={{
                  background: "rgba(12,28,42,0.8)",
                  border: "1px solid rgba(85,214,255,0.22)",
                  color: "#e2f4ff",
                }}
              />
              <div className="flex gap-2">
                {(["all", "pending", "approved", "rejected"] as const).map(
                  (s) => (
                    <Button
                      key={s}
                      onClick={() => setStatusFilter(s)}
                      data-ocid={`admin.${s}.toggle`}
                      className="text-xs font-montserrat tracking-widest uppercase"
                      style={{
                        height: "36px",
                        background:
                          statusFilter === s
                            ? "rgba(85,214,255,0.2)"
                            : "rgba(12,28,42,0.6)",
                        border:
                          statusFilter === s
                            ? "1px solid rgba(85,214,255,0.5)"
                            : "1px solid rgba(85,214,255,0.15)",
                        color:
                          statusFilter === s
                            ? "#55d6ff"
                            : "rgba(100,180,220,0.55)",
                      }}
                    >
                      {s}
                    </Button>
                  ),
                )}
              </div>
            </div>
            <div className="glass-card overflow-hidden">
              <ScrollArea className="h-[500px]">
                {filteredAll.length === 0 ? (
                  <p
                    data-ocid="admin.all.empty_state"
                    className="p-6 text-sm"
                    style={{ color: "rgba(100,180,220,0.45)" }}
                  >
                    No registrations match your filter.
                  </p>
                ) : (
                  <table className="w-full min-w-[700px]">
                    <thead>
                      <tr
                        style={{
                          borderBottom: "1px solid rgba(85,214,255,0.12)",
                        }}
                      >
                        {[
                          "#",
                          "Name",
                          "Email",
                          "Role",
                          "Date",
                          "Device",
                          "Status",
                        ].map((h) => (
                          <th
                            key={h}
                            className="px-4 py-3 text-left text-xs font-montserrat font-bold tracking-widest uppercase"
                            style={{ color: "rgba(100,180,220,0.5)" }}
                          >
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {filteredAll.map((r, i) => {
                        const s = getStatus(r);
                        return (
                          <tr
                            key={r.id}
                            data-ocid={`admin.all.item.${i + 1}`}
                            style={{
                              borderBottom: "1px solid rgba(85,214,255,0.06)",
                            }}
                          >
                            <td
                              className="px-4 py-3 text-xs"
                              style={{ color: "rgba(100,180,220,0.45)" }}
                            >
                              {i + 1}
                            </td>
                            <td className="px-4 py-3 text-sm text-white">
                              {r.name}
                            </td>
                            <td
                              className="px-4 py-3 text-xs"
                              style={{ color: "rgba(160,200,230,0.7)" }}
                            >
                              {r.email}
                            </td>
                            <td
                              className="px-4 py-3 text-xs"
                              style={{ color: "rgba(160,200,230,0.7)" }}
                            >
                              {r.roleTitle}
                            </td>
                            <td
                              className="px-4 py-3 text-xs"
                              style={{ color: "rgba(100,180,220,0.5)" }}
                            >
                              {fmtTs(r.timestamp)}
                            </td>
                            <td
                              className="px-4 py-3 text-xs max-w-[120px] truncate"
                              style={{ color: "rgba(100,180,220,0.4)" }}
                              title={r.deviceInfo}
                            >
                              {r.deviceInfo.slice(0, 30)}…
                            </td>
                            <td className="px-4 py-3">
                              <span
                                className="text-xs font-montserrat font-bold px-2 py-1 rounded-full"
                                style={statusBadge[s].style}
                              >
                                {statusBadge[s].label}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </ScrollArea>
            </div>
          </TabsContent>

          {/* PENDING APPROVALS */}
          <TabsContent value="pending" className="space-y-4">
            {pending.length === 0 ? (
              <div
                data-ocid="admin.pending2.empty_state"
                className="glass-card p-8 text-center"
              >
                <CheckCircle
                  size={40}
                  className="mx-auto mb-3"
                  style={{ color: "#00dc78" }}
                />
                <p
                  className="font-montserrat font-bold tracking-widest text-sm uppercase"
                  style={{ color: "rgba(0,220,120,0.8)" }}
                >
                  No pending approvals
                </p>
                <p
                  className="text-xs mt-2"
                  style={{ color: "rgba(100,180,220,0.5)" }}
                >
                  All registrations have been reviewed.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {pending.map((r, i) => (
                  <div
                    key={r.id}
                    data-ocid={`admin.pending.item.${i + 1}`}
                    className="glass-card p-6"
                    style={{ borderLeft: "3px solid rgba(250,200,0,0.4)" }}
                  >
                    <div className="flex items-start justify-between flex-wrap gap-4">
                      <div className="space-y-1 flex-1">
                        <h4 className="font-montserrat font-bold text-white">
                          {r.name}
                        </h4>
                        <p
                          className="text-xs"
                          style={{ color: "rgba(160,200,230,0.7)" }}
                        >
                          {r.email} · {r.mobile} · {r.country}
                        </p>
                        <p
                          className="text-xs"
                          style={{ color: "rgba(85,214,255,0.7)" }}
                        >
                          {r.roleTitle}
                        </p>
                        <p
                          className="text-xs"
                          style={{ color: "rgba(100,180,220,0.5)" }}
                        >
                          Purpose: {r.registrationPurpose}
                        </p>
                        <p
                          className="text-xs"
                          style={{ color: "rgba(100,180,220,0.4)" }}
                        >
                          DOB: {r.dateOfBirth} · {fmtTs(r.timestamp)}
                        </p>
                        <p
                          className="text-xs truncate max-w-sm"
                          style={{ color: "rgba(100,180,220,0.3)" }}
                          title={r.deviceInfo}
                        >
                          Device: {r.deviceInfo.slice(0, 60)}…
                        </p>
                      </div>
                      <div className="flex flex-col gap-2 min-w-[160px]">
                        <Button
                          onClick={() => handleApprove(r.id)}
                          disabled={actionLoading[r.id]}
                          data-ocid={`admin.approve.button.${i + 1}`}
                          className="text-xs font-montserrat tracking-widest uppercase"
                          style={{
                            height: "36px",
                            background: "rgba(0,220,120,0.15)",
                            border: "1px solid rgba(0,220,120,0.35)",
                            color: "#00dc78",
                          }}
                        >
                          {actionLoading[r.id] ? (
                            <Loader2 size={12} className="animate-spin mr-1" />
                          ) : (
                            <CheckCircle size={12} className="mr-1" />
                          )}
                          Approve
                        </Button>
                        <div className="flex gap-2">
                          <Input
                            placeholder="Rejection reason..."
                            value={rejectReasons[r.id] || ""}
                            onChange={(e) =>
                              setRejectReasons((p) => ({
                                ...p,
                                [r.id]: e.target.value,
                              }))
                            }
                            data-ocid={`admin.reject.input.${i + 1}`}
                            className="text-xs h-8"
                            style={{
                              background: "rgba(12,28,42,0.8)",
                              border: "1px solid rgba(255,80,80,0.22)",
                              color: "#e2f4ff",
                            }}
                          />
                          <Button
                            onClick={() => handleReject(r.id)}
                            disabled={actionLoading[r.id]}
                            data-ocid={`admin.reject.button.${i + 1}`}
                            className="text-xs shrink-0"
                            style={{
                              height: "32px",
                              background: "rgba(255,80,80,0.15)",
                              border: "1px solid rgba(255,80,80,0.3)",
                              color: "#ff6060",
                            }}
                          >
                            {actionLoading[r.id] ? (
                              <Loader2 size={10} className="animate-spin" />
                            ) : (
                              <XCircle size={12} />
                            )}
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          {/* FAILED LOGS */}
          <TabsContent value="failed" className="space-y-4">
            <div className="glass-card overflow-hidden">
              <div
                className="px-6 py-4"
                style={{ borderBottom: "1px solid rgba(85,214,255,0.1)" }}
              >
                <h3
                  className="font-montserrat font-bold text-sm tracking-widest uppercase"
                  style={{ color: "rgba(249,115,22,0.8)" }}
                >
                  Failed Registration Attempts
                </h3>
              </div>
              <ScrollArea className="h-[450px]">
                {failedLogs.length === 0 ? (
                  <p
                    data-ocid="admin.failed.empty_state"
                    className="p-6 text-sm"
                    style={{ color: "rgba(100,180,220,0.45)" }}
                  >
                    No failed registration attempts logged.
                  </p>
                ) : (
                  <table className="w-full min-w-[600px]">
                    <thead>
                      <tr
                        style={{
                          borderBottom: "1px solid rgba(85,214,255,0.12)",
                        }}
                      >
                        {["#", "Email", "Role", "Error", "Device", "Time"].map(
                          (h) => (
                            <th
                              key={h}
                              className="px-4 py-3 text-left text-xs font-montserrat font-bold tracking-widest uppercase"
                              style={{ color: "rgba(100,180,220,0.5)" }}
                            >
                              {h}
                            </th>
                          ),
                        )}
                      </tr>
                    </thead>
                    <tbody>
                      {failedLogs.map((log, i) => (
                        <tr
                          key={`${log.email}-${log.roleTitle}-${i}`}
                          data-ocid={`admin.failed.item.${i + 1}`}
                          style={{
                            borderBottom: "1px solid rgba(85,214,255,0.06)",
                          }}
                        >
                          <td
                            className="px-4 py-3 text-xs"
                            style={{ color: "rgba(100,180,220,0.45)" }}
                          >
                            {i + 1}
                          </td>
                          <td className="px-4 py-3 text-xs text-white">
                            {log.email}
                          </td>
                          <td
                            className="px-4 py-3 text-xs"
                            style={{ color: "rgba(160,200,230,0.7)" }}
                          >
                            {log.roleTitle}
                          </td>
                          <td
                            className="px-4 py-3 text-xs max-w-[200px]"
                            style={{ color: "#ff8080" }}
                            title={log.errorMsg}
                          >
                            {log.errorMsg.slice(0, 60)}
                            {log.errorMsg.length > 60 ? "…" : ""}
                          </td>
                          <td
                            className="px-4 py-3 text-xs max-w-[100px] truncate"
                            style={{ color: "rgba(100,180,220,0.4)" }}
                            title={log.deviceInfo}
                          >
                            {log.deviceInfo.slice(0, 20)}…
                          </td>
                          <td
                            className="px-4 py-3 text-xs"
                            style={{ color: "rgba(100,180,220,0.5)" }}
                          >
                            {fmtTs(log.timestamp)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </ScrollArea>
            </div>
          </TabsContent>

          {/* IMAGES */}
          {/* BOOKINGS TAB */}
          <TabsContent value="bookings" className="space-y-6">
            {/* CONFERENCE ROOM APPROVALS */}
            <div
              className="glass-card p-6"
              style={{ borderColor: "rgba(85,214,255,0.2)" }}
            >
              <h3
                className="font-montserrat font-bold text-sm tracking-widest uppercase mb-4"
                style={{ color: "rgba(85,214,255,0.8)" }}
              >
                Conference Room Approvals{" "}
                <span
                  className="ml-2 px-2 py-0.5 rounded text-xs"
                  style={{
                    background: "rgba(85,214,255,0.15)",
                    color: "rgba(85,214,255,0.9)",
                  }}
                >
                  {
                    pendingBookings.filter((b) => b.roomType === "conference")
                      .length
                  }
                </span>
              </h3>
              {pendingBookings.filter((b) => b.roomType === "conference")
                .length === 0 ? (
                <p
                  className="text-sm"
                  style={{ color: "rgba(100,180,220,0.45)" }}
                >
                  No pending conference room bookings.
                </p>
              ) : (
                <div className="space-y-4">
                  {pendingBookings
                    .filter((b) => b.roomType === "conference")
                    .map((b, i) => {
                      const isLoading = bookingActionLoading[b.id];
                      return (
                        <div
                          key={b.id}
                          data-ocid={`admin.conference_pending.item.${i + 1}`}
                          className="rounded-xl p-4 space-y-3"
                          style={{
                            background: "rgba(85,214,255,0.04)",
                            border: "1px solid rgba(85,214,255,0.15)",
                          }}
                        >
                          <div className="flex items-start justify-between flex-wrap gap-2">
                            <div>
                              <p className="font-montserrat font-bold text-sm text-white">
                                {b.roomName}
                              </p>
                              <p
                                className="text-xs mt-0.5"
                                style={{ color: "rgba(100,180,220,0.6)" }}
                              >
                                Conference Room · {b.bookingDate}{" "}
                                {b.bookingHour}:{b.bookingMinute}
                              </p>
                            </div>
                            <span
                              className="text-xs font-montserrat font-bold tracking-widest uppercase px-2.5 py-1 rounded-full"
                              style={{
                                background: "rgba(85,214,255,0.12)",
                                border: "1px solid rgba(85,214,255,0.3)",
                                color: "rgba(85,214,255,0.9)",
                              }}
                            >
                              PENDING
                            </span>
                          </div>
                          <div
                            className="grid grid-cols-2 gap-2 text-xs"
                            style={{ color: "rgba(140,190,220,0.7)" }}
                          >
                            <p>
                              <span style={{ color: "rgba(85,214,255,0.5)" }}>
                                Name:
                              </span>{" "}
                              {b.bookerName}
                            </p>
                            <p>
                              <span style={{ color: "rgba(85,214,255,0.5)" }}>
                                Email:
                              </span>{" "}
                              {b.email}
                            </p>
                            <p>
                              <span style={{ color: "rgba(85,214,255,0.5)" }}>
                                Mobile:
                              </span>{" "}
                              {b.mobile}
                            </p>
                            <p>
                              <span style={{ color: "rgba(85,214,255,0.5)" }}>
                                Purpose:
                              </span>{" "}
                              {b.purpose}
                            </p>
                          </div>
                          <div className="flex items-center gap-2 flex-wrap pt-1">
                            <button
                              type="button"
                              data-ocid={`admin.conference_pending.approve_button.${i + 1}`}
                              onClick={() => handleApproveBooking(b.id)}
                              disabled={isLoading}
                              className="px-4 py-2 rounded-lg text-xs font-montserrat font-bold tracking-widest uppercase"
                              style={{
                                background: "rgba(85,214,255,0.15)",
                                border: "1px solid rgba(85,214,255,0.3)",
                                color: "rgba(85,214,255,0.9)",
                                cursor: isLoading ? "not-allowed" : "pointer",
                              }}
                            >
                              {isLoading ? "Processing..." : "APPROVE"}
                            </button>
                            <input
                              className="flex-1 rounded-lg px-3 py-2 text-xs outline-none"
                              style={{
                                background: "rgba(12,28,42,0.8)",
                                border: "1px solid rgba(255,80,80,0.2)",
                                color: "#e2f4ff",
                                minWidth: "120px",
                              }}
                              placeholder="Rejection reason (optional)"
                              value={bookingRejectReasons[b.id] ?? ""}
                              onChange={(e) =>
                                setBookingRejectReasons((prev) => ({
                                  ...prev,
                                  [b.id]: e.target.value,
                                }))
                              }
                            />
                            <button
                              type="button"
                              data-ocid={`admin.conference_pending.reject_button.${i + 1}`}
                              onClick={() => handleRejectBooking(b.id)}
                              disabled={isLoading}
                              className="px-4 py-2 rounded-lg text-xs font-montserrat font-bold tracking-widest uppercase"
                              style={{
                                background: "rgba(255,80,80,0.15)",
                                border: "1px solid rgba(255,80,80,0.3)",
                                color: "#ff6060",
                                cursor: isLoading ? "not-allowed" : "pointer",
                              }}
                            >
                              REJECT
                            </button>
                          </div>
                        </div>
                      );
                    })}
                </div>
              )}
            </div>

            {/* DINING ROOM APPROVALS */}
            <div
              className="glass-card p-6"
              style={{ borderColor: "rgba(249,115,22,0.2)" }}
            >
              <h3
                className="font-montserrat font-bold text-sm tracking-widest uppercase mb-4"
                style={{ color: "rgba(249,115,22,0.8)" }}
              >
                Dining Room Approvals{" "}
                <span
                  className="ml-2 px-2 py-0.5 rounded text-xs"
                  style={{
                    background: "rgba(249,115,22,0.15)",
                    color: "rgba(249,115,22,0.9)",
                  }}
                >
                  {
                    pendingBookings.filter((b) => b.roomType === "dining")
                      .length
                  }
                </span>
              </h3>
              {pendingBookings.filter((b) => b.roomType === "dining").length ===
              0 ? (
                <p
                  className="text-sm"
                  style={{ color: "rgba(100,180,220,0.45)" }}
                >
                  No pending dining room bookings.
                </p>
              ) : (
                <div className="space-y-4">
                  {pendingBookings
                    .filter((b) => b.roomType === "dining")
                    .map((b, i) => {
                      const isLoading = bookingActionLoading[b.id];
                      return (
                        <div
                          key={b.id}
                          data-ocid={`admin.dining_pending.item.${i + 1}`}
                          className="rounded-xl p-4 space-y-3"
                          style={{
                            background: "rgba(249,115,22,0.04)",
                            border: "1px solid rgba(249,115,22,0.15)",
                          }}
                        >
                          <div className="flex items-start justify-between flex-wrap gap-2">
                            <div>
                              <p className="font-montserrat font-bold text-sm text-white">
                                {b.roomName}
                              </p>
                              <p
                                className="text-xs mt-0.5"
                                style={{ color: "rgba(100,180,220,0.6)" }}
                              >
                                Dining Room · {b.bookingDate} {b.bookingHour}:
                                {b.bookingMinute}
                              </p>
                            </div>
                            <span
                              className="text-xs font-montserrat font-bold tracking-widest uppercase px-2.5 py-1 rounded-full"
                              style={{
                                background: "rgba(249,115,22,0.12)",
                                border: "1px solid rgba(249,115,22,0.3)",
                                color: "rgba(249,115,22,0.9)",
                              }}
                            >
                              PENDING
                            </span>
                          </div>
                          <div
                            className="grid grid-cols-2 gap-2 text-xs"
                            style={{ color: "rgba(140,190,220,0.7)" }}
                          >
                            <p>
                              <span style={{ color: "rgba(249,115,22,0.7)" }}>
                                Name:
                              </span>{" "}
                              {b.bookerName}
                            </p>
                            <p>
                              <span style={{ color: "rgba(249,115,22,0.7)" }}>
                                Email:
                              </span>{" "}
                              {b.email}
                            </p>
                            <p>
                              <span style={{ color: "rgba(249,115,22,0.7)" }}>
                                Mobile:
                              </span>{" "}
                              {b.mobile}
                            </p>
                            <p>
                              <span style={{ color: "rgba(249,115,22,0.7)" }}>
                                Purpose:
                              </span>{" "}
                              {b.purpose}
                            </p>
                          </div>
                          <div className="flex items-center gap-2 flex-wrap pt-1">
                            <button
                              type="button"
                              data-ocid={`admin.dining_pending.approve_button.${i + 1}`}
                              onClick={() => handleApproveBooking(b.id)}
                              disabled={isLoading}
                              className="px-4 py-2 rounded-lg text-xs font-montserrat font-bold tracking-widest uppercase"
                              style={{
                                background: "rgba(249,115,22,0.15)",
                                border: "1px solid rgba(249,115,22,0.3)",
                                color: "rgba(249,115,22,0.9)",
                                cursor: isLoading ? "not-allowed" : "pointer",
                              }}
                            >
                              {isLoading ? "Processing..." : "APPROVE"}
                            </button>
                            <input
                              className="flex-1 rounded-lg px-3 py-2 text-xs outline-none"
                              style={{
                                background: "rgba(12,28,42,0.8)",
                                border: "1px solid rgba(255,80,80,0.2)",
                                color: "#e2f4ff",
                                minWidth: "120px",
                              }}
                              placeholder="Rejection reason (optional)"
                              value={bookingRejectReasons[b.id] ?? ""}
                              onChange={(e) =>
                                setBookingRejectReasons((prev) => ({
                                  ...prev,
                                  [b.id]: e.target.value,
                                }))
                              }
                            />
                            <button
                              type="button"
                              data-ocid={`admin.dining_pending.reject_button.${i + 1}`}
                              onClick={() => handleRejectBooking(b.id)}
                              disabled={isLoading}
                              className="px-4 py-2 rounded-lg text-xs font-montserrat font-bold tracking-widest uppercase"
                              style={{
                                background: "rgba(255,80,80,0.15)",
                                border: "1px solid rgba(255,80,80,0.3)",
                                color: "#ff6060",
                                cursor: isLoading ? "not-allowed" : "pointer",
                              }}
                            >
                              REJECT
                            </button>
                          </div>
                        </div>
                      );
                    })}
                </div>
              )}
            </div>

            {/* All Pending Bookings (combined view) */}
            <div className="glass-card p-6">
              <h3
                className="font-montserrat font-bold text-sm tracking-widest uppercase mb-4"
                style={{ color: "rgba(245,196,0,0.8)" }}
              >
                Pending Bookings{" "}
                {pendingBookings.length > 0 && (
                  <span
                    className="ml-2 px-2 py-0.5 rounded text-xs"
                    style={{
                      background: "rgba(245,196,0,0.2)",
                      color: "#f5c400",
                    }}
                  >
                    {pendingBookings.length}
                  </span>
                )}
              </h3>
              {pendingBookings.length === 0 ? (
                <p
                  className="text-sm"
                  style={{ color: "rgba(100,180,220,0.45)" }}
                  data-ocid="admin.bookings_pending.empty_state"
                >
                  No pending bookings.
                </p>
              ) : (
                <div className="space-y-4">
                  {pendingBookings.map((b, i) => {
                    const isLoading = bookingActionLoading[b.id];
                    return (
                      <div
                        key={b.id}
                        data-ocid={`admin.bookings_pending.item.${i + 1}`}
                        className="rounded-xl p-4 space-y-3"
                        style={{
                          background: "rgba(245,196,0,0.05)",
                          border: "1px solid rgba(245,196,0,0.15)",
                        }}
                      >
                        <div className="flex items-start justify-between flex-wrap gap-2">
                          <div>
                            <p className="font-montserrat font-bold text-sm text-white">
                              {b.roomName}
                            </p>
                            <p
                              className="text-xs mt-0.5"
                              style={{ color: "rgba(100,180,220,0.6)" }}
                            >
                              {b.roomType === "conference"
                                ? "Conference Room"
                                : "Dining Room"}{" "}
                              · {b.bookingDate} {b.bookingHour}:
                              {b.bookingMinute}
                            </p>
                          </div>
                          <span
                            className="text-xs font-montserrat font-bold tracking-widest uppercase px-2.5 py-1 rounded-full"
                            style={{
                              background: "rgba(245,196,0,0.12)",
                              border: "1px solid rgba(245,196,0,0.3)",
                              color: "#f5c400",
                            }}
                          >
                            PENDING
                          </span>
                        </div>
                        <div
                          className="grid grid-cols-2 gap-2 text-xs"
                          style={{ color: "rgba(140,190,220,0.7)" }}
                        >
                          <p>
                            <span style={{ color: "rgba(85,214,255,0.5)" }}>
                              Name:
                            </span>{" "}
                            {b.bookerName}
                          </p>
                          <p>
                            <span style={{ color: "rgba(85,214,255,0.5)" }}>
                              Email:
                            </span>{" "}
                            {b.email}
                          </p>
                          <p>
                            <span style={{ color: "rgba(85,214,255,0.5)" }}>
                              Mobile:
                            </span>{" "}
                            {b.mobile}
                          </p>
                          <p>
                            <span style={{ color: "rgba(85,214,255,0.5)" }}>
                              Purpose:
                            </span>{" "}
                            {b.purpose}
                          </p>
                        </div>
                        <div className="flex gap-2 flex-wrap">
                          <button
                            type="button"
                            disabled={isLoading}
                            onClick={() => handleApproveBooking(b.id)}
                            data-ocid={`admin.bookings_pending.confirm_button.${i + 1}`}
                            className="px-4 py-2 rounded-lg text-xs font-montserrat font-bold tracking-widest uppercase"
                            style={{
                              background: "rgba(0,220,120,0.15)",
                              border: "1px solid rgba(0,220,120,0.3)",
                              color: "#00dc78",
                              cursor: isLoading ? "not-allowed" : "pointer",
                            }}
                          >
                            {isLoading ? "..." : "APPROVE"}
                          </button>
                          <input
                            type="text"
                            placeholder="Rejection reason..."
                            value={bookingRejectReasons[b.id] ?? ""}
                            onChange={(e) =>
                              setBookingRejectReasons((p) => ({
                                ...p,
                                [b.id]: e.target.value,
                              }))
                            }
                            className="flex-1 min-w-0 rounded-lg px-3 py-2 text-xs outline-none"
                            style={{
                              background: "rgba(12,28,42,0.8)",
                              border: "1px solid rgba(255,80,80,0.2)",
                              color: "#e2f4ff",
                            }}
                          />
                          <button
                            type="button"
                            disabled={isLoading}
                            onClick={() => handleRejectBooking(b.id)}
                            data-ocid={`admin.bookings_pending.delete_button.${i + 1}`}
                            className="px-4 py-2 rounded-lg text-xs font-montserrat font-bold tracking-widest uppercase"
                            style={{
                              background: "rgba(255,80,80,0.15)",
                              border: "1px solid rgba(255,80,80,0.3)",
                              color: "#ff6060",
                              cursor: isLoading ? "not-allowed" : "pointer",
                            }}
                          >
                            REJECT
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* All bookings table */}
            <div className="glass-card p-6">
              <h3
                className="font-montserrat font-bold text-sm tracking-widest uppercase mb-4"
                style={{ color: "rgba(85,214,255,0.8)" }}
              >
                All Bookings
              </h3>
              {allBookings.length === 0 ? (
                <p
                  className="text-sm"
                  style={{ color: "rgba(100,180,220,0.45)" }}
                  data-ocid="admin.bookings_all.empty_state"
                >
                  No bookings yet.
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table
                    className="w-full text-xs"
                    data-ocid="admin.bookings_all.table"
                  >
                    <thead>
                      <tr
                        style={{
                          borderBottom: "1px solid rgba(85,214,255,0.12)",
                        }}
                      >
                        {[
                          "#",
                          "Room",
                          "Type",
                          "Booker",
                          "Email",
                          "Date",
                          "Time",
                          "Status",
                        ].map((h) => (
                          <th
                            key={h}
                            className="text-left py-2 px-3 font-montserrat font-bold tracking-widest uppercase"
                            style={{
                              color: "rgba(85,214,255,0.6)",
                              fontSize: "0.6rem",
                            }}
                          >
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {allBookings.map((b, i) => {
                        const st =
                          "pending" in b.status
                            ? "pending"
                            : "approved" in b.status
                              ? "approved"
                              : "rejected";
                        const stColor =
                          st === "pending"
                            ? "#f5c400"
                            : st === "approved"
                              ? "#55d6ff"
                              : "#ff6060";
                        return (
                          <tr
                            key={b.id}
                            data-ocid={`admin.bookings_all.row.${i + 1}`}
                            style={{
                              borderBottom: "1px solid rgba(85,214,255,0.06)",
                            }}
                          >
                            <td
                              className="py-2 px-3"
                              style={{ color: "rgba(100,180,220,0.5)" }}
                            >
                              {i + 1}
                            </td>
                            <td className="py-2 px-3 font-semibold text-white">
                              {b.roomName}
                            </td>
                            <td
                              className="py-2 px-3"
                              style={{ color: "rgba(140,190,220,0.7)" }}
                            >
                              {b.roomType}
                            </td>
                            <td
                              className="py-2 px-3"
                              style={{ color: "rgba(140,190,220,0.7)" }}
                            >
                              {b.bookerName}
                            </td>
                            <td
                              className="py-2 px-3"
                              style={{ color: "rgba(140,190,220,0.7)" }}
                            >
                              {b.email}
                            </td>
                            <td
                              className="py-2 px-3"
                              style={{ color: "rgba(140,190,220,0.7)" }}
                            >
                              {b.bookingDate}
                            </td>
                            <td
                              className="py-2 px-3"
                              style={{ color: "rgba(140,190,220,0.7)" }}
                            >
                              {b.bookingHour}:{b.bookingMinute}
                            </td>
                            <td className="py-2 px-3">
                              <span
                                className="font-montserrat font-bold uppercase"
                                style={{ color: stColor }}
                              >
                                {st}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </TabsContent>

          {/* RATINGS TAB */}
          <TabsContent value="ratings" className="space-y-4">
            <div className="glass-card p-6">
              <h3
                className="font-montserrat font-bold text-sm tracking-widest uppercase mb-4"
                style={{ color: "#fbbf24" }}
              >
                Service Ratings{" "}
                {allRatings.length > 0 && (
                  <span
                    className="ml-2 px-2 py-0.5 rounded text-xs"
                    style={{
                      background: "rgba(251,191,36,0.2)",
                      color: "#fbbf24",
                    }}
                  >
                    {allRatings.length}
                  </span>
                )}
              </h3>
              {allRatings.length === 0 ? (
                <p
                  className="text-sm"
                  style={{ color: "rgba(200,160,80,0.45)" }}
                  data-ocid="admin.ratings.empty_state"
                >
                  No ratings submitted yet.
                </p>
              ) : (
                <div className="space-y-4">
                  {allRatings.map((r, i) => (
                    <div
                      key={r.id}
                      data-ocid={`admin.ratings.item.${i + 1}`}
                      className="rounded-xl p-4 space-y-3"
                      style={{
                        background: "rgba(251,191,36,0.04)",
                        border: "1px solid rgba(251,191,36,0.2)",
                      }}
                    >
                      <div className="flex items-start justify-between flex-wrap gap-2">
                        <div>
                          <p className="font-montserrat font-bold text-sm text-white">
                            {r.roomName}
                          </p>
                          <p
                            className="text-xs mt-0.5"
                            style={{ color: "rgba(200,160,80,0.6)" }}
                          >
                            {r.bookerName} · {r.email}
                          </p>
                          <p
                            className="text-xs mt-0.5 font-mono"
                            style={{ color: "rgba(200,160,80,0.5)" }}
                          >
                            Booking: {r.bookingId}
                          </p>
                        </div>
                        <span
                          className="text-xs font-montserrat font-bold px-2.5 py-1 rounded-full"
                          style={{
                            background: "rgba(251,191,36,0.12)",
                            border: "1px solid rgba(251,191,36,0.3)",
                            color: "#fbbf24",
                          }}
                        >
                          {r.selectedOptions.length} ratings
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {r.selectedOptions.map((opt) => (
                          <span
                            key={opt}
                            className="text-xs px-2 py-0.5 rounded-full"
                            style={{
                              background: "rgba(251,191,36,0.08)",
                              border: "1px solid rgba(251,191,36,0.2)",
                              color: "rgba(251,191,36,0.8)",
                            }}
                          >
                            {opt}
                          </span>
                        ))}
                      </div>
                      {r.overallComment && (
                        <p
                          className="text-xs italic"
                          style={{ color: "rgba(180,200,220,0.6)" }}
                        >
                          "{r.overallComment}"
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="images" className="space-y-4">
            <div className="glass-card p-6">
              <div className="mb-4">
                <h3
                  className="font-montserrat font-bold text-sm tracking-widest uppercase mb-1"
                  style={{ color: "rgba(85,214,255,0.8)" }}
                >
                  Slideshow Images
                </h3>
                <p
                  className="text-xs"
                  style={{ color: "rgba(100,180,220,0.5)" }}
                >
                  15 images currently active on the home page EBC slideshow.
                </p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {[
                  {
                    src: "/assets/generated/ebc_slide_01_conference_meeting.dim_1920x1080.jpg",
                    label: "Conference Meeting",
                  },
                  {
                    src: "/assets/generated/ebc_slide_02_reception_area.dim_1920x1080.jpg",
                    label: "Reception Area",
                  },
                  {
                    src: "/assets/generated/ebc_slide_03_dining_area.dim_1920x1080.jpg",
                    label: "Dining Area",
                  },
                  {
                    src: "/assets/generated/ebc_slide_04_kitchen_staff.dim_1920x1080.jpg",
                    label: "Kitchen Staff",
                  },
                  {
                    src: "/assets/generated/ebc_slide_05_open_office.dim_1920x1080.jpg",
                    label: "Open Office",
                  },
                  {
                    src: "/assets/generated/ebc_slide_06_boardroom.dim_1920x1080.jpg",
                    label: "Boardroom",
                  },
                  {
                    src: "/assets/generated/ebc_slide_07_lounge_area.dim_1920x1080.jpg",
                    label: "Lounge Area",
                  },
                  {
                    src: "/assets/generated/ebc_slide_08_buffet_dining.dim_1920x1080.jpg",
                    label: "Buffet Dining",
                  },
                  {
                    src: "/assets/generated/ebc_slide_09_server_room.dim_1920x1080.jpg",
                    label: "Server Room",
                  },
                  {
                    src: "/assets/generated/ebc_slide_10_training_room.dim_1920x1080.jpg",
                    label: "Training Room",
                  },
                  {
                    src: "/assets/generated/ebc_slide_11_lobby_entrance.dim_1920x1080.jpg",
                    label: "Lobby Entrance",
                  },
                  {
                    src: "/assets/generated/ebc_slide_12_private_meeting.dim_1920x1080.jpg",
                    label: "Private Meeting",
                  },
                  {
                    src: "/assets/generated/ebc_slide_13_restaurant_dining.dim_1920x1080.jpg",
                    label: "Restaurant Dining",
                  },
                  {
                    src: "/assets/generated/ebc_slide_14_catering_kitchen.dim_1920x1080.jpg",
                    label: "Catering Kitchen",
                  },
                  {
                    src: "/assets/generated/ebc_slide_15_night_office.dim_1920x1080.jpg",
                    label: "Night Office",
                  },
                ].map((img, i) => (
                  <div
                    key={img.src}
                    data-ocid={`admin.images.item.${i + 1}`}
                    className="rounded-xl overflow-hidden"
                    style={{
                      border: "1px solid rgba(85,214,255,0.15)",
                      background: "rgba(8,22,36,0.6)",
                    }}
                  >
                    <div className="relative" style={{ aspectRatio: "16/9" }}>
                      <img
                        src={img.src}
                        alt={img.label}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                      <div
                        className="absolute top-2 left-2 text-xs font-montserrat font-bold px-2 py-0.5 rounded"
                        style={{
                          background: "rgba(85,214,255,0.15)",
                          color: "#55d6ff",
                          border: "1px solid rgba(85,214,255,0.25)",
                        }}
                      >
                        {String(i + 1).padStart(2, "0")}
                      </div>
                    </div>
                    <div className="px-3 py-2">
                      <p
                        className="text-xs font-montserrat tracking-wide uppercase"
                        style={{ color: "rgba(140,190,220,0.7)" }}
                      >
                        {img.label}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
