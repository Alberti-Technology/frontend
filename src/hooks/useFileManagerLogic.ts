import { useState, useCallback, useEffect, useRef } from 'react';
import * as api from '../services/api';
import { useAppStore } from '../store/useAppStore';
import { useDataStore } from '../store/useDataStore';
import { ApiLikeError, fixImageUrl, isMicrografiaDuplicateError, addMicrografiaToAutoCalibrationQueue } from '../utils/helpers';
import { ToastNotification, ApiMuestra, ApiRegion, ApiMicrografia } from '../types';

export function useFileManagerLogic() {
  const [token] = useState<string | null>(
    typeof window !== "undefined" ? localStorage.getItem("access_token") : null,
  );
  
  const [toastNotifications, setToastNotifications] = useState<ToastNotification[]>([]);
  const { uploadProgress, setUploadProgress, setCompanyEnabled, createModal, setCreateModal, setDeleteModal, setRenameModal, setRenameModalError } = useAppStore();
  const { setApiMuestras, setApiMateriales, setApiRegiones, setApiMicrografias, setIsLoading } = useDataStore();

  const toastTimeoutsRef = useRef<NodeJS.Timeout[]>([]);
  const toastIdRef = useRef(0);
  const MAX_VISIBLE_TOASTS = 3;

  const removeToast = useCallback((id: number) => {
    setToastNotifications((prev) =>
      prev.map((t) => (t.id === id ? { ...t, leaving: true } : t)),
    );
    const timeout = setTimeout(() => {
      setToastNotifications((prev) => prev.filter((t) => t.id !== id));
    }, 260);
    toastTimeoutsRef.current.push(timeout);
  }, []);

  const pushToast = useCallback(
    (
      message: string,
      tone: "error" | "info" | "success" | "warning" = "error",
      dismissDelayMs = 7200,
    ) => {
      const id = ++toastIdRef.current;
      const titleByTone = {
        success: "Correcto",
        error: "Error",
        info: "Información",
        warning: "Advertencia",
      } as const;
      const nextToast: ToastNotification = {
        id,
        title: titleByTone[tone],
        message,
        tone,
        durationMs: dismissDelayMs,
        leaving: false,
      };
      setToastNotifications((prev) => {
        const active = prev.filter((t) => !t.leaving);
        return [...active, nextToast].slice(-MAX_VISIBLE_TOASTS);
      });
      const timeout = setTimeout(() => removeToast(id), dismissDelayMs);
      toastTimeoutsRef.current.push(timeout);
      return id;
    },
    [removeToast],
  );

  const fetchAll = useCallback(async () => {
    if (!token) return;
    setIsLoading(true);
    try {
      const [m, mats, r, img, companyStatus] = await Promise.all([
        api.getMuestras(),
        api.getMateriales(),
        api.getRegiones(),
        api.getMicrografias(),
        api.getCompanyStatus(),
      ]);

      if (companyStatus) { setCompanyEnabled(companyStatus === true || (companyStatus as any)?.enabled === true || (companyStatus as any)?.enabled === "true"); }

      setApiMuestras(m);
      setApiMateriales(mats);
      setApiRegiones(r);
      
      setApiMicrografias(img);
      
      return { m, mats, r, img, companyStatus };
    } catch (e: any) {
      if (e.message !== "Company is disabled") console.error("Fetch all failed:", e);
    } finally {
      setIsLoading(false);
    }
  }, [token, setCompanyEnabled, setApiMuestras, setApiMateriales, setApiRegiones, setApiMicrografias, setIsLoading]);

  const handleCreate = async (fds: FormData[]) => {
    const currentCreateModal = createModal;
    try {
      setCreateModal(null);
      if (currentCreateModal?.type === "micrografia" && fds.length > 1) {
        setUploadProgress({ current: 0, total: fds.length });
        let errors = 0;
        let duplicateErrors = 0;
        for (let i = 0; i < fds.length; i++) {
          setUploadProgress({ current: i + 1, total: fds.length });
          try {
            const apiRes = await api.createMicrografia(fds[i]);
            const rawFile = fds[i].get("imagen");
            const normalizedUrl = fixImageUrl(apiRes?.imagen);
            if (rawFile instanceof Blob && normalizedUrl) {
              const regionId = String(fds[i].get("region") || "");
              if (regionId) addMicrografiaToAutoCalibrationQueue(rawFile, normalizedUrl);
            }
          } catch (e) {
            errors++;
            if (isMicrografiaDuplicateError(e as ApiLikeError)) {
              duplicateErrors++;
              pushToast(`No se pudo crear: ya existe en la región seleccionada.`, "error", 8500);
            }
          }
        }
        setUploadProgress({});
        if (errors > 0 && duplicateErrors !== errors) pushToast(`${errors} fallaron al subir.`, "warning", 9000);
        else if (errors === 0) pushToast(`Añadidas correctamente.`, "success", 4200);
      } else {
        const fd = fds[0];
        if (currentCreateModal?.type === "material") await api.createMaterial(fd);
        else if (currentCreateModal?.type === "muestra") await api.createMuestra(fd);
        else if (currentCreateModal?.type === "region") await api.createRegion(fd);
        else if (currentCreateModal?.type === "micrografia") await api.createMicrografia(fd);
        pushToast("Elemento creado correctamente.", "success", 4200);
      }
      await fetchAll();
    } catch (e) {
      console.error(e);
      pushToast("Error inesperado en la creación. Revisa los datos.", "error", 5000);
    }
  };

  const getApiId = (id: string) => (id || "").replace(/^(mat|mue|reg|mic)_/, "");

  const handleDelete = async (id: string, type: string) => {
    try {
      const apiId = getApiId(id);
      if (type === "muestra") await api.deleteMuestra(apiId);
      else if (type === "region") await api.deleteRegion(apiId);
      else if (type === "micrografia") await api.deleteMicrografia(apiId);
      
      setDeleteModal(null);
      pushToast("Elemento eliminado correctamente.", "success");
      await fetchAll();
    } catch (e) {
      console.error(e);
      pushToast("No se pudo eliminar el elemento.", "error", 5000);
    }
  };

  const handleRename = async (id: string, type: string, newName: string) => {
    if (!newName.trim()) {
      setRenameModalError("El nombre es requerido.");
      return;
    }
    setRenameModalError(null);
    try {
      const fd = new FormData();
      fd.append("nombre", newName.trim());
      
      const apiId = getApiId(id);
      if (type === "muestra") await api.updateMuestra(apiId, fd);
      else if (type === "region") await api.updateRegion(apiId, fd);
      else if (type === "micrografia") await api.updateMicrografia(apiId, fd);
      
      setRenameModal(null);
      pushToast("Elemento renombrado correctamente.", "success");
      await fetchAll();
    } catch (e) {
      console.error(e);
      pushToast("No se pudo renombrar el elemento.", "error", 5000);
    }
  };

  return { token, toastNotifications, pushToast, removeToast, fetchAll, handleCreate, handleDelete, handleRename };
}
