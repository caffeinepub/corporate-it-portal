import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CheckCircle, ChevronRight, Copy, Loader2, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { RoleDef } from "../App";
import { robustCall } from "../hooks/useNexusActor";

const PURPOSES = [
  "IT Infrastructure Management",
  "Software Development & Deployment",
  "Network Operations & Security",
  "Cloud Solutions & DevOps",
  "Data Analytics & Business Intelligence",
  "System Administration",
  "Project Management",
  "Quality Assurance & Testing",
  "Technical Support & Helpdesk",
  "Corporate IT Consulting",
];

interface Props {
  role: RoleDef;
  onClose: () => void;
  onStatusCheck?: (email: string) => void;
}

type Stage = "form" | "loading" | "success" | "error";

type Fields = {
  name: string;
  dob: string;
  email: string;
  mobile: string;
  country: string;
  purpose: string;
};

function validate(f: Fields): string {
  if (!f.name.trim()) return "Full Name is required.";
  if (!f.dob) return "Date of Birth is required.";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.email))
    return "Valid email address is required.";
  if (!/^[0-9]{6,15}$/.test(f.mobile.replace(/[\s+\-()]/g, "")))
    return "Valid mobile number is required (digits only, 6-15 digits).";
  if (!f.country.trim()) return "Country is required.";
  if (!f.purpose) return "Please select a Registration Purpose.";
  return "";
}

function initFields(): Fields {
  return { name: "", dob: "", email: "", mobile: "", country: "", purpose: "" };
}

export function RegistrationModal({ role, onClose, onStatusCheck }: Props) {
  const [fields, setFields] = useState<Fields>(initFields);
  const [stage, setStage] = useState<Stage>("form");
  const [regId, setRegId] = useState("");
  const [errMsg, setErrMsg] = useState("");
  const [fieldError, setFieldError] = useState("");
  const [copied, setCopied] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const startRef = useRef<number>(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (stage === "loading") {
      startRef.current = Date.now();
      setElapsed(0);
      timerRef.current = setInterval(() => {
        setElapsed(Math.floor((Date.now() - startRef.current) / 1000));
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [stage]);

  const MAX_WAIT = 65;
  const remaining = Math.max(0, MAX_WAIT - elapsed);
  const progress = Math.min(100, (elapsed / MAX_WAIT) * 100);

  function set(k: keyof Fields) {
    return (v: string) => setFields((p) => ({ ...p, [k]: v }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const err = validate(fields);
    if (err) {
      setFieldError(err);
      return;
    }
    setFieldError("");
    setStage("loading");
    setErrMsg("");

    const deviceInfo = `${navigator.userAgent} | ${navigator.language} | ${screen.width}x${screen.height}`;

    try {
      const id = await robustCall(
        (actor) =>
          actor.submitRegistration(
            fields.name.trim(),
            fields.dob,
            fields.email.trim().toLowerCase(),
            fields.mobile.trim(),
            fields.country.trim(),
            role.title,
            fields.purpose,
            deviceInfo,
          ),
        20,
      );
      if (!id || id.trim() === "") throw new Error("Empty ID returned.");
      localStorage.setItem(
        `nexus_reg_${fields.email.trim().toLowerCase()}`,
        id,
      );
      setRegId(id);
      setStage("success");
    } catch (e) {
      const rawMsg = e instanceof Error ? e.message : String(e);
      if (
        rawMsg.toLowerCase().includes("stopped") ||
        rawMsg.includes("IC0508")
      ) {
        setErrMsg(
          "Server is temporarily offline. Please wait 1 minute and try again.",
        );
      } else if (
        rawMsg.toLowerCase().includes("network") ||
        rawMsg.toLowerCase().includes("fetch")
      ) {
        setErrMsg(
          "Network error. Please check your internet connection and try again.",
        );
      } else {
        setErrMsg(
          "Registration could not be submitted. Please wait 30 seconds and try again.",
        );
      }
      setStage("error");
    }
  }

  function copyRegId() {
    navigator.clipboard.writeText(regId).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  const greetingMessage = `Dear ${fields.name || "Valued Applicant"},

Thank you for registering with our Conference Service Management System.

We sincerely appreciate your interest in being part of our corporate workflow environment. Your registration request has been successfully received and is currently under review by our Application Administration Team.

We value your patience and cooperation during this process. Our team is carefully verifying your details to ensure a secure and well-structured system experience for all users.

Kindly allow us some time to complete the verification. You will be notified shortly once your request has been reviewed and processed.

We look forward to welcoming you onboard.

Best Regards,
Corporate Administration Team`;

  return (
    <div
      className="fixed inset-0 flex items-center justify-center z-50 overflow-y-auto py-6"
      style={{ background: "rgba(2,8,18,0.88)", backdropFilter: "blur(8px)" }}
      onClick={onClose}
      onKeyDown={(e) => e.key === "Escape" && onClose()}
      role="presentation"
    >
      <div
        className="glass-modal w-full max-w-lg mx-4 relative"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => e.stopPropagation()}
        data-ocid="registration.modal"
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute top-5 right-5 opacity-50 hover:opacity-100 transition-opacity"
          aria-label="Close"
        >
          <X size={18} color="#55d6ff" />
        </button>

        {/* Header */}
        <div
          className="px-8 pt-8 pb-5"
          style={{ borderBottom: "1px solid rgba(85,214,255,0.12)" }}
        >
          <div
            className="inline-block px-3 py-1 rounded-full text-xs font-montserrat tracking-widest uppercase mb-3"
            style={{
              background: "rgba(85,214,255,0.08)",
              border: "1px solid rgba(85,214,255,0.2)",
              color: "rgba(85,214,255,0.6)",
            }}
          >
            Registration Portal
          </div>
          <h2
            className="font-montserrat font-black text-sm tracking-wide uppercase"
            style={{ color: "#55d6ff" }}
          >
            {role.title}
          </h2>
        </div>

        <div className="px-8 pb-8 pt-6">
          {/* FORM */}
          {stage === "form" && (
            <form
              onSubmit={handleSubmit}
              className="space-y-4"
              data-ocid="registration.form"
            >
              <div className="space-y-1">
                <Label
                  className="text-xs font-montserrat tracking-widest uppercase"
                  style={{ color: "rgba(85,214,255,0.6)" }}
                >
                  Full Name *
                </Label>
                <Input
                  data-ocid="registration.name_input"
                  value={fields.name}
                  onChange={(e) => set("name")(e.target.value)}
                  style={{
                    background: "rgba(4,13,22,0.8)",
                    border: "1px solid rgba(85,214,255,0.2)",
                    color: "#e2f4ff",
                  }}
                />
              </div>
              <div className="space-y-1">
                <Label
                  className="text-xs font-montserrat tracking-widest uppercase"
                  style={{ color: "rgba(85,214,255,0.6)" }}
                >
                  Date of Birth *
                </Label>
                <Input
                  data-ocid="registration.dob_input"
                  type="date"
                  value={fields.dob}
                  onChange={(e) => set("dob")(e.target.value)}
                  style={{
                    background: "rgba(4,13,22,0.8)",
                    border: "1px solid rgba(85,214,255,0.2)",
                    color: "#e2f4ff",
                  }}
                />
              </div>
              <div className="space-y-1">
                <Label
                  className="text-xs font-montserrat tracking-widest uppercase"
                  style={{ color: "rgba(85,214,255,0.6)" }}
                >
                  Email ID *
                </Label>
                <Input
                  data-ocid="registration.email_input"
                  type="email"
                  value={fields.email}
                  onChange={(e) => set("email")(e.target.value)}
                  style={{
                    background: "rgba(4,13,22,0.8)",
                    border: "1px solid rgba(85,214,255,0.2)",
                    color: "#e2f4ff",
                  }}
                />
              </div>
              <div className="space-y-1">
                <Label
                  className="text-xs font-montserrat tracking-widest uppercase"
                  style={{ color: "rgba(85,214,255,0.6)" }}
                >
                  Mobile Number *
                </Label>
                <Input
                  data-ocid="registration.mobile_input"
                  type="tel"
                  value={fields.mobile}
                  onChange={(e) => set("mobile")(e.target.value)}
                  style={{
                    background: "rgba(4,13,22,0.8)",
                    border: "1px solid rgba(85,214,255,0.2)",
                    color: "#e2f4ff",
                  }}
                />
              </div>
              <div className="space-y-1">
                <Label
                  className="text-xs font-montserrat tracking-widest uppercase"
                  style={{ color: "rgba(85,214,255,0.6)" }}
                >
                  Country *
                </Label>
                <Input
                  data-ocid="registration.country_input"
                  value={fields.country}
                  onChange={(e) => set("country")(e.target.value)}
                  style={{
                    background: "rgba(4,13,22,0.8)",
                    border: "1px solid rgba(85,214,255,0.2)",
                    color: "#e2f4ff",
                  }}
                />
              </div>
              <div className="space-y-1">
                <Label
                  className="text-xs font-montserrat tracking-widest uppercase"
                  style={{ color: "rgba(85,214,255,0.6)" }}
                >
                  Registration Purpose *
                </Label>
                <Select onValueChange={set("purpose")} value={fields.purpose}>
                  <SelectTrigger
                    data-ocid="registration.purpose_select"
                    style={{
                      background: "rgba(4,13,22,0.8)",
                      border: "1px solid rgba(85,214,255,0.2)",
                      color: fields.purpose
                        ? "#e2f4ff"
                        : "rgba(130,180,220,0.4)",
                    }}
                  >
                    <SelectValue placeholder="Select purpose..." />
                  </SelectTrigger>
                  <SelectContent
                    style={{
                      background: "#061220",
                      border: "1px solid rgba(85,214,255,0.2)",
                    }}
                  >
                    {PURPOSES.map((p) => (
                      <SelectItem
                        key={p}
                        value={p}
                        style={{ color: "#e2f4ff" }}
                      >
                        {p}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {fieldError && (
                <p className="text-xs" style={{ color: "#ff8080" }}>
                  {fieldError}
                </p>
              )}
              <Button
                type="submit"
                data-ocid="registration.submit_button"
                className="w-full font-montserrat tracking-widest text-xs uppercase"
                style={{
                  height: "44px",
                  background:
                    "linear-gradient(135deg, rgba(0,120,180,0.85), rgba(0,80,140,0.8))",
                  color: "#fff",
                  border: "1px solid rgba(85,214,255,0.3)",
                }}
              >
                <ChevronRight size={14} className="mr-2" />
                Submit Registration
              </Button>
            </form>
          )}

          {/* LOADING */}
          {stage === "loading" && (
            <div
              data-ocid="registration.loading_state"
              className="flex flex-col items-center py-8 gap-4"
            >
              <Loader2
                size={36}
                className="animate-spin"
                style={{ color: "#55d6ff" }}
              />
              <div className="w-full text-center space-y-2">
                <p
                  className="font-montserrat text-xs font-bold tracking-widest uppercase"
                  style={{ color: "rgba(85,214,255,0.9)" }}
                >
                  SUBMITTING REGISTRATION
                </p>
                <p
                  className="text-xs"
                  style={{ color: "rgba(85,214,255,0.55)" }}
                >
                  Server is starting up &mdash; please wait
                </p>
              </div>
              <div
                className="w-full rounded-full overflow-hidden"
                style={{ height: "6px", background: "rgba(85,214,255,0.12)" }}
              >
                <div
                  className="h-full rounded-full transition-all duration-1000"
                  style={{
                    width: `${progress}%`,
                    background:
                      "linear-gradient(90deg, rgba(0,100,160,0.8), rgba(85,214,255,0.9))",
                  }}
                />
              </div>
              <p
                className="text-xs font-montserrat font-bold"
                style={{ color: "rgba(85,214,255,0.7)" }}
              >
                {remaining > 0
                  ? `~${remaining} seconds remaining`
                  : "Almost ready..."}
              </p>
              <p
                className="text-xs text-center"
                style={{ color: "rgba(85,214,255,0.3)", fontSize: "0.6rem" }}
              >
                First use takes 30&ndash;60 seconds. Please do not close this
                window.
              </p>
            </div>
          )}

          {/* SUCCESS */}
          {stage === "success" && (
            <div data-ocid="registration.success_state" className="space-y-4">
              <div
                className="flex items-center gap-3 p-4 rounded-xl"
                style={{
                  background: "rgba(0,220,120,0.08)",
                  border: "1px solid rgba(0,220,120,0.3)",
                }}
              >
                <CheckCircle size={20} color="#00dc78" />
                <p
                  className="text-xs font-montserrat font-bold tracking-widest uppercase"
                  style={{ color: "#00dc78" }}
                >
                  Registration Submitted
                </p>
              </div>
              <div
                className="p-4 rounded-xl"
                style={{
                  background: "rgba(4,13,22,0.8)",
                  border: "1px solid rgba(85,214,255,0.12)",
                }}
              >
                <p
                  className="text-xs font-montserrat font-bold tracking-widest uppercase mb-2"
                  style={{ color: "rgba(85,214,255,0.6)" }}
                >
                  Request ID
                </p>
                <div className="flex items-center justify-between gap-3">
                  <code className="text-xs" style={{ color: "#55d6ff" }}>
                    {regId}
                  </code>
                  <button
                    type="button"
                    onClick={copyRegId}
                    className="flex items-center gap-1 text-xs px-2 py-1 rounded"
                    style={{
                      background: copied
                        ? "rgba(0,220,120,0.15)"
                        : "rgba(85,214,255,0.1)",
                      border: "1px solid rgba(85,214,255,0.2)",
                      color: copied ? "#00dc78" : "#55d6ff",
                    }}
                  >
                    <Copy size={12} /> {copied ? "Copied" : "Copy"}
                  </button>
                </div>
              </div>
              <div
                className="p-4 rounded-xl"
                style={{
                  background: "rgba(4,13,22,0.6)",
                  border: "1px solid rgba(85,214,255,0.1)",
                }}
              >
                <pre
                  className="text-xs leading-relaxed whitespace-pre-wrap"
                  style={{
                    color: "rgba(160,200,230,0.8)",
                    fontFamily: "inherit",
                  }}
                >
                  {greetingMessage}
                </pre>
              </div>
              {onStatusCheck && (
                <button
                  type="button"
                  onClick={() => {
                    onStatusCheck(fields.email);
                    onClose();
                  }}
                  className="w-full py-2.5 rounded-xl text-xs font-montserrat font-bold tracking-widest uppercase"
                  style={{
                    background: "rgba(85,214,255,0.08)",
                    border: "1px solid rgba(85,214,255,0.2)",
                    color: "rgba(85,214,255,0.8)",
                  }}
                  data-ocid="registration.check_status_button"
                >
                  Check My Status
                </button>
              )}
            </div>
          )}

          {/* ERROR */}
          {stage === "error" && (
            <div data-ocid="registration.error_state" className="space-y-4">
              <div
                className="p-4 rounded-xl text-center"
                style={{
                  background: "rgba(255,80,80,0.08)",
                  border: "1px solid rgba(255,80,80,0.3)",
                }}
              >
                <p
                  className="text-xs font-montserrat font-bold"
                  style={{ color: "#ff8080" }}
                >
                  {errMsg}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setStage("form")}
                className="w-full py-2.5 rounded-xl text-xs font-montserrat font-bold tracking-widest uppercase"
                style={{
                  background: "rgba(85,214,255,0.08)",
                  border: "1px solid rgba(85,214,255,0.2)",
                  color: "rgba(85,214,255,0.8)",
                }}
              >
                Try Again
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
