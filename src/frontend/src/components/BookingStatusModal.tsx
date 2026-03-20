import { CalendarDays, Clock, Search, X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import type { BookingRecord } from "../hooks/useNexusActor";
import { useNexusActor } from "../hooks/useNexusActor";

function getBookingStatus(
  rec: BookingRecord,
): "pending" | "approved" | "rejected" {
  if ("pending" in rec.status) return "pending";
  if ("approved" in rec.status) return "approved";
  return "rejected";
}

function ApprovalMessage({ rec }: { rec: BookingRecord }) {
  const msg = `Congratulations! Your booking for ${rec.roomName} is successfully confirmed. We at EBC Booking Management System sincerely thank you for choosing our services. Your scheduled time is ${rec.bookingHour}:${rec.bookingMinute} on ${rec.bookingDate}. We are committed to making your experience seamless and professional. All arrangements meet corporate IT standards, from seating to technology support and catering. Check your dashboard anytime for updates. Your satisfaction is our priority. Thank you for trusting EBC Booking Management System. Your booking reference is ${rec.approvedBookingId ?? rec.id}. Contact admin for modifications. Enjoy your time in ${rec.roomName} and experience premium service designed for IT sector professionals. We deeply appreciate your association and strive to make every interaction remarkable.`;
  return (
    <div
      className="mt-3 p-4 rounded-xl text-xs leading-relaxed"
      style={{
        background: "rgba(85,214,255,0.06)",
        border: "1px solid rgba(85,214,255,0.18)",
        color: "rgba(180,220,240,0.85)",
      }}
    >
      <p
        className="font-montserrat font-bold text-xs tracking-widest uppercase mb-2"
        style={{ color: "#55d6ff" }}
      >
        BOOKING CONFIRMATION
      </p>
      <p>{msg}</p>
      {rec.approvedBookingId && (
        <p className="mt-2 font-bold" style={{ color: "#55d6ff" }}>
          Booking ID: {rec.approvedBookingId}
        </p>
      )}
    </div>
  );
}

function RejectionMessage({ rec }: { rec: BookingRecord }) {
  return (
    <div
      className="mt-3 p-4 rounded-xl text-xs leading-relaxed"
      style={{
        background: "rgba(255,80,80,0.06)",
        border: "1px solid rgba(255,80,80,0.2)",
        color: "rgba(220,180,180,0.85)",
      }}
    >
      <p
        className="font-montserrat font-bold text-xs tracking-widest uppercase mb-2"
        style={{ color: "#ff6060" }}
      >
        BOOKING NOT APPROVED
      </p>
      <p>Dear {rec.bookerName},</p>
      <p className="mt-2">
        Thank you for your interest in booking {rec.roomName} at EBC Booking
        Management System.
      </p>
      <p className="mt-2">
        After careful review, we regret to inform you that your booking request
        has not been approved at this time. This decision is based on internal
        verification and room availability policies designed to maintain
        operational efficiency.
      </p>
      <p className="mt-2">
        If you believe this requires reconsideration, please contact the
        Administration Team with appropriate details.
      </p>
      <p className="mt-2">We appreciate your understanding and cooperation.</p>
      <p className="mt-3 font-semibold">
        Best Regards,
        <br />
        Corporate IT &amp; Administration Team
      </p>
    </div>
  );
}

interface Props {
  onClose: () => void;
}

export function BookingStatusModal({ onClose }: Props) {
  const { actor } = useNexusActor();
  const [searchType, setSearchType] = useState<"email" | "mobile">("email");
  const [query, setQuery] = useState("");
  const [bookings, setBookings] = useState<BookingRecord[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!actor || !query.trim()) return;
    setLoading(true);
    setError("");
    setBookings(null);
    try {
      const nb = actor;
      const results =
        searchType === "email"
          ? await nb.getBookingsByEmail(query.trim())
          : await nb.getBookingsByMobile(query.trim());
      setBookings(results);
      if (results.length === 0)
        setError(`No bookings found for this ${searchType}.`);
    } catch {
      setError("Failed to fetch bookings. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  const statusStyle = {
    pending: {
      bg: "rgba(245,196,0,0.12)",
      border: "rgba(245,196,0,0.3)",
      color: "#f5c400",
      label: "PENDING",
    },
    approved: {
      bg: "rgba(85,214,255,0.12)",
      border: "rgba(85,214,255,0.3)",
      color: "#55d6ff",
      label: "APPROVED",
    },
    rejected: {
      bg: "rgba(255,80,80,0.12)",
      border: "rgba(255,80,80,0.3)",
      color: "#ff6060",
      label: "REJECTED",
    },
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
      onKeyDown={(e) => {
        if (e.key === "Escape") onClose();
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        transition={{ duration: 0.25 }}
        className="w-full max-w-lg rounded-2xl overflow-y-auto"
        style={{
          maxHeight: "90vh",
          background:
            "linear-gradient(135deg, rgba(8,22,36,0.97) 0%, rgba(12,28,42,0.95) 100%)",
          border: "1px solid rgba(85,214,255,0.3)",
          boxShadow:
            "0 0 60px rgba(85,214,255,0.1), 0 25px 50px rgba(0,0,0,0.5)",
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between p-6 pb-4"
          style={{ borderBottom: "1px solid rgba(85,214,255,0.12)" }}
        >
          <div>
            <h2
              className="font-montserrat font-black text-sm tracking-widest uppercase"
              style={{ color: "#55d6ff" }}
            >
              CHECK BOOKING STATUS
            </h2>
            <p
              className="text-xs mt-0.5"
              style={{ color: "rgba(100,180,220,0.5)" }}
            >
              Track your room booking requests
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            data-ocid="booking_status.close_button"
            className="p-2 rounded-lg hover:bg-white/5 transition-colors"
            style={{ color: "rgba(85,214,255,0.7)" }}
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Search type toggle */}
          <div className="flex gap-2">
            {(["email", "mobile"] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setSearchType(t)}
                className="flex-1 py-2 rounded-lg text-xs font-montserrat font-bold tracking-widest uppercase transition-all"
                style={{
                  background:
                    searchType === t ? "rgba(85,214,255,0.15)" : "transparent",
                  border: `1px solid ${searchType === t ? "rgba(85,214,255,0.4)" : "rgba(85,214,255,0.15)"}`,
                  color: searchType === t ? "#55d6ff" : "rgba(100,180,220,0.5)",
                }}
              >
                {t === "email" ? "BY EMAIL" : "BY MOBILE"}
              </button>
            ))}
          </div>

          {/* Search form */}
          <form onSubmit={handleSearch} className="flex gap-2">
            <input
              type={searchType === "email" ? "email" : "tel"}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={
                searchType === "email"
                  ? "Enter your email address"
                  : "Enter mobile number"
              }
              required
              className="flex-1 rounded-lg px-3 py-2.5 text-sm outline-none"
              style={{
                background: "rgba(12,28,42,0.8)",
                border: "1px solid rgba(85,214,255,0.22)",
                color: "#e2f4ff",
              }}
              data-ocid="booking_status.search_input"
            />
            <button
              type="submit"
              disabled={loading}
              data-ocid="booking_status.button"
              className="px-4 py-2.5 rounded-lg font-montserrat font-bold text-xs tracking-widest uppercase transition-all flex items-center gap-2"
              style={{
                background: "rgba(85,214,255,0.15)",
                border: "1px solid rgba(85,214,255,0.35)",
                color: "#55d6ff",
              }}
            >
              {loading ? "..." : <Search size={14} />}
            </button>
          </form>

          {/* Error */}
          {error && (
            <div
              className="p-3 rounded-xl text-xs"
              style={{
                background: "rgba(255,80,80,0.08)",
                border: "1px solid rgba(255,80,80,0.2)",
                color: "#ff8080",
              }}
              data-ocid="booking_status.error_state"
            >
              {error}
            </div>
          )}

          {/* Results */}
          {bookings && bookings.length > 0 && (
            <div className="space-y-4" data-ocid="booking_status.list">
              <p
                className="text-xs font-montserrat tracking-widest uppercase"
                style={{ color: "rgba(100,180,220,0.5)" }}
              >
                {bookings.length} BOOKING{bookings.length > 1 ? "S" : ""} FOUND
              </p>
              <AnimatePresence>
                {bookings.map((b, i) => {
                  const st = getBookingStatus(b);
                  const ss = statusStyle[st];
                  return (
                    <motion.div
                      key={b.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05 }}
                      data-ocid={`booking_status.item.${i + 1}`}
                      className="rounded-xl p-4"
                      style={{
                        background: "rgba(8,22,36,0.7)",
                        border: "1px solid rgba(85,214,255,0.12)",
                      }}
                    >
                      <div className="flex items-start justify-between gap-3 flex-wrap">
                        <div>
                          <p className="font-montserrat font-bold text-sm text-white">
                            {b.roomName}
                          </p>
                          <span
                            className="inline-block text-xs font-montserrat tracking-widest uppercase px-2 py-0.5 rounded mt-1"
                            style={{
                              background: "rgba(85,214,255,0.1)",
                              color: "#55d6ff",
                              border: "1px solid rgba(85,214,255,0.2)",
                            }}
                          >
                            {b.roomType === "conference"
                              ? "CONFERENCE"
                              : "DINING"}
                          </span>
                        </div>
                        <span
                          className="text-xs font-montserrat font-bold tracking-widest uppercase px-2.5 py-1 rounded-full"
                          style={{
                            background: ss.bg,
                            border: `1px solid ${ss.border}`,
                            color: ss.color,
                          }}
                        >
                          {ss.label}
                        </span>
                      </div>
                      <div
                        className="flex items-center gap-4 mt-3 text-xs"
                        style={{ color: "rgba(140,190,220,0.6)" }}
                      >
                        <span className="flex items-center gap-1">
                          <CalendarDays size={12} />
                          {b.bookingDate}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock size={12} />
                          {b.bookingHour}:{b.bookingMinute}
                        </span>
                      </div>
                      {st === "approved" && <ApprovalMessage rec={b} />}
                      {st === "rejected" && <RejectionMessage rec={b} />}
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
