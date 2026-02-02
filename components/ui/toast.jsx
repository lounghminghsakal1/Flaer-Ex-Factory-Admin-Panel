import toast from "react-hot-toast";

const baseStyle = {
  borderRadius: "12px",
  padding: "14px 16px",
  fontSize: "14px",
  fontWeight: "500",
};

/* ✅ Success */
export const successToast = (message) => {
  toast.success(message, {
    icon: "✅",
    style: {
      ...baseStyle,
      background: "#ECFDF5",
      color: "#065F46",
      border: "1px solid #A7F3D0",
    },
  });
};

/* ❌ Error */
export const errorToast = (message) => {
  toast.error(message, {
    icon: "❌",
    style: {
      ...baseStyle,
      background: "#FEF2F2",
      color: "#991B1B",
      border: "1px solid #FCA5A5",
    },
  });
};
