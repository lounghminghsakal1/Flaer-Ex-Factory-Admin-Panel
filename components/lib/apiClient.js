import { toast } from "react-toastify";

const BASE_URL = `${process.env.NEXT_PUBLIC_BASE_URL}`;

export async function apiFetch(endpoint) {
  try {
    const response = await fetch(`${BASE_URL}${endpoint}`);
    const result = await response.json();
    if (!response.ok || result?.status === "failure") throw new Error(result?.errors[0] ?? "Something went wrong");
    
  } catch(err) {
    console.log(err);
    toast.error("Failed to fetch: "+err);
  }
}