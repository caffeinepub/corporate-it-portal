import { CalendarDays, Clock, Star, X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import type { BookingRecord, ServiceRating } from "../hooks/useNexusActor";
import { useNexusActor } from "../hooks/useNexusActor";

const RATING_OPTIONS = [
  "Room was clean and well-maintained",
  "AV and presentation equipment worked perfectly",
  "High-speed internet connectivity provided",
  "Video conferencing setup was ready on time",
  "Air conditioning was comfortable and regulated",
  "Seating arrangement was professional and ergonomic",
  "Lighting was appropriate for the meeting",
  "Food and beverages were served on time",
  "Catering quality met corporate standards",
  "Reception and greeting was courteous and professional",
  "Admin staff was responsive and helpful",
  "Booking confirmation was received promptly",
  "Room setup matched the booking request",
  "Technical support was available on-site",
  "Noise levels were well-controlled",
  "Parking and access facilities were adequate",
  "Privacy and confidentiality was maintained",
  "Housekeeping service was timely and efficient",
  "Overall ambiance was professional and executive",
  "I would recommend this facility to colleagues",
];

function getStatus(rec: BookingRecord): "pending" | "approved" | "rejected" {
  if ("pending" in rec.status) return "pending";
  if ("approved" in rec.status) return "approved";
  return "rejected";
}

const STATUS_STYLE = {
  pending: {
    bg: "rgba(245,196,0,0.12)",
    border: "rgba(245,196,0,0.3)",
    color: "#f5c400",
    label: "PENDING",
  },
  approved: {
    bg: "rgba(0,220,120,0.12)",
    border: "rgba(0,220,120,0.3)",
    color: "#00dc78",
    label: "APPROVED",
  },
  rejected: {
    bg: "rgba(255,80,80,0.12)",
    border: "rgba(255,80,80,0.3)",
    color: "#ff6060",
    label: "REJECTED",
  },
};

function ApprovalGreeting({ b }: { b: BookingRecord }) {
  return (
    <p
      className="text-xs leading-relaxed mt-3"
      style={{ color: "rgba(160,220,200,0.8)" }}
    >
      Congratulations! Your booking for <strong>{b.roomName}</strong> is
      successfully confirmed. We at EBC Booking Management System sincerely
      thank you for choosing our services. Your scheduled time is{" "}
      {b.bookingHour}:{b.bookingMinute} on {b.bookingDate}. We are committed to
      making your experience seamless and professional. All arrangements meet
      corporate IT standards, from seating to technology support and catering.
      Check your dashboard anytime for updates. Your satisfaction is our
      priority. Thank you for trusting EBC Booking Management System. Your
      booking reference is <strong>{b.approvedBookingId ?? b.id}</strong>.
      Contact admin for modifications. Enjoy your time in {b.roomName} and
      experience premium service designed for IT sector professionals. We deeply
      appreciate your association and strive to make every interaction
      remarkable.
    </p>
  );
}

function RejectionMsg({ b }: { b: BookingRecord }) {
  return (
    <p
      className="text-xs leading-relaxed mt-3"
      style={{ color: "rgba(220,160,160,0.8)" }}
    >
      Dear {b.bookerName}, thank you for your interest in booking {b.roomName}.
      After careful review, we regret that your request has not been approved at
      this time. This is based on internal verification and availability
      policies. For reconsideration, please contact the Administration Team.
      {b.rejectionReason ? ` Reason: ${b.rejectionReason}` : ""}
    </p>
  );
}

interface RatingPanelProps {
  approvedBookings: BookingRecord[];
  existingRatings: ServiceRating[];
  email: string;
  onRated: () => void;
}

function RatingPanel({
  approvedBookings,
  existingRatings,
  email,
  onRated,
}: RatingPanelProps) {
  const { actor } = useNexusActor();
  const [selectedBookingId, setSelectedBookingId] = useState("");
  const [checked, setChecked] = useState<Set<string>>(new Set());
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const ratedIds = new Set(existingRatings.map((r) => r.bookingId));
  const selectedBooking = approvedBookings.find(
    (b) => b.id === selectedBookingId,
  );
  const alreadyRated = selectedBookingId && ratedIds.has(selectedBookingId);

  function toggle(opt: string) {
    setChecked((prev) => {
      const next = new Set(prev);
      if (next.has(opt)) next.delete(opt);
      else next.add(opt);
      return next;
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!actor || !selectedBooking || checked.size === 0) return;
    setSubmitting(true);
    try {
      const nb = actor;
      await nb.submitRating(
        selectedBooking.id,
        selectedBooking.roomName,
        selectedBooking.bookerName,
        email,
        Array.from(checked),
        comment,
      );
      setSuccess(true);
      onRated();
    } catch {
      // ignore
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      <div
        className="rounded-2xl p-6"
        style={{
          background: "rgba(251,191,36,0.03)",
          border: "1px solid rgba(251,191,36,0.3)",
        }}
      >
        <h3
          className="font-montserrat font-black text-base tracking-widest uppercase mb-1"
          style={{
            color: "#fbbf24",
            textShadow: "0 0 20px rgba(251,191,36,0.4)",
          }}
        >
          SERVICE RATING
        </h3>
        <p className="text-xs mb-5" style={{ color: "rgba(200,160,80,0.7)" }}>
          Rate your experience to help us improve
        </p>

        {approvedBookings.length === 0 ? (
          <p className="text-sm" style={{ color: "rgba(200,160,80,0.5)" }}>
            No approved bookings to rate yet.
          </p>
        ) : success ? (
          <div
            className="p-4 rounded-xl text-sm"
            style={{
              background: "rgba(0,220,120,0.1)",
              border: "1px solid rgba(0,220,120,0.3)",
              color: "#00dc78",
            }}
          >
            Thank you! Your rating has been submitted and shared with the
            administration team.
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Booking selector */}
            <div>
              <label
                htmlFor="rating-booking"
                className="block text-xs font-montserrat font-bold tracking-widest uppercase mb-2"
                style={{ color: "rgba(251,191,36,0.7)" }}
              >
                Select Booking to Rate
              </label>
              <select
                id="rating-booking"
                value={selectedBookingId}
                onChange={(e) => {
                  setSelectedBookingId(e.target.value);
                  setChecked(new Set());
                  setComment("");
                  setSuccess(false);
                }}
                className="w-full rounded-lg px-3 py-2.5 text-sm outline-none"
                style={{
                  background: "rgba(12,28,42,0.95)",
                  border: "1px solid rgba(251,191,36,0.25)",
                  color: selectedBookingId ? "#e2f4ff" : "rgba(200,160,80,0.5)",
                }}
                data-ocid="rating.select"
              >
                <option value="">Choose an approved booking...</option>
                {approvedBookings.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.roomName} — {b.bookingDate} {b.bookingHour}:
                    {b.bookingMinute}
                    {ratedIds.has(b.id) ? " (Already Rated)" : ""}
                  </option>
                ))}
              </select>
            </div>

            {alreadyRated && (
              <div
                className="p-3 rounded-xl text-xs"
                style={{
                  background: "rgba(251,191,36,0.08)",
                  border: "1px solid rgba(251,191,36,0.25)",
                  color: "#fbbf24",
                }}
              >
                You have already submitted a rating for this booking.
              </div>
            )}

            {selectedBookingId && !alreadyRated && (
              <>
                <div>
                  <p
                    className="text-xs font-montserrat font-bold tracking-widest uppercase mb-3"
                    style={{ color: "rgba(251,191,36,0.7)" }}
                  >
                    Select All That Apply
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {RATING_OPTIONS.map((opt, i) => (
                      <label
                        key={opt}
                        htmlFor={`rating-opt-${i}`}
                        className="flex items-start gap-2.5 cursor-pointer p-2.5 rounded-lg transition-all"
                        style={{
                          background: checked.has(opt)
                            ? "rgba(251,191,36,0.08)"
                            : "transparent",
                          border: checked.has(opt)
                            ? "1px solid rgba(251,191,36,0.25)"
                            : "1px solid transparent",
                        }}
                      >
                        <input
                          id={`rating-opt-${i}`}
                          type="checkbox"
                          checked={checked.has(opt)}
                          onChange={() => toggle(opt)}
                          className="mt-0.5 shrink-0 accent-yellow-400"
                          data-ocid={`rating.checkbox.${i + 1}`}
                        />
                        <span
                          className="text-xs leading-relaxed"
                          style={{
                            color: checked.has(opt)
                              ? "#fbbf24"
                              : "rgba(180,200,220,0.7)",
                          }}
                        >
                          {opt}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="rating-comment"
                    className="block text-xs font-montserrat font-bold tracking-widest uppercase mb-2"
                    style={{ color: "rgba(251,191,36,0.7)" }}
                  >
                    Additional Comments (Optional)
                  </label>
                  <textarea
                    id="rating-comment"
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    rows={3}
                    className="w-full rounded-lg px-3 py-2.5 text-sm outline-none resize-none"
                    style={{
                      background: "rgba(12,28,42,0.8)",
                      border: "1px solid rgba(251,191,36,0.2)",
                      color: "#e2f4ff",
                    }}
                    placeholder="Share any additional feedback..."
                    data-ocid="rating.textarea"
                  />
                </div>

                <button
                  type="submit"
                  disabled={submitting || checked.size === 0}
                  data-ocid="rating.submit_button"
                  className="w-full py-3 rounded-xl font-montserrat font-black text-xs tracking-widest uppercase transition-all"
                  style={{
                    background:
                      checked.size === 0
                        ? "rgba(251,191,36,0.05)"
                        : "rgba(251,191,36,0.15)",
                    border: "1px solid rgba(251,191,36,0.4)",
                    color:
                      checked.size === 0 ? "rgba(251,191,36,0.35)" : "#fbbf24",
                    cursor:
                      checked.size === 0 || submitting
                        ? "not-allowed"
                        : "pointer",
                  }}
                >
                  {submitting ? "Submitting..." : "SUBMIT RATING"}
                </button>
              </>
            )}
          </form>
        )}
      </div>

      {/* Previous ratings */}
      {existingRatings.length > 0 && (
        <div>
          <h4
            className="font-montserrat font-bold text-xs tracking-widest uppercase mb-3"
            style={{ color: "rgba(251,191,36,0.6)" }}
          >
            Your Previous Ratings
          </h4>
          <div className="space-y-3">
            {existingRatings.map((r, i) => (
              <div
                key={r.id}
                data-ocid={`rating.item.${i + 1}`}
                className="rounded-xl p-4"
                style={{
                  background: "rgba(251,191,36,0.04)",
                  border: "1px solid rgba(251,191,36,0.15)",
                }}
              >
                <div className="flex items-start justify-between flex-wrap gap-2">
                  <div>
                    <p className="font-montserrat font-bold text-sm text-white">
                      {r.roomName}
                    </p>
                    <p
                      className="text-xs mt-0.5"
                      style={{ color: "rgba(200,160,80,0.6)" }}
                    >
                      Booking ID: {r.bookingId}
                    </p>
                  </div>
                  <span
                    className="flex items-center gap-1 text-xs"
                    style={{ color: "#fbbf24" }}
                  >
                    <Star size={12} fill="#fbbf24" />
                    {r.selectedOptions.length} items rated
                  </span>
                </div>
                {r.overallComment && (
                  <p
                    className="text-xs mt-2 italic"
                    style={{ color: "rgba(180,200,220,0.6)" }}
                  >
                    "{r.overallComment}"
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

interface Props {
  onClose: () => void;
}

export function UserBookingDashboard({ onClose }: Props) {
  const { actor } = useNexusActor();
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [bookings, setBookings] = useState<BookingRecord[]>([]);
  const [ratings, setRatings] = useState<ServiceRating[]>([]);
  const [activeTab, setActiveTab] = useState<
    "submitted" | "approved" | "rejected" | "rating"
  >("submitted");
  const [error, setError] = useState("");

  async function loadData(emailVal: string) {
    if (!actor) {
      setError("Backend not connected.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const nb = actor;
      const [bks, rts] = await Promise.all([
        nb.getBookingsByEmail(emailVal),
        nb.getRatingsByEmail(emailVal),
      ]);
      setBookings(bks);
      setRatings(rts);
      setSubmitted(true);
    } catch {
      setError("Failed to load data. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    await loadData(email.trim());
  }

  const approved = bookings.filter((b) => getStatus(b) === "approved");
  const rejected = bookings.filter((b) => getStatus(b) === "rejected");

  const TABS = [
    {
      id: "submitted" as const,
      label: `SUBMITTED (${bookings.length})`,
      color: "#55d6ff",
    },
    {
      id: "approved" as const,
      label: `APPROVED (${approved.length})`,
      color: "#00dc78",
    },
    {
      id: "rejected" as const,
      label: `REJECTED (${rejected.length})`,
      color: "#ff6060",
    },
    { id: "rating" as const, label: "SERVICE RATING", color: "#fbbf24" },
  ];

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto"
      style={{
        background:
          "linear-gradient(160deg, #040d16 0%, #071628 40%, #050e1a 70%, #040d16 100%)",
      }}
    >
      {/* Header */}
      <div
        className="sticky top-0 z-10 flex items-center justify-between px-6 py-4"
        style={{
          background: "rgba(4,13,22,0.95)",
          borderBottom: "1px solid rgba(85,214,255,0.15)",
          backdropFilter: "blur(12px)",
        }}
      >
        <div className="flex items-center gap-3">
          <div style={{ filter: "drop-shadow(0 0 8px rgba(85,214,255,0.3))" }}>
            <Star size={20} color="#fbbf24" fill="rgba(251,191,36,0.3)" />
          </div>
          <div>
            <h1
              className="font-montserrat font-black text-sm tracking-widest uppercase"
              style={{ color: "#55d6ff", letterSpacing: "0.2em" }}
            >
              MY BOOKING DASHBOARD
            </h1>
            <p
              className="text-xs font-montserrat tracking-widest"
              style={{
                color: "rgba(85,214,255,0.4)",
                fontSize: "0.55rem",
                letterSpacing: "0.2em",
              }}
            >
              EBC BOOKING MANAGEMENT SYSTEM
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          data-ocid="user_dashboard.close_button"
          className="p-2 rounded-lg hover:bg-white/5 transition-colors"
          style={{ color: "rgba(85,214,255,0.7)" }}
        >
          <X size={20} />
        </button>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Email search */}
        {!submitted ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-md mx-auto"
          >
            <div
              className="rounded-2xl p-8"
              style={{
                background:
                  "linear-gradient(135deg, rgba(8,22,36,0.92) 0%, rgba(12,28,42,0.88) 100%)",
                border: "1px solid rgba(85,214,255,0.22)",
              }}
            >
              <h2
                className="font-montserrat font-black text-base tracking-widest uppercase mb-2"
                style={{ color: "#55d6ff" }}
              >
                ACCESS YOUR DASHBOARD
              </h2>
              <p
                className="text-xs mb-6"
                style={{ color: "rgba(100,180,220,0.55)" }}
              >
                Enter your official email to view your bookings and ratings
              </p>
              <form onSubmit={handleSearch} className="space-y-4">
                <div>
                  <label
                    htmlFor="dash-email"
                    className="block text-xs font-montserrat font-bold tracking-widest uppercase mb-2"
                    style={{ color: "rgba(85,214,255,0.7)" }}
                  >
                    Official Email ID
                  </label>
                  <input
                    id="dash-email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full rounded-lg px-3 py-2.5 text-sm outline-none"
                    style={{
                      background: "rgba(12,28,42,0.8)",
                      border: "1px solid rgba(85,214,255,0.22)",
                      color: "#e2f4ff",
                    }}
                    placeholder="official@company.com"
                    data-ocid="user_dashboard.input"
                  />
                </div>
                {error && (
                  <p
                    className="text-xs"
                    style={{ color: "#ff8080" }}
                    data-ocid="user_dashboard.error_state"
                  >
                    {error}
                  </p>
                )}
                <button
                  type="submit"
                  disabled={loading}
                  data-ocid="user_dashboard.submit_button"
                  className="w-full py-3 rounded-xl font-montserrat font-black text-xs tracking-widest uppercase"
                  style={{
                    background: "rgba(85,214,255,0.15)",
                    border: "1px solid rgba(85,214,255,0.4)",
                    color: "#55d6ff",
                  }}
                >
                  {loading ? "Loading..." : "ACCESS MY DASHBOARD"}
                </button>
              </form>
            </div>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-6"
          >
            {/* Email + change */}
            <div className="flex items-center justify-between flex-wrap gap-3">
              <p className="text-sm" style={{ color: "rgba(100,180,220,0.7)" }}>
                Showing data for:{" "}
                <span style={{ color: "#55d6ff" }}>{email}</span>
              </p>
              <button
                type="button"
                onClick={() => {
                  setSubmitted(false);
                  setBookings([]);
                  setRatings([]);
                }}
                className="text-xs font-montserrat font-bold tracking-widest uppercase px-3 py-1.5 rounded-lg"
                style={{
                  background: "rgba(85,214,255,0.08)",
                  border: "1px solid rgba(85,214,255,0.2)",
                  color: "rgba(85,214,255,0.7)",
                }}
              >
                CHANGE EMAIL
              </button>
            </div>

            {/* Tabs */}
            <div className="flex flex-wrap gap-2">
              {TABS.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  data-ocid={`user_dashboard.${tab.id}.tab`}
                  className="px-4 py-2 rounded-xl font-montserrat font-bold text-xs tracking-widest uppercase transition-all"
                  style={{
                    background:
                      activeTab === tab.id ? `${tab.color}22` : "transparent",
                    border: `1px solid ${activeTab === tab.id ? `${tab.color}55` : "rgba(85,214,255,0.12)"}`,
                    color:
                      activeTab === tab.id
                        ? tab.color
                        : "rgba(100,180,220,0.5)",
                  }}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Panel content */}
            <AnimatePresence mode="wait">
              {activeTab === "submitted" && (
                <motion.div
                  key="submitted"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="space-y-4"
                >
                  <SectionHeader
                    title="SUBMITTED REQUESTS"
                    count={bookings.length}
                    color="#55d6ff"
                  />
                  {bookings.length === 0 ? (
                    <EmptyState
                      message="No booking requests found."
                      data-ocid="user_dashboard.submitted.empty_state"
                    />
                  ) : (
                    bookings.map((b, i) => {
                      const st = getStatus(b);
                      const ss = STATUS_STYLE[st];
                      return (
                        <div
                          key={b.id}
                          data-ocid={`user_dashboard.submitted.item.${i + 1}`}
                          className="rounded-xl p-5"
                          style={{
                            background:
                              "linear-gradient(135deg, rgba(8,22,36,0.92) 0%, rgba(12,28,42,0.88) 100%)",
                            border: "1px solid rgba(85,214,255,0.15)",
                          }}
                        >
                          <div className="flex items-start justify-between flex-wrap gap-3">
                            <div>
                              <p className="font-montserrat font-bold text-base text-white">
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
                          <p
                            className="text-xs mt-2"
                            style={{ color: "rgba(140,190,220,0.5)" }}
                          >
                            Purpose: {b.purpose}
                          </p>
                        </div>
                      );
                    })
                  )}
                </motion.div>
              )}

              {activeTab === "approved" && (
                <motion.div
                  key="approved"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="space-y-4"
                >
                  <SectionHeader
                    title="APPROVED BOOKINGS"
                    count={approved.length}
                    color="#00dc78"
                  />
                  {approved.length === 0 ? (
                    <EmptyState
                      message="No approved bookings yet."
                      data-ocid="user_dashboard.approved.empty_state"
                    />
                  ) : (
                    approved.map((b, i) => (
                      <div
                        key={b.id}
                        data-ocid={`user_dashboard.approved.item.${i + 1}`}
                        className="rounded-xl p-5"
                        style={{
                          background: "rgba(0,220,120,0.04)",
                          border: "1px solid rgba(0,220,120,0.25)",
                        }}
                      >
                        <div className="flex items-start justify-between flex-wrap gap-3">
                          <p className="font-montserrat font-bold text-base text-white">
                            {b.roomName}
                          </p>
                          <span
                            className="text-xs font-montserrat font-bold tracking-widest uppercase px-2.5 py-1 rounded-full"
                            style={{
                              background: "rgba(0,220,120,0.12)",
                              border: "1px solid rgba(0,220,120,0.3)",
                              color: "#00dc78",
                            }}
                          >
                            APPROVED
                          </span>
                        </div>
                        <p
                          className="text-xs mt-2 font-mono"
                          style={{ color: "rgba(0,220,120,0.7)" }}
                        >
                          Ref: {b.approvedBookingId ?? b.id}
                        </p>
                        <div
                          className="flex items-center gap-4 mt-2 text-xs"
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
                        <div
                          className="mt-3 p-4 rounded-xl"
                          style={{
                            background: "rgba(0,220,120,0.05)",
                            border: "1px solid rgba(0,220,120,0.15)",
                          }}
                        >
                          <ApprovalGreeting b={b} />
                        </div>
                      </div>
                    ))
                  )}
                </motion.div>
              )}

              {activeTab === "rejected" && (
                <motion.div
                  key="rejected"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="space-y-4"
                >
                  <SectionHeader
                    title="REJECTED BOOKINGS"
                    count={rejected.length}
                    color="#ff6060"
                  />
                  {rejected.length === 0 ? (
                    <EmptyState
                      message="No rejected bookings."
                      data-ocid="user_dashboard.rejected.empty_state"
                    />
                  ) : (
                    rejected.map((b, i) => (
                      <div
                        key={b.id}
                        data-ocid={`user_dashboard.rejected.item.${i + 1}`}
                        className="rounded-xl p-5"
                        style={{
                          background: "rgba(255,80,80,0.04)",
                          border: "1px solid rgba(255,80,80,0.2)",
                        }}
                      >
                        <div className="flex items-start justify-between flex-wrap gap-3">
                          <p className="font-montserrat font-bold text-base text-white">
                            {b.roomName}
                          </p>
                          <span
                            className="text-xs font-montserrat font-bold tracking-widest uppercase px-2.5 py-1 rounded-full"
                            style={{
                              background: "rgba(255,80,80,0.12)",
                              border: "1px solid rgba(255,80,80,0.3)",
                              color: "#ff6060",
                            }}
                          >
                            REJECTED
                          </span>
                        </div>
                        <div
                          className="flex items-center gap-4 mt-2 text-xs"
                          style={{ color: "rgba(140,190,220,0.6)" }}
                        >
                          <span className="flex items-center gap-1">
                            <CalendarDays size={12} />
                            {b.bookingDate}
                          </span>
                        </div>
                        <div
                          className="mt-3 p-4 rounded-xl"
                          style={{
                            background: "rgba(255,80,80,0.04)",
                            border: "1px solid rgba(255,80,80,0.1)",
                          }}
                        >
                          <RejectionMsg b={b} />
                        </div>
                      </div>
                    ))
                  )}
                </motion.div>
              )}

              {activeTab === "rating" && (
                <motion.div
                  key="rating"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                >
                  <RatingPanel
                    approvedBookings={approved}
                    existingRatings={ratings}
                    email={email}
                    onRated={() => loadData(email)}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </div>
    </div>
  );
}

function SectionHeader({
  title,
  count,
  color,
}: { title: string; count: number; color: string }) {
  return (
    <div className="flex items-center gap-3 mb-2">
      <h2
        className="font-montserrat font-black text-sm tracking-widest uppercase"
        style={{ color, textShadow: `0 0 20px ${color}44` }}
      >
        {title}
      </h2>
      <span
        className="text-xs font-montserrat font-bold px-2 py-0.5 rounded-full"
        style={{
          background: `${color}18`,
          color,
          border: `1px solid ${color}44`,
        }}
      >
        {count}
      </span>
    </div>
  );
}

function EmptyState({
  message,
  ...props
}: { message: string; "data-ocid"?: string }) {
  return (
    <div
      className="rounded-xl p-8 text-center"
      style={{
        background: "rgba(8,22,36,0.6)",
        border: "1px solid rgba(85,214,255,0.08)",
      }}
      {...props}
    >
      <p className="text-sm" style={{ color: "rgba(100,180,220,0.4)" }}>
        {message}
      </p>
    </div>
  );
}
