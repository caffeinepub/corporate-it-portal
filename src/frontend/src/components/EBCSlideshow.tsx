import { ChevronLeft, ChevronRight } from "lucide-react";
import { motion } from "motion/react";
import { useCallback, useEffect, useRef, useState } from "react";

const SLIDES = [
  {
    src: "/assets/generated/ebc_slide_01_conference_meeting.dim_1920x1080.jpg",
    label: "Conference Meeting",
  },
  {
    src: "/assets/generated/ebc_slide_02_reception_area.dim_1920x1080.jpg",
    label: "Reception Area",
  },
  {
    src: "/assets/generated/ebc_slide_03_dining_area.dim_1920x1080.jpg",
    label: "Dining Area",
  },
  {
    src: "/assets/generated/ebc_slide_04_kitchen_staff.dim_1920x1080.jpg",
    label: "Kitchen Staff",
  },
  {
    src: "/assets/generated/ebc_slide_05_open_office.dim_1920x1080.jpg",
    label: "Open Office",
  },
  {
    src: "/assets/generated/ebc_slide_06_boardroom.dim_1920x1080.jpg",
    label: "Boardroom",
  },
  {
    src: "/assets/generated/ebc_slide_07_lounge_area.dim_1920x1080.jpg",
    label: "Lounge Area",
  },
  {
    src: "/assets/generated/ebc_slide_08_buffet_dining.dim_1920x1080.jpg",
    label: "Buffet Dining",
  },
  {
    src: "/assets/generated/ebc_slide_09_server_room.dim_1920x1080.jpg",
    label: "Server Room",
  },
  {
    src: "/assets/generated/ebc_slide_10_training_room.dim_1920x1080.jpg",
    label: "Training Room",
  },
  {
    src: "/assets/generated/ebc_slide_11_lobby_entrance.dim_1920x1080.jpg",
    label: "Lobby Entrance",
  },
  {
    src: "/assets/generated/ebc_slide_12_private_meeting.dim_1920x1080.jpg",
    label: "Private Meeting",
  },
  {
    src: "/assets/generated/ebc_slide_13_restaurant_dining.dim_1920x1080.jpg",
    label: "Restaurant Dining",
  },
  {
    src: "/assets/generated/ebc_slide_14_catering_kitchen.dim_1920x1080.jpg",
    label: "Catering Kitchen",
  },
  {
    src: "/assets/generated/ebc_slide_15_night_office.dim_1920x1080.jpg",
    label: "Night Office",
  },
];

// Preload all images immediately so there's no blank flash during transitions
function usePreloadImages(srcs: string[]) {
  const loaded = useRef<Set<string>>(new Set());
  useEffect(() => {
    for (const src of srcs) {
      if (!loaded.current.has(src)) {
        const img = new Image();
        img.src = src;
        loaded.current.add(src);
      }
    }
  }, [srcs]);
}

