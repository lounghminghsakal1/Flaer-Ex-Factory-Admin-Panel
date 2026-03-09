"use client";

import { useParams } from "next/navigation";
import OrderDetails from "./_components/OrderDetails";
import OrdersSidebar from "./_components/OrdersSidebar";
import HeaderWithBack from "../../../../../components/shared/HeaderWithBack";

export default function OrderDetailsPage() {
  const params = useParams();
  const orderId = params.orderId;

  return (
    <div className="">
      <HeaderWithBack title="Order Details" defaultBackPath="/orders" />
      <div className="flex h-[calc(100vh-56px)] overflow-hidden">
        {/* ── Sidebar ── */}
        <OrdersSidebar activeOrderId={orderId} />

        {/* ── Main content ── */}
        <main className="flex-1 overflow-y-auto px-4 py-4">
          <OrderDetails orderId={orderId} />
        </main>
      </div>
    </div>
  );
}