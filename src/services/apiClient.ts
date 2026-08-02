import { API_BASE_URL, API_WAKEUP_RETRY_MS } from "../config/apiConfig";

export const BASE_URL = API_BASE_URL;
export const HF_BASE_URL = import.meta.env.VITE_HF_BASE_URL;
export const HF_MASK_ENDPOINT = import.meta.env.VITE_HF_MASK_ENDPOINT;

export type ApiRequestError = Error & {
  status?: number;
  data?: any;
};

interface RecoveryState {
  isRecovering: boolean;
  attempts: number;
}

type RecoveryListener = (state: RecoveryState) => void;

type DeferredRequest = {
  path: string;
  init?: RequestInit;
  resolve: (response: Response) => void;
  reject: (reason?: unknown) => void;
};

type ManualOverlayState = {
  id: number;
  message: string;
  detail?: string;
};

const overlayId = "api-wakeup-overlay";

let isRecovering = false;
let recoveryAttempts = 0;
const recoveryQueue: DeferredRequest[] = [];
const recoveryListeners = new Set<RecoveryListener>();
let recoveryBarrier: Promise<void> | null = null;
let releaseRecoveryBarrier: (() => void) | null = null;
let manualOverlayState: ManualOverlayState | null = null;
let manualOverlayCounter = 0;

export function currentRecoveryState(): RecoveryState {
  return {
    isRecovering,
    attempts: recoveryAttempts,
  };
}

function waitForRecoveryToFinish() {
  return recoveryBarrier || Promise.resolve();
}

function ensureWakeupOverlayRoot() {
  if (typeof document === "undefined") return null;
  let root = document.getElementById(overlayId);
  if (!root) {
    root = document.createElement("div");
    root.id = overlayId;
    document.body.appendChild(root);
  }
  return root;
}

function renderWakeupOverlay(state: RecoveryState) {
  if (typeof document === "undefined") return;
  const root = ensureWakeupOverlayRoot();
  if (!root) return;

  if (!state.isRecovering && !manualOverlayState) {
    root.innerHTML = "";
    return;
  }

  const title = manualOverlayState
    ? manualOverlayState.message
    : "Conectando con el servidor...";

  root.innerHTML = `
    <div style="position: fixed; inset: 0; z-index: 13000; background: rgba(16,36,63,0.34); backdrop-filter: blur(6px); display: flex; align-items: center; justify-content: center; padding: 20px;">
      <div style="display:flex; flex-direction:column; align-items:center; gap:14px; width:min(92vw,560px); font-family: var(--font-body, 'Segoe UI', system-ui, sans-serif);">
        <div style="position:relative; width:148px; height:148px;">
          <div style="position:absolute; inset:0; border-radius:50%; border:11px solid rgba(130,201,255,0.38);"></div>
          <div style="position:absolute; inset:0; border-radius:50%; border:11px solid transparent; border-top-color:#339eea; border-right-color:#82c9ff; animation: api-wakeup-spin 1s linear infinite;"></div>
        </div>
        <div style="text-align:center; color:#eef7ff; text-shadow: 0 3px 12px rgba(16,36,63,0.42); font-family: var(--font-display, var(--font-body, 'Segoe UI', system-ui, sans-serif)); font-size:clamp(24px,3.2vw,50px); font-weight:700; letter-spacing:0.01em; line-height:1.14;">
          ${title}
        </div>
      </div>
    </div>
    <style>
      @keyframes api-wakeup-spin {
        from { transform: rotate(0deg); }
        to { transform: rotate(360deg); }
      }
    </style>
  `;
}

export function showGlobalLoader(message: string, detail?: string) {
  const id = ++manualOverlayCounter;
  manualOverlayState = { id, message, detail };
  renderWakeupOverlay(currentRecoveryState());
  return id;
}

export function hideGlobalLoader(id: number) {
  if (!manualOverlayState || manualOverlayState.id !== id) return;
  manualOverlayState = null;
  renderWakeupOverlay(currentRecoveryState());
}

