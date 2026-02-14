import { ArrowRight } from "lucide-react";

export default function CreateNewButton({buttonTitle, onClick}) {
  return (
    <button
      className='bg-primary font-medium hover:scale-105 h-10 flex items-center text-white rounded-md transition-all duration-all cursor-pointer'
      onClick={onClick}
    >
      <p className='px-2 text-sm capitalize'>{buttonTitle}</p>

      <p className='bg-blue-900 bg-opacity-30 h-full w-10 grid place-items-center rounded-r-md'>
        <ArrowRight size={19} />
      </p>
    </button>
  );
}