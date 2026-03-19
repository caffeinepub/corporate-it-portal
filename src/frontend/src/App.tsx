import { Toaster } from "@/components/ui/sonner";
import { useQueryClient } from "@tanstack/react-query";
import {
  Briefcase,
  Building2,
  ChefHat,
  ClipboardList,
  Cpu,
  Globe,
  Loader2,
  LogIn,
  Mail,
  Phone,
  PhoneCall,
  Shield,
  User,
  Users,
  UtensilsCrossed,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { AdminDashboard } from "./components/AdminDashboard";
import { RegistrationModal } from "./components/RegistrationModal";
import { useInternetIdentity } from "./hooks/useInternetIdentity";
import {
  UserStatus,
  useGetMyRegistrationStatus,
  useIsAdmin,
} from "./hooks/useQueries";

// ─── Role definitions ──────────────────────────────────────────────────────────
export const ROLES = [
  {
    id: "admin",
    title: "APP FULL ACCESS ADMIN PANEL",
    description: "Complete system administration and oversight",
    icon: Shield,
    color: "#ff6b6b",
    isEmergencyContact: false,
    contactEmail: undefined as string | undefined,
    contactEmailAlt: undefined as string | undefined,
    contactMobile: undefined as string | undefined,
  },
  {
    id: "site_manager",
    title: "SITE MANAGER REGISTRATION",
    description: "Manage site operations and resources",
    icon: Building2,
    color: "#55d6ff",
    isEmergencyContact: false,
    contactEmail: undefined as string | undefined,
    contactEmailAlt: undefined as string | undefined,
    contactMobile: undefined as string | undefined,
  },
  {
    id: "site_supervisor",
    title: "SITE SUPERVISOR REGISTRATION",
    description: "Supervise daily site activities",
    icon: ClipboardList,
    color: "#55d6ff",
    isEmergencyContact: false,
    contactEmail: undefined as string | undefined,
    contactEmailAlt: undefined as string | undefined,
    contactMobile: undefined as string | undefined,
  },
  {
    id: "site_hr",
    title: "SITE HR REGISTRATION",
    description: "Handle personnel and recruitment",
    icon: Users,
    color: "#a78bfa",
    isEmergencyContact: false,
    contactEmail: undefined as string | undefined,
    contactEmailAlt: undefined as string | undefined,
    contactMobile: undefined as string | undefined,
  },
  {
    id: "site_team_member",
    title: "SITE TEAM MEMBER REGISTRATION",
    description: "Access team collaboration tools",
    icon: User,
    color: "#55d6ff",
    isEmergencyContact: false,
    contactEmail: undefined as string | undefined,
    contactEmailAlt: undefined as string | undefined,
    contactMobile: undefined as string | undefined,
  },
  {
    id: "gre",
    title: "GRE REGISTRATION",
    description: "Guest relations and engagement",
    icon: Globe,
    color: "#6ee7b7",
    isEmergencyContact: false,
    contactEmail: undefined as string | undefined,
    contactEmailAlt: undefined as string | undefined,
    contactMobile: undefined as string | undefined,
  },
  {
    id: "site_executive",
    title: "SITE EXECUTIVE REGISTRATION",
    description: "Executive oversight and reporting",
    icon: Briefcase,
    color: "#93c5fd",
    isEmergencyContact: false,
    contactEmail: undefined as string | undefined,
    contactEmailAlt: undefined as string | undefined,
    contactMobile: undefined as string | undefined,
  },
  {
    id: "executive_chef",
    title: "EXECUTIVE CHEF REGISTRATION",
    description: "Culinary operations leadership",
    icon: ChefHat,
    color: "#fbbf24",
    isEmergencyContact: false,
    contactEmail: undefined as string | undefined,
    contactEmailAlt: undefined as string | undefined,
    contactMobile: undefined as string | undefined,
  },
  {
    id: "site_chef",
    title: "SITE CHEF REGISTRATION",
    description: "Kitchen management and operations",
    icon: UtensilsCrossed,
    color: "#fb923c",
    isEmergencyContact: false,
    contactEmail: undefined as string | undefined,
    contactEmailAlt: undefined as string | undefined,
    contactMobile: undefined as string | undefined,
  },
  {
    id: "emergency_contact_admin",
    title: "EMERGENCY CONTACT APP ADMIN",
    description: "Emergency escalation and critical contact management",
    icon: PhoneCall,
    color: "#f97316",
    isEmergencyContact: true,
    contactEmail: "contact.adminvicky@myapp.com",
    contactEmailAlt: "Vickymyapp@india.com",
    contactMobile: "9858522563",
  },
];

export type RoleDef = (typeof ROLES)[0];

// hex color to rgba helper
function hexAlpha(hex: string, alpha: number) {
  const r = Number.parseInt(hex.slice(1, 3), 16);
  const g = Number.parseInt(hex.slice(3, 5), 16);
  const b = Number.parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

// ─── Dot-grid + hex SVG overlay ───────────────────────────────────────────────
function NetworkOverlay() {
  return (
    <svg
      className="fixed inset-0 w-full h-full pointer-events-none"
      style={{ zIndex: 1 }}
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        {/* Hex grid */}
        <pattern
          id="hex"
          x="0"
          y="0"
          width="80"
          height="92.4"
          patternUnits="userSpaceOnUse"
        >
          <polygon
            points="40,5 75,23 75,69.4 40,87.4 5,69.4 5,23"
            fill="none"
            stroke="#55d6ff"
            strokeWidth="0.6"
            opacity="0.07"
          />
        </pattern>
        {/* Dot grid */}
        <pattern
          id="dots"
          x="0"
          y="0"
          width="40"
          height="40"
          patternUnits="userSpaceOnUse"
        >
          <circle cx="0" cy="0" r="1" fill="#55d6ff" opacity="0.18" />
          <circle cx="40" cy="0" r="1" fill="#55d6ff" opacity="0.18" />
          <circle cx="0" cy="40" r="1" fill="#55d6ff" opacity="0.18" />
          <circle cx="40" cy="40" r="1" fill="#55d6ff" opacity="0.18" />
          <circle cx="20" cy="20" r="0.6" fill="#55d6ff" opacity="0.1" />
        </pattern>
        {/* Corner accent lines */}
        <pattern
          id="diag"
          x="0"
          y="0"
          width="120"
          height="120"
          patternUnits="userSpaceOnUse"
        >
          <line
            x1="0"
            y1="0"
            x2="120"
            y2="120"
            stroke="#55d6ff"
            strokeWidth="0.25"
            opacity="0.05"
          />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#hex)" />
      <rect width="100%" height="100%" fill="url(#dots)" />
      <rect width="100%" height="100%" fill="url(#diag)" />
    </svg>
  );
}

// ─── Corporate Emblem ──────────────────────────────────────────────────────────
function CorporateEmblem() {
  return (
    <div className="relative flex items-center justify-center mb-8">
      {/* Outer glow ring */}
      <div
        className="absolute rounded-full animate-emblem-pulse"
        style={{
          width: 180,
          height: 180,
          background:
            "radial-gradient(circle, rgba(85,214,255,0.06) 0%, transparent 70%)",
          border: "1px solid rgba(85,214,255,0.12)",
        }}
      />
      {/* Spinning dashed ring */}
      <svg
        aria-hidden="true"
        focusable="false"
        width="160"
        height="160"
        className="absolute animate-emblem-spin"
        style={{ opacity: 0.35 }}
      >
        <circle
          cx="80"
          cy="80"
          r="74"
          fill="none"
          stroke="#55d6ff"
          strokeWidth="1"
          strokeDasharray="6 10"
        />
        <circle
          cx="80"
          cy="80"
          r="66"
          fill="none"
          stroke="#55d6ff"
          strokeWidth="0.5"
          strokeDasharray="3 18"
        />
      </svg>
      {/* Core hexagon emblem */}
      <svg
        aria-hidden="true"
        focusable="false"
        width="110"
        height="110"
        viewBox="0 0 110 110"
        className="relative animate-emblem-pulse"
        style={{ zIndex: 1 }}
      >
        {/* Hex bg */}
        <polygon
          points="55,8 98,31 98,79 55,102 12,79 12,31"
          fill="rgba(4,16,28,0.92)"
          stroke="rgba(85,214,255,0.6)"
          strokeWidth="1.5"
        />
        {/* Inner hex */}
        <polygon
          points="55,20 88,37 88,72 55,90 22,72 22,37"
          fill="none"
          stroke="rgba(85,214,255,0.2)"
          strokeWidth="0.8"
        />
        {/* Circuit lines */}
        <line
          x1="55"
          y1="20"
          x2="55"
          y2="35"
          stroke="#55d6ff"
          strokeWidth="1"
          opacity="0.5"
        />
        <line
          x1="55"
          y1="75"
          x2="55"
          y2="90"
          stroke="#55d6ff"
          strokeWidth="1"
          opacity="0.5"
        />
        <line
          x1="22"
          y1="37"
          x2="34"
          y2="44"
          stroke="#55d6ff"
          strokeWidth="1"
          opacity="0.5"
        />
        <line
          x1="88"
          y1="37"
          x2="76"
          y2="44"
          stroke="#55d6ff"
          strokeWidth="1"
          opacity="0.5"
        />
        {/* Center CPU icon approximation */}
        <rect
          x="42"
          y="42"
          width="26"
          height="26"
          rx="3"
          fill="rgba(85,214,255,0.12)"
          stroke="rgba(85,214,255,0.7)"
          strokeWidth="1.2"
        />
        <rect
          x="47"
          y="47"
          width="16"
          height="16"
          rx="2"
          fill="rgba(85,214,255,0.25)"
        />
        {/* Node dots */}
        <circle cx="37" cy="55" r="2.5" fill="#55d6ff" opacity="0.8" />
        <circle cx="73" cy="55" r="2.5" fill="#55d6ff" opacity="0.8" />
        <circle cx="55" cy="37" r="2.5" fill="#55d6ff" opacity="0.8" />
        <circle cx="55" cy="73" r="2.5" fill="#55d6ff" opacity="0.8" />
      </svg>
    </div>
  );
}

// ─── Scanning line ─────────────────────────────────────────────────────────────
function ScanLine() {
  return (
    <div
      className="absolute left-0 right-0 pointer-events-none overflow-hidden"
      style={{ top: 0, bottom: 0, zIndex: 0 }}
      aria-hidden="true"
    >
      <div
        className="animate-scan-line"
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          height: "2px",
          background:
            "linear-gradient(90deg, transparent 0%, rgba(85,214,255,0.0) 10%, rgba(85,214,255,0.6) 50%, rgba(85,214,255,0.0) 90%, transparent 100%)",
          boxShadow: "0 0 12px 4px rgba(85,214,255,0.15)",
        }}
      />
    </div>
  );
}

