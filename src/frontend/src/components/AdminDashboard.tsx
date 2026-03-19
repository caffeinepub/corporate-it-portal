import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  Loader2,
  ShieldCheck,
  Users,
  XCircle,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";
import type { UserProfile } from "../backend.d";
import { UserStatus } from "../hooks/useQueries";
import {
  useApproveUser,
  useGetAllRegistrations,
  useGetPendingRegistrations,
  useRejectUser,
} from "../hooks/useQueries";

// ─── Stat card ──────────────────────────────────────────────────────────────────
function StatCard({
  label,
  value,
  color,
  icon: Icon,
  sub,
}: {
  label: string;
  value: number;
  color: string;
  sub?: string;
  icon: React.ComponentType<{ size?: number; color?: string }>;
}) {
  return (
    <div
      className="relative overflow-hidden rounded-xl p-5 flex items-center gap-4"
      style={{
        background:
          "linear-gradient(135deg, rgba(8,20,32,0.9) 0%, rgba(8,20,32,0.7) 100%)",
        border: `1px solid rgba(${color === "#55d6ff" ? "85,214,255" : color === "#ffd93d" ? "255,217,61" : color === "#4ade80" ? "74,222,128" : "255,107,107"},0.22)`,
        borderTop: `2px solid ${color}`,
      }}
    >
      {/* Background glow */}
      <div
        className="absolute top-0 right-0 w-24 h-24 rounded-full pointer-events-none"
        style={{
          background: `radial-gradient(circle, ${color}18 0%, transparent 70%)`,
          transform: "translate(30%, -30%)",
        }}
      />
      <div
        className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
        style={
          {
            background: `${color}14`,
            border: `1px solid ${color}35`,
          } as React.CSSProperties
        }
      >
        <Icon size={19} color={color} />
      </div>
      <div className="relative">
        <p
          className="font-montserrat font-black leading-none"
          style={{ fontSize: "1.75rem", color }}
        >
          {value}
        </p>
        <p
          className="text-[10px] uppercase tracking-widest mt-0.5"
          style={{ color: "rgba(169,182,198,0.6)" }}
        >
          {label}
        </p>
        {sub && (
          <p className="text-[9px] mt-0.5" style={{ color: `${color}80` }}>
            {sub}
          </p>
        )}
      </div>
    </div>
  );
}

// ─── Status pill ────────────────────────────────────────────────────────────────
function StatusPill({ status }: { status: string }) {
  const map: Record<
    string,
    { color: string; bg: string; dot: string; label: string }
  > = {
    [UserStatus.pending]: {
      color: "#ffd93d",
      bg: "rgba(255,217,61,0.1)",
      dot: "#ffd93d",
      label: "Pending",
    },
    [UserStatus.approved]: {
      color: "#4ade80",
      bg: "rgba(74,222,128,0.1)",
      dot: "#4ade80",
      label: "Approved",
    },
    [UserStatus.rejected]: {
      color: "#ff6b6b",
      bg: "rgba(255,107,107,0.1)",
      dot: "#ff6b6b",
      label: "Rejected",
    },
  };
  const s = map[status] ?? map[UserStatus.pending];
  return (
    <span
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider"
      style={{
        background: s.bg,
        color: s.color,
        border: `1px solid ${s.color}38`,
      }}
    >
      <span
        className="w-1.5 h-1.5 rounded-full shrink-0"
        style={{ background: s.dot, boxShadow: `0 0 4px ${s.dot}` }}
      />
      {s.label}
    </span>
  );
}

