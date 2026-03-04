"use client";
import { useState } from "react";
import { AlertTriangle } from "lucide-react";

/**
 * Usage:
 *   const [confirmState, setConfirmState] = useState({ open: false, message: "", onConfirm: null });
 *
 *   // To trigger:
 *   const confirmed = await new Promise((resolve) => {
 *     setConfirmState({ open: true, message: "Remove this image?", onConfirm: resolve });
 *   });
 *   if (!confirmed) return;
 *
 *   <ConfirmModal
 *     open={confirmState.open}
 *     message={confirmState.message}
 *     onConfirm={() => { setConfirmState({ open: false, message: "", onConfirm: null }); confirmState.onConfirm(true); }}
 *     onCancel={() => { setConfirmState({ open: false, message: "", onConfirm: null }); confirmState.onConfirm(false); }}
 *   />
 */

export default function ConfirmModal({
  open,
  title = "Are you sure?",
  message = "This action cannot be undone.",
  confirmLabel = "Remove",
  cancelLabel = "Cancel",
  variant = "danger", // "danger" | "warning"
  onConfirm,
  onCancel,
}) {
  if (!open) return null;

  const isDanger = variant === "danger";

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"
        onClick={onCancel}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-[40%] max-w-sm p-6 flex flex-col items-center gap-4 animate-in">
        {/* Icon */}
        <div
          className={`w-14 h-14 rounded-full flex items-center justify-center ${
            isDanger ? "bg-red-50" : "bg-amber-50"
          }`}
        >
          <AlertTriangle
            size={26}
            className={isDanger ? "text-red-500" : "text-amber-500"}
          />
        </div>

        {/* Text */}
        <div className="text-center space-y-1">
          <h3 className="text-base font-semibold text-gray-900">{title}</h3>
          <p className="text-sm text-gray-500">{message}</p>
        </div>

        {/* Actions */}
        <div className="flex gap-3 w-full pt-1">
          <button
            onClick={onCancel}
            className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-medium cursor-pointer text-gray-600 hover:bg-gray-50 transition-colors"
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            className={`flex-1 py-2.5 rounded-xl text-sm font-semibold text-white cursor-pointer transition-colors ${
              isDanger
                ? "bg-red-500 hover:bg-red-600"
                : "bg-amber-500 hover:bg-amber-600"
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * Hook to use confirm modal imperatively
 * 
 * Usage:
 *   const { confirmModal, askConfirm } = useConfirmModal();
 * 
 *   // In JSX: {confirmModal}
 *   // To confirm: const ok = await askConfirm({ message: "Remove this?" });
 */
export function useConfirmModal() {
  const [state, setState] = useState({
    open: false,
    title: "",
    message: "",
    confirmLabel: "Remove",
    cancelLabel: "Cancel",
    variant: "danger",
    resolve: null,
  });

  const askConfirm = ({ title, message, confirmLabel, cancelLabel, variant } = {}) => {
    return new Promise((resolve) => {
      setState({
        open: true,
        title: title ?? "Are you sure?",
        message: message ?? "This action cannot be undone.",
        confirmLabel: confirmLabel ?? "Remove",
        cancelLabel: cancelLabel ?? "Cancel",
        variant: variant ?? "danger",
        resolve,
      });
    });
  };

  const handleConfirm = () => {
    state.resolve?.(true);
    setState((s) => ({ ...s, open: false, resolve: null }));
  };

  const handleCancel = () => {
    state.resolve?.(false);
    setState((s) => ({ ...s, open: false, resolve: null }));
  };

  const confirmModal = (
    <ConfirmModal
      open={state.open}
      title={state.title}
      message={state.message}
      confirmLabel={state.confirmLabel}
      cancelLabel={state.cancelLabel}
      variant={state.variant}
      onConfirm={handleConfirm}
      onCancel={handleCancel}
    />
  );

  return { confirmModal, askConfirm };
}