import { motion } from "motion/react";
import { useState } from "react";
import { BookingModal } from "./BookingModal";

const DINING_ROOMS = [
  "VARSHA",
  "HEMANT",
  "SHARAD",
  "GRISHMA",
  "VASANT",
  "SHISHIR",
];

export function DiningRoomsSection() {
  const [bookingRoom, setBookingRoom] = useState<string | null>(null);

  return (
    <>
      <div className="mb-8">
        <h2
          className="font-montserrat font-black text-xl sm:text-2xl tracking-widest uppercase text-center"
          style={{
            color: "#fbbf24",
            textShadow: "0 0 30px rgba(251,191,36,0.3)",
            letterSpacing: "0.18em",
          }}
        >
          DINING ROOMS
        </h2>
        <div className="flex justify-center mt-2">
          <div
            className="h-0.5 w-24"
            style={{
              background:
                "linear-gradient(90deg, transparent, #fbbf24, transparent)",
            }}
          />
        </div>
        <p
          className="text-center text-xs font-montserrat tracking-widest uppercase mt-2"
          style={{ color: "rgba(220,180,100,0.5)" }}
        >
          {DINING_ROOMS.length} Dining Spaces Available — Reserve Your Venue
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {DINING_ROOMS.map((room, i) => (
          <motion.div
            key={room}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.07, duration: 0.4 }}
            data-ocid={`dining.item.${i + 1}`}
            className="rounded-xl p-4 flex flex-col gap-3"
            style={{
              background:
                "linear-gradient(135deg, rgba(8,22,36,0.92) 0%, rgba(16,24,12,0.88) 100%)",
              border: "1px solid rgba(251,191,36,0.15)",
              transition: "border-color 0.3s, box-shadow 0.3s",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.borderColor =
                "rgba(251,191,36,0.4)";
              (e.currentTarget as HTMLElement).style.boxShadow =
                "0 0 20px rgba(251,191,36,0.08)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.borderColor =
                "rgba(251,191,36,0.15)";
              (e.currentTarget as HTMLElement).style.boxShadow = "none";
            }}
          >
            <div className="flex items-center justify-between">
              <span
                className="text-xs font-montserrat font-bold tracking-widest uppercase"
                style={{ color: "rgba(251,191,36,0.45)" }}
              >
                DINING
              </span>
              <span
                className="flex items-center gap-1.5 text-xs"
                style={{ color: "rgba(251,191,36,0.7)" }}
              >
                <span
                  className="w-2 h-2 rounded-full"
                  style={{
                    background: "#fbbf24",
                    boxShadow: "0 0 6px rgba(251,191,36,0.6)",
                  }}
                />
                Available
              </span>
            </div>

            <p className="font-montserrat font-black text-sm tracking-wide text-white leading-tight">
              {room}
            </p>

            <button
              type="button"
              onClick={() => setBookingRoom(room)}
              data-ocid={`dining.button.${i + 1}`}
              className="mt-auto w-full py-2 rounded-lg font-montserrat font-black text-xs tracking-widest uppercase transition-all"
              style={{
                background: "rgba(251,191,36,0.08)",
                border: "1px solid rgba(251,191,36,0.3)",
                color: "#fbbf24",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.background =
                  "rgba(251,191,36,0.18)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.background =
                  "rgba(251,191,36,0.08)";
              }}
            >
              BOOK NOW
            </button>
          </motion.div>
        ))}
      </div>

      {bookingRoom && (
        <BookingModal
          roomName={bookingRoom}
          roomType="dining"
          onClose={() => setBookingRoom(null)}
        />
      )}
    </>
  );
}
