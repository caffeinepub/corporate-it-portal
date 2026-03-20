import { motion } from "motion/react";
import { useState } from "react";
import { BookingModal } from "./BookingModal";

const CONFERENCE_ROOMS = [
  "MYRIAD",
  "GOTHAM",
  "BROADWAY",
  "CALIBERI",
  "FUTURA",
  "CABIN-01",
  "CABIN-02",
  "CABIN-03",
  "CABIN-04",
  "CABIN-05",
  "CABIN-06",
  "CABIN-07",
  "DISCUSSION ROOM-01",
  "DISCUSSION ROOM-02",
  "GULMOHAR",
  "TULIP",
  "JACKRANDA",
  "GENEVA",
  "GEORGIA",
];

export function ConferenceRoomsSection() {
  const [bookingRoom, setBookingRoom] = useState<string | null>(null);

  return (
    <>
      <div className="mb-8">
        <h2
          className="font-montserrat font-black text-xl sm:text-2xl tracking-widest uppercase text-center"
          style={{
            color: "#55d6ff",
            textShadow: "0 0 30px rgba(85,214,255,0.3)",
            letterSpacing: "0.18em",
          }}
        >
          CONFERENCE ROOMS
        </h2>
        <div className="flex justify-center mt-2">
          <div
            className="h-0.5 w-24"
            style={{
              background:
                "linear-gradient(90deg, transparent, #55d6ff, transparent)",
            }}
          />
        </div>
        <p
          className="text-center text-xs font-montserrat tracking-widest uppercase mt-2"
          style={{ color: "rgba(100,180,220,0.5)" }}
        >
          {CONFERENCE_ROOMS.length} Rooms Available — Book Your Space
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {CONFERENCE_ROOMS.map((room, i) => (
          <motion.div
            key={room}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.04, duration: 0.4 }}
            data-ocid={`conference.item.${i + 1}`}
            className="rounded-xl p-4 flex flex-col gap-3 group"
            style={{
              background:
                "linear-gradient(135deg, rgba(8,22,36,0.92) 0%, rgba(12,28,42,0.88) 100%)",
              border: "1px solid rgba(85,214,255,0.15)",
              transition: "border-color 0.3s, box-shadow 0.3s",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.borderColor =
                "rgba(85,214,255,0.4)";
              (e.currentTarget as HTMLElement).style.boxShadow =
                "0 0 20px rgba(85,214,255,0.08)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.borderColor =
                "rgba(85,214,255,0.15)";
              (e.currentTarget as HTMLElement).style.boxShadow = "none";
            }}
          >
            {/* Availability dot */}
            <div className="flex items-center justify-between">
              <span
                className="text-xs font-montserrat font-bold tracking-widest uppercase"
                style={{ color: "rgba(85,214,255,0.45)" }}
              >
                CONFERENCE
              </span>
              <span
                className="flex items-center gap-1.5 text-xs"
                style={{ color: "rgba(85,214,255,0.7)" }}
              >
                <span
                  className="w-2 h-2 rounded-full"
                  style={{
                    background: "#55d6ff",
                    boxShadow: "0 0 6px rgba(85,214,255,0.6)",
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
              data-ocid={`conference.button.${i + 1}`}
              className="mt-auto w-full py-2 rounded-lg font-montserrat font-black text-xs tracking-widest uppercase transition-all"
              style={{
                background: "rgba(85,214,255,0.08)",
                border: "1px solid rgba(85,214,255,0.3)",
                color: "#55d6ff",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.background =
                  "rgba(85,214,255,0.18)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.background =
                  "rgba(85,214,255,0.08)";
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
          roomType="conference"
          onClose={() => setBookingRoom(null)}
        />
      )}
    </>
  );
}
