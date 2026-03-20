import { Loader2, Star } from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { robustCall } from "../hooks/useNexusActor";

const FEEDBACK_OPTIONS = [
  "Professional Service Quality",
  "Meeting Room Setup",
  "AV Equipment Functionality",
  "Network Connectivity",
  "Technical Support",
  "Catering Quality",
  "Staff Responsiveness",
  "Cleanliness & Hygiene",
  "Punctuality & Time Management",
  "Documentation Support",
  "Booking Process Ease",
  "Conference Facilities",
  "IT Infrastructure",
  "Security & Access Control",
  "Facilities Management",
  "Communication Quality",
  "Problem Resolution Speed",
  "Equipment Availability",
  "Room Comfort & Ambiance",
  "Overall Experience",
];

interface FeedbackModalProps {
  bookingId: string;
  roomName: string;
  bookerName: string;
  email: string;
  onComplete: () => void;
}

export function FeedbackModal({
  bookingId,
  roomName,
  bookerName,
  email,
  onComplete,
}: FeedbackModalProps) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  function toggle(opt: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(opt)) next.delete(opt);
      else next.add(opt);
      return next;
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (selected.size === 0) {
      setError("Please select at least one option before submitting.");
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      await robustCall((actor) =>
        actor.submitRating(
          bookingId,
          roomName,
          bookerName,
          email,
          Array.from(selected),
          "",
        ),
      );
      setSuccess(true);
      setTimeout(() => onComplete(), 1200);
    } catch {
      setError("Failed to submit feedback. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center"
      style={{ background: "rgba(2,8,16,0.92)", backdropFilter: "blur(8px)" }}
      data-ocid="feedback.modal"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.94, y: 24 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        className="w-full max-w-2xl mx-4 rounded-2xl overflow-hidden"
        style={{
          background:
            "linear-gradient(160deg, #0f0a00 0%, #1a1000 40%, #120c00 100%)",
          border: "1.5px solid rgba(251,191,36,0.35)",
          boxShadow:
            "0 0 60px rgba(251,191,36,0.08), 0 0 120px rgba(251,191,36,0.04)",
          maxHeight: "90vh",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* Header */}
        <div
          className="px-6 py-5 flex items-center gap-3"
          style={{
            borderBottom: "1px solid rgba(251,191,36,0.18)",
            background: "rgba(251,191,36,0.04)",
          }}
        >
          <div style={{ filter: "drop-shadow(0 0 10px rgba(251,191,36,0.5))" }}>
            <Star size={22} color="#fbbf24" fill="rgba(251,191,36,0.35)" />
          </div>
          <div className="flex-1">
            <h2
              className="font-montserrat font-black text-sm tracking-widest uppercase"
              style={{ color: "#fbbf24", letterSpacing: "0.18em" }}
            >
              SERVICE FEEDBACK REQUIRED
            </h2>
            <p
              className="text-xs font-montserrat tracking-widest mt-0.5"
              style={{ color: "rgba(251,191,36,0.45)", fontSize: "0.6rem" }}
            >
              EBC BOOKING MANAGEMENT SYSTEM
            </p>
          </div>
          <span
            className="text-xs font-montserrat font-bold px-2.5 py-1 rounded-full"
            style={{
              background: "rgba(251,191,36,0.12)",
              border: "1px solid rgba(251,191,36,0.3)",
              color: "rgba(251,191,36,0.8)",
            }}
          >
            MANDATORY
          </span>
        </div>

        {/* Booking info */}
        <div
          className="px-6 py-4"
          style={{ borderBottom: "1px solid rgba(251,191,36,0.1)" }}
        >
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {[
              { label: "ROOM", value: roomName },
              { label: "BOOKED BY", value: bookerName },
              { label: "BOOKING REF", value: `${bookingId.slice(0, 12)}...` },
            ].map((item) => (
              <div key={item.label}>
                <p
                  className="text-xs font-montserrat font-bold tracking-widest uppercase mb-0.5"
                  style={{ color: "rgba(251,191,36,0.5)", fontSize: "0.55rem" }}
                >
                  {item.label}
                </p>
                <p
                  className="text-xs font-montserrat font-bold truncate"
                  style={{ color: "rgba(251,191,36,0.85)" }}
                >
                  {item.value}
                </p>
              </div>
            ))}
          </div>
          <p
            className="mt-3 text-xs"
            style={{ color: "rgba(251,191,36,0.55)" }}
          >
            Your booking has been approved. Please provide your service feedback
            to proceed. This step is mandatory and cannot be skipped.
          </p>
        </div>

        {/* Options — scrollable */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          <p
            className="text-xs font-montserrat font-bold tracking-widest uppercase mb-4"
            style={{ color: "rgba(251,191,36,0.6)", fontSize: "0.6rem" }}
          >
            SELECT ALL THAT APPLY ({selected.size} / {FEEDBACK_OPTIONS.length})
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {FEEDBACK_OPTIONS.map((opt, idx) => {
              const isChecked = selected.has(opt);
              return (
                <button
                  key={opt}
                  type="button"
                  onClick={() => toggle(opt)}
                  data-ocid={`feedback.checkbox.${idx + 1}`}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all"
                  style={{
                    background: isChecked
                      ? "rgba(251,191,36,0.12)"
                      : "rgba(251,191,36,0.03)",
                    border: `1px solid ${
                      isChecked
                        ? "rgba(251,191,36,0.45)"
                        : "rgba(251,191,36,0.12)"
                    }`,
                    color: isChecked
                      ? "rgba(251,191,36,0.9)"
                      : "rgba(251,191,36,0.5)",
                  }}
                >
                  <div
                    className="w-4 h-4 rounded flex items-center justify-center flex-shrink-0"
                    style={{
                      background: isChecked
                        ? "rgba(251,191,36,0.85)"
                        : "transparent",
                      border: `1.5px solid ${
                        isChecked
                          ? "rgba(251,191,36,0.9)"
                          : "rgba(251,191,36,0.3)"
                      }`,
                    }}
                  >
                    {isChecked && (
                      <svg
                        width="10"
                        height="8"
                        viewBox="0 0 10 8"
                        fill="none"
                        aria-label="checked"
                        role="img"
                      >
                        <path
                          d="M1 4L3.5 6.5L9 1"
                          stroke="#0f0a00"
                          strokeWidth="1.8"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    )}
                  </div>
                  <span className="text-xs font-montserrat font-medium">
                    {opt}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div
          className="px-6 py-4"
          style={{ borderTop: "1px solid rgba(251,191,36,0.15)" }}
        >
          {error && (
            <p
              className="text-xs mb-3"
              style={{ color: "#ff8080" }}
              data-ocid="feedback.error_state"
            >
              {error}
            </p>
          )}
          {success && (
            <p
              className="text-xs mb-3 font-montserrat font-bold tracking-widest"
              style={{ color: "#00dc78" }}
              data-ocid="feedback.success_state"
            >
              ✓ FEEDBACK SUBMITTED SUCCESSFULLY
            </p>
          )}
          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitting || selected.size === 0 || success}
            data-ocid="feedback.submit_button"
            className="w-full py-3 rounded-xl font-montserrat font-black text-xs tracking-widest uppercase flex items-center justify-center gap-2 transition-all"
            style={{
              background:
                selected.size === 0 || submitting || success
                  ? "rgba(251,191,36,0.05)"
                  : "rgba(251,191,36,0.18)",
              border: `1px solid ${
                selected.size === 0 || submitting || success
                  ? "rgba(251,191,36,0.15)"
                  : "rgba(251,191,36,0.5)"
              }`,
              color:
                selected.size === 0 || submitting || success
                  ? "rgba(251,191,36,0.3)"
                  : "#fbbf24",
              cursor:
                selected.size === 0 || submitting || success
                  ? "not-allowed"
                  : "pointer",
              boxShadow:
                selected.size > 0 && !submitting && !success
                  ? "0 0 20px rgba(251,191,36,0.12)"
                  : "none",
            }}
          >
            {submitting && <Loader2 size={14} className="animate-spin" />}
            {success
              ? "FEEDBACK SUBMITTED"
              : submitting
                ? "SUBMITTING..."
                : `SUBMIT FEEDBACK (${selected.size} SELECTED)`}
          </button>
          <p
            className="text-center text-xs mt-2"
            style={{ color: "rgba(251,191,36,0.25)", fontSize: "0.6rem" }}
          >
            This popup cannot be dismissed until feedback is submitted
          </p>
        </div>
      </motion.div>
    </div>
  );
}
