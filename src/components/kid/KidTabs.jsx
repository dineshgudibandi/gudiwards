
export function KidTabs({kids, selectedKid, setSelectedKid}) {
   return <div className="mb-6 flex gap-2 overflow-x-auto">
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
};