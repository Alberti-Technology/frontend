import { createPortal } from "react-dom";
import { ToastNotification } from "../types";
import { CloseIcon, InfoIcon, CheckIcon, AlertIcon, XCircleIcon } from "./FileManager/Icons";

interface ToastOverlayProps {
  toastNotifications: ToastNotification[];
  removeToast: (id: number) => void;
}

export function getToastToneConfig(tone?: string) {
  switch (tone) {
    case "success":
      return {
        accent: "#10b981",
        iconBg: "#d1fae5",
        iconColor: "#059669",
        titleColor: "#065f46",
        bodyColor: "#047857",
        icon: <CheckIcon />,
      };
    case "warning":
      return {
        accent: "#f59e0b",
        iconBg: "#fef3c7",
        iconColor: "#d97706",
        titleColor: "#92400e",
        bodyColor: "#b45309",
        icon: <AlertIcon />,
      };
    case "error":
      return {
        accent: "#ef4444",
        iconBg: "#fee2e2",
        iconColor: "#dc2626",
        titleColor: "#991b1b",
        bodyColor: "#b91c1c",
        icon: <XCircleIcon />,
      };
    case "info":
    default:
      return {
        accent: "#3b82f6",
        iconBg: "#dbeafe",
        iconColor: "#2563eb",
        titleColor: "#1e3a8a",
        bodyColor: "#1d4ed8",
        icon: <InfoIcon />,
      };
  }
}

export function ToastOverlay({ toastNotifications, removeToast }: ToastOverlayProps) {
  if (typeof document === "undefined" || toastNotifications.length === 0) return null;

  return createPortal(
    <div
      style={{
        position: "fixed",
        top: 16,
        right: 16,
        zIndex: 12000,
        display: "flex",
        flexDirection: "column",
        gap: 10,
        pointerEvents: "auto",
        width: "min(420px, calc(100vw - 24px))",
        maxHeight: "calc(100vh - 140px)",
        overflowY: "auto",
        overflowX: "hidden",
        paddingRight: 4,
      }}
      className="custom-scrollbar"
    >
      {[...toastNotifications].reverse().map((toast) => {
        const toneConfig = getToastToneConfig(toast.tone);
        return (
          <div
            key={toast.id}
            style={{
              position: "relative",
              background: "#ffffff",
              border: "1px solid rgba(16,36,63,0.1)",
              borderRadius: 14,
              boxShadow: "0 14px 34px rgba(16,36,63,0.16)",
              padding: "12px 14px 14px 14px",
              opacity: toast.leaving ? 0 : 1,
              transform: toast.leaving ? "translateY(-6px)" : "translateY(0)",
              transition: "opacity 240ms ease, transform 240ms ease",
              pointerEvents: "auto",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                position: "absolute",
                left: 0,
                top: 0,
                bottom: 0,
                width: 8,
                background: toneConfig.accent,
              }}
            />
            <button
              onClick={() => removeToast(toast.id)}
              style={{
                position: "absolute",
                top: 10,
                right: 10,
                border: "none",
                background: "transparent",
                color: "#6b7280",
                cursor: "pointer",
                padding: 2,
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
              }}
              aria-label="Cerrar notificación"
            >
              <CloseIcon />
            </button>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                paddingLeft: 10,
                paddingRight: 18,
              }}
            >
              <span
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: 999,
                  background: toneConfig.iconBg,
                  color: toneConfig.iconColor,
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                {toneConfig.icon}
              </span>
              <div style={{ minWidth: 0 }}>
                <div
                  style={{
                    fontSize: "1.02rem",
                    fontWeight: 800,
                    lineHeight: 1.1,
                    color: toneConfig.titleColor,
                    marginBottom: 3,
                  }}
                >
                  {toast.title}
                </div>
                <div
                  style={{
                    fontSize: "0.92rem",
                    fontWeight: 500,
                    lineHeight: 1.35,
                    color: toneConfig.bodyColor,
                    wordBreak: "break-word",
                  }}
                >
                  {toast.message}
                </div>
              </div>
            </div>
            <div
              style={{
                position: "absolute",
                left: 0,
                right: 0,
                bottom: 0,
                height: 5,
                background: "rgba(16,36,63,0.08)",
              }}
            >
              <span
                style={{
                  display: "block",
                  height: "100%",
                  width: "100%",
                  background: toneConfig.accent,
                  transformOrigin: "left center",
                  animation: `toastProgress ${toast.durationMs}ms linear forwards`,
                }}
              />
            </div>
          </div>
        );
      })}
    </div>,
    document.body
  );
}
