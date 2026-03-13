import { X } from "lucide-react";

export default function ShipmentCancelModal({ isOpen, onClose, onCancel, rejection_reason, setRejection_reason }) {

  const isValid = rejection_reason.trim().length >= 10;
  const charsLeft = 10 - rejection_reason.trim().length;

  const handleReject = () => {
    if (!isValid) return;
    onCancel(rejection_reason);
    onClose();
    setRejection_reason("");
  };

  const handleClose = () => {
    setRejection_reason("");
    onClose();
  };

  if (!isOpen) return null;

  return (
    <>
      <div
        className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm transition-opacity"
        onClick={handleClose}
      />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="relative w-full max-w-lg rounded-2xl bg-white shadow-2xl">
          <button
            onClick={handleClose}
            className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="px-8 pb-6 pt-8">
            <h2 className="mb-6 text-center text-xl font-semibold text-gray-900">
              Why are you Cancelling this shipment?
            </h2>

            <div className="relative">
              <textarea
                value={rejection_reason}
                onChange={(e) => setRejection_reason(e.target.value)}
                placeholder="Write a minimum of 10 characters to enable cancellation"
                rows={5}
                className="w-full resize-none rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-800 outline-none transition-all placeholder:text-gray-400 focus:border-gray-400 focus:bg-white focus:ring-2 focus:ring-gray-200"
              />
              {!isValid && rejection_reason.length > 0 && (
                <p className="mt-1.5 text-right text-xs text-amber-600">
                  {charsLeft} more character{charsLeft !== 1 ? "s" : ""} needed
                </p>
              )}
              {isValid && (
                <p className="mt-1.5 text-right text-xs text-green-600">✓ Ready to submit</p>
              )}
            </div>
          </div>

          <div className="flex gap-3 border-t border-gray-100 px-8 py-5">
            <button
              onClick={handleClose}
              className="flex-1 rounded-xl bg-gray-900 px-6 py-3 text-sm font-semibold text-white transition-all cursor-pointer hover:bg-gray-700 active:scale-[0.98]"
            >
              Go Back
            </button>
            <button
              onClick={handleReject}
              disabled={!isValid}
              className={`flex-1 rounded-xl px-6 py-3 text-sm font-semibold transition-all active:scale-[0.98] cursor-pointer ${isValid
                ? "bg-red-500 text-white hover:bg-red-600"
                : "cursor-not-allowed bg-gray-200 text-gray-400"
                }`}
            >
              Confirm Cancel
            </button>
          </div>
        </div>
      </div>
    </>
  );
}