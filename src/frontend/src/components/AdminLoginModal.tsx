import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Lock, RefreshCw, Shield } from "lucide-react";
import { useState } from "react";
import { useAdminAuth } from "../hooks/useAdminAuth";

interface Props {
  onClose: () => void;
}

export function AdminLoginModal({ onClose }: Props) {
  const { login, isFetching } = useAdminAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      setError("Please enter username and password.");
      return;
    }

    setLoading(true);
    setError("");
    try {
      const result = await login(username.trim(), password.trim());
      if (result === "no_actor") {
        setError(
          "Cannot reach server. Please wait a few seconds and try again.",
        );
      } else if (result === true) {
        onClose();
      } else {
        setError(
          "Invalid username or password. Please check your credentials and try again.",
        );
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.toLowerCase().includes("stopped") || msg.includes("IC0508")) {
        setError(
          "Backend is currently offline. The app is being redeployed. Please try again in a moment.",
        );
      } else if (
        msg.toLowerCase().includes("initialize") ||
        msg.toLowerCase().includes("method")
      ) {
        setError(
          "Cannot connect to server. Please wait a few seconds and try again.",
        );
      } else {
        setError("Login failed. Please check your credentials and try again.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="fixed inset-0 flex items-center justify-center z-50"
      style={{ background: "rgba(2,8,18,0.88)", backdropFilter: "blur(8px)" }}
      onClick={onClose}
      onKeyDown={(e) => e.key === "Escape" && onClose()}
      role="presentation"
    >
      <div
        className="glass-modal w-full max-w-md mx-4 p-8"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => e.stopPropagation()}
        data-ocid="admin_login.modal"
      >
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div
            className="icon-tile"
            style={{
              background: "rgba(255,100,100,0.12)",
              borderColor: "rgba(255,100,100,0.35)",
            }}
          >
            <Shield size={22} color="#ff6b6b" />
          </div>
          <div>
            <h2 className="font-montserrat font-bold text-lg tracking-widest text-white uppercase">
              Admin Login
            </h2>
            <p className="text-xs" style={{ color: "rgba(100,180,220,0.6)" }}>
              Secure Access — Authorized Personnel Only
            </p>
          </div>
        </div>

        {isFetching && (
          <div
            className="flex items-center gap-2 mb-4 px-3 py-2 rounded-lg text-xs"
            style={{
              background: "rgba(85,214,255,0.07)",
              border: "1px solid rgba(85,214,255,0.2)",
              color: "rgba(85,214,255,0.7)",
            }}
          >
            <RefreshCw size={12} className="animate-spin" />
            Connecting to server…
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-1.5">
            <Label
              className="text-xs font-montserrat tracking-widest uppercase"
              style={{ color: "rgba(100,180,220,0.7)" }}
            >
              Username
            </Label>
            <Input
              data-ocid="admin_login.input"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter admin username"
              autoComplete="username"
              className="glass-input"
              style={{
                background: "rgba(12,28,42,0.8)",
                border: "1px solid rgba(85,214,255,0.25)",
                color: "#e2f4ff",
              }}
            />
          </div>
          <div className="space-y-1.5">
            <Label
              className="text-xs font-montserrat tracking-widest uppercase"
              style={{ color: "rgba(100,180,220,0.7)" }}
            >
              Password
            </Label>
            <div className="relative">
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter admin password"
                autoComplete="current-password"
                style={{
                  background: "rgba(12,28,42,0.8)",
                  border: "1px solid rgba(85,214,255,0.25)",
                  color: "#e2f4ff",
                  paddingRight: "2.5rem",
                }}
              />
              <Lock
                size={14}
                className="absolute right-3 top-1/2 -translate-y-1/2"
                style={{ color: "rgba(85,214,255,0.4)" }}
              />
            </div>
          </div>

          {error && (
            <div
              data-ocid="admin_login.error_state"
              className="text-xs px-4 py-2.5 rounded-lg"
              style={{
                background: "rgba(255,80,80,0.1)",
                border: "1px solid rgba(255,80,80,0.3)",
                color: "#ff8080",
              }}
            >
              {error}
            </div>
          )}

          <Button
            type="submit"
            disabled={loading || isFetching}
            data-ocid="admin_login.submit_button"
            className="w-full btn-cyan-solid font-montserrat tracking-widest text-xs uppercase py-3"
            style={{ height: "auto" }}
          >
            {loading ? (
              <Loader2 size={16} className="animate-spin mr-2" />
            ) : null}
            {loading
              ? "Authenticating..."
              : isFetching
                ? "Connecting..."
                : "Login"}
          </Button>

          <Button
            type="button"
            variant="ghost"
            onClick={onClose}
            data-ocid="admin_login.cancel_button"
            className="w-full text-xs"
            style={{ color: "rgba(100,180,220,0.5)" }}
          >
            Cancel
          </Button>
        </form>
      </div>
    </div>
  );
}
