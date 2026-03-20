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
import type { RegistrationRecord } from "../hooks/useNexusActor";
import { unwrapOpt, useNexusActor } from "../hooks/useNexusActor";

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
    return "\u2014";
  }
}

interface Props {
  onClose: () => void;
  prefillEmail?: string;
}

export function StatusCheckModal({ onClose, prefillEmail = "" }: Props) {
  const { actor, isFetching } = useNexusActor();
  const [searchValue, setSearchValue] = useState(prefillEmail);
  const [searchType, setSearchType] = useState<"email" | "mobile">("email");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<RegistrationRecord | null | "not_found">(
    null,
  );
  const [error, setError] = useState("");
  const [copiedUser, setCopiedUser] = useState(false);
  const [copiedPass, setCopiedPass] = useState(false);

  // Poll every 10 seconds for real-time update
  const [polling, setPolling] = useState(false);

  async function fetchStatus(value: string, type: "email" | "mobile") {
    if (!actor) {
      setError("Backend not ready. Please try again.");
      return;
    }
    try {
      const nb = actor;
      let rec: RegistrationRecord | null = null;
      if (type === "email") {
        rec = unwrapOpt(await nb.getRegistrationStatusByEmail(value.trim()));
      } else {
        rec = unwrapOpt(await nb.getRegistrationStatusByMobile(value.trim()));
      }
      setResult(rec ?? "not_found");
      setError("");
    } catch (_) {
      setError("Failed to fetch status. Please try again.");
    }
  }

  async function handleCheck(e: React.FormEvent) {
    e.preventDefault();
    if (!searchValue.trim()) return;
    setLoading(true);
    setError("");
    await fetchStatus(searchValue, searchType);
    setLoading(false);
    // Start polling for real-time updates
    if (!polling) {
      setPolling(true);
      const interval = setInterval(async () => {
        if (!searchValue.trim()) {
          clearInterval(interval);
          return;
        }
        await fetchStatus(searchValue, searchType);
      }, 10000);
      // Stop after 5 minutes
      setTimeout(() => clearInterval(interval), 5 * 60 * 1000);
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
                Enter your registered email or mobile number
              </p>
            </div>
          </div>
        </div>

        {/* Scrollable body */}
        <ScrollArea style={{ flex: 1, minHeight: 0 }}>
          <div className="px-8 py-6 space-y-5">
            {/* Toggle email / mobile */}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  setSearchType("email");
                  setSearchValue("");
                  setResult(null);
                }}
                style={{
                  flex: 1,
                  padding: "6px 0",
                  borderRadius: "8px",
                  fontSize: "0.7rem",
                  fontWeight: 700,
                  letterSpacing: "0.1em",
                  cursor: "pointer",
                  border:
                    searchType === "email"
                      ? "1px solid rgba(85,214,255,0.6)"
                      : "1px solid rgba(85,214,255,0.18)",
                  background:
                    searchType === "email"
                      ? "rgba(85,214,255,0.12)"
                      : "rgba(12,28,42,0.5)",
                  color:
                    searchType === "email"
                      ? "#55d6ff"
                      : "rgba(100,180,220,0.5)",
                }}
              >
                EMAIL
              </button>
              <button
                type="button"
                onClick={() => {
                  setSearchType("mobile");
                  setSearchValue("");
                  setResult(null);
                }}
                style={{
                  flex: 1,
                  padding: "6px 0",
                  borderRadius: "8px",
                  fontSize: "0.7rem",
                  fontWeight: 700,
                  letterSpacing: "0.1em",
                  cursor: "pointer",
                  border:
                    searchType === "mobile"
                      ? "1px solid rgba(85,214,255,0.6)"
                      : "1px solid rgba(85,214,255,0.18)",
                  background:
                    searchType === "mobile"
                      ? "rgba(85,214,255,0.12)"
                      : "rgba(12,28,42,0.5)",
                  color:
                    searchType === "mobile"
                      ? "#55d6ff"
                      : "rgba(100,180,220,0.5)",
                }}
              >
                MOBILE NUMBER
              </button>
            </div>

            <form onSubmit={handleCheck} className="space-y-4">
              <div className="space-y-1.5">
                <Label
                  className="text-xs font-montserrat tracking-widest uppercase"
                  style={{ color: "rgba(100,180,220,0.7)" }}
                >
                  {searchType === "email" ? "Email Address" : "Mobile Number"}
                </Label>
                <Input
                  data-ocid="status_check.input"
                  type={searchType === "email" ? "email" : "tel"}
                  value={searchValue}
                  onChange={(e) => setSearchValue(e.target.value)}
                  placeholder={
                    searchType === "email"
                      ? "your@email.com"
                      : "Enter your mobile number"
                  }
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
                  No registration found for this{" "}
                  {searchType === "email" ? "email address" : "mobile number"}.
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
                      {result.name} \u2014 {result.roleTitle}
                    </p>
                    <p
                      className="text-xs mt-0.5"
                      style={{ color: "rgba(120,160,200,0.5)" }}
                    >
                      Request Date: {fmtTs(result.timestamp)}
                    </p>
                  </div>
                </div>

                {/* \u2500\u2500 APPROVED \u2500\u2500 */}
                {status === "approved" && (
                  <>
                    {/* Approval heading */}
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

                    {/* Credentials box */}
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
                          \uD83D\uDD11 Your Login Credentials
                        </p>

                        {/* User ID row */}
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
                              User ID
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
                              copyText(
                                unwrapOpt(
                                  result.loginUsername as [] | [string],
                                ) ?? "",
                                "user",
                              )
                            }
                            title="Copy User ID"
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
                              copyText(
                                unwrapOpt(
                                  result.loginPassword as [] | [string],
                                ) ?? "",
                                "pass",
                              )
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
                          \u26A0 Keep your credentials secure. Do not share with
                          anyone.
                        </p>
                      </div>
                    )}

                    {/* Approval message */}
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
                        \u2756 Official Welcome Message
                      </p>
                      <div
                        className="text-sm leading-relaxed space-y-3"
                        style={{
                          color: "rgba(200,240,220,0.88)",
                          lineHeight: "1.9",
                        }}
                      >
                        <p>
                          Dear{" "}
                          <strong style={{ color: "#e2f4ff" }}>
                            {result.name}
                          </strong>
                          ,
                        </p>
                        <p>
                          We are delighted to inform you that your registration
                          request has been successfully approved by our
                          Application Administration Team.
                        </p>
                        <p>
                          We extend our sincere appreciation for your patience
                          and for choosing to be part of our Conference Service
                          Management System. Your inclusion strengthens our
                          commitment to maintaining a well-organized, efficient,
                          and professional corporate environment.
                        </p>
                        <p>
                          Your login credentials have now been securely
                          generated, enabling you to access the system and its
                          features. We encourage you to use the platform
                          responsibly, maintain data accuracy, and follow all
                          operational guidelines to ensure smooth coordination
                          across departments.
                        </p>
                        <p>
                          At our organization, we value discipline,
                          transparency, and collaboration. Your cooperation
                          plays a vital role in maintaining these standards.
                        </p>
                        <p>
                          We are confident that this system will enhance your
                          workflow experience and contribute positively to your
                          daily operations.
                        </p>
                        <p>
                          Welcome aboard, and we look forward to your active
                          participation.
                        </p>
                        <p className="pt-1">
                          <strong style={{ color: "rgba(0,220,120,0.8)" }}>
                            Best Regards,
                          </strong>
                          <br />
                          <span style={{ color: "rgba(0,220,120,0.7)" }}>
                            Corporate IT &amp; Administration Team
                          </span>
                        </p>
                      </div>
                    </div>
                  </>
                )}

                {/* \u2500\u2500 REJECTED \u2500\u2500 */}
                {status === "rejected" && (
                  <>
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

                    {/* Rejection message */}
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
                        \u2756 Official Notice
                      </p>
                      <div
                        className="text-sm leading-relaxed space-y-3"
                        style={{
                          color: "rgba(240,200,190,0.88)",
                          lineHeight: "1.9",
                        }}
                      >
                        <p>
                          Dear{" "}
                          <strong style={{ color: "#e2f4ff" }}>
                            {result.name}
                          </strong>
                          ,
                        </p>
                        <p>
                          Thank you for your interest in accessing our
                          Conference Service Management System.
                        </p>
                        <p>
                          After careful review, we regret to inform you that
                          your registration request has not been approved at
                          this time.
                        </p>
                        <p>
                          This decision is based on internal verification and
                          system access policies designed to maintain
                          operational security and data integrity.
                        </p>
                        <p>
                          If you believe your request requires reconsideration,
                          you may contact the Application Administration Team
                          with appropriate details and supporting information.
                        </p>
                        <p>We appreciate your understanding and cooperation.</p>
                        <p className="pt-1">
                          <strong style={{ color: "rgba(249,115,22,0.8)" }}>
                            Best Regards,
                          </strong>
                          <br />
                          <span style={{ color: "rgba(249,115,22,0.7)" }}>
                            Corporate Administration Team
                          </span>
                        </p>
                      </div>
                    </div>
                  </>
                )}

                {/* \u2500\u2500 PENDING \u2500\u2500 */}
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
                      \u2756 Application Status Update
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
                        Request Date: {fmtTs(result.timestamp)}
                      </p>
                    </div>
                    <div
                      className="text-sm leading-relaxed space-y-3"
                      style={{
                        color: "rgba(240,220,160,0.88)",
                        lineHeight: "1.9",
                      }}
                    >
                      <p>
                        Dear{" "}
                        <strong style={{ color: "#e2f4ff" }}>
                          {result.name}
                        </strong>
                        ,
                      </p>
                      <p>
                        Thank you for registering with our Conference Service
                        Management System.
                      </p>
                      <p>
                        We sincerely appreciate your interest in being part of
                        our corporate workflow environment. Your registration
                        request has been successfully received and is currently
                        under review by our Application Administration Team.
                      </p>
                      <p>
                        We value your patience and cooperation during this
                        process. Our team is carefully verifying your details to
                        ensure a secure and well-structured system experience
                        for all users.
                      </p>
                      <p>
                        Kindly allow us some time to complete the verification.
                        You will be notified shortly once your request has been
                        reviewed and processed.
                      </p>
                      <p>We look forward to welcoming you onboard.</p>
                      <p className="pt-1">
                        <strong style={{ color: "rgba(245,196,0,0.7)" }}>
                          Best Regards,
                        </strong>
                        <br />
                        <span style={{ color: "rgba(245,196,0,0.6)" }}>
                          Corporate Administration Team
                        </span>
                      </p>
                    </div>
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