// ─── Contact Item (reusable for Emergency Card) ────────────────────────────────
interface ContactItemProps {
  href: string;
  icon: React.ReactNode;
  label: string;
  value: string;
  ocid: string;
}

function ContactItem({ href, icon, label, value, ocid }: ContactItemProps) {
  return (
    <a
      href={href}
      className="flex items-center gap-3 px-4 py-3 rounded-xl transition-all hover:brightness-110"
      style={{
        background: "rgba(249,115,22,0.07)",
        border: "1px solid rgba(249,115,22,0.25)",
        textDecoration: "none",
        flex: "1 1 0",
        minWidth: 0,
      }}
      data-ocid={ocid}
    >
      <div
        className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
        style={{
          background: "rgba(249,115,22,0.15)",
          border: "1px solid rgba(249,115,22,0.3)",
        }}
      >
        {icon}
      </div>
      <div className="min-w-0">
        <p
          className="text-[9px] font-montserrat font-bold uppercase tracking-widest mb-0.5"
          style={{ color: "rgba(249,115,22,0.7)" }}
        >
          {label}
        </p>
        <p
          className="text-xs font-semibold truncate"
          style={{ color: "#fde4ca" }}
        >
          {value}
        </p>
      </div>
    </a>
  );
}

// ─── Role Card ─────────────────────────────────────────────────────────────────
interface RoleCardProps {
  role: RoleDef;
  index: number;
  onAccess: (role: RoleDef) => void;
  registrationStatus: string | null;
  registrationRoleTitle: string | null;
}

