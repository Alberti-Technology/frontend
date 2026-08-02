import { useCallback, useRef } from "react";
import * as api from "../services/api";
import { useDataStore } from "../store/useDataStore";
import { useAppStore } from "../store/useAppStore";
import { useCalibrationStore } from "../store/useCalibrationStore";
import { isMicrografiaDuplicateError, normalizeId } from "../utils/helpers";
import { CLOUDINARY_BASE_URL } from "../config/apiConfig";

export const useFileManagerMutations = (
  token: string | null,
  pushToast: (msg: string, tone?: 'success'|'error'|'info'|'warning') => void
) => {
  const {
    apiMuestras, setApiMuestras,
    apiMateriales, setApiMateriales,
    apiRegiones, setApiRegiones,
    apiMicrografias, setApiMicrografias,
    setExpandedIds, setSelectedId
  } = useDataStore.getState();

  const {
    setDeleteModal,
    setRenameModal,
    setRenameModalError,
    setCreateModal,
    setUploadProgress
  } = useAppStore.getState();

  const {
    setCalibrationData,
    setCalibratingByUrl,
    setFailedCalibrationByUrl,
    setLastMicrometers
  } = useCalibrationStore.getState();

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Implement the API handlers here...
  // Since we have global state, we can just use the state directly.

  return {
    fileInputRef,
    // Add handlers...
  };
};
