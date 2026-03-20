import { X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { useNexusActor } from "../hooks/useNexusActor";

const PURPOSES = [
  {
    group: "Food & Beverage",
    options: [
      "Corporate Lunch Meeting",
      "Team Dinner",
      "Client Entertainment",
      "Food Tasting Session",
      "Catering Event",
    ],
  },
  {
    group: "IT Sector",
    options: [
      "Technical Conference",
      "Product Demo",
      "Team Sprint Review",
      "Client Onboarding",
      "IT Training Session",
    ],
  },
];

const HOURS = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, "0"));
const MINUTES = ["00", "15", "30", "45"];

interface Props {
  roomName: string;
  roomType: string;
  onClose: () => void;
}

function Field({
  id,
  label,
  accentAlpha,
  children,
}: {
  id: string;
  label: string;
  accentAlpha: (a: number) => string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label
        htmlFor={id}
        className="block text-xs font-montserrat font-bold tracking-widest uppercase mb-1.5"
        style={{ color: accentAlpha(0.7) }}
      >
        {label}
      </label>
      {children}
    </div>
  );
}

export function BookingModal({ roomName, roomType, onClose }: Props) {
  const { actor, isFetching } = useNexusActor();
  const actorRef = useRef(actor);
  useEffect(() => {
    actorRef.current = actor;
  }, [actor]);

  const [form, setForm] = useState({
    bookerName: "",
    panName: "",
    dob: "",
    mobile: "",
    email: "",
    purpose: "",
    bookingDate: "",
    bookingHour: "09",
    bookingMinute: "00",
  });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    success: boolean;
    message: string;
    bookingId?: string;
  } | null>(null);

  function set(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function waitForActor(maxWaitMs = 20000) {
    if (actorRef.current) return actorRef.current;
    const start = Date.now();
    while (Date.now() - start < maxWaitMs) {
      await new Promise((r) => setTimeout(r, 600));
      if (actorRef.current) return actorRef.current;
    }
    return null;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const {
      bookerName,
      panName,
      dob,
      mobile,
      email,
      purpose,
      bookingDate,
      bookingHour,
      bookingMinute,
    } = form;
    if (
      !bookerName ||
      !panName ||
      !dob ||
      !mobile ||
      !email ||
      !purpose ||
      !bookingDate
    ) {
      setResult({
        success: false,
        message: "Please fill all required fields.",
      });
      return;
    }
    setLoading(true);
    setResult(null);

    const nb = await waitForActor();
    if (!nb) {
      setResult({
        success: false,
        message: "Cannot reach server. Please wait and try again.",
      });
      setLoading(false);
      return;
    }

    try {
      const resp = await nb.submitBooking(
        roomName,
        roomType,
        bookerName,
        panName,
        dob,
        mobile,
        email,
        purpose,
        bookingDate,
        bookingHour,
        bookingMinute,
        "00",
      );
      if (resp.startsWith("CONFLICT:")) {
        setResult({
          success: false,
          message: resp.replace("CONFLICT:", "").trim(),
        });
      } else {
        setResult({
          success: true,
          message:
            "Booking request submitted successfully! Awaiting admin approval.",
          bookingId: resp,
        });
      }
    } catch (err) {
      const msg =
        err instanceof Error
          ? err.message
          : "Submission failed. Please try again.";
      setResult({ success: false, message: msg });
    } finally {
      setLoading(false);
    }
  }

  const accentColor = roomType === "conference" ? "#55d6ff" : "#fbbf24";
  const accentAlpha = (a: number) =>
    roomType === "conference"
      ? `rgba(85,214,255,${a})`
      : `rgba(251,191,36,${a})`;
  const inputStyle = {
    background: "rgba(12,28,42,0.8)",
    border: `1px solid ${accentAlpha(0.22)}`,
    color: "#e2f4ff",
  };
  const cls = "w-full rounded-lg px-3 py-2.5 text-sm outline-none";

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
          border: `1px solid ${accentAlpha(0.35)}`,
          boxShadow: `0 0 60px ${accentAlpha(0.12)}, 0 25px 50px rgba(0,0,0,0.5)`,
        }}
      >
        <div
          className="flex items-center justify-between p-6 pb-4"
          style={{ borderBottom: `1px solid ${accentAlpha(0.15)}` }}
        >
          <div>
            <h2
              className="font-montserrat font-black text-sm tracking-widest uppercase"
              style={{ color: accentColor }}
            >
              BOOK ROOM
            </h2>
            <p className="font-montserrat font-bold text-base tracking-wider text-white mt-0.5">
              {roomName}
            </p>
            <p
              className="text-xs font-montserrat tracking-widest uppercase mt-0.5"
              style={{ color: accentAlpha(0.6) }}
            >
              {roomType === "conference" ? "CONFERENCE ROOM" : "DINING ROOM"}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            data-ocid="booking.close_button"
            className="p-2 rounded-lg hover:bg-white/5 transition-colors"
            style={{ color: accentAlpha(0.7) }}
          >
            <X size={18} />
          </button>
        </div>

        {isFetching && (
          <div
            className="mx-6 mt-4 p-3 rounded-xl text-xs flex items-center gap-2"
            style={{
              background: accentAlpha(0.06),
              border: `1px solid ${accentAlpha(0.2)}`,
              color: accentAlpha(0.7),
            }}
          >
            <span className="animate-spin">&#9696;</span> Connecting to server…
          </div>
        )}

        <AnimatePresence>
          {result && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="mx-6 mt-4 p-4 rounded-xl text-sm"
              style={{
                background: result.success
                  ? "rgba(0,220,120,0.1)"
                  : "rgba(255,80,80,0.1)",
                border: result.success
                  ? "1px solid rgba(0,220,120,0.3)"
                  : "1px solid rgba(255,80,80,0.3)",
                color: result.success ? "#00dc78" : "#ff6060",
              }}
              data-ocid={
                result.success ? "booking.success_state" : "booking.error_state"
              }
            >
              {result.message}
              {result.bookingId && (
                <p className="mt-1 text-xs opacity-80">
                  Reference ID: {result.bookingId}
                </p>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {!result?.success && (
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <Field
              id="bk-name"
              label="Full Name (As per Aadhar) *"
              accentAlpha={accentAlpha}
            >
              <input
                id="bk-name"
                type="text"
                required
                value={form.bookerName}
                onChange={(e) => set("bookerName", e.target.value)}
                className={cls}
                style={inputStyle}
                data-ocid="booking.input"
                placeholder="Enter full name as per Aadhar"
              />
            </Field>
            <Field
              id="bk-pan"
              label="Name as per PAN *"
              accentAlpha={accentAlpha}
            >
              <input
                id="bk-pan"
                type="text"
                required
                value={form.panName}
                onChange={(e) => set("panName", e.target.value)}
                className={cls}
                style={inputStyle}
                placeholder="Enter name as per PAN card"
              />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field
                id="bk-dob"
                label="Date of Birth *"
                accentAlpha={accentAlpha}
              >
                <input
                  id="bk-dob"
                  type="date"
                  required
                  value={form.dob}
                  onChange={(e) => set("dob", e.target.value)}
                  className={cls}
                  style={inputStyle}
                />
              </Field>
              <Field
                id="bk-mobile"
                label="Mobile Number *"
                accentAlpha={accentAlpha}
              >
                <input
                  id="bk-mobile"
                  type="tel"
                  required
                  value={form.mobile}
                  onChange={(e) => set("mobile", e.target.value)}
                  className={cls}
                  style={inputStyle}
                  placeholder="+91 XXXXXXXXXX"
                />
              </Field>
            </div>
            <Field
              id="bk-email"
              label="Official Email ID *"
              accentAlpha={accentAlpha}
            >
              <input
                id="bk-email"
                type="email"
                required
                value={form.email}
                onChange={(e) => set("email", e.target.value)}
                className={cls}
                style={inputStyle}
                placeholder="official@company.com"
              />
            </Field>
            <Field
              id="bk-purpose"
              label="Purpose of Booking *"
              accentAlpha={accentAlpha}
            >
              <select
                id="bk-purpose"
                required
                value={form.purpose}
                onChange={(e) => set("purpose", e.target.value)}
                className={cls}
                style={{
                  ...inputStyle,
                  background: "rgba(12,28,42,0.95)",
                  color: form.purpose ? "#e2f4ff" : "rgba(140,190,220,0.4)",
                }}
                data-ocid="booking.select"
              >
                <option value="">Select purpose...</option>
                {PURPOSES.map((g) => (
                  <optgroup key={g.group} label={g.group}>
                    {g.options.map((o) => (
                      <option key={o} value={o}>
                        {o}
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>
            </Field>
            <Field
              id="bk-date"
              label="Booking Date *"
              accentAlpha={accentAlpha}
            >
              <input
                id="bk-date"
                type="date"
                required
                value={form.bookingDate}
                min={new Date().toISOString().split("T")[0]}
                onChange={(e) => set("bookingDate", e.target.value)}
                className={cls}
                style={inputStyle}
              />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field id="bk-hour" label="Hour" accentAlpha={accentAlpha}>
                <select
                  id="bk-hour"
                  value={form.bookingHour}
                  onChange={(e) => set("bookingHour", e.target.value)}
                  className={cls}
                  style={{ ...inputStyle, background: "rgba(12,28,42,0.95)" }}
                >
                  {HOURS.map((h) => (
                    <option key={h} value={h}>
                      {h}:00
                    </option>
                  ))}
                </select>
              </Field>
              <Field id="bk-minute" label="Minute" accentAlpha={accentAlpha}>
                <select
                  id="bk-minute"
                  value={form.bookingMinute}
                  onChange={(e) => set("bookingMinute", e.target.value)}
                  className={cls}
                  style={{ ...inputStyle, background: "rgba(12,28,42,0.95)" }}
                >
                  {MINUTES.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
              </Field>
            </div>
            <button
              type="submit"
              disabled={loading || isFetching}
              data-ocid="booking.submit_button"
              className="w-full py-3 rounded-xl font-montserrat font-black text-xs tracking-widest uppercase transition-all"
              style={{
                background: loading
                  ? accentAlpha(0.15)
                  : `linear-gradient(135deg, ${accentAlpha(0.25)}, ${accentAlpha(0.15)})`,
                border: `1px solid ${accentAlpha(0.4)}`,
                color: loading ? accentAlpha(0.5) : accentColor,
                cursor: loading || isFetching ? "not-allowed" : "pointer",
              }}
            >
              {loading
                ? "Submitting..."
                : isFetching
                  ? "Connecting..."
                  : "SUBMIT BOOKING REQUEST"}
            </button>
          </form>
        )}

        {result?.success && (
          <div className="p-6 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="w-full py-3 rounded-xl font-montserrat font-black text-xs tracking-widest uppercase transition-all"
              style={{
                background: accentAlpha(0.15),
                border: `1px solid ${accentAlpha(0.35)}`,
                color: accentColor,
              }}
            >
              CLOSE
            </button>
          </div>
        )}
      </motion.div>
    </div>
  );
}