function EmergencyContactCard({
  role,
  index,
}: { role: RoleDef; index: number }) {
  const Icon = role.icon;
  const num = String(index + 1).padStart(2, "0");

  return (
    <motion.article
      className="role-card p-6 flex flex-col gap-5 relative overflow-hidden"
      initial={{ opacity: 0, y: 28 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.05 * index, duration: 0.45, ease: "easeOut" }}
      style={{
        background:
          "linear-gradient(145deg, rgba(10,24,38,0.92) 0%, rgba(249,115,22,0.08) 100%)",
        border: "1.5px solid rgba(249,115,22,0.5)",
        borderTop: "2px solid #f97316",
        boxShadow:
          "0 4px 32px rgba(0,0,0,0.5), 0 0 40px rgba(249,115,22,0.18), inset 0 0 60px rgba(249,115,22,0.03)",
        animation: "emergencyPulse 2.5s ease-in-out infinite",
      }}
      data-ocid="role.item.10"
    >
      {/* Pulsing border overlay */}
      <div
        className="absolute inset-0 rounded-xl pointer-events-none"
        style={{
          border: "1.5px solid rgba(249,115,22,0.25)",
          animation: "emergencyRing 2.5s ease-in-out infinite",
        }}
      />

      {/* Number badge */}
      <span
        className="absolute top-3.5 right-4 font-montserrat font-black"
        style={{
          fontSize: "0.7rem",
          letterSpacing: "0.12em",
          color: "rgba(249,115,22,0.45)",
          lineHeight: 1,
        }}
      >
        {num}
      </span>

      {/* EMERGENCY badge */}
      <div className="absolute top-3.5 left-4">
        <span
          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-montserrat font-black uppercase tracking-widest"
          style={{
            background: "rgba(249,115,22,0.18)",
            border: "1px solid rgba(249,115,22,0.5)",
            color: "#f97316",
            boxShadow: "0 0 10px rgba(249,115,22,0.2)",
            animation: "emergencyBadge 1.5s ease-in-out infinite",
          }}
        >
          <span
            className="w-1.5 h-1.5 rounded-full"
            style={{ background: "#f97316", boxShadow: "0 0 5px #f97316" }}
          />
          EMERGENCY
        </span>
      </div>

      {/* Top row: icon + title (with top padding for badge) */}
      <div className="flex items-start gap-4 mt-7">
        <div
          className="icon-tile shrink-0"
          style={{
            background: "rgba(249,115,22,0.12)",
            border: "1px solid rgba(249,115,22,0.35)",
          }}
        >
          <Icon size={24} color="#f97316" />
        </div>
        <div className="min-w-0 pr-6">
          <h3
            className="font-montserrat font-extrabold uppercase text-xs leading-snug tracking-wider mb-1.5"
            style={{ color: "#eef4ff" }}
          >
            {role.title}
          </h3>
          <p
            className="text-xs leading-relaxed"
            style={{ color: "rgba(169,182,198,0.85)" }}
          >
            {role.description}
          </p>
        </div>
      </div>

      {/* Thin divider */}
      <div
        style={{
          height: 1,
          background:
            "linear-gradient(90deg, rgba(249,115,22,0.5), transparent)",
          borderRadius: 1,
        }}
      />

      {/* Contact info — 3 items, stacked on mobile, row on sm+ */}
      <div className="flex flex-col sm:flex-row gap-3">
        <ContactItem
          href={`mailto:${role.contactEmail}`}
          icon={<Mail size={15} color="#f97316" />}
          label="Primary Email"
          value={role.contactEmail ?? ""}
          ocid="emergency.email.link"
        />
        <ContactItem
          href={`mailto:${role.contactEmailAlt}`}
          icon={<Mail size={15} color="#f97316" />}
          label="Alternate Email ✉️"
          value={role.contactEmailAlt ?? ""}
          ocid="emergency.email_alt.link"
        />
        <ContactItem
          href={`tel:${role.contactMobile}`}
          icon={<Phone size={15} color="#f97316" />}
          label="Mobile"
          value={role.contactMobile ?? ""}
          ocid="emergency.phone.link"
        />
      </div>
    </motion.article>
  );
}

