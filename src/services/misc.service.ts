import { getHeaders, apiFetchWithAuth } from "./auth.service";

export async function getCompanyStatus(): Promise<boolean> {
  try {
    const res = await apiFetchWithAuth("member/company/status/", {
      headers: getHeaders(),
    });
    if (res.ok) {
      const data = await res.json();
      return data.is_enabled;
    }
  } catch (e) {
    console.error(e);
  }
  return true;
}
