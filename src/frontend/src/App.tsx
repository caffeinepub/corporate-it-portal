import { Toaster } from "@/components/ui/sonner";
import {
  Briefcase,
  Building2,
  ChefHat,
  ClipboardList,
  Cpu,
  Globe,
  Mail,
  Phone,
  PhoneCall,
  Search,
  Shield,
  User,
  Users,
  UtensilsCrossed,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { AdminDashboard } from "./components/AdminDashboard";
import { AdminLoginModal } from "./components/AdminLoginModal";
import { EBCSlideshow } from "./components/EBCSlideshow";
import { RegistrationModal } from "./components/RegistrationModal";
import { StatusCheckModal } from "./components/StatusCheckModal";
import { useAdminAuth } from "./hooks/useAdminAuth";

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

function hexAlpha(hex: string, alpha: number) {
  const r = Number.parseInt(hex.slice(1, 3), 16);
  const g = Number.parseInt(hex.slice(3, 5), 16);
  const b = Number.parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

// ─── Network overlay ────────────────────────────────────────────────────────────
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

// ─── Corporate Emblem ────────────────────────────────────────────────────────────
function CorporateEmblem() {
  return (
    <div className="relative flex items-center justify-center mb-8">
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
      <svg
        aria-hidden="true"
        focusable="false"
        width="110"
        height="110"
        viewBox="0 0 110 110"
        className="relative animate-emblem-pulse"
        style={{ filter: "drop-shadow(0 0 18px rgba(85,214,255,0.5))" }}
      >
        <polygon
          points="55,8 98,31 98,79 55,102 12,79 12,31"
          fill="rgba(85,214,255,0.07)"
          stroke="#55d6ff"
          strokeWidth="1.5"
        />
        <polygon
          points="55,20 86,37 86,73 55,90 24,73 24,37"
          fill="rgba(85,214,255,0.04)"
          stroke="#55d6ff"
          strokeWidth="0.75"
          opacity="0.6"
        />
        <text
          x="55"
          y="62"
          textAnchor="middle"
          fill="#55d6ff"
          fontSize="22"
          fontFamily="Montserrat,sans-serif"
          fontWeight="900"
          letterSpacing="2"
        >
          N
        </text>
        <text
          x="55"
          y="76"
          textAnchor="middle"
          fill="#55d6ff"
          fontSize="6"
          fontFamily="Montserrat,sans-serif"
          fontWeight="600"
          letterSpacing="3"
          opacity="0.7"
        >
          NEXUS
        </text>
      </svg>
    </div>
  );
}

// ─── Scan line animation ──────────────────────────────────────────────────────────
function ScanLine() {
  return (
    <div
      className="fixed left-0 right-0 pointer-events-none"
      style={{
        zIndex: 2,
        top: 0,
        height: "2px",
        background:
          "linear-gradient(90deg, transparent 0%, rgba(85,214,255,0.3) 30%, rgba(85,214,255,0.7) 50%, rgba(85,214,255,0.3) 70%, transparent 100%)",
        animation: "scan-line 8s linear infinite",
      }}
    />
  );
}

// ─── Role Card ──────────────────────────────────────────────────────────────────
function RoleCard({
  role,
  index,
  onRegister,
}: {
  role: RoleDef;
  index: number;
  onRegister: (role: RoleDef) => void;
}) {
  const accentColor = role.color;
  const isEmergency = role.isEmergencyContact;

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06, duration: 0.5 }}
      className="role-card"
      style={{
        background:
          "linear-gradient(135deg, rgba(8,22,36,0.92) 0%, rgba(12,28,42,0.88) 100%)",
        border: isEmergency
          ? "1px solid rgba(249,115,22,0.45)"
          : `1px solid ${hexAlpha(accentColor, 0.22)}`,
        boxShadow: isEmergency
          ? "0 4px 24px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.04), 0 0 0 1px rgba(249,115,22,0.1)"
          : "0 4px 24px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.04)",
        animation: isEmergency
          ? "emergency-pulse 2.5s ease-in-out infinite"
          : undefined,
      }}
      data-ocid={`role.item.${index + 1}`}
    >
      {/* Top color strip */}
      <div
        style={{
          height: "3px",
          background: `linear-gradient(90deg, ${accentColor} 0%, transparent 100%)`,
          borderRadius: "16px 16px 0 0",
          opacity: isEmergency ? 1 : 0.75,
        }}
      />

      <div className="p-5">
        {/* Card header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div
              className="icon-tile"
              style={{
                background: hexAlpha(accentColor, 0.12),
                borderColor: hexAlpha(accentColor, 0.3),
              }}
            >
              <role.icon size={20} color={accentColor} />
            </div>
            <div>
              <p
                className="font-montserrat font-black text-xs tracking-wider leading-tight"
                style={{
                  color: accentColor,
                  textShadow: `0 0 12px ${hexAlpha(accentColor, 0.4)}`,
                }}
              >
                {role.title}
              </p>
              <p
                className="text-xs mt-1"
                style={{ color: "rgba(140,190,220,0.6)" }}
              >
                {role.description}
              </p>
            </div>
          </div>
          {/* Badge number */}
          <span
            className="font-montserrat font-black text-sm shrink-0 ml-2"
            style={{
              color: hexAlpha(accentColor, 0.4),
              letterSpacing: "0.04em",
            }}
          >
            {String(index + 1).padStart(2, "0")}
          </span>
        </div>

        {/* Emergency contact info */}
        {isEmergency ? (
          <div className="space-y-2 mb-4">
            <a
              href={`mailto:${role.contactEmail}`}
              className="flex items-center gap-2 text-xs group"
              style={{ color: "rgba(249,115,22,0.85)" }}
            >
              <Mail size={12} />
              <span className="group-hover:underline">{role.contactEmail}</span>
            </a>
            <a
              href={`mailto:${role.contactEmailAlt}`}
              className="flex items-center gap-2 text-xs group"
              style={{ color: "rgba(249,115,22,0.65)" }}
            >
              <Mail size={12} />
              <span className="group-hover:underline">
                {role.contactEmailAlt}
              </span>
            </a>
            <a
              href={`tel:${role.contactMobile}`}
              className="flex items-center gap-2 text-xs group"
              style={{ color: "rgba(249,115,22,0.85)" }}
            >
              <Phone size={12} />
              <span className="group-hover:underline">
                {role.contactMobile}
              </span>
            </a>
          </div>
        ) : null}

        {/* Access button */}
        <button
          type="button"
          className="btn-access"
          onClick={() => onRegister(role)}
          data-ocid={`role.button.${index + 1}`}
          style={{
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore
            "--card-accent-glow": hexAlpha(accentColor, 0.45),
            borderColor: hexAlpha(accentColor, 0.38),
            color: accentColor,
          }}
        >
          ACCESS PORTAL
        </button>
      </div>
    </motion.div>
  );
}

