"use client";

import { useState } from "react";
import { ConfirmContext } from "../hooks/context/ConfirmContext";

export default function ConfirmProvider({ children }) {
  const [confirmState, setConfirmState] = useState({
    open: false,
    message: "",
    resolve: null
  });

  const confirm = (message) => {
    return new Promise((resolve) => {
      setConfirmState({
        open: true,
        message,
        resolve
      });
    });
  };

  const handleOk = () => {
    confirmState.resolve?.(true);
    setConfirmState({ open: false, message: "", resolve: null });
  };

  const handleCancel = () => {
    confirmState.resolve?.(false);
    setConfirmState({ open: false, message: "", resolve: null });
  };

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}

      {/* GLOBAL MODAL */}
      {confirmState.open && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999]">
          <div className="bg-white rounded-md shadow-xl w-full max-w-md p-6 animate-scale-in">
            <h2 className="text-lg font-semibold text-gray-900">
              Confirmation
            </h2>

            <p className="mt-3 text-sm text-gray-600 whitespace-pre-line">
              {confirmState.message}
            </p>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={handleCancel}
                className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-100"
              >
                Cancel
              </button>

              <button
                onClick={handleOk}
                className="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700"
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}
    </ConfirmContext.Provider>
  );
}
