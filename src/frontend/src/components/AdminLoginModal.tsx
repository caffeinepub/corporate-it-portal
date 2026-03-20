import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Shield, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useAdminAuth } from "../hooks/useAdminAuth";
import { robustCall } from "../hooks/useNexusActor";

interface Props {
  onClose: () => void;
}

export function AdminLoginModal({ onClose }: Props) {
  const { loginWithToken } = useAdminAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [stage, setStage] = useState<"form" | "loading" | "error">("form");
  const [errMsg, setErrMsg] = useState("");
  const [elapsed, setElapsed] = useState(0);
  const startRef = useRef<number>(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (stage === "loading") {
      startRef.current = Date.now();
      setElapsed(0);
      timerRef.current = setInterval(() => {
        setElapsed(Math.floor((Date.now() - startRef.current) / 1000));
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [stage]);

  const MAX_WAIT = 65;
  const remaining = Math.max(0, MAX_WAIT - elapsed);
  const progress = Math.min(100, (elapsed / MAX_WAIT) * 100);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      setErrMsg("Please enter both username and password.");
      return;
    }
    setErrMsg("");
    setStage("loading");

    try {
      const result = await robustCall(
        (actor) => actor.adminLogin(username.trim(), password.trim()),
        20,
      );
      const token =
        Array.isArray(result) && result.length > 0 ? result[0] : null;
      if (token) {
        loginWithToken(token);
        onClose();
      } else {
        setErrMsg("Invalid User ID or Password. Please try again.");
        setStage("form");
      }
    } catch {
      setErrMsg(
        "Server did not respond. Please wait 30 seconds and try again.",
      );
      setStage("error");
    }
  }

  return (
    <div
      className="fixed inset-0 flex items-center justify-center z-50"
      style={{ background: "rgba(2,8,18,0.92)", backdropFilter: "blur(8px)" }}
      onClick={onClose}
      onKeyDown={(e) => e.key === "Escape" && onClose()}
      role="presentation"
    >
      <div
        className="glass-modal w-full max-w-md mx-4 relative"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => e.stopPropagation()}
        data-ocid="admin_login.modal"
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute top-5 right-5 opacity-50 hover:opacity-100 transition-opacity"
          aria-label="Close"
        >
          <X size={18} color="#ff8080" />
        </button>

        <div
          className="px-8 pt-8 pb-5"
          style={{ borderBottom: "1px solid rgba(255,100,100,0.12)" }}
        >
          <div className="flex items-center gap-3">
            <div
              className="icon-tile"
              style={{
                borderColor: "rgba(255,100,100,0.3)",
                background: "rgba(255,100,100,0.1)",
              }}
            >
              <Shield size={20} color="#ff8080" />
            </div>
            <div>
              <p
                className="text-xs font-montserrat tracking-widest uppercase"
                style={{ color: "rgba(255,120,120,0.6)" }}
              >
                Secure Access
              </p>
              <h2
                className="font-montserrat font-bold text-sm tracking-wide uppercase"
                style={{ color: "#ff8080" }}
              >
                ADMIN LOGIN
              </h2>
            </div>
          </div>
        </div>

        <div className="px-8 pb-8 pt-6">
          {(stage === "form" || stage === "error") && (
            <form
              onSubmit={handleLogin}
              className="space-y-4"
              data-ocid="admin_login.panel"
            >
              <div className="space-y-1">
                <Label
                  className="text-xs font-montserrat tracking-widest uppercase"
                  style={{ color: "rgba(255,140,140,0.7)" }}
                >
                  Admin Username
                </Label>
                <Input
                  data-ocid="admin_login.username_input"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  autoComplete="off"
                  style={{
                    background: "rgba(20,8,8,0.8)",
                    border: "1px solid rgba(255,100,100,0.22)",
                    color: "#ffe0e0",
                  }}
                />
              </div>
              <div className="space-y-1">
                <Label
                  className="text-xs font-montserrat tracking-widest uppercase"
                  style={{ color: "rgba(255,140,140,0.7)" }}
                >
                  Admin Password
                </Label>
                <Input
                  data-ocid="admin_login.password_input"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="off"
                  style={{
                    background: "rgba(20,8,8,0.8)",
                    border: "1px solid rgba(255,100,100,0.22)",
                    color: "#ffe0e0",
                  }}
                />
              </div>
              {errMsg && (
                <p
                  data-ocid="admin_login.error_state"
                  className="text-xs text-center"
                  style={{ color: "#ff8080" }}
                >
                  {errMsg}
                </p>
              )}
              <Button
                type="submit"
                data-ocid="admin_login.submit_button"
                className="w-full font-montserrat tracking-widest text-xs uppercase"
                style={{
                  height: "44px",
                  background:
                    "linear-gradient(135deg, rgba(200,50,50,0.85), rgba(160,30,30,0.8))",
                  color: "#fff",
                  border: "1px solid rgba(255,100,100,0.3)",
                }}
              >
                <Shield size={14} className="mr-2" />
                Access Admin Panel
              </Button>
            </form>
          )}

          {stage === "loading" && (
            <div
              data-ocid="admin_login.loading_state"
              className="flex flex-col items-center py-8 gap-4"
            >
              <Loader2
                size={36}
                className="animate-spin"
                style={{ color: "#ff8080" }}
              />
              <div className="w-full text-center space-y-2">
                <p
                  className="font-montserrat text-xs font-bold tracking-widest uppercase"
                  style={{ color: "rgba(255,140,140,0.9)" }}
                >
                  CONNECTING TO SERVER
                </p>
                <p
                  className="text-xs"
                  style={{ color: "rgba(255,140,140,0.55)" }}
                >
                  Server is starting up &mdash; please wait
                </p>
              </div>
              {/* Progress bar */}
              <div
                className="w-full rounded-full overflow-hidden"
                style={{ height: "6px", background: "rgba(255,100,100,0.12)" }}
              >
                <div
                  className="h-full rounded-full transition-all duration-1000"
                  style={{
                    width: `${progress}%`,
                    background:
                      "linear-gradient(90deg, rgba(200,50,50,0.7), rgba(255,80,80,0.9))",
                  }}
                />
              </div>
              <p
                className="text-xs font-montserrat font-bold"
                style={{ color: "rgba(255,140,140,0.7)" }}
              >
                {remaining > 0
                  ? `~${remaining} seconds remaining`
                  : "Almost ready..."}
              </p>
              <p
                className="text-xs text-center"
                style={{ color: "rgba(255,140,140,0.35)", fontSize: "0.6rem" }}
              >
                First use takes 30&ndash;60 seconds. Please do not close this
                window.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
