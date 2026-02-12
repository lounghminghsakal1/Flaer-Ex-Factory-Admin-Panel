"use server";
import { Plus } from "lucide-react";

export default async function PageHeaderWithActionButton({ title = "Page Title", actionButtontitle = "Action Button", actionButtonOnclickFunction = null, Icon=Plus }) {
  return (
    <div className="flex justify-between items-center">
      <div>
        <h1 className="text-2xl text-blue-800 font-semibold">{title}</h1>
      </div>
      <div>
        <button className="flex gap-1 items-center bg-blue-800 text-lg text-gray-100 px-4 py-2 rounded-lg cursor-pointer hover:bg-blue-700 hover:scale-105 transition-all duration-200 ease-in-out" onClick={actionButtonOnclickFunction}><Icon />  <p>{actionButtontitle}</p></button>
      </div>
    </div>
  );
}