function emitRecoveryState() {
  const snapshot = currentRecoveryState();
  renderWakeupOverlay(snapshot);
  recoveryListeners.forEach((listener) => listener(snapshot));
}

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function cloneRequestInit(init?: RequestInit): RequestInit | undefined {
  if (!init) return undefined;
  return {
    ...init,
    headers: init.headers ? new Headers(init.headers) : undefined,
  };
}

function requestUrl(path: string): string {
  const cleanPath = path.startsWith("/") ? path.slice(1) : path;
  return `${BASE_URL}${cleanPath}`;
}

export async function readErrorPayload(response: Response) {
  const contentType = response.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    try {
      return await response.json();
    } catch {
      return null;
    }
  }

  try {
    const text = await response.text();
    return text ? { detail: text } : null;
  } catch {
    return null;
  }
}

export function buildApiError(
  response: Response,
  payload: any,
  fallbackMessage: string,
): ApiRequestError {
  const message =
    payload?.error ||
    payload?.detalle ||
    payload?.detail ||
    (Array.isArray(payload?.non_field_errors)
      ? payload.non_field_errors[0]
      : undefined) ||
    fallbackMessage;

  const error = new Error(message) as ApiRequestError;
  error.status = response.status;
  error.data = payload;
  return error;
}

function shouldTreatAsSleepingServer(response: Response) {
  const maybeSleepingStatus =
    response.status === 502 ||
    response.status === 503 ||
    response.status === 504 ||
    response.status >= 500;

  if (!maybeSleepingStatus) return false;
  const contentType = response.headers.get("content-type") || "";
  return !contentType.includes("application/json");
}

async function runRecoveryLoop() {
  if (isRecovering) return;
  isRecovering = true;
  recoveryBarrier = new Promise<void>((resolve) => {
    releaseRecoveryBarrier = resolve;
  });
  recoveryAttempts = 0;
  emitRecoveryState();

  while (recoveryQueue.length > 0) {
    const pending = recoveryQueue[0];
    recoveryAttempts += 1;
    emitRecoveryState();

    try {
      const url = requestUrl(pending.path);
      const response = await fetch(url, pending.init);
      if (shouldTreatAsSleepingServer(response)) {
        await wait(API_WAKEUP_RETRY_MS);
        continue;
      }

      recoveryQueue.shift();
      pending.resolve(response);
      emitRecoveryState();
    } catch {
      await wait(API_WAKEUP_RETRY_MS);
    }
  }

  isRecovering = false;
  recoveryAttempts = 0;
  releaseRecoveryBarrier?.();
  releaseRecoveryBarrier = null;
  recoveryBarrier = null;
  emitRecoveryState();
}

function enqueueDeferredRequest(path: string, init?: RequestInit) {
  return new Promise<Response>((resolve, reject) => {
    recoveryQueue.push({
      path,
      init: cloneRequestInit(init),
      resolve,
      reject,
    });
    emitRecoveryState();
    void runRecoveryLoop();
  });
}

export async function apiFetch(path: string, init?: RequestInit) {
  if (isRecovering) await waitForRecoveryToFinish();

  const safeInit = cloneRequestInit(init) || {};

  try {
    const url = requestUrl(path);
    const response = await fetch(url, safeInit);
    if (shouldTreatAsSleepingServer(response)) {
      return enqueueDeferredRequest(path, safeInit);
    }
    return response;
  } catch {
    return enqueueDeferredRequest(path, safeInit);
  }
}

export function subscribeApiRecovery(listener: RecoveryListener) {
  recoveryListeners.add(listener);
  listener(currentRecoveryState());
  return () => {
    recoveryListeners.delete(listener);
  };
}

export function pingSpaces() {
  const spaces = [
    "https://albertitechnology-agent-api.hf.space",
    HF_BASE_URL,
    "https://albertitechnology-report-api.hf.space"
  ];
  spaces.forEach((space) => {
    fetch(space + "/", { method: "GET" }).catch(() => {});
  });
}
