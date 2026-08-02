import { useCallback } from 'react';
import * as api from '../services/api';
import { ApiMicrografia } from '../types';
import { useAppStore } from '../store/useAppStore';
import { useReportStore } from '../store/useReportStore';
import { addMicrografiaToAutoCalibrationQueue } from '../utils/helpers';

export function useFileManagerApi(pushToast: (msg: string, type: "success" | "error" | "warning" | "info", duration: number) => void) {
  const { setUploadProgress } = useAppStore();
  const { reportConfig, setPdfHistory } = useReportStore();

  const handleCreateMuestra = useCallback(async (
    materialId: number, 
    name: string, 
    info: string, 
    file: File | null
  ) => {
    try {
      const fd = new FormData();
      fd.append('material', materialId.toString());
      fd.append('nombre', name.trim());
      
      if (file) fd.append('imagen', file);
      const response = await api.createMuestra(fd);
      if (response && response.muestra) {
        return response.muestra;
      }
      throw new Error("Invalid response");
    } catch (error) {
      pushToast("No se pudo crear la muestra.", "error", 5000);
      return null;
    }
  }, [pushToast]);

  const handleCreateRegion = useCallback(async (
    muestraId: number, 
    name: string, 
    file: File | null
  ) => {
    try {
      const fd = new FormData();
      fd.append('muestra', muestraId.toString());
      fd.append('nombre', name.trim());
      if (file) fd.append('imagen', file);
      const response = await api.createRegion(fd);
      if (response && response.region) {
        return response.region;
      }
      throw new Error("Invalid response");
    } catch (error) {
      pushToast("No se pudo crear la región.", "error", 5000);
      return null;
    }
  }, [pushToast]);

  const handleCreateMicrografias = useCallback(async (
    regionId: number, 
    files: File[], 
    enableAutocalibration: boolean,
    onSuccess: (newMicros: ApiMicrografia[]) => void
  ) => {
    setUploadProgress({ general: 0 });
    try {
      const fds = files.map((f) => {
        const data = new FormData();
        data.append("region", regionId.toString());
        data.append("nombre", f.name.replace(/\.[^.]+$/, ""));
        data.append("um_by_px", "1");
        data.append("imagen", f);
        return data;
      });

      const newMicros: ApiMicrografia[] = [];
      let i = 0;
      for (let j = 0; j < fds.length; j++) {
        const fd = fds[j];
        const response = await api.createMicrografia(fd);
        if (response && response.micrografia) {
          const mic = response.micrografia;
          newMicros.push(mic);
          if (enableAutocalibration) {
            // Need fixImageUrl if not in scope, or just mic.imagen.
            // Let's import fixImageUrl or just pass mic.imagen if the helper handles it? 
            // Wait, the helper might need normalizedUrl. Let's pass the raw file and mic.imagen.
            addMicrografiaToAutoCalibrationQueue(files[j], mic.imagen || mic.url);
          }
        }
        i++;
        setUploadProgress({ general: Math.round((i / fds.length) * 100) });
      }

      setUploadProgress(null as any);
      if (newMicros.length > 0) {
        onSuccess(newMicros);
      }
      
      return newMicros;
    } catch (error) {
      setUploadProgress(null as any);
      pushToast("Ocurrió un error al cargar las micrografías.", "error", 5000);
      return null;
    }
  }, [pushToast, setUploadProgress]);

  const handleDeleteItem = useCallback(async (
    id: string, 
    type: string,
    onSuccess: (id: string, type: string) => void
  ) => {
    try {
      if (type === "muestra") {
        await api.deleteMuestra(Number(id));
      } else if (type === "region") {
        await api.deleteRegion(Number(id));
      } else if (type === "micrografia") {
        await api.deleteMicrografia(Number(id));
      }
      onSuccess(id, type);
      pushToast(`${type.charAt(0).toUpperCase() + type.slice(1)} eliminado.`, "success", 5000);
      return true;
    } catch (error) {
      pushToast("No se pudo eliminar el elemento.", "error", 5000);
      return false;
    }
  }, [pushToast]);

  const handleRenameItem = useCallback(async (
    id: string, 
    type: string, 
    newName: string,
    onSuccess: (id: string, type: string, newName: string) => void
  ) => {
    try {
      if (type === "muestra") {
        const fd = new FormData();
        fd.append('nombre', newName.trim());
        await api.updateMuestra(Number(id), fd);
      } else if (type === "region") {
        const fd = new FormData();
        fd.append('nombre', newName.trim());
        await api.updateRegion(Number(id), fd);
      } else if (type === "micrografia") {
        const fd = new FormData();
        fd.append('nombre', newName.trim());
        await api.updateMicrografia(Number(id), fd);
      }
      onSuccess(id, type, newName);
      return true;
    } catch (error) {
      pushToast("No se pudo renombrar el elemento.", "error", 5000);
      return false;
    }
  }, [pushToast]);

  const handleGeneratePdf = useCallback(async (muestraId: string) => {
    try {
      const response = await api.generatePdf(Number(muestraId), {
        include_masks: reportConfig.include_masks,
        include_histograms: reportConfig.include_histograms,
        send_email: reportConfig.send_email,
        custom_text: reportConfig.custom_text || "",
        manual_conclusion: reportConfig.manual_conclusion || "",
      });

      if (response && response.job_id) {
        pushToast("El informe se está generando en segundo plano...", "info", 5000);

        setPdfHistory((prev) => [{
          id: response.job_id,
          muestra_id: Number(muestraId),
          value: `Informe_${muestraId}`,
          status: "processing",
          fecha: new Date().toISOString(),
          job: {
            id: response.job_id,
            status: "processing",
            progress: 0,
            stage: "Iniciando...",
          }
        }, ...prev]);
        
        return response.job_id;
      } else {
        throw new Error("No job_id returned");
      }
    } catch (error: any) {
      const msg = error?.response?.data?.error || "Error al solicitar la generación del informe.";
      pushToast(msg, "error", 5000);
      return null;
    }
  }, [reportConfig, pushToast, setPdfHistory]);

  return {
    handleCreateMuestra,
    handleCreateRegion,
    handleCreateMicrografias,
    handleDeleteItem,
    handleRenameItem,
    handleGeneratePdf,
  };
}