export function EBCSlideshow() {
  const [current, setCurrent] = useState(0);
  const [prev, setPrev] = useState<number | null>(null);
  const [sliding, setSliding] = useState(false);
  const [direction, setDirection] = useState(1);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  usePreloadImages(SLIDES.map((s) => s.src));

  const TRANSITION_MS = 600; // slide animation duration
  const DISPLAY_MS = 1000; // each image display time

  const navigate = useCallback(
    (dir: number) => {
      if (sliding) return;
      setSliding(true);
      setDirection(dir);
      setPrev(current);
      setCurrent((c) => (c + dir + SLIDES.length) % SLIDES.length);
      setTimeout(() => {
        setPrev(null);
        setSliding(false);
      }, TRANSITION_MS);
    },
    [current, sliding],
  );

  const next = useCallback(() => navigate(1), [navigate]);
  const prevSlide = useCallback(() => navigate(-1), [navigate]);

  const goTo = useCallback(
    (idx: number) => {
      if (sliding || idx === current) return;
      navigate(idx > current ? 1 : -1);
    },
    [current, navigate, sliding],
  );

  // Auto-slide: display for DISPLAY_MS then transition
  useEffect(() => {
    timerRef.current = setInterval(next, DISPLAY_MS + TRANSITION_MS);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [next]);

  // Reset timer on manual nav
  const manualNav = useCallback(
    (fn: () => void) => {
      if (timerRef.current) clearInterval(timerRef.current);
      fn();
      timerRef.current = setInterval(next, DISPLAY_MS + TRANSITION_MS);
    },
    [next],
  );

  const slideOffset = (isEntering: boolean) => {
    if (isEntering) return direction > 0 ? "100%" : "-100%";
    return direction > 0 ? "-100%" : "100%";
  };

  return (
    <div className="w-full" data-ocid="ebc.slideshow.section">
      {/* ── WELCOME BANNER ── */}
      <div
        className="w-full py-5 px-4 mb-3 rounded-xl flex flex-col items-center justify-center gap-2"
        style={{
          background:
            "linear-gradient(135deg, rgba(4,13,22,0.95) 0%, rgba(7,22,40,0.98) 50%, rgba(4,13,22,0.95) 100%)",
          border: "1px solid rgba(85,214,255,0.25)",
          boxShadow:
            "0 0 40px rgba(85,214,255,0.12), inset 0 0 60px rgba(85,214,255,0.04)",
        }}
      >
        <div
          className="w-24 h-0.5 mb-1 rounded-full"
          style={{
            background:
              "linear-gradient(90deg, transparent, rgba(85,214,255,0.7), transparent)",
          }}
        />
        <motion.h2
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: "easeOut" }}
          className="font-montserrat font-black text-center tracking-widest uppercase"
          style={{
            color: "#55d6ff",
            fontSize: "clamp(0.7rem, 3vw, 1.35rem)",
            letterSpacing: "0.22em",
            textShadow:
              "0 0 30px rgba(85,214,255,0.7), 0 0 60px rgba(85,214,255,0.3)",
            lineHeight: 1.3,
          }}
        >
          WELCOME TO EBC BOOKING MANAGEMENT SYSTEM
        </motion.h2>
        <div
          className="w-24 h-0.5 mt-1 rounded-full"
          style={{
            background:
              "linear-gradient(90deg, transparent, rgba(85,214,255,0.7), transparent)",
          }}
        />
      </div>

      {/* ── CAROUSEL ── */}
      <div
        className="relative w-full rounded-2xl overflow-hidden"
        style={{ height: "clamp(220px, 42vw, 480px)" }}
        data-ocid="ebc.slideshow.panel"
      >
        {/* Previous slide (sliding out) */}
        {prev !== null && (
          <motion.div
            key={`prev-${prev}`}
            className="absolute inset-0"
            initial={{ x: 0 }}
            animate={{ x: slideOffset(false) }}
            transition={{ duration: TRANSITION_MS / 1000, ease: "easeInOut" }}
          >
            <img
              src={SLIDES[prev].src}
              alt={SLIDES[prev].label}
              className="w-full h-full object-cover"
              draggable={false}
            />
            <div
              className="absolute inset-0"
              style={{
                background:
                  "linear-gradient(180deg, rgba(4,13,22,0.25) 0%, rgba(4,13,22,0.05) 40%, rgba(4,13,22,0.35) 100%)",
              }}
            />
          </motion.div>
        )}

        {/* Current slide (sliding in) */}
        <motion.div
          key={`curr-${current}`}
          className="absolute inset-0"
          initial={{ x: sliding ? slideOffset(true) : 0 }}
          animate={{ x: 0 }}
          transition={{ duration: TRANSITION_MS / 1000, ease: "easeInOut" }}
        >
          <img
            src={SLIDES[current].src}
            alt={SLIDES[current].label}
            className="w-full h-full object-cover"
            draggable={false}
          />
          <div
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(180deg, rgba(4,13,22,0.25) 0%, rgba(4,13,22,0.05) 40%, rgba(4,13,22,0.35) 100%)",
            }}
          />
        </motion.div>

        {/* Slide label */}
        <div
          className="absolute bottom-10 left-4 z-10"
          style={{
            background: "rgba(4,13,22,0.6)",
            backdropFilter: "blur(4px)",
            padding: "4px 10px",
            borderRadius: "6px",
            border: "1px solid rgba(85,214,255,0.15)",
          }}
        >
          <p
            className="font-montserrat text-xs tracking-widest uppercase"
            style={{ color: "rgba(160,210,240,0.7)", fontSize: "0.6rem" }}
          >
            {SLIDES[current].label}
          </p>
        </div>

        {/* Prev button */}
        <button
          type="button"
          onClick={() => manualNav(prevSlide)}
          data-ocid="ebc.slideshow.prev_button"
          aria-label="Previous slide"
          className="absolute left-3 top-1/2 -translate-y-1/2 z-10 flex items-center justify-center w-9 h-9 rounded-full transition-all"
          style={{
            background: "rgba(12,28,42,0.7)",
            border: "1px solid rgba(85,214,255,0.25)",
            color: "#55d6ff",
          }}
        >
          <ChevronLeft size={18} />
        </button>

        {/* Next button */}
        <button
          type="button"
          onClick={() => manualNav(next)}
          data-ocid="ebc.slideshow.next_button"
          aria-label="Next slide"
          className="absolute right-3 top-1/2 -translate-y-1/2 z-10 flex items-center justify-center w-9 h-9 rounded-full transition-all"
          style={{
            background: "rgba(12,28,42,0.7)",
            border: "1px solid rgba(85,214,255,0.25)",
            color: "#55d6ff",
          }}
        >
          <ChevronRight size={18} />
        </button>

        {/* Dot indicators */}
        <div className="absolute bottom-3 left-0 right-0 z-10 flex items-center justify-center gap-1.5">
          {SLIDES.map((slide, i) => (
            <button
              key={slide.src}
              type="button"
              onClick={() => manualNav(() => goTo(i))}
              data-ocid={`ebc.slideshow.dot.${i + 1}`}
              aria-label={`Go to slide ${i + 1}`}
              className="rounded-full transition-all"
              style={{
                width: i === current ? 18 : 6,
                height: 6,
                background: i === current ? "#55d6ff" : "rgba(85,214,255,0.3)",
                border: "none",
                padding: 0,
                cursor: "pointer",
              }}
            />
          ))}
        </div>

        {/* Slide counter */}
        <div
          className="absolute top-3 right-4 z-10"
          style={{
            background: "rgba(12,28,42,0.7)",
            backdropFilter: "blur(4px)",
            padding: "2px 8px",
            borderRadius: "4px",
            border: "1px solid rgba(85,214,255,0.2)",
          }}
        >
          <span
            className="font-montserrat font-bold text-xs"
            style={{ color: "rgba(85,214,255,0.8)" }}
          >
            {String(current + 1).padStart(2, "0")} /{" "}
            {String(SLIDES.length).padStart(2, "0")}
          </span>
        </div>
      </div>
    </div>
  );
}