// ─── Table row ──────────────────────────────────────────────────────────────────
function RegistrationRow({
  profile,
  index,
  showActions,
}: {
  profile: UserProfile;
  index: number;
  showActions: boolean;
}) {
  const [rejectOpen, setRejectOpen] = useState(false);
  const [reason, setReason] = useState("");
  const approve = useApproveUser();
  const reject = useRejectUser();

  const handleApprove = async () => {
    try {
      await approve.mutateAsync(profile.principal);
      toast.success(`${profile.name} has been approved.`);
    } catch (err: any) {
      toast.error(err?.message ?? "Failed to approve user.");
    }
  };

  const handleReject = async () => {
    if (!reason.trim()) return;
    try {
      await reject.mutateAsync({
        principal: profile.principal,
        reason: reason.trim(),
      });
      toast.success(`${profile.name}'s registration has been rejected.`);
      setRejectOpen(false);
      setReason("");
    } catch (err: any) {
      toast.error(err?.message ?? "Failed to reject user.");
    }
  };

  const isEven = index % 2 === 0;

  return (
    <>
      <motion.div
        className="admin-table-row"
        style={{
          gridTemplateColumns: "2.5fr 1.8fr 1.4fr 1fr auto",
          background: isEven ? "rgba(255,255,255,0.015)" : "transparent",
        }}
        initial={{ opacity: 0, x: -8 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.03 * index }}
        data-ocid={`admin.registration.item.${index + 1}`}
      >
        {/* Name + Role */}
        <div className="min-w-0 pr-3">
          <p className="font-montserrat font-bold text-sm text-white truncate">
            {profile.name}
          </p>
          <p
            className="text-[10px] font-bold uppercase tracking-wider truncate"
            style={{ color: "rgba(85,214,255,0.7)" }}
          >
            {profile.roleTitle}
          </p>
          <p
            className="text-[10px] mt-0.5 truncate"
            style={{ color: "rgba(169,182,198,0.5)" }}
          >
            {profile.registrationPurpose}
          </p>
        </div>

        {/* Contact */}
        <div className="min-w-0 pr-3">
          <p
            className="text-xs truncate"
            style={{ color: "rgba(169,182,198,0.85)" }}
          >
            {profile.email}
          </p>
          <p
            className="text-[11px] mt-0.5"
            style={{ color: "rgba(169,182,198,0.55)" }}
          >
            {profile.mobile}
          </p>
        </div>

        {/* Country + DOB */}
        <div className="min-w-0 pr-3">
          <p className="text-xs" style={{ color: "rgba(169,182,198,0.85)" }}>
            {profile.country}
          </p>
          <p
            className="text-[11px] mt-0.5"
            style={{ color: "rgba(169,182,198,0.45)" }}
          >
            {profile.dateOfBirth}
          </p>
        </div>

        {/* Status */}
        <div>
          <StatusPill status={profile.status as unknown as string} />
          {profile.rejectionReason && (
            <p
              className="text-[9px] mt-1 max-w-[120px] truncate"
              style={{ color: "rgba(255,107,107,0.6)" }}
              title={profile.rejectionReason}
            >
              {profile.rejectionReason}
            </p>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1.5 shrink-0">
          {showActions ? (
            <>
              <button
                type="button"
                onClick={handleApprove}
                disabled={approve.isPending}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all"
                style={{
                  background: "rgba(74,222,128,0.1)",
                  border: "1px solid rgba(74,222,128,0.35)",
                  color: "#4ade80",
                }}
                title="Approve"
                data-ocid={`admin.approve.button.${index + 1}`}
              >
                {approve.isPending ? (
                  <Loader2 size={11} className="animate-spin" />
                ) : (
                  <CheckCircle2 size={11} />
                )}
                <span className="hidden sm:inline">Approve</span>
              </button>
              <button
                type="button"
                onClick={() => setRejectOpen((v) => !v)}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all"
                style={{
                  background: rejectOpen
                    ? "rgba(255,107,107,0.2)"
                    : "rgba(255,107,107,0.08)",
                  border: "1px solid rgba(255,107,107,0.35)",
                  color: "#ff6b6b",
                }}
                title="Reject"
                data-ocid={`admin.reject.button.${index + 1}`}
              >
                <XCircle size={11} />
                <span className="hidden sm:inline">Reject</span>
              </button>
            </>
          ) : (
            <span
              className="text-[10px]"
              style={{ color: "rgba(169,182,198,0.3)" }}
            >
              —
            </span>
          )}
        </div>
      </motion.div>

      {/* Reject reason expansion */}
      <AnimatePresence>
        {rejectOpen && (
          <motion.div
            key="reject-panel"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div
              className="px-5 py-4 mx-4 mb-2 rounded-xl"
              style={{
                background: "rgba(255,107,107,0.05)",
                border: "1px solid rgba(255,107,107,0.2)",
              }}
            >
              <p
                className="text-[10px] font-bold uppercase tracking-widest mb-2"
                style={{ color: "rgba(255,107,107,0.7)" }}
              >
                Rejection reason for{" "}
                <span style={{ color: "#ffa0a0" }}>{profile.name}</span>
              </p>
              <textarea
                id="reject-reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Provide a clear reason for rejection..."
                rows={2}
                className="w-full px-3 py-2.5 rounded-lg text-sm text-white placeholder-gray-600 outline-none resize-none"
                style={{
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,107,107,0.25)",
                }}
                data-ocid={`admin.reject_reason.textarea.${index + 1}`}
              />
              <div className="flex gap-2 mt-2.5">
                <button
                  type="button"
                  onClick={handleReject}
                  disabled={!reason.trim() || reject.isPending}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                  style={{
                    background: "rgba(255,107,107,0.18)",
                    border: "1px solid rgba(255,107,107,0.45)",
                    color: "#ff6b6b",
                  }}
                  data-ocid={`admin.confirm_reject.button.${index + 1}`}
                >
                  {reject.isPending ? (
                    <Loader2 size={11} className="animate-spin" />
                  ) : (
                    <XCircle size={11} />
                  )}
                  Confirm Reject
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setRejectOpen(false);
                    setReason("");
                  }}
                  className="px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider"
                  style={{
                    background: "rgba(255,255,255,0.04)",
                    color: "rgba(169,182,198,0.7)",
                    border: "1px solid rgba(255,255,255,0.08)",
                  }}
                  data-ocid={`admin.cancel_reject.button.${index + 1}`}
                >
                  Cancel
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

// ─── Main Dashboard ─────────────────────────────────────────────────────────────
export function AdminDashboard({ onBack }: { onBack: () => void }) {
  const [tab, setTab] = useState<"pending" | "all">("pending");
  const { data: pending = [], isLoading: pendingLoading } =
    useGetPendingRegistrations();
  const { data: all = [], isLoading: allLoading } = useGetAllRegistrations();

  const totalCount = all.length;
  const approvedCount = all.filter(
    (r) => (r.status as unknown as string) === UserStatus.approved,
  ).length;
  const rejectedCount = all.filter(
    (r) => (r.status as unknown as string) === UserStatus.rejected,
  ).length;
  const pendingCount = all.filter(
    (r) => (r.status as unknown as string) === UserStatus.pending,
  ).length;

  const isLoading = tab === "pending" ? pendingLoading : allLoading;
  const list: UserProfile[] = tab === "pending" ? pending : all;

  return (
    <div className="relative min-h-screen" style={{ background: "#040d16" }}>
      <div
        className="fixed inset-0"
        style={{
          backgroundImage:
            "url('/assets/generated/corporate-it-bg.dim_1920x1080.jpg')",
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundAttachment: "fixed",
          zIndex: 0,
          opacity: 0.18,
        }}
      />
      <div
        className="fixed inset-0"
        style={{ background: "rgba(2,7,16,0.92)", zIndex: 0 }}
      />

      <div className="relative" style={{ zIndex: 1 }}>
        {/* ── Header ── */}
        <header
          className="sticky top-0 z-40"
          style={{
            background: "rgba(2,7,16,0.96)",
            backdropFilter: "blur(24px)",
            WebkitBackdropFilter: "blur(24px)",
            borderBottom: "1px solid rgba(85,214,255,0.1)",
            borderTop: "2px solid rgba(85,214,255,0.5)",
          }}
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3.5 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={onBack}
                className="flex items-center gap-1.5 btn-cyan px-3 py-1.5 rounded-xl text-xs font-semibold"
                data-ocid="admin.back.button"
              >
                <ArrowLeft size={13} />
                Back
              </button>
              <div
                className="hidden sm:block w-px h-7"
                style={{ background: "rgba(85,214,255,0.15)" }}
              />
              <div className="hidden sm:block">
                <p
                  className="text-[9px] font-montserrat font-bold uppercase tracking-[0.3em]"
                  style={{ color: "rgba(85,214,255,0.45)" }}
                >
                  Corporate IT Portal
                </p>
                <h1
                  className="font-montserrat font-black uppercase text-base tracking-wider"
                  style={{
                    color: "#55d6ff",
                    textShadow: "0 0 20px rgba(85,214,255,0.35)",
                  }}
                >
                  ADMIN CONTROL CENTER
                </h1>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div
                className="flex items-center gap-2 px-3.5 py-2 rounded-xl"
                style={{
                  background: "rgba(74,222,128,0.07)",
                  border: "1px solid rgba(74,222,128,0.2)",
                }}
              >
                <div
                  className="w-1.5 h-1.5 rounded-full"
                  style={{
                    background: "#4ade80",
                    boxShadow: "0 0 6px #4ade80",
                    animation: "pulse 2s ease-in-out infinite",
                  }}
                />
                <span
                  className="text-[10px] font-bold uppercase tracking-wider"
                  style={{ color: "#4ade80" }}
                >
                  ADMIN LIVE
                </span>
              </div>
              <div
                className="hidden md:flex items-center gap-2 px-3.5 py-2 rounded-xl"
                style={{
                  background: "rgba(85,214,255,0.06)",
                  border: "1px solid rgba(85,214,255,0.15)",
                }}
              >
                <ShieldCheck size={13} color="#55d6ff" />
                <span
                  className="text-[10px] font-bold uppercase tracking-wider"
                  style={{ color: "rgba(85,214,255,0.8)" }}
                >
                  Full Access
                </span>
              </div>
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
          {/* ── Stats ── */}
          <motion.div
            className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            data-ocid="admin.stats.section"
          >
            <StatCard
              label="Total"
              value={totalCount}
              color="#55d6ff"
              icon={Users}
              sub="All registrations"
            />
            <StatCard
              label="Pending"
              value={pendingCount}
              color="#ffd93d"
              icon={Clock}
              sub="Awaiting review"
            />
            <StatCard
              label="Approved"
              value={approvedCount}
              color="#4ade80"
              icon={CheckCircle2}
              sub="Active users"
            />
            <StatCard
              label="Rejected"
              value={rejectedCount}
              color="#ff6b6b"
              icon={XCircle}
              sub="Declined"
            />
          </motion.div>

          {/* ── Table panel ── */}
          <motion.div
            className="rounded-2xl overflow-hidden"
            style={{
              background: "rgba(5,14,26,0.88)",
              border: "1px solid rgba(85,214,255,0.12)",
              backdropFilter: "blur(16px)",
            }}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            {/* Panel header with tabs */}
            <div
              className="px-6 py-4 flex items-center justify-between flex-wrap gap-3"
              style={{
                borderBottom: "1px solid rgba(85,214,255,0.1)",
                background: "rgba(85,214,255,0.03)",
              }}
            >
              <div className="flex items-center gap-2">
                <div
                  className="w-1 h-5 rounded-full"
                  style={{ background: "rgba(85,214,255,0.6)" }}
                />
                <h2
                  className="font-montserrat font-bold text-xs uppercase tracking-widest"
                  style={{ color: "rgba(240,248,255,0.9)" }}
                >
                  Registration Management
                </h2>
              </div>

              <div
                className="flex gap-1 p-1 rounded-xl"
                style={{
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(85,214,255,0.1)",
                }}
                data-ocid="admin.tabs.section"
              >
                <button
                  type="button"
                  onClick={() => setTab("pending")}
                  className="px-4 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all"
                  style={
                    tab === "pending"
                      ? {
                          background: "rgba(255,217,61,0.15)",
                          color: "#ffd93d",
                          border: "1px solid rgba(255,217,61,0.3)",
                        }
                      : {
                          color: "rgba(169,182,198,0.5)",
                          border: "1px solid transparent",
                        }
                  }
                  data-ocid="admin.pending.tab"
                >
                  Pending ({pendingCount})
                </button>
                <button
                  type="button"
                  onClick={() => setTab("all")}
                  className="px-4 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all"
                  style={
                    tab === "all"
                      ? {
                          background: "rgba(85,214,255,0.15)",
                          color: "#55d6ff",
                          border: "1px solid rgba(85,214,255,0.3)",
                        }
                      : {
                          color: "rgba(169,182,198,0.5)",
                          border: "1px solid transparent",
                        }
                  }
                  data-ocid="admin.all.tab"
                >
                  All ({totalCount})
                </button>
              </div>
            </div>

            {/* Column headers */}
            {!isLoading && list.length > 0 && (
              <div
                className="admin-table-header"
                style={{
                  gridTemplateColumns: "2.5fr 1.8fr 1.4fr 1fr auto",
                }}
              >
                <span>Applicant</span>
                <span>Contact</span>
                <span>Location / DOB</span>
                <span>Status</span>
                <span>Actions</span>
              </div>
            )}

            {/* Body */}
            {isLoading ? (
              <div
                className="flex flex-col items-center justify-center py-20 gap-4"
                data-ocid="admin.loading_state"
              >
                <Loader2
                  size={28}
                  className="animate-spin"
                  style={{ color: "#55d6ff" }}
                />
                <p
                  className="text-xs uppercase tracking-widest"
                  style={{ color: "rgba(169,182,198,0.5)" }}
                >
                  Loading registrations...
                </p>
              </div>
            ) : list.length === 0 ? (
              <div
                className="flex flex-col items-center justify-center py-20 gap-4"
                data-ocid="admin.registrations.empty_state"
              >
                <div
                  className="w-14 h-14 rounded-xl flex items-center justify-center"
                  style={{
                    background: "rgba(85,214,255,0.06)",
                    border: "1px solid rgba(85,214,255,0.15)",
                  }}
                >
                  <Users size={22} color="#55d6ff" style={{ opacity: 0.4 }} />
                </div>
                <div className="text-center">
                  <p
                    className="font-montserrat font-bold text-sm"
                    style={{ color: "rgba(240,248,255,0.6)" }}
                  >
                    No registrations found
                  </p>
                  <p
                    className="text-xs mt-1"
                    style={{ color: "rgba(169,182,198,0.35)" }}
                  >
                    {tab === "pending"
                      ? "No pending registrations at this time."
                      : "No registrations yet."}
                  </p>
                </div>
              </div>
            ) : (
              <div data-ocid="admin.registrations.list">
                {list.map((profile, i) => (
                  <RegistrationRow
                    key={profile.principal.toString()}
                    profile={profile}
                    index={i}
                    showActions={
                      tab === "pending" &&
                      (profile.status as unknown as string) ===
                        UserStatus.pending
                    }
                  />
                ))}
              </div>
            )}

            {/* Table footer */}
            {!isLoading && list.length > 0 && (
              <div
                className="px-6 py-3 flex items-center justify-between"
                style={{
                  borderTop: "1px solid rgba(85,214,255,0.07)",
                  background: "rgba(85,214,255,0.02)",
                }}
              >
                <p
                  className="text-[10px] uppercase tracking-wider"
                  style={{ color: "rgba(169,182,198,0.35)" }}
                >
                  Showing {list.length} record{list.length !== 1 ? "s" : ""}
                </p>
                <p
                  className="text-[10px] uppercase tracking-wider"
                  style={{ color: "rgba(85,214,255,0.3)" }}
                >
                  NEXUS IT Portal · Admin
                </p>
              </div>
            )}
          </motion.div>
        </main>

        <footer
          className="text-center py-6 px-4 mt-6"
          style={{
            borderTop: "1px solid rgba(85,214,255,0.06)",
            background: "rgba(2,6,14,0.8)",
          }}
        >
          <p className="text-[11px]" style={{ color: "rgba(74,85,104,0.8)" }}>
            © {new Date().getFullYear()} NEXUS Corporate IT Portal — Admin Panel
            ·{" "}
            <a
              href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(typeof window !== "undefined" ? window.location.hostname : "")}`}
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: "rgba(85,214,255,0.6)" }}
            >
              caffeine.ai
            </a>
          </p>
        </footer>
      </div>
    </div>
  );
}
