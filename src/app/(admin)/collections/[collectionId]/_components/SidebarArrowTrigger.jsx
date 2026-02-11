export default function SidebarArrowTrigger({ onClick }) {
  return (
    <button
      onClick={onClick}
      className="bg-white border shadow rounded-full w-8 h-8 flex items-center justify-center hover:bg-gray-100"
    >
      {"<"}
    </button>
  );
}
