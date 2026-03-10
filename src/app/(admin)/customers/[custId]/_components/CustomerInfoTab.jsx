import { useEffect, useState } from "react";
import { Mail, Phone, MapPin, Calendar, User, Globe, Bell, ShieldCheck, ShieldOff, Clock, Hash } from "lucide-react";
import { toast } from "react-toastify";

const MOCK = {
  id: 2, code: "EXCUS10002", name: "sainathreddy", email: null,
  mobile_number: "7093620019", status: "active", verified: false,
  dob: null, notifications_allowed: true, preferred_language: null,
  gender: null, pincode: null, meta: {},
  created_at: "2026-03-02T16:32:26.332+05:30",
  updated_at: "2026-03-02T16:32:26.332+05:30"
};

const fmt = (val) => (val != null && val !== "" ? val : "—");
const fmtDate = (iso) => iso ? new Date(iso).toLocaleString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "—";
const initials = (name) => name ? name.slice(0, 2).toUpperCase() : "??";

const InfoRow = ({ icon: Icon, label, value, children }) => (
  <div className="flex items-start gap-3 py-2.5 border-b border-gray-100 last:border-0">
    {Icon && <Icon className="w-3.5 h-3.5 text-gray-400 mt-0.5 flex-shrink-0" />}
    <div className="flex-1 min-w-0">
      <p className="text-[11px] text-gray-400 uppercase tracking-wider font-medium">{label}</p>
      {children ?? <p className="text-sm text-gray-800 mt-0.5 truncate">{fmt(value)}</p>}
    </div>
  </div>
);

const Card = ({ title, children }) => (
  <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
    <p className="text-[11px] font-bold uppercase tracking-widest text-gray-400 px-4 py-2.5 border-b border-gray-100 bg-gray-100">{title}</p>
    <div className="px-4">{children}</div>
  </div>
);

const StatusBadge = ({ active, trueLabel, falseLabel }) => (
  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold border ${active ? "bg-green-50 text-green-700 border-green-200" : "bg-red-50 text-red-600 border-red-200"}`}>
    <span className={`w-1.5 h-1.5 rounded-full ${active ? "bg-green-500" : "bg-red-400"}`} />
    {active ? trueLabel : falseLabel}
  </span>
);

export default function CustomerInfoTab({ custId }) {
  const [customerData, setcustomerData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCustomerData();
  }, [custId]);

  const fetchCustomerData = async () => {
    try {
      setLoading(true);
      const url = `${process.env.NEXT_PUBLIC_BASE_URL}/admin/api/v1/customers/${custId}`;
      const response = await fetch(url);
      const result = await response.json();
      if (!response.ok || result?.status === "failure") throw new Error(result?.errors[0] ?? "Something went wrong");
      setcustomerData(result?.data);
    } catch(err) {
      console.log(err);
      toast.error("Failed to fetch customer data "+err.message);
    } finally {
      setLoading(false);
    }
  }

  if (loading) return <div className="py-16 text-center text-sm text-gray-400">Loading...</div>;
  if (!customerData) return <div className="py-16 text-center text-sm text-gray-400">No customerData found.</div>;

  return (
    <div className="space-y-3 py-3">

      {/* Profile strip */}
      <div className="bg-white rounded-xl border border-gray-100 p-4 flex items-center gap-3">
        {/* <div className="w-10 h-10 rounded-lg bg-blue-900 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
          {initials(customerData.name)}
        </div> */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-gray-900 capitalize">{customerData.name}</p>
          <p className="text-xs text-gray-400 font-mono">{customerData.code}</p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <StatusBadge active={customerData.status === "active"} trueLabel="Active" falseLabel="Inactive" />
          <StatusBadge active={customerData.verified} trueLabel="Verified" falseLabel="Unverified" />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">

        {/* Contact */}
        <Card title="Contact">
          <InfoRow icon={Mail} label="Email" value={customerData.email} />
          <InfoRow icon={Phone} label="Mobile" value={customerData.mobile_number} />
          <InfoRow icon={MapPin} label="Pincode" value={customerData.pincode} />
        </Card>

        {/* Personal */}
        <Card title="Personal">
          <InfoRow icon={Calendar} label="Date of Birth" value={customerData.dob} />
          <InfoRow icon={User} label="Gender" value={customerData.gender} />
          <InfoRow icon={Globe} label="Preferred Language" value={customerData.preferred_language} />
        </Card>

        {/* Preferences */}
        <Card title="Preferences">
          <InfoRow icon={Bell} label="Notifications">
            <div className="mt-0.5">
              <StatusBadge active={customerData.notifications_allowed} trueLabel="Allowed" falseLabel="Disabled" />
            </div>
          </InfoRow>
          <InfoRow icon={customerData.verified ? ShieldCheck : ShieldOff} label="Verification">
            <div className="mt-0.5">
              <StatusBadge active={customerData.verified} trueLabel="Verified" falseLabel="Not Verified" />
            </div>
          </InfoRow>
        </Card>

        {/* Meta */}
        <Card title="System">
          <InfoRow icon={Hash} label="Customer ID" value={`#${customerData.id}`} />
          <InfoRow icon={Clock} label="Created" value={fmtDate(customerData.created_at)} />
          <InfoRow icon={Clock} label="Updated" value={fmtDate(customerData.updated_at)} />
        </Card>

      </div>
    </div>
  );
}