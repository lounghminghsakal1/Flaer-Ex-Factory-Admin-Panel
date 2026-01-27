export default function ButtonSplit({
  text,
  onClick,
  icon: Icon = null,
  className = "",
}) {
  return (
    <button
      onClick={onClick}
      className={`
        group inline-flex items-center overflow-hidden
        rounded-lg
        bg-blue-600
        transition-all duration-200
        hover:scale-[1.03]
        hover:bg-blue-700
        focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
        cursor-pointer
        ${className}
      `}
    >
      {/* TEXT PART */}
      <span
        className="
          px-4 py-2
          text-sm font-semibold text-white
          bg-blue-800
          transition-colors duration-200
          group-hover:bg-blue-700
        "
      >
        {text}
      </span>

      {/* ICON PART */}
      <span
        className="
          flex items-center justify-center
          px-4 py-2.5
          bg-blue-900
          transition-colors duration-200
          group-hover:bg-blue-900
        "
      >
        {Icon && <Icon className="w-4 h-4 text-white" />}
      </span>
    </button>
  );
}
