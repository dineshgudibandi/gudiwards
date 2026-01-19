import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";

import { FaCoins } from "react-icons/fa";

const supabase = createClient(
    "https://geyojtdfqnlgryzyiqbz.supabase.co",
    "sb_publishable_kOv2CGDktM1N5azSH4M97g_XHfUiODV"
);

/* ===================== APP ===================== */

export default function App() {
    const isAdmin = new URLSearchParams(window.location.search).has("admin");

    const [role, setRole] = useState(isAdmin ? "parent" : "kid");
    const [kids, setKids] = useState([]);
    const [selectedKid, setSelectedKid] = useState(null);

    useEffect(() => {
        loadKids();
    }, []);

    async function loadKids() {
        const { data } = await supabase.from("kids").select("*");
        setKids(data || []);
        if (!selectedKid && data?.length) setSelectedKid(data[0]);
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-100 via-purple-100 to-pink-100 p-6">
            <div className="max-w-3xl mx-auto">
                <header className="flex justify-between items-center mb-8">
                    <h1 className="text-3xl font-extrabold text-indigo-700">Gudiwards</h1>

                    <div className="flex bg-white rounded-full shadow overflow-hidden">
                        {isAdmin && (
                            <button
                                className={`px-4 py-2 font-semibold ${
                                    role === "parent"
                                        ? "bg-indigo-600 text-white"
                                        : "text-indigo-600"
                                }`}
                                onClick={() => setRole("parent")}
                            >
                                Parent
                            </button>
                        )}
                        <button
                            className={`px-4 py-2 font-semibold ${
                                role === "kid"
                                    ? "bg-pink-500 text-white"
                                    : "text-pink-600"
                            }`}
                            onClick={() => setRole("kid")}
                        >
                            Kids
                        </button>
                    </div>
                </header>

                {role === "parent" ? (
                    <ParentDashboard />
                ) : selectedKid ? (
                    <>
                        <div className="mb-6 flex gap-2 overflow-x-auto">
                            {kids.map(k => (
                                <button
                                    key={k.id}
                                    onClick={() => setSelectedKid(k)}
                                    className={`px-4 py-2 rounded-full font-semibold ${
                                        selectedKid.id === k.id
                                            ? "bg-pink-500 text-white"
                                            : "bg-white text-pink-600 shadow"
                                    }`}
                                >
                                    {k.name}
                                </button>
                            ))}
                        </div>
                        <KidDashboard kid={selectedKid} />
                    </>
                ) : (
                    <p className="text-center text-gray-500">No kids available</p>
                )}
            </div>
        </div>
    );
}


