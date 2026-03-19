import { CheckCircle2, Clock, Loader2, LogIn, X, XCircle } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import {
  UserStatus,
  useGetMyRegistrationStatus,
  useRegisterUser,
} from "../hooks/useQueries";

const REGISTRATION_PURPOSES = [
  "Project Management",
  "Site Operations",
  "Human Resources",
  "Executive Management",
  "Kitchen & Catering Operations",
  "Guest Relations",
  "Quality Control & Compliance",
  "IT Infrastructure",
  "Finance & Administration",
  "Training & Development",
];

const APPROVAL_MESSAGE =
  "Welcome to the Corporate IT Portal! Your registration has been reviewed and approved by our administration team. You now have full access to your designated role dashboard and all associated enterprise tools. As a valued member of our corporate IT ecosystem, we expect you to uphold our standards of professionalism, data security, and operational excellence. Your login credentials are active and tied to your Internet Identity. Please review the role guidelines available in your dashboard. We look forward to your contributions to our growing team. If you have any questions, contact the system administrator immediately. Welcome aboard!";

const REJECTION_MESSAGE =
  "Thank you for your interest in joining the Corporate IT Portal. After careful review by our administration team, we regret to inform you that your registration request has not been approved at this time. This decision may be due to incomplete information, role capacity limitations, or administrative requirements. We encourage you to review your submitted details and resubmit your application with accurate and complete information. If you believe this decision was made in error, please contact the system administrator for further clarification. We appreciate your understanding and hope to welcome you to our team in the future.";

interface RoleInfo {
  title: string;
  color: string;
  icon: React.ComponentType<{ size?: number; color?: string }>;
}

interface RegistrationModalProps {
  role: RoleInfo | null;
  onClose: () => void;
}

function StatusScreen({
  status,
  profile,
  onClose,
}: {
  status: "pending" | "approved" | "rejected";
  profile: {
    name: string;
    roleTitle: string;
    email: string;
    rejectionReason?: string;
  };
  onClose: () => void;
}) {
  const isPending = status === "pending";
  const isApproved = status === "approved";
  const isRejected = status === "rejected";

  const badgeStyle = isPending
    ? {
        bg: "rgba(255,193,7,0.12)",
        border: "rgba(255,193,7,0.4)",
        color: "#ffd93d",
        glow: "rgba(255,193,7,0.3)",
      }
    : isApproved
      ? {
          bg: "rgba(74,222,128,0.12)",
          border: "rgba(74,222,128,0.4)",
          color: "#4ade80",
          glow: "rgba(74,222,128,0.3)",
        }
      : {
          bg: "rgba(255,107,107,0.12)",
          border: "rgba(255,107,107,0.4)",
          color: "#ff6b6b",
          glow: "rgba(255,107,107,0.3)",
        };

  return (
    <div className="text-center">
      <div
        className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
        style={{
          background: badgeStyle.bg,
          border: `1px solid ${badgeStyle.border}`,
          boxShadow: `0 0 24px ${badgeStyle.glow}`,
        }}
      >
        {isPending && <Clock size={28} color={badgeStyle.color} />}
        {isApproved && <CheckCircle2 size={28} color={badgeStyle.color} />}
        {isRejected && <XCircle size={28} color={badgeStyle.color} />}
      </div>

      <div
        className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest mb-4"
        style={{
          background: badgeStyle.bg,
          border: `1px solid ${badgeStyle.border}`,
          color: badgeStyle.color,
        }}
        data-ocid="registration.success_state"
      >
        {isPending && "⏳ Awaiting Admin Approval"}
        {isApproved && "✓ Access Granted"}
        {isRejected && "✗ Registration Rejected"}
      </div>

      <p className="text-white font-bold text-base mb-1">{profile.name}</p>
      <p className="text-xs mb-5" style={{ color: "#a9b6c6" }}>
        Role: {profile.roleTitle}
      </p>

      <div
        className="text-left p-4 rounded-xl mb-5 text-xs leading-relaxed"
        style={{
          background: "rgba(255,255,255,0.04)",
          border: `1px solid ${badgeStyle.border}`,
          color: "#c8d8e8",
        }}
      >
        {isApproved && APPROVAL_MESSAGE}
        {isRejected && (
          <>
            <p>{REJECTION_MESSAGE}</p>
            {profile.rejectionReason && (
              <div
                className="mt-3 p-3 rounded-lg"
                style={{
                  background: "rgba(255,107,107,0.08)",
                  border: "1px solid rgba(255,107,107,0.2)",
                }}
              >
                <p
                  className="text-xs font-bold mb-1"
                  style={{ color: "#ff6b6b" }}
                >
                  Rejection Reason:
                </p>
                <p style={{ color: "#f0c0c0" }}>{profile.rejectionReason}</p>
              </div>
            )}
          </>
        )}
        {isPending && (
          <p>
            Your registration has been submitted successfully. Our
            administration team will review your application and notify you upon
            approval. Please check back later or contact your system
            administrator for updates. Thank you for your patience.
          </p>
        )}
      </div>

      <button
        type="button"
        onClick={onClose}
        className="btn-cyan px-6 py-2 rounded-xl text-sm font-semibold"
        data-ocid="registration.close_button"
      >
        Close
      </button>
    </div>
  );
}

