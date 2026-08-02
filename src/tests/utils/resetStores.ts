import { useAppStore } from '../../store/useAppStore';
import { useCalibrationStore } from '../../store/useCalibrationStore';
import { useCanvasStore } from '../../store/useCanvasStore';
import { useDataStore } from '../../store/useDataStore';
import { useMeasurementStore } from '../../store/useMeasurementStore';
import { useReportStore } from '../../store/useReportStore';

// Guardamos el estado inicial de cada store en memoria
const initialApp = useAppStore.getState();
const initialCalibration = useCalibrationStore.getState();
const initialCanvas = useCanvasStore.getState();
const initialData = useDataStore.getState();
const initialMeasurement = useMeasurementStore.getState();
const initialReport = useReportStore.getState();

export const resetAllStores = () => {
  useAppStore.setState(initialApp, true);
  useCalibrationStore.setState(initialCalibration, true);
  useCanvasStore.setState(initialCanvas, true);
  useDataStore.setState(initialData, true);
  useMeasurementStore.setState(initialMeasurement, true);
  useReportStore.setState(initialReport, true);
};
