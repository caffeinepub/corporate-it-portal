import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  CheckCircle,
  Clock,
  Copy,
  Loader2,
  Search,
  XCircle,
} from "lucide-react";
import { useState } from "react";
import type {
  backendInterface as NewBackend,
  RegistrationRecord,
} from "../backend.d";
import { useBackend } from "../hooks/useBackend";

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

interface Props {
  onClose: () => void;
  prefillEmail?: string;
}

export function StatusCheckModal({ onClose, prefillEmail = "" }: Props) {
  const { actor, isFetching } = useBackend();
  const [email, setEmail] = useState(prefillEmail);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<RegistrationRecord | null | "not_found">(
    null,
  );
  const [error, setError] = useState("");
  const [copiedUser, setCopiedUser] = useState(false);
  const [copiedPass, setCopiedPass] = useState(false);

  async function handleCheck(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    if (!actor) {
      setError("Backend not ready. Please try again.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const nb = actor as unknown as NewBackend;
      const rec = await nb.getRegistrationStatusByEmail(email.trim());
      setResult(rec ?? "not_found");
    } catch (_) {
      setError("Failed to fetch status. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  function copyText(text: string, which: "user" | "pass") {
    navigator.clipboard.writeText(text).then(() => {
      if (which === "user") {
        setCopiedUser(true);
        setTimeout(() => setCopiedUser(false), 2000);
      } else {
        setCopiedPass(true);
        setTimeout(() => setCopiedPass(false), 2000);
      }
    });
  }

  const status = result && result !== "not_found" ? getStatus(result) : null;

  const statusStyle = {
    pending: {
      bg: "rgba(250,200,0,0.1)",
      border: "rgba(250,200,0,0.3)",
      color: "#f5c400",
      icon: <Clock size={20} color="#f5c400" />,
      label: "PENDING APPROVAL",
    },
    approved: {
      bg: "rgba(0,220,120,0.1)",
      border: "rgba(0,220,120,0.3)",
      color: "#00dc78",
      icon: <CheckCircle size={20} color="#00dc78" />,
      label: "APPROVED",
    },
    rejected: {
      bg: "rgba(255,80,80,0.1)",
      border: "rgba(255,80,80,0.3)",
      color: "#ff6060",
      icon: <XCircle size={20} color="#ff6060" />,
      label: "REJECTED",
    },
  };

  const hasResult = result && result !== "not_found" && status;

  return (
    <div
      className="fixed inset-0 flex items-center justify-center z-50"
      style={{ background: "rgba(2,8,18,0.88)", backdropFilter: "blur(8px)" }}
      onClick={onClose}
      onKeyDown={(e) => e.key === "Escape" && onClose()}
      role="presentation"
    >
      <div
        className="glass-modal w-full max-w-lg mx-4"
        style={{ maxHeight: "92vh", display: "flex", flexDirection: "column" }}
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => e.stopPropagation()}
        data-ocid="status_check.modal"
      >
        {/* Fixed header */}
        <div
          className="px-8 pt-8 pb-5"
          style={{ borderBottom: "1px solid rgba(85,214,255,0.1)" }}
        >
          <div className="flex items-center gap-3">
            <div className="icon-tile">
              <Search size={20} color="#55d6ff" />
            </div>
            <div>
              <h2 className="font-montserrat font-bold text-lg tracking-widest text-white uppercase">
                Check Registration Status
              </h2>
              <p className="text-xs" style={{ color: "rgba(100,180,220,0.6)" }}>
                Enter your registered email address
              </p>
            </div>
          </div>
        </div>

        {/* Scrollable body */}
        <ScrollArea style={{ flex: 1, minHeight: 0 }}>
          <div className="px-8 py-6 space-y-5">
            <form onSubmit={handleCheck} className="space-y-4">
              <div className="space-y-1.5">
                <Label
                  className="text-xs font-montserrat tracking-widest uppercase"
                  style={{ color: "rgba(100,180,220,0.7)" }}
                >
                  Email Address
                </Label>
                <Input
                  data-ocid="status_check.input"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  style={{
                    background: "rgba(12,28,42,0.8)",
                    border: "1px solid rgba(85,214,255,0.25)",
                    color: "#e2f4ff",
                  }}
                />
              </div>
              {error && (
                <p
                  data-ocid="status_check.error_state"
                  className="text-xs"
                  style={{ color: "#ff8080" }}
                >
                  {error}
                </p>
              )}
              <Button
                type="submit"
                disabled={loading || isFetching}
                data-ocid="status_check.submit_button"
                className="w-full btn-cyan-solid font-montserrat tracking-widest text-xs uppercase"
                style={{ height: "42px" }}
              >
                {loading ? (
                  <Loader2 size={16} className="animate-spin mr-2" />
                ) : null}
                {loading ? "Checking..." : "Check Status"}
              </Button>
            </form>

            {/* Not found */}
            {result === "not_found" && (
              <div
                data-ocid="status_check.error_state"
                className="p-4 rounded-xl text-center"
                style={{
                  background: "rgba(100,120,140,0.1)",
                  border: "1px solid rgba(100,150,180,0.2)",
                }}
              >
                <p
                  className="text-sm"
                  style={{ color: "rgba(160,200,230,0.7)" }}
                >
                  No registration found for this email address.
                </p>
              </div>
            )}

            {/* Status result */}
            {hasResult && (
              <div data-ocid="status_check.success_state" className="space-y-4">
                {/* Status badge row */}
                <div
                  className="p-4 rounded-xl flex items-center gap-3"
                  style={{
                    background: statusStyle[status].bg,
                    border: `1px solid ${statusStyle[status].border}`,
                  }}
                >
                  {statusStyle[status].icon}
                  <div>
                    <p
                      className="font-montserrat font-bold text-sm tracking-widest"
                      style={{ color: statusStyle[status].color }}
                    >
                      {statusStyle[status].label}
                    </p>
                    <p
                      className="text-xs mt-0.5"
                      style={{ color: "rgba(160,200,230,0.7)" }}
                    >
                      {result.name} — {result.roleTitle}
                    </p>
                    <p
                      className="text-xs mt-0.5"
                      style={{ color: "rgba(120,160,200,0.5)" }}
                    >
                      Submitted: {fmtTs(result.timestamp)}
                    </p>
                  </div>
                </div>

                {/* ── APPROVED ── */}
                {status === "approved" && (
                  <>
                    {/* Heading */}
                    <div
                      className="p-4 rounded-xl text-center"
                      style={{
                        background: "rgba(0,220,120,0.08)",
                        border: "1px solid rgba(0,220,120,0.35)",
                        boxShadow: "0 0 24px rgba(0,220,120,0.12)",
                      }}
                    >
                      <p
                        className="font-montserrat font-black tracking-widest uppercase"
                        style={{
                          color: "#00dc78",
                          fontSize: "clamp(0.65rem, 2.5vw, 0.9rem)",
                          letterSpacing: "0.15em",
                          textShadow: "0 0 14px rgba(0,220,120,0.5)",
                        }}
                      >
                        YOUR REGISTRATION HAS BEEN APPROVED
                      </p>
                    </div>

                    {/* Credentials box — prominent */}
                    {result.loginUsername && (
                      <div
                        className="p-5 rounded-xl space-y-4"
                        style={{
                          background: "rgba(0,220,120,0.07)",
                          border: "2px solid rgba(0,220,120,0.35)",
                          boxShadow: "0 0 20px rgba(0,220,120,0.1)",
                        }}
                      >
                        <p
                          className="text-xs font-montserrat font-bold tracking-widest uppercase"
                          style={{ color: "rgba(0,220,120,0.8)" }}
                        >
                          🔑 Your Login Credentials
                        </p>

                        {/* Username row */}
                        <div
                          className="p-3 rounded-lg flex items-center justify-between gap-3"
                          style={{
                            background: "rgba(0,0,0,0.3)",
                            border: "1px solid rgba(0,220,120,0.2)",
                          }}
                        >
                          <div>
                            <p
                              className="text-xs font-montserrat tracking-widest uppercase mb-1"
                              style={{ color: "rgba(0,220,120,0.6)" }}
                            >
                              Username
                            </p>
                            <code
                              className="font-bold"
                              style={{ color: "#00dc78", fontSize: "1rem" }}
                            >
                              {result.loginUsername}
                            </code>
                          </div>
                          <button
                            type="button"
                            onClick={() =>
                              copyText(result.loginUsername!, "user")
                            }
                            title="Copy username"
                            style={{
                              background: copiedUser
                                ? "rgba(0,220,120,0.25)"
                                : "rgba(0,220,120,0.1)",
                              border: "1px solid rgba(0,220,120,0.3)",
                              borderRadius: "8px",
                              padding: "6px 8px",
                              cursor: "pointer",
                              color: "#00dc78",
                              flexShrink: 0,
                              transition: "all 0.2s",
                            }}
                          >
                            <Copy size={14} />
                          </button>
                        </div>

                        {/* Password row */}
                        <div
                          className="p-3 rounded-lg flex items-center justify-between gap-3"
                          style={{
                            background: "rgba(0,0,0,0.3)",
                            border: "1px solid rgba(0,220,120,0.2)",
                          }}
                        >
                          <div>
                            <p
                              className="text-xs font-montserrat tracking-widest uppercase mb-1"
                              style={{ color: "rgba(0,220,120,0.6)" }}
                            >
                              Password
                            </p>
                            <code
                              className="font-bold"
                              style={{ color: "#00dc78", fontSize: "1rem" }}
                            >
                              {result.loginPassword}
                            </code>
                          </div>
                          <button
                            type="button"
                            onClick={() =>
                              copyText(result.loginPassword!, "pass")
                            }
                            title="Copy password"
                            style={{
                              background: copiedPass
                                ? "rgba(0,220,120,0.25)"
                                : "rgba(0,220,120,0.1)",
                              border: "1px solid rgba(0,220,120,0.3)",
                              borderRadius: "8px",
                              padding: "6px 8px",
                              cursor: "pointer",
                              color: "#00dc78",
                              flexShrink: 0,
                              transition: "all 0.2s",
                            }}
                          >
                            <Copy size={14} />
                          </button>
                        </div>

                        <p
                          className="text-xs"
                          style={{ color: "rgba(160,200,180,0.6)" }}
                        >
                          ⚠ Keep your credentials secure. Do not share with
                          anyone.
                        </p>
                      </div>
                    )}

                    {/* 100-word corporate approval message */}
                    <div
                      className="p-5 rounded-xl"
                      style={{
                        background: "rgba(0,220,120,0.04)",
                        border: "1px solid rgba(0,220,120,0.18)",
                        borderLeft: "3px solid rgba(0,220,120,0.55)",
                      }}
                    >
                      <p
                        className="text-xs font-montserrat font-bold tracking-widest uppercase mb-3"
                        style={{ color: "rgba(0,220,120,0.7)" }}
                      >
                        ✦ Official Welcome Message
                      </p>
                      <p
                        className="text-sm leading-relaxed"
                        style={{
                          color: "rgba(200,240,220,0.82)",
                          fontStyle: "italic",
                          lineHeight: "1.8",
                        }}
                      >
                        Dear{" "}
                        <strong
                          style={{ color: "#e2f4ff", fontStyle: "normal" }}
                        >
                          {result.name}
                        </strong>
                        , we are pleased to inform you that your registration on
                        NEXUS IT PORTAL has been approved by our administration
                        team. Your account credentials are provided above.
                        Please keep them secure and do not share with anyone.
                        You may now log in to access your role-specific
                        dashboard. We welcome you to our corporate enterprise
                        system and look forward to your contributions. If you
                        have any questions or require assistance, please contact
                        our support team. Once again, congratulations on your
                        approval. — NEXUS IT Portal Administration
                      </p>
                    </div>
                  </>
                )}

                {/* ── REJECTED ── */}
                {status === "rejected" && (
                  <>
                    {/* Rejection reason */}
                    {result.rejectionReason && (
                      <div
                        className="p-4 rounded-xl"
                        style={{
                          background: "rgba(255,80,80,0.06)",
                          border: "1px solid rgba(255,80,80,0.2)",
                        }}
                      >
                        <p
                          className="text-xs font-montserrat font-bold tracking-widest uppercase mb-2"
                          style={{ color: "rgba(255,100,100,0.8)" }}
                        >
                          Rejection Reason
                        </p>
                        <p
                          className="text-xs"
                          style={{ color: "rgba(220,160,160,0.8)" }}
                        >
                          {result.rejectionReason}
                        </p>
                      </div>
                    )}

                    {/* 100-word corporate rejection message */}
                    <div
                      className="p-5 rounded-xl"
                      style={{
                        background: "rgba(255,80,80,0.04)",
                        border: "1px solid rgba(255,80,80,0.18)",
                        borderLeft: "3px solid rgba(249,115,22,0.6)",
                      }}
                    >
                      <p
                        className="text-xs font-montserrat font-bold tracking-widest uppercase mb-3"
                        style={{ color: "rgba(249,115,22,0.7)" }}
                      >
                        ✦ Official Notice
                      </p>
                      <p
                        className="text-sm leading-relaxed"
                        style={{
                          color: "rgba(240,200,190,0.82)",
                          fontStyle: "italic",
                          lineHeight: "1.8",
                        }}
                      >
                        Dear{" "}
                        <strong
                          style={{ color: "#e2f4ff", fontStyle: "normal" }}
                        >
                          {result.name}
                        </strong>
                        , after careful review of your registration request on
                        NEXUS IT PORTAL, our administration team has been unable
                        to approve your application at this time. We understand
                        this may be disappointing, and we sincerely appreciate
                        your interest in our enterprise system. If you believe
                        this decision was made in error or require further
                        clarification, please contact our support team at{" "}
                        <a
                          href="mailto:contact.adminvicky@myapp.com"
                          style={{ color: "#55d6ff", fontStyle: "normal" }}
                        >
                          contact.adminvicky@myapp.com
                        </a>
                        . You are welcome to resubmit your registration with
                        updated information. Thank you for your understanding
                        and professionalism. We wish you the best. — NEXUS IT
                        Portal Administration
                      </p>
                    </div>
                  </>
                )}

                {/* ── PENDING ── */}
                {status === "pending" && (
                  <div
                    className="p-5 rounded-xl"
                    style={{
                      background: "rgba(250,200,0,0.04)",
                      border: "1px solid rgba(250,200,0,0.18)",
                      borderLeft: "3px solid rgba(250,200,0,0.5)",
                    }}
                  >
                    <p
                      className="text-xs font-montserrat font-bold tracking-widest uppercase mb-3"
                      style={{ color: "rgba(245,196,0,0.7)" }}
                    >
                      ✦ Application Status Update
                    </p>
                    <div
                      className="flex items-center gap-2 mb-3 p-2 rounded-lg"
                      style={{
                        background: "rgba(250,200,0,0.06)",
                        border: "1px solid rgba(250,200,0,0.15)",
                      }}
                    >
                      <Clock size={14} color="#f5c400" />
                      <p
                        className="text-xs font-montserrat"
                        style={{ color: "rgba(245,196,0,0.8)" }}
                      >
                        Submitted: {fmtTs(result.timestamp)}
                      </p>
                    </div>
                    <p
                      className="text-sm leading-relaxed"
                      style={{
                        color: "rgba(240,220,160,0.82)",
                        fontStyle: "italic",
                        lineHeight: "1.8",
                      }}
                    >
                      Dear{" "}
                      <strong style={{ color: "#e2f4ff", fontStyle: "normal" }}>
                        {result.name}
                      </strong>
                      , your registration application for the role of{" "}
                      <strong style={{ color: "#f5d060", fontStyle: "normal" }}>
                        {result.roleTitle}
                      </strong>{" "}
                      has been received and is currently under review by our
                      administration team. We appreciate your patience. You will
                      be able to check your updated status here at any time. Our
                      typical review period is 24 to 48 business hours. Thank
                      you for your interest in joining the NEXUS IT Portal
                      enterprise system.
                    </p>
                    <p
                      className="text-xs font-montserrat font-bold tracking-widest mt-4"
                      style={{ color: "rgba(245,196,0,0.5)" }}
                    >
                      — NEXUS IT Portal Administration
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Fixed footer */}
        <div
          className="px-8 pb-6 pt-3"
          style={{ borderTop: "1px solid rgba(85,214,255,0.08)" }}
        >
          <Button
            variant="ghost"
            onClick={onClose}
            data-ocid="status_check.close_button"
            className="w-full text-xs font-montserrat tracking-widest uppercase"
            style={{ color: "rgba(100,180,220,0.5)", height: "38px" }}
          >
            Close
          </Button>
        </div>
      </div>
    </div>
  );
}
