import { apiFetch, pingSpaces } from "./apiClient";

export function getHeaders(isFormData = false): HeadersInit {
  const token = localStorage.getItem("access_token");
  const headers: HeadersInit = {};
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  if (!isFormData) {
    headers["Content-Type"] = "application/json";
  }
  
  // Header requerido por Ngrok gratuito para no devolver su página HTML de advertencia (que detona fallos de CORS)
  headers["ngrok-skip-browser-warning"] = "true";
  
  return headers;
}

export async function login(user: string, pass: string): Promise<string> {
  try {
    const res = await apiFetch("member/login/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: user, password: pass }),
    });

    if (res.ok) {
      const data = await res.json();
      const token = data.access || data.token;
      if (token) {
        localStorage.setItem("access_token", token);
        localStorage.setItem("refresh_token", data.refresh || "");
        localStorage.setItem("user_id", data.user_id?.toString() || "");
        localStorage.setItem("username", data.username || user);
        
        const firstName = data.first_name?.trim() || "";
        const lastName = data.last_name?.trim() || "";
        let fullName = `${firstName} ${lastName}`.trim();
        if (!fullName) fullName = data.username || user;
        localStorage.setItem("user_fullname", fullName);
        
        localStorage.setItem("company_enabled", data.company_enabled ? "true" : "false");
        pingSpaces();
        return token;
      }
    }

    // Manejar errores específicos del servidor
    if (res.status === 423) {
      document.body.innerHTML = '<div style="background:#b42318;color:white;font-family:sans-serif;height:100vh;display:flex;align-items:center;justify-content:center;text-align:center;padding:2rem;"><div><h1 style="font-size:3rem;margin-bottom:1rem">ACCESO BLOQUEADO</h1><p style="font-size:1.2rem">Se ha detectado un intento de inicio de sesión sospechoso o desde otro dispositivo no autorizado.<br/><br/>Por razones de seguridad, esta aplicación ha sido bloqueada. Contactá al administrador.</p></div></div>';
      return "";
    }

    if (res.status === 403) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error || "Tu cuenta ha sido desactivada");
    }

    throw new Error("Credenciales inválidas");
  } catch (err) {
    console.error("Error en login:", err);
    throw err;
  }
}

export function logout() {
  const refreshToken = localStorage.getItem("refresh_token");
  if (refreshToken) {
    apiFetch("member/logout/", {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify({ refresh: refreshToken }),
    }).catch(() => {});
  }

  localStorage.removeItem("access_token");
  localStorage.removeItem("refresh_token");
  localStorage.removeItem("token");        // limpieza legacy
  localStorage.removeItem("user_id");
  localStorage.removeItem("username");
  localStorage.removeItem("metalurgia_user");
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("auth_logout"));
  }
}

/**
 * Wrapper de apiFetch que cierra sesión si recibe un 401.
 */
export async function apiFetchWithAuth(path: string, init?: RequestInit): Promise<Response> {
  const res = await apiFetch(path, init);

  if (res.status === 401) {
    logout();
  }

  return res;
}
