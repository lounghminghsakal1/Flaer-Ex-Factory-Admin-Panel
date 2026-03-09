"use client";

import { useEffect,useState } from "react";
import TaxForm from "../_components/TaxForm";
import { useParams } from "next/navigation";
import { toast } from "react-toastify";

export default function TaxPage() {
  const params = useParams();
  const taxId = params.taxId;

  const [taxData, setTaxData] = useState(null);
  const [loading, setLoading] = useState(false);
  
  useEffect(() => {
    fetchTaxData();
  },[taxId]);
  
  const fetchTaxData = async () => {
    try {
      setLoading(true);
      const url = `${process.env.NEXT_PUBLIC_BASE_URL}/admin/api/v1/tax_types/${taxId}`;
      const response = await fetch(url);
      const result = await response.json();
      if (!response.ok || result?.status === "failure") throw new Error(result?.errors[0] ?? "Something went wrong");
      setTaxData(result?.data);
    } catch (err) {
      console.log(err);
      toast.error("Failed to fetch tax data, " + err.message);
    } finally {
      setLoading(false);
    }
  }
  return (
    <TaxForm taxId={taxId} taxData={taxData} />
  );
}