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
import { useBackend } from "../hooks/useBackend";

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

type BackendActor = {
  submitRegistration(
    name: string,
    dateOfBirth: string,
    email: string,
    mobile: string,
    country: string,
    roleTitle: string,
    registrationPurpose: string,
    deviceInfo: string,
  ): Promise<string>;
  logFailedRegistration(
    email: string,
    roleTitle: string,
    errorMsg: string,
    deviceInfo: string,
  ): Promise<void>;
};

export function RegistrationModal({ role, onClose, onStatusCheck }: Props) {
  const { actor, isFetching } = useBackend();
  const actorRef = useRef(actor);
  useEffect(() => {
    actorRef.current = actor;
  }, [actor]);
  const [fields, setFields] = useState<Fields>(initFields);
  const [stage, setStage] = useState<Stage>("form");
  const [regId, setRegId] = useState("");
  const [errMsg, setErrMsg] = useState("");
  const [loadingMsg, setLoadingMsg] = useState("Submitting Registration...");
  const [fieldError, setFieldError] = useState("");
  const [copied, setCopied] = useState(false);

  function set(k: keyof Fields) {
    return (v: string) => setFields((p) => ({ ...p, [k]: v }));
  }

  async function waitForActor(maxWaitMs = 15000): Promise<BackendActor | null> {
    if (actorRef.current) return actorRef.current as unknown as BackendActor;
    const start = Date.now();
    while (Date.now() - start < maxWaitMs) {
      await new Promise((r) => setTimeout(r, 800));
      if (actorRef.current) return actorRef.current as unknown as BackendActor;
    }
    return null;
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
    setLoadingMsg("Connecting to server...");
    setErrMsg("");

    const nb = await waitForActor();
    if (!nb) {
      setErrMsg(
        "Cannot reach server. Please check your internet connection and try again.",
      );
      setStage("error");
      return;
    }

    setLoadingMsg("Submitting your registration...");
    const deviceInfo = `${navigator.userAgent} | ${navigator.language} | ${screen.width}x${screen.height}`;

    const attempt = async () =>
      nb.submitRegistration(
        fields.name.trim(),
        fields.dob,
        fields.email.trim().toLowerCase(),
        fields.mobile.trim(),
        fields.country.trim(),
        role.title,
        fields.purpose,
        deviceInfo,
      );

    try {
      const id = await attempt();
      if (!id || id.trim() === "")
        throw new Error("Server returned an empty registration ID.");
      localStorage.setItem(
        `nexus_reg_${fields.email.trim().toLowerCase()}`,
        id,
      );
      setRegId(id);
      setStage("success");
    } catch (_e1) {
      setLoadingMsg("Retrying...");
      await new Promise((r) => setTimeout(r, 2500));
      try {
        const id = await attempt();
        if (!id || id.trim() === "")
          throw new Error("Server returned an empty registration ID.");
        localStorage.setItem(
          `nexus_reg_${fields.email.trim().toLowerCase()}`,
          id,
        );
        setRegId(id);
        setStage("success");
      } catch (e2) {
        const msg =
          e2 instanceof Error
            ? e2.message
            : "Submission failed. Please try again.";
        nb.logFailedRegistration(
          fields.email.trim(),
          role.title,
          msg,
          deviceInfo,
        ).catch(() => {});
        setErrMsg(msg);
        setStage("error");
      }
    }
  }

  function copyRegId() {
    navigator.clipboard.writeText(regId).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  const greetingMessage = `Dear ${fields.name || "Valued Applicant"}, thank you for registering on the NEXUS IT PORTAL — EBC Booking Management System. Your registration request has been received and is currently under review by our administration team. We will process your application at the earliest and notify you of the outcome. Please save your Registration ID for future reference. Our team is committed to reviewing all requests promptly and professionally. We sincerely appreciate your patience and look forward to welcoming you to our enterprise network. — NEXUS IT Portal Administration`;

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
        {/* Close button */}
        <button
          type="button"
          onClick={onClose}
          data-ocid="registration.close_button"
          className="absolute top-5 right-5 opacity-50 hover:opacity-100 transition-opacity"
          aria-label="Close"
        >
          <X size={18} color="#55d6ff" />
        </button>

        {/* Header */}
        <div
          className="px-8 pt-8 pb-5"
          style={{ borderBottom: "1px solid rgba(85,214,255,0.1)" }}
        >
          <div className="flex items-center gap-3">
            <div
              className="icon-tile"
              style={{
                borderColor: `${role.color}55`,
                background: `${role.color}18`,
              }}
            >
              <role.icon size={22} color={role.color} />
            </div>
            <div>
              <p
                className="text-xs font-montserrat tracking-widest uppercase"
                style={{ color: "rgba(100,180,220,0.6)" }}
              >
                Registration Form
              </p>
              <h2 className="font-montserrat font-bold text-sm tracking-wide text-white uppercase leading-tight">
                {role.title}
              </h2>
            </div>
          </div>
        </div>

        <div className="px-8 pb-8 pt-6">
          {/* FORM */}
          {stage === "form" && (
            <form
              onSubmit={handleSubmit}
              className="space-y-4"
              data-ocid="registration.panel"
            >
              {isFetching && (
                <div
                  className="flex items-center gap-2 text-xs px-3 py-2 rounded-lg"
                  style={{
                    background: "rgba(85,214,255,0.06)",
                    border: "1px solid rgba(85,214,255,0.15)",
                    color: "rgba(85,214,255,0.6)",
                  }}
                >
                  <Loader2 size={12} className="animate-spin" />
                  Connecting to server… you can fill the form while waiting.
                </div>
              )}

              {(
                [
                  ["Full Name", "name", "text", "John Smith"],
                  ["Date of Birth", "dob", "date", ""],
                  ["Email Address", "email", "email", "name@company.com"],
                  ["Mobile Number", "mobile", "tel", "+91 9000000000"],
                  ["Country", "country", "text", "India"],
                ] as const
              ).map(([label, key, type, ph]) => (
                <div key={key} className="space-y-1">
                  <Label
                    className="text-xs font-montserrat tracking-widest uppercase"
                    style={{ color: "rgba(100,180,220,0.7)" }}
                  >
                    {label}
                  </Label>
                  <Input
                    data-ocid={`registration.${key}_input`}
                    type={type}
                    value={fields[key]}
                    onChange={(e) => set(key)(e.target.value)}
                    placeholder={ph}
                    style={{
                      background: "rgba(12,28,42,0.8)",
                      border: "1px solid rgba(85,214,255,0.22)",
                      color: "#e2f4ff",
                    }}
                  />
                </div>
              ))}

              <div className="space-y-1">
                <Label
                  className="text-xs font-montserrat tracking-widest uppercase"
                  style={{ color: "rgba(100,180,220,0.7)" }}
                >
                  Registration Purpose
                </Label>
                <Select value={fields.purpose} onValueChange={set("purpose")}>
                  <SelectTrigger
                    data-ocid="registration.select"
                    style={{
                      background: "rgba(12,28,42,0.8)",
                      border: "1px solid rgba(85,214,255,0.22)",
                      color: fields.purpose
                        ? "#e2f4ff"
                        : "rgba(160,200,230,0.4)",
                    }}
                  >
                    <SelectValue placeholder="Select registration purpose..." />
                  </SelectTrigger>
                  <SelectContent
                    style={{
                      background: "#091827",
                      border: "1px solid rgba(85,214,255,0.25)",
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
                <p
                  data-ocid="registration.error_state"
                  className="text-xs"
                  style={{ color: "#ff8080" }}
                >
                  {fieldError}
                </p>
              )}

              <Button
                type="submit"
                data-ocid="registration.submit_button"
                className="w-full btn-cyan-solid font-montserrat tracking-widest text-xs uppercase mt-2"
                style={{ height: "44px" }}
              >
                Submit Registration <ChevronRight size={14} className="ml-1" />
              </Button>
            </form>
          )}

          {/* LOADING */}
          {stage === "loading" && (
            <div
              data-ocid="registration.loading_state"
              className="flex flex-col items-center py-10 gap-4"
            >
              <Loader2
                size={40}
                className="animate-spin"
                style={{ color: "#55d6ff" }}
              />
              <p
                className="font-montserrat text-sm tracking-widest uppercase"
                style={{ color: "rgba(100,180,220,0.7)" }}
              >
                {loadingMsg}
              </p>
              <p
                className="text-xs text-center"
                style={{ color: "rgba(100,180,220,0.45)" }}
              >
                Please wait while we securely process your registration.
              </p>
            </div>
          )}

          {/* SUCCESS */}
          {stage === "success" && (
            <div
              data-ocid="registration.success_state"
              className="flex flex-col items-center py-4 gap-5 text-center"
            >
              <div
                className="w-16 h-16 rounded-full flex items-center justify-center"
                style={{
                  background: "rgba(0,220,120,0.12)",
                  border: "2px solid rgba(0,220,120,0.4)",
                  boxShadow: "0 0 28px rgba(0,220,120,0.2)",
                }}
              >
                <CheckCircle size={34} color="#00dc78" />
              </div>

              <div>
                <h3
                  className="font-montserrat font-black tracking-widest uppercase"
                  style={{
                    color: "#00dc78",
                    fontSize: "clamp(0.75rem, 3vw, 1rem)",
                    letterSpacing: "0.18em",
                    textShadow: "0 0 16px rgba(0,220,120,0.45)",
                  }}
                >
                  REGISTRATION SUBMITTED SUCCESSFULLY
                </h3>
                <p
                  className="text-xs mt-1 font-montserrat tracking-widest uppercase"
                  style={{ color: "rgba(100,180,220,0.55)" }}
                >
                  {role.title}
                </p>
              </div>

              <div
                className="w-full p-4 rounded-xl flex items-center justify-between gap-3"
                style={{
                  background: "rgba(85,214,255,0.06)",
                  border: "1px solid rgba(85,214,255,0.25)",
                }}
              >
                <div className="text-left">
                  <p
                    className="text-xs font-montserrat tracking-widest uppercase mb-1"
                    style={{ color: "rgba(85,214,255,0.6)" }}
                  >
                    Registration ID
                  </p>
                  <code
                    className="font-bold"
                    style={{ color: "#55d6ff", fontSize: "0.85rem" }}
                  >
                    {regId}
                  </code>
                </div>
                <button
                  type="button"
                  onClick={copyRegId}
                  title="Copy Registration ID"
                  style={{
                    background: copied
                      ? "rgba(0,220,120,0.15)"
                      : "rgba(85,214,255,0.1)",
                    border: `1px solid ${copied ? "rgba(0,220,120,0.4)" : "rgba(85,214,255,0.3)"}`,
                    borderRadius: "8px",
                    padding: "6px 8px",
                    cursor: "pointer",
                    color: copied ? "#00dc78" : "#55d6ff",
                    flexShrink: 0,
                  }}
                >
                  <Copy size={14} />
                </button>
              </div>

              <div
                className="w-full p-5 rounded-xl text-left"
                style={{
                  background: "rgba(0,220,120,0.04)",
                  border: "1px solid rgba(0,220,120,0.2)",
                  borderLeft: "3px solid rgba(0,220,120,0.5)",
                }}
              >
                <p
                  className="text-xs font-montserrat font-bold tracking-widest uppercase mb-3"
                  style={{ color: "rgba(0,220,120,0.7)" }}
                >
                  ✦ Official Acknowledgement
                </p>
                <p
                  className="text-sm leading-relaxed"
                  style={{
                    color: "rgba(200,240,220,0.85)",
                    fontStyle: "italic",
                    lineHeight: "1.8",
                  }}
                >
                  {greetingMessage}
                </p>
              </div>

              <div className="flex gap-3 w-full">
                <Button
                  onClick={() => {
                    onStatusCheck?.(fields.email);
                    onClose();
                  }}
                  data-ocid="registration.secondary_button"
                  className="flex-1 btn-cyan font-montserrat text-xs tracking-widest uppercase"
                  style={{ height: "40px" }}
                >
                  Check My Status
                </Button>
                <Button
                  onClick={onClose}
                  data-ocid="registration.close_button"
                  variant="ghost"
                  className="flex-1 text-xs"
                  style={{ color: "rgba(100,180,220,0.5)" }}
                >
                  Close
                </Button>
              </div>
            </div>
          )}

          {/* ERROR */}
          {stage === "error" && (
            <div
              data-ocid="registration.error_state"
              className="flex flex-col items-center py-6 gap-4 text-center"
            >
              <div
                className="w-16 h-16 rounded-full flex items-center justify-center"
                style={{
                  background: "rgba(255,80,80,0.12)",
                  border: "2px solid rgba(255,80,80,0.35)",
                }}
              >
                <X size={32} color="#ff6060" />
              </div>
              <h3 className="font-montserrat font-bold tracking-widest text-white">
                Submission Failed
              </h3>
              <p className="text-xs" style={{ color: "rgba(220,160,160,0.8)" }}>
                {errMsg}
              </p>
              <p className="text-xs" style={{ color: "rgba(160,200,230,0.5)" }}>
                This error has been logged. Please try again or contact support
                at contact.adminvicky@myapp.com.
              </p>
              <div className="flex gap-3 w-full">
                <Button
                  onClick={() => setStage("form")}
                  data-ocid="registration.primary_button"
                  className="flex-1 btn-cyan-solid font-montserrat text-xs tracking-widest uppercase"
                  style={{ height: "40px" }}
                >
                  Try Again
                </Button>
                <Button
                  onClick={onClose}
                  variant="ghost"
                  data-ocid="registration.cancel_button"
                  className="flex-1 text-xs"
                  style={{ color: "rgba(100,180,220,0.5)" }}
                >
                  Close
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