// ─── Main App ─────────────────────────────────────────────────────────────────────
export default function App() {
  const { isAdmin, isVerifying, token, logout } = useAdminAuth();
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [showStatusCheck, setShowStatusCheck] = useState(false);
  const [statusCheckEmail, setStatusCheckEmail] = useState("");
  const [activeRole, setActiveRole] = useState<RoleDef | null>(null);

  function openStatusCheck(email = "") {
    setStatusCheckEmail(email);
    setShowStatusCheck(true);
  }

  const year = new Date().getFullYear();

  return (
    <div
      className="relative min-h-screen"
      style={{
        background:
          "linear-gradient(160deg, #040d16 0%, #071628 40%, #050e1a 70%, #040d16 100%)",
        minHeight: "100vh",
      }}
    >
      <NetworkOverlay />
      <ScanLine />

      {/* ── Navbar ── */}
      <nav
        className="glass-navbar fixed top-0 left-0 right-0 z-30"
        aria-label="Main navigation"
      >
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div
              style={{ filter: "drop-shadow(0 0 8px rgba(85,214,255,0.4))" }}
            >
              <Cpu size={22} color="#55d6ff" />
            </div>
            <div>
              <span
                className="font-montserrat font-black text-sm tracking-widest"
                style={{ color: "#55d6ff", letterSpacing: "0.2em" }}
              >
                NEXUS IT PORTAL
              </span>
              <div
                className="text-xs font-montserrat font-semibold tracking-widest"
                style={{
                  color: "rgba(85,214,255,0.4)",
                  fontSize: "0.55rem",
                  letterSpacing: "0.28em",
                }}
              >
                ENTERPRISE ACCESS SYSTEM
              </div>
            </div>
          </div>

          {/* System Online indicator */}
          <div
            className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full"
            style={{
              background: "rgba(0,220,120,0.08)",
              border: "1px solid rgba(0,220,120,0.2)",
            }}
          >
            <span
              className="w-2 h-2 rounded-full"
              style={{
                background: "#00dc78",
                animation: "system-blink 1.8s step-end infinite",
              }}
            />
            <span
              className="font-montserrat font-bold text-xs tracking-widest"
              style={{ color: "rgba(0,220,120,0.8)", fontSize: "0.6rem" }}
            >
              SYSTEM ONLINE
            </span>
          </div>

          {/* Nav actions */}
          <div className="flex items-center gap-2">
            {/* Check Status - always visible */}
            <button
              type="button"
              onClick={() => openStatusCheck()}
              data-ocid="nav.status_button"
              className="btn-cyan flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-montserrat font-bold tracking-widest uppercase"
            >
              <Search size={14} />
              <span className="hidden sm:inline">Check Status</span>
            </button>

            {isVerifying ? null : isAdmin ? (
              <>
                <button
                  type="button"
                  onClick={() =>
                    window.scrollTo({ top: 0, behavior: "smooth" })
                  }
                  data-ocid="nav.admin_dashboard.link"
                  className="btn-cyan-solid flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-montserrat font-bold tracking-widest uppercase"
                  style={{
                    background:
                      "linear-gradient(135deg, rgba(255,100,100,0.85), rgba(200,60,60,0.8))",
                    color: "#fff",
                  }}
                >
                  <Shield size={14} />
                  <span className="hidden sm:inline">Admin Dashboard</span>
                </button>
                <button
                  type="button"
                  onClick={logout}
                  data-ocid="nav.logout.button"
                  className="px-3 py-2 rounded-lg text-xs font-montserrat font-bold tracking-widest uppercase"
                  style={{
                    background: "rgba(255,80,80,0.1)",
                    border: "1px solid rgba(255,80,80,0.25)",
                    color: "#ff8080",
                  }}
                >
                  Logout
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={() => setShowAdminLogin(true)}
                data-ocid="nav.admin_login.button"
                className="btn-cyan flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-montserrat font-bold tracking-widest uppercase"
              >
                <Shield size={14} />
                <span className="hidden sm:inline">Admin Login</span>
              </button>
            )}
          </div>
        </div>
      </nav>

      {/* ── Main content ── */}
      <main style={{ position: "relative", zIndex: 10, paddingTop: "64px" }}>
        <AnimatePresence mode="wait">
          {isAdmin && token ? (
            <motion.div
              key="admin-dashboard"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              <AdminDashboard token={token} onLogout={logout} />
            </motion.div>
          ) : (
            <motion.div
              key="home"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              {/* Hero section */}
              <section className="text-center py-16 px-4">
                <CorporateEmblem />
                <motion.h1
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2, duration: 0.7 }}
                  className="font-montserrat font-black text-lg sm:text-2xl md:text-3xl lg:text-4xl tracking-widest mb-4 px-4 break-words"
                  style={{
                    color: "#55d6ff",
                    textShadow: "0 0 40px rgba(85,214,255,0.35)",
                    letterSpacing: "0.1em",
                    wordBreak: "break-word",
                    overflowWrap: "break-word",
                  }}
                >
                  WELCOME TO EBC BOOKING MANAGEMENT SYSTEM
                </motion.h1>
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.4, duration: 0.7 }}
                  className="font-montserrat text-xs tracking-widest uppercase max-w-lg mx-auto"
                  style={{
                    color: "rgba(100,180,220,0.6)",
                    letterSpacing: "0.28em",
                  }}
                >
                  Enterprise Access & Registration System
                </motion.p>
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.55, duration: 0.6 }}
                  className="text-sm mt-3 max-w-xl mx-auto"
                  style={{ color: "rgba(140,190,220,0.5)" }}
                >
                  Select your role below to register. All registrations require
                  admin approval before access is granted.
                </motion.p>
              </section>

              {/* EBC Slideshow */}
              <section className="max-w-7xl mx-auto px-4 pb-8">
                <EBCSlideshow />
              </section>

              {/* Roles grid */}
              <section className="max-w-7xl mx-auto px-4 pb-12">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                  {ROLES.map((role, idx) => (
                    <RoleCard
                      key={role.id}
                      role={role}
                      index={idx}
                      onRegister={(r) => {
                        if (r.id === "admin") {
                          setShowAdminLogin(true);
                        } else {
                          setActiveRole(r);
                        }
                      }}
                    />
                  ))}
                </div>
              </section>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* ── Footer ── */}
      <footer
        className="relative py-6 text-center"
        style={{ zIndex: 10, borderTop: "1px solid rgba(85,214,255,0.08)" }}
      >
        <p className="text-xs" style={{ color: "rgba(100,180,220,0.35)" }}>
          © {year}. Built with ❤️ using{" "}
          <a
            href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
            target="_blank"
            rel="noreferrer"
            className="hover:underline"
            style={{ color: "rgba(85,214,255,0.5)" }}
          >
            caffeine.ai
          </a>
        </p>
      </footer>

      <Toaster />

      {/* ── Modals ── */}
      <AnimatePresence>
        {showAdminLogin && (
          <AdminLoginModal onClose={() => setShowAdminLogin(false)} />
        )}
        {showStatusCheck && (
          <StatusCheckModal
            onClose={() => setShowStatusCheck(false)}
            prefillEmail={statusCheckEmail}
          />
        )}
        {activeRole && (
          <RegistrationModal
            role={activeRole}
            onClose={() => setActiveRole(null)}
            onStatusCheck={(email) => openStatusCheck(email)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