interface RegistrationFormProps {
  role: RoleInfo;
  onSuccess: () => void;
  existingRoleTitle?: string;
}

function RegistrationForm({
  role,
  onSuccess,
  existingRoleTitle,
}: RegistrationFormProps) {
  const [form, setForm] = useState({
    name: "",
    dateOfBirth: "",
    email: "",
    mobile: "",
    country: "",
    registrationPurpose: "",
  });
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [duplicateError, setDuplicateError] = useState<string | null>(null);
  const registerUser = useRegisterUser();
  const { identity, login, loginStatus } = useInternetIdentity();
  const isAuthenticated = !!identity;
  const isLoggingIn = loginStatus === "logging-in";

  // Store pending form data to submit after login
  const pendingSubmitRef = useRef(false);

  // Auto-submit after login if there's a pending submit
  useEffect(() => {
    if (isAuthenticated && pendingSubmitRef.current) {
      pendingSubmitRef.current = false;
      doSubmit();
    }
  }, [isAuthenticated]);

  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email);
  const mobileValid = /^[0-9+\-\s]{7,15}$/.test(form.mobile);

  const errors: Record<string, string> = {};
  if (touched.name && !form.name.trim()) errors.name = "Full name is required";
  if (touched.email && !form.email) errors.email = "Email is required";
  else if (touched.email && !emailValid)
    errors.email = "Enter a valid email address";
  if (touched.mobile && !form.mobile)
    errors.mobile = "Mobile number is required";
  else if (touched.mobile && !mobileValid)
    errors.mobile = "Enter a valid mobile number (7-15 digits)";
  if (touched.dateOfBirth && !form.dateOfBirth)
    errors.dateOfBirth = "Date of birth is required";
  if (touched.country && !form.country.trim())
    errors.country = "Country is required";
  if (touched.registrationPurpose && !form.registrationPurpose)
    errors.registrationPurpose = "Please select a purpose";

  const isFormValid =
    form.name.trim() &&
    form.dateOfBirth &&
    emailValid &&
    mobileValid &&
    form.country.trim() &&
    form.registrationPurpose;

  const doSubmit = async () => {
    if (!isFormValid) return;
    setDuplicateError(null);
    try {
      await registerUser.mutateAsync({
        name: form.name.trim(),
        dateOfBirth: form.dateOfBirth,
        email: form.email,
        mobile: form.mobile,
        country: form.country.trim(),
        roleTitle: role.title,
        registrationPurpose: form.registrationPurpose,
      });
      toast.success("Registration submitted! Awaiting admin approval.");
      onSuccess();
    } catch (err: any) {
      const msg = err?.message ?? "";
      if (msg.includes("already registered") || msg.includes("duplicate")) {
        setDuplicateError(
          `You are already registered for ${existingRoleTitle ?? "another role"}. One registration per user is allowed.`,
        );
      } else {
        toast.error(msg || "Registration failed. Please try again.");
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched({
      name: true,
      dateOfBirth: true,
      email: true,
      mobile: true,
      country: true,
      registrationPurpose: true,
    });
    if (!isFormValid) return;

    if (!isAuthenticated) {
      // Mark pending submit, then trigger login
      pendingSubmitRef.current = true;
      toast.info("Please connect your Identity to complete registration.");
      login();
      return;
    }

    await doSubmit();
  };

  const field = (
    key: string,
    value: string,
    label: string,
    extras: React.InputHTMLAttributes<HTMLInputElement> = {},
  ) => (
    <div className="mb-3">
      <label
        className="block text-xs text-gray-400 uppercase tracking-wider mb-1.5"
        htmlFor={`reg-${key}`}
      >
        {label} <span style={{ color: "#ff6b6b" }}>*</span>
      </label>
      <input
        id={`reg-${key}`}
        value={value}
        onChange={(e) => setForm((p) => ({ ...p, [key]: e.target.value }))}
        onBlur={() => setTouched((p) => ({ ...p, [key]: true }))}
        className="w-full px-3 py-2.5 rounded-xl text-white placeholder-gray-500 text-sm outline-none transition-all"
        style={{
          background: "rgba(255,255,255,0.06)",
          border: errors[key]
            ? "1px solid rgba(255,100,100,0.6)"
            : "1px solid rgba(100,200,240,0.2)",
        }}
        data-ocid={`registration.${key}.input`}
        {...extras}
      />
      {errors[key] && (
        <p
          className="text-xs mt-1"
          style={{ color: "#ff6b6b" }}
          data-ocid={`registration.${key}_error`}
        >
          {errors[key]}
        </p>
      )}
    </div>
  );

  const isSubmitting = registerUser.isPending || isLoggingIn;

  return (
    <form onSubmit={handleSubmit}>
      {/* Heading */}
      <p
        className="text-xs uppercase tracking-widest mb-4"
        style={{ color: "#a9b6c6" }}
      >
        Fill in your details to register
      </p>

      {/* Role badge — pre-filled, read-only */}
      <div className="mb-3">
        <p className="block text-xs text-gray-400 uppercase tracking-wider mb-1.5">
          Role
        </p>
        <div
          className="w-full px-3 py-2.5 rounded-xl text-sm font-semibold"
          style={{
            background: "rgba(255,255,255,0.04)",
            border: `1px solid ${role.color}44`,
            color: role.color,
          }}
        >
          {role.title}
        </div>
      </div>

      {field("name", form.name, "Full Name", {
        type: "text",
        autoComplete: "name",
        placeholder: "Enter your full name",
      })}

      <div className="grid grid-cols-2 gap-3">
        <div>
          {field("dateOfBirth", form.dateOfBirth, "Date of Birth", {
            type: "date",
            max: new Date().toISOString().split("T")[0],
          })}
        </div>
        <div>
          {field("country", form.country, "Country", {
            type: "text",
            placeholder: "e.g. India",
          })}
        </div>
      </div>

      {field("email", form.email, "Email ID", {
        type: "email",
        autoComplete: "email",
        placeholder: "name@company.com",
      })}

      {field("mobile", form.mobile, "Mobile Number", {
        type: "tel",
        placeholder: "+91 9876543210",
      })}

      {/* Registration Purpose */}
      <div className="mb-4">
        <label
          className="block text-xs text-gray-400 uppercase tracking-wider mb-1.5"
          htmlFor="reg-purpose"
        >
          Registration Purpose <span style={{ color: "#ff6b6b" }}>*</span>
        </label>
        <select
          id="reg-purpose"
          value={form.registrationPurpose}
          onChange={(e) =>
            setForm((p) => ({ ...p, registrationPurpose: e.target.value }))
          }
          onBlur={() =>
            setTouched((p) => ({ ...p, registrationPurpose: true }))
          }
          className="w-full px-3 py-2.5 rounded-xl text-white text-sm outline-none transition-all"
          style={{
            background: "rgba(20,36,52,0.95)",
            border: errors.registrationPurpose
              ? "1px solid rgba(255,100,100,0.6)"
              : "1px solid rgba(100,200,240,0.2)",
            color: form.registrationPurpose ? "white" : "#6b7280",
          }}
          data-ocid="registration.registrationPurpose.select"
        >
          <option value="" disabled style={{ color: "#6b7280" }}>
            — Select Purpose —
          </option>
          {REGISTRATION_PURPOSES.map((p) => (
            <option
              key={p}
              value={p}
              style={{ background: "#0d1f2d", color: "white" }}
            >
              {p}
            </option>
          ))}
        </select>
        {errors.registrationPurpose && (
          <p
            className="text-xs mt-1"
            style={{ color: "#ff6b6b" }}
            data-ocid="registration.purpose_error"
          >
            {errors.registrationPurpose}
          </p>
        )}
      </div>

      {/* Duplicate registration error */}
      {duplicateError && (
        <div
          className="mb-4 p-3 rounded-xl text-xs"
          style={{
            background: "rgba(255,107,107,0.08)",
            border: "1px solid rgba(255,107,107,0.35)",
            color: "#ff8c8c",
          }}
          data-ocid="registration.error_state"
        >
          ⚠ {duplicateError}
        </div>
      )}

      {/* Auth hint when not logged in */}
      {!isAuthenticated && (
        <div
          className="mb-4 p-3 rounded-xl text-xs flex items-center gap-2"
          style={{
            background: "rgba(85,214,255,0.06)",
            border: "1px solid rgba(85,214,255,0.2)",
            color: "#7dd3fc",
          }}
        >
          <LogIn size={14} />
          <span>
            You are not logged in. Clicking <strong>Submit Registration</strong>{" "}
            will open the Identity login, then auto-submit your form.
          </span>
        </div>
      )}

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full py-3 rounded-xl btn-cyan-solid font-montserrat font-bold uppercase tracking-wider text-sm flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        data-ocid="registration.submit_button"
      >
        {isSubmitting ? (
          <>
            <Loader2 size={16} className="animate-spin" />
            {isLoggingIn ? "Connecting Identity..." : "Submitting..."}
          </>
        ) : (
          <>
            {!isAuthenticated && <LogIn size={15} />}
            Submit Registration
          </>
        )}
      </button>
    </form>
  );
}

export function RegistrationModal({ role, onClose }: RegistrationModalProps) {
  const { data: regStatus, isLoading: statusLoading } =
    useGetMyRegistrationStatus();
  const { identity } = useInternetIdentity();
  const [submitted, setSubmitted] = useState(false);

  const isAuthenticated = !!identity;

  if (!role) return null;

  const RoleIcon = role.icon;

  // Determine what to show based on registration status
  const sameRoleRegistered =
    !submitted && regStatus && regStatus.roleTitle === role.title;
  const differentRoleRegistered =
    !submitted && regStatus && regStatus.roleTitle !== role.title;

  const showStatus = submitted || sameRoleRegistered;
  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
      data-ocid="registration.modal"
    >
      <div
        className="absolute inset-0"
        style={{ background: "rgba(4, 12, 20, 0.88)" }}
      />

      <motion.div
        className="relative glass-modal w-full max-w-lg p-7 max-h-[90vh] overflow-y-auto"
        initial={{ scale: 0.92, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.92, opacity: 0, y: 20 }}
        transition={{ type: "spring", stiffness: 320, damping: 32 }}
      >
        {/* Close */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors p-1 rounded-lg hover:bg-white/10"
          data-ocid="registration.close_button"
          aria-label="Close"
        >
          <X size={20} />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div
            className="icon-tile shrink-0"
            style={{ borderColor: `${role.color}33` }}
          >
            <RoleIcon size={26} color={role.color} />
          </div>
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-widest mb-0.5">
              Access Portal
            </p>
            <h2
              className="text-sm font-montserrat font-bold uppercase leading-tight tracking-wider"
              style={{
                color: role.color,
                textShadow: `0 0 12px ${role.color}55`,
              }}
            >
              {role.title}
            </h2>
          </div>
        </div>

        {/* Content */}
        <AnimatePresence mode="wait">
          {/* Loading state — only when authenticated and checking status */}
          {isAuthenticated && statusLoading ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center py-10 gap-3"
              data-ocid="registration.loading_state"
            >
              <Loader2
                size={28}
                className="animate-spin"
                style={{ color: "#55d6ff" }}
              />
              <p className="text-sm text-gray-400">
                Checking registration status...
              </p>
            </motion.div>
          ) : showStatus ? (
            <motion.div
              key="status"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <StatusScreen
                status={
                  submitted
                    ? "pending"
                    : (regStatus!.status as unknown as
                        | "pending"
                        | "approved"
                        | "rejected")
                }
                profile={
                  regStatus ?? {
                    name: "",
                    roleTitle: role.title,
                    email: "",
                    rejectionReason: undefined,
                  }
                }
                onClose={onClose}
              />
            </motion.div>
          ) : (
            <motion.div
              key="form"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <RegistrationForm
                role={role}
                onSuccess={() => setSubmitted(true)}
                existingRoleTitle={
                  differentRoleRegistered ? regStatus!.roleTitle : undefined
                }
              />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
}