function RoleCard({
  role,
  index,
  onAccess,
  registrationStatus,
  registrationRoleTitle,
}: RoleCardProps) {
  if (role.isEmergencyContact) {
    return <EmergencyContactCard role={role} index={index} />;
  }

  const Icon = role.icon;
  const isMyRole = registrationRoleTitle === role.title;
  const myStatus = isMyRole ? registrationStatus : null;
  const num = String(index + 1).padStart(2, "0");

  const statusBadge =
    myStatus === UserStatus.approved
      ? {
          label: "✓ ACCESS GRANTED",
          color: "#4ade80",
          bg: "rgba(74,222,128,0.12)",
          border: "rgba(74,222,128,0.4)",
          glowColor: "#4ade80",
        }
      : myStatus === UserStatus.pending
        ? {
            label: "⏳ PENDING APPROVAL",
            color: "#ffd93d",
            bg: "rgba(255,217,61,0.12)",
            border: "rgba(255,217,61,0.4)",
            glowColor: "#ffd93d",
          }
        : myStatus === UserStatus.rejected
          ? {
              label: "✗ REJECTED",
              color: "#ff6b6b",
              bg: "rgba(255,107,107,0.12)",
              border: "rgba(255,107,107,0.4)",
              glowColor: "#ff6b6b",
            }
          : null;

  return (
    <motion.article
      className="role-card p-6 flex flex-col gap-5"
      initial={{ opacity: 0, y: 28 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.05 * index, duration: 0.45, ease: "easeOut" }}
      style={{
        background: `linear-gradient(145deg, rgba(10,24,38,0.85) 0%, ${hexAlpha(role.color, 0.05)} 100%)`,
        border: `1px solid ${hexAlpha(role.color, 0.22)}`,
        borderTop: `2px solid ${role.color}`,
        boxShadow: statusBadge
          ? `0 4px 32px rgba(0,0,0,0.4), 0 0 24px ${hexAlpha(statusBadge.glowColor, 0.18)}`
          : "0 4px 24px rgba(0,0,0,0.4)",
      }}
      data-ocid={`role.item.${index + 1}`}
    >
      {/* Number badge */}
      <span
        className="absolute top-3.5 right-4 font-montserrat font-black"
        style={{
          fontSize: "0.7rem",
          letterSpacing: "0.12em",
          color: hexAlpha(role.color, 0.45),
          lineHeight: 1,
        }}
      >
        {num}
      </span>

      {/* Top row: icon + title */}
      <div className="flex items-start gap-4">
        <div
          className="icon-tile shrink-0"
          style={{
            background: hexAlpha(role.color, 0.1),
            border: `1px solid ${hexAlpha(role.color, 0.28)}`,
          }}
        >
          <Icon size={24} color={role.color} />
        </div>
        <div className="min-w-0 pr-6">
          <h3
            className="font-montserrat font-extrabold uppercase text-xs leading-snug tracking-wider mb-1.5"
            style={{ color: "#eef4ff" }}
          >
            {role.title}
          </h3>
          <p
            className="text-xs leading-relaxed"
            style={{ color: "rgba(169,182,198,0.85)" }}
          >
            {role.description}
          </p>
        </div>
      </div>

      {/* Thin divider */}
      <div
        style={{
          height: 1,
          background: `linear-gradient(90deg, ${hexAlpha(role.color, 0.3)}, transparent)`,
          borderRadius: 1,
        }}
      />

      {/* Button or status */}
      {statusBadge ? (
        <div
          className="w-full py-2.5 rounded-xl text-xs font-montserrat font-bold uppercase tracking-widest text-center"
          style={{
            background: statusBadge.bg,
            border: `1px solid ${statusBadge.border}`,
            color: statusBadge.color,
          }}
          data-ocid={`role.status.${index + 1}`}
        >
          {statusBadge.label}
        </div>
      ) : (
        <button
          type="button"
          onClick={() => onAccess(role)}
          className="btn-access"
          style={{
            borderColor: hexAlpha(role.color, 0.5),
            color: role.color,
          }}
          data-ocid={`role.access_button.${index + 1}`}
        >
          ▶ ACCESS PORTAL
        </button>
      )}
    </motion.article>
  );
}

