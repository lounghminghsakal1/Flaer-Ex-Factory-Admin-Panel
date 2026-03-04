"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter, useSearchParams, usePathname } from "next/navigation";
import "react-toastify/dist/ReactToastify.css";

import CustomerSidebar from "./_components/CustomerSidebar";
import CustomerInfoTab from "./_components/CustomerInfoTab";
import HeaderWithBack from "../../../../../components/shared/HeaderWithBack";
import { toast } from "react-toastify";
import useOnlineCheck from "../../../../../components/hooks/useOnlineCheck";
import AddToCart from "./_components/AddToCart";
import CheckoutForm from "./_components/CheckoutForm";

const TABS = [
  { key: "info", label: "Customer Info" },
  { key: "place-order", label: "Place Order" },
];

export default function CustomerDetailPage() {
  const params = useParams();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [cartData, setCartData] = useState(null);
  const [loadingCart, setLoadingCart] = useState(true);

  const custId = params?.custId ?? params?.id;

  const activeTab = searchParams.get("tab") || "info";

  const [customersData, setCustomersData] = useState([]);
  const [appliedCoupons, setAppliedCoupons] = useState([]);

  const isOnline = useOnlineCheck();

  useEffect(() => {
    getCustomersData();
  }, []);

  function setActiveTab(tabKey) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", tabKey);
    router.push(`${pathname}?${params.toString()}`);
  }

  async function getCustomersData() {
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BASE_URL}/admin/api/v1/customers`
      );
      const json = await res.json();
      if (!res.ok || json.status === "failure") throw new Error(json?.errors[0] ?? "Something went wrong");
      setCustomersData(json.data ?? []);
    } catch (err) {
      console.log(err);
      toast.error("Failed to fetch customers data " + err.message);
      if (!isOnline) toast.error("Seems like your internet is off, check your internet connection");
    }
  }

  // ── Fetch cart ────
  const fetchCart = async () => {
    setLoadingCart(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/admin/api/v1/sales/carts/cart_summary?customer_id=${custId}`);
      const json = await res.json();
      if (!res.ok || json.status === "failure") throw new Error(json?.errors[0] ?? "Soemthing went wrong");
      setCartData(json.data || null);
      setAppliedCoupons(json?.data?.applied_coupons ?? []);
    } catch (err) {
      setCartData(null);
      toast.error("Failed to fetch cart data " + err)
    } finally {
      setLoadingCart(false);
    }
  };

  useEffect(() => {
    fetchCart();
  }, []);

  return (
    <div>
      <HeaderWithBack title="Customer Details" defaultBackPath="/customers" />
      <div className="flex min-h-screen bg-gray-50">

        {/* Fixed Left Sidebar */}
        <CustomerSidebar custId={custId} />

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto">

          {/* Fixed Top Bar: Tabs */}
          <div className="sticky top-0 z-20 bg-gray-50 px-5 border-b border-gray-300">
            <div className="flex items-center justify-between gap-4">

              <div className="flex items-end gap-1 flex-1 pt-3">
                {TABS.map((tab) => (
                  <button
                    key={tab.key}
                    type="button"
                    onClick={() => setActiveTab(tab.key)}
                    className={`relative px-5 py-2 text-[13.5px] font-medium transition-all whitespace-nowrap -mb-px
                      rounded-t-lg
                      ${activeTab === tab.key
                        ? "bg-primary text-white border border-b-0 border-primary shadow-sm"
                        : "bg-gray-200/60 text-gray-500 border border-transparent hover:text-gray-700 hover:bg-gray-300/60"
                      }
                      cursor-pointer`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

            </div>
          </div>

          {/* Tab Content */}
          <div className="px-5 py-4">
            {activeTab === "info" && (
              <CustomerInfoTab custId={custId} />
            )}
            {activeTab === "place-order" && (
              <AddToCart customerId={custId} cartData={cartData} fetchCart={fetchCart} loadingCart={loadingCart} setCartData={setCartData} appliedCoupons={appliedCoupons} />
            )}
          </div>
        </main>
      </div>
    </div>
  );
}