import { createPortal } from "react-dom";
import { ConfirmModal, RenameModal, CreateModal } from "./FileManager/SubComponents";

interface FileManagerModalsProps {
  deleteModal: { id: string; type: string; name: string } | null;
  setDeleteModal: (val: any) => void;
  handleDelete: (id: string, type: string) => void;

  renameModal: { id: string; type: string; name: string } | null;
  setRenameModal: (val: any) => void;
  handleRename: (id: string, type: string, newName: string) => void;
  renameModalError: string | null;
  setRenameModalError: (val: string | null) => void;

  createModal: { type: "material" | "muestra" | "region" | "micrografia"; parentId?: string | number | null } | null;
  setCreateModal: (val: any) => void;
  handleCreate: (fds: FormData[]) => void;

  showDisabledCompanyModal: boolean;
  setShowDisabledCompanyModal: (val: boolean) => void;
}

export function FileManagerModals({
  deleteModal,
  setDeleteModal,
  handleDelete,

  renameModal,
  setRenameModal,
  handleRename,
  renameModalError,
  setRenameModalError,

  createModal,
  setCreateModal,
  handleCreate,

  showDisabledCompanyModal,
  setShowDisabledCompanyModal
}: FileManagerModalsProps) {
  if (typeof document === "undefined") return null;

  return (
    <>
      {deleteModal &&
        createPortal(
          <ConfirmModal
            title="Eliminar elemento"
            message={`¿Estás seguro de que deseas eliminar "${deleteModal.name}"? ${deleteModal.type === "muestra" || deleteModal.type === "region" ? "Todos los elementos internos se eliminarán también." : ""}`}
            confirmLabel="Eliminar"
            confirmColor="#e53e3e"
            onConfirm={() => handleDelete(deleteModal.id, deleteModal.type)}
            onCancel={() => setDeleteModal(null)}
          />,
          document.body,
        )}
      
      {renameModal &&
        createPortal(
          <RenameModal
            currentName={renameModal.name}
            onConfirm={(n) => handleRename(renameModal.id, renameModal.type, n)}
            errorMessage={renameModalError}
            onInputChange={() => setRenameModalError(null)}
            onCancel={() => {
              setRenameModal(null);
              setRenameModalError(null);
            }}
          />,
          document.body,
        )}
      
      {createModal &&
        createPortal(
          <CreateModal
            parentId={createModal.parentId!}
            type={createModal.type}
            onConfirm={handleCreate}
            onCancel={() => setCreateModal(null)}
          />,
          document.body,
        )}

      {showDisabledCompanyModal &&
        createPortal(
          <div className="fixed inset-0 z-[9999] flex items-center justify-center">
            <div className="absolute inset-0 bg-[#10243f66] backdrop-blur-sm" />
            <div className="relative bg-white rounded-[28px] shadow-xl border border-[#10243f14] max-w-md w-[90%] overflow-hidden text-center p-8">
              <div className="w-16 h-16 rounded-full bg-red-50 text-red-600 flex items-center justify-center mx-auto mb-6">
                <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"></circle>
                  <line x1="12" y1="8" x2="12" y2="12"></line>
                  <line x1="12" y1="16" x2="12.01" y2="16"></line>
                </svg>
              </div>
              <h2 className="m-0 mb-4 text-[#10243f] text-2xl font-bold">
                Compañía en Revisión
              </h2>
              <p className="m-0 mb-6 text-[#4d6684] leading-relaxed">
                Tu compañía aún no está habilitada. Debes cargar al menos <strong>20 micrografías</strong> ordenadas como quieras (materiales, muestras, regiones) y luego esperar la habilitación manual de los administradores.
              </p>
              <button
                onClick={() => setShowDisabledCompanyModal(false)}
                className="px-8 py-3 rounded-xl bg-[#10243f] text-white font-semibold text-base cursor-pointer transition-opacity hover:opacity-90 border-none w-full"
              >
                Entendido
              </button>
            </div>
          </div>,
          document.body
        )}
    </>
  );
}