// ─── Main App ──────────────────────────────────────────────────────────────────
export default function App() {
  const [selectedRole, setSelectedRole] = useState<RoleDef | null>(null);
  const [page, setPage] = useState<"home" | "admin">("home");
  const { identity, login, loginStatus, clear } = useInternetIdentity();
  const queryClient = useQueryClient();
  const isAuthenticated = !!identity;
  const isLoggingIn = loginStatus === "logging-in";

  const { data: isAdmin } = useIsAdmin();
  const { data: regStatus } = useGetMyRegistrationStatus();

  const handleNavLogin = async () => {
    if (isAuthenticated) {
      await clear();
      queryClient.clear();
    } else {
      await login();
    }
  };

  if (page === "admin" && isAdmin) {
    return (
      <>
        <AdminDashboard onBack={() => setPage("home")} />
        <Toaster position="top-right" />
      </>
    );
  }

  // Split roles: first 9 for normal grid, 10th (emergency) spans full row
  const normalRoles = ROLES.filter((r) => !r.isEmergencyContact);
  const emergencyRole = ROLES.find((r) => r.isEmergencyContact);
  const emergencyIndex = ROLES.findIndex((r) => r.isEmergencyContact);

  return (
    <div
      className="relative min-h-screen overflow-x-hidden"
      style={{ background: "#040d16" }}
    >
      {/* Background image */}
      <div
        className="fixed inset-0"
        style={{
          backgroundImage:
            "url('/assets/generated/corporate-it-bg.dim_1920x1080.jpg')",
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundAttachment: "fixed",
          zIndex: 0,
        }}
      />
      {/* Gradient overlay */}
      <div
        className="fixed inset-0"
        style={{
          background:
            "linear-gradient(180deg, rgba(4,13,22,0.82) 0%, rgba(4,13,22,0.72) 40%, rgba(4,13,22,0.88) 100%)",
          zIndex: 0,
        }}
      />
      {/* Network overlay */}
      <NetworkOverlay />
      {/* Center glow */}
      <div
        className="fixed pointer-events-none"
        style={{
          top: "10%",
          left: "50%",
          transform: "translateX(-50%)",
          width: "900px",
          height: "600px",
          background:
            "radial-gradient(ellipse at center, rgba(85,214,255,0.05) 0%, transparent 65%)",
          zIndex: 1,
        }}
      />

      {/* Emergency pulse keyframes */}
      <style>{`
        @keyframes emergencyPulse {
          0%, 100% { box-shadow: 0 4px 32px rgba(0,0,0,0.5), 0 0 30px rgba(249,115,22,0.18); }
          50% { box-shadow: 0 4px 32px rgba(0,0,0,0.5), 0 0 55px rgba(249,115,22,0.38), 0 0 80px rgba(249,115,22,0.12); }
        }
        @keyframes emergencyRing {
          0%, 100% { opacity: 0.3; transform: scale(1); }
          50% { opacity: 0.7; transform: scale(1.008); }
        }
        @keyframes emergencyBadge {
          0%, 100% { opacity: 0.8; }
          50% { opacity: 1; box-shadow: 0 0 14px rgba(249,115,22,0.5); }
        }
      `}</style>

      <div className="relative" style={{ zIndex: 2 }}>
        {/* ── Navbar ── */}
        <header className="sticky top-0 z-40 px-4 pt-3 pb-2">
          <nav
            className="glass-navbar max-w-6xl mx-auto flex items-center justify-between px-6 py-2.5 rounded-2xl"
            data-ocid="nav.panel"
          >
            {/* Logo */}
            <div className="flex items-center gap-3">
              <div
                className="relative w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                style={{
                  background: "rgba(85,214,255,0.12)",
                  border: "1px solid rgba(85,214,255,0.35)",
                  boxShadow: "0 0 16px rgba(85,214,255,0.15)",
                }}
              >
                <Cpu size={17} color="#55d6ff" />
              </div>
              <div>
                <p
                  className="font-montserrat font-black text-xs uppercase tracking-[0.25em] leading-none"
                  style={{ color: "#f0f8ff" }}
                >
                  NEXUS IT PORTAL
                </p>
                <p
                  className="text-[9px] uppercase tracking-[0.2em] mt-0.5"
                  style={{ color: "rgba(85,214,255,0.5)" }}
                >
                  Enterprise Management System
                </p>
              </div>
            </div>

            {/* Right controls */}
            <div className="flex items-center gap-2">
              {isAdmin && (
                <button
                  type="button"
                  onClick={() => setPage("admin")}
                  className="btn-cyan-solid px-4 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider hidden sm:flex items-center gap-1.5"
                  data-ocid="nav.admin_dashboard.button"
                >
                  <Shield size={11} />
                  Admin
                </button>
              )}
              <button
                type="button"
                onClick={handleNavLogin}
                disabled={isLoggingIn}
                className="btn-cyan px-4 py-1.5 rounded-xl text-xs font-semibold hidden sm:flex items-center gap-1.5"
                data-ocid="nav.login.button"
              >
                {isLoggingIn ? (
                  <Loader2 size={12} className="animate-spin" />
                ) : (
                  <LogIn size={12} />
                )}
                {isLoggingIn
                  ? "Connecting"
                  : isAuthenticated
                    ? "Logout"
                    : "Login"}
              </button>
              <button
                type="button"
                onClick={() => setSelectedRole(ROLES[0])}
                className="btn-cyan-solid px-4 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider"
                data-ocid="nav.register.button"
              >
                Register
              </button>
            </div>
          </nav>
        </header>

        {/* ── Hero ── */}
        <section
          className="relative text-center px-4 pt-14 pb-10 overflow-hidden"
          data-ocid="hero.section"
        >
          <ScanLine />

          {/* Corporate emblem */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.05, duration: 0.7, ease: "easeOut" }}
          >
            <CorporateEmblem />
          </motion.div>

          {/* SYSTEM ONLINE indicator */}
          <motion.div
            className="inline-flex items-center gap-2.5 mb-5 px-4 py-1.5 rounded-full"
            style={{
              background: "rgba(74,222,128,0.07)",
              border: "1px solid rgba(74,222,128,0.25)",
            }}
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <span
              className="w-1.5 h-1.5 rounded-full animate-system-blink"
              style={{ background: "#4ade80", boxShadow: "0 0 6px #4ade80" }}
            />
            <span
              className="font-montserrat font-bold text-[10px] uppercase tracking-[0.3em]"
              style={{ color: "#4ade80" }}
            >
              SYSTEM ONLINE
            </span>
            <span
              className="font-mono text-[9px]"
              style={{ color: "rgba(74,222,128,0.5)" }}
            >
              v4.2.1
            </span>
          </motion.div>

          <motion.p
            className="text-[10px] font-montserrat font-bold uppercase tracking-[0.5em] mb-3 text-cyan-glow"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
          >
            ◈ SECURE ACCESS PORTAL ◈
          </motion.p>

          <motion.h1
            className="font-montserrat font-black uppercase leading-[0.95] mb-4"
            style={{
              fontSize: "clamp(2.8rem, 8vw, 5.5rem)",
              color: "#eef4ff",
              letterSpacing: "-0.03em",
              textShadow:
                "0 2px 60px rgba(0,0,0,0.6), 0 0 120px rgba(85,214,255,0.08)",
            }}
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.55 }}
          >
            EMPOWERING
            <br />
            <span
              style={{
                color: "#55d6ff",
                textShadow:
                  "0 0 60px rgba(85,214,255,0.35), 0 0 120px rgba(85,214,255,0.15)",
              }}
            >
              GLOBAL
            </span>{" "}
            <span
              style={{
                color: "#eef4ff",
                WebkitTextStroke: "1px rgba(85,214,255,0.3)",
              }}
            >
              OPS
            </span>
          </motion.h1>

          <motion.p
            className="text-sm max-w-lg mx-auto mb-6"
            style={{ color: "rgba(169,182,198,0.8)", lineHeight: 1.7 }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.35 }}
          >
            Select your designated role below to register for access or view
            your current approval status.
          </motion.p>

          {/* Status banner */}
          {isAuthenticated && regStatus && (
            <motion.div
              className="inline-flex items-center gap-2.5 mt-1 mb-2 px-5 py-2 rounded-xl text-xs font-bold uppercase tracking-widest"
              initial={{ opacity: 0, scale: 0.92 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.5 }}
              style={{
                background:
                  (regStatus.status as unknown as string) ===
                  UserStatus.approved
                    ? "rgba(74,222,128,0.1)"
                    : (regStatus.status as unknown as string) ===
                        UserStatus.rejected
                      ? "rgba(255,107,107,0.1)"
                      : "rgba(255,217,61,0.1)",
                border:
                  (regStatus.status as unknown as string) ===
                  UserStatus.approved
                    ? "1px solid rgba(74,222,128,0.35)"
                    : (regStatus.status as unknown as string) ===
                        UserStatus.rejected
                      ? "1px solid rgba(255,107,107,0.35)"
                      : "1px solid rgba(255,217,61,0.35)",
                color:
                  (regStatus.status as unknown as string) ===
                  UserStatus.approved
                    ? "#4ade80"
                    : (regStatus.status as unknown as string) ===
                        UserStatus.rejected
                      ? "#ff6b6b"
                      : "#ffd93d",
              }}
              data-ocid="hero.status.panel"
            >
              {(regStatus.status as unknown as string) ===
                UserStatus.approved &&
                `✓ Approved — Welcome, ${regStatus.name}`}
              {(regStatus.status as unknown as string) === UserStatus.pending &&
                "⏳ Registration Pending Approval"}
              {(regStatus.status as unknown as string) ===
                UserStatus.rejected &&
                "✗ Registration Rejected — Contact Admin"}
            </motion.div>
          )}

          {/* Divider */}
          <motion.div
            className="flex items-center justify-center gap-3 mt-7"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.45 }}
          >
            <div
              style={{
                height: 1,
                width: 80,
                background:
                  "linear-gradient(to right, transparent, rgba(85,214,255,0.5))",
              }}
            />
            <div
              className="animate-pulse-glow"
              style={{
                width: 6,
                height: 6,
                borderRadius: "50%",
                background: "#55d6ff",
                boxShadow: "0 0 10px rgba(85,214,255,0.6)",
              }}
            />
            <div
              style={{
                height: 1,
                width: 80,
                background:
                  "linear-gradient(to left, transparent, rgba(85,214,255,0.5))",
              }}
            />
          </motion.div>
        </section>

        {/* ── Role Grid ── */}
        <main className="px-4 pb-20" data-ocid="roles.section">
          <motion.div
            className="flex items-center justify-center gap-3 mb-10"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            <div
              style={{
                height: 1,
                width: 40,
                background: "rgba(85,214,255,0.25)",
              }}
            />
            <p
              className="font-montserrat font-bold uppercase tracking-[0.35em] text-[10px]"
              style={{ color: "rgba(85,214,255,0.7)" }}
            >
              SELECT YOUR ROLE TO ACCESS
            </p>
            <div
              style={{
                height: 1,
                width: 40,
                background: "rgba(85,214,255,0.25)",
              }}
            />
          </motion.div>

          <div className="max-w-6xl mx-auto" data-ocid="roles.list">
            {/* 9 regular role cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 mb-5">
              {normalRoles.map((role, i) => (
                <RoleCard
                  key={role.id}
                  role={role}
                  index={i}
                  onAccess={setSelectedRole}
                  registrationStatus={
                    regStatus ? (regStatus.status as unknown as string) : null
                  }
                  registrationRoleTitle={regStatus?.roleTitle ?? null}
                />
              ))}
            </div>

            {/* 10th emergency card — full width */}
            {emergencyRole && (
              <div className="w-full">
                <RoleCard
                  key={emergencyRole.id}
                  role={emergencyRole}
                  index={emergencyIndex}
                  onAccess={setSelectedRole}
                  registrationStatus={
                    regStatus ? (regStatus.status as unknown as string) : null
                  }
                  registrationRoleTitle={regStatus?.roleTitle ?? null}
                />
              </div>
            )}
          </div>
        </main>

        {/* ── Footer ── */}
        <footer
          className="text-center py-6 px-4"
          style={{
            borderTop: "1px solid rgba(85,214,255,0.07)",
            background: "rgba(2,8,16,0.8)",
          }}
        >
          <p className="text-[11px]" style={{ color: "rgba(74,85,104,0.9)" }}>
            © {new Date().getFullYear()} NEXUS Corporate IT Portal. All rights
            reserved. <span style={{ color: "rgba(45,55,72,0.8)" }}>·</span>{" "}
            Built with <span style={{ color: "#ff6b6b" }}>♥</span> using{" "}
            <a
              href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(typeof window !== "undefined" ? window.location.hostname : "")}`}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:underline transition-colors"
              style={{ color: "rgba(85,214,255,0.7)" }}
            >
              caffeine.ai
            </a>
          </p>
        </footer>
      </div>

      {/* ── Registration Modal ── */}
      <AnimatePresence>
        {selectedRole && (
          <RegistrationModal
            role={selectedRole}
            onClose={() => setSelectedRole(null)}
          />
        )}
      </AnimatePresence>

      <Toaster position="top-right" />
    </div>
  );
}
