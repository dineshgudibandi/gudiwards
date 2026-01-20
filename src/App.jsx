import { useEffect, useState } from "react";
import { ParentDashboard } from "./components/parent/ParentDashboard";
import { Header } from "./components/layout/Header";
import { KidDashboard } from "./components/kid/KidDashboard";
import { KidTabs } from "./components/kid/KidTabs";
import { supabase } from "./supabase";
import { Home } from "./components/layout/Home";

export default function App() {
    const [user, setUser] = useState(null);
    const [members, setMembers] = useState([]);
    const [role, setRole] = useState("user");
    const [kids, setKids] = useState([]);
    const [selectedKid, setSelectedKid] = useState(null);
    const [userEmail, setUserEmail] = useState("");
    const [families, setFamilies] = useState([]);
    const [selectedFamily, setSelectedFamily] = useState(null);
    const [newGroupName, setNewGroupName] = useState("");

    useEffect(() => {
        const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
            setUser(session?.user || null);
            if (session?.user) {
                setUserEmail(session.user.email);
                loadFamilies(session.user);
            }
        });
        return () => authListener.subscription.unsubscribe();
    }, []);

    async function signInWithGoogle() {
        try {
            const { data, error } = await supabase.auth.signInWithOAuth({
                provider: "google",
                options: { redirectTo: window.location.origin }
            });
            if (error) console.error("Login error:", error.message);
        } catch (err) {
            console.error("Unexpected error during Google login:", err);
        }
    }

    async function loadFamilies(user) {
        const { data } = await supabase
            .from("family_members")
            .select("*, families(*)")
            .eq("user_id", user.id);

        if (!data || data.length === 0) return;

        const uniqueFamilies = data.map(fm => fm.families).filter(f => f != null);
        setFamilies(uniqueFamilies);
        if (uniqueFamilies.length > 0) {
            setSelectedFamily(uniqueFamilies[0]);
            loadMembers(uniqueFamilies[0].id);
            loadKids(uniqueFamilies[0].id);
        }
    }

    async function loadMembers(familyId) {
        if (!familyId) return;
        const { data: mems } = await supabase
            .from("family_members")
            .select("*")
            .eq("family_id", familyId);
        setMembers(mems || []);
    }

    async function loadKids(familyId) {
        if (!familyId) return;
        const { data } = await supabase.from("kids").select("*").eq("family_id", familyId);
        setKids(data || []);
        if (!selectedKid && data?.length) setSelectedKid(data[0]);
    }

    async function createFamilyGroup() {
        if (!newGroupName || !user) { alert("Please enter a group name and ensure you are logged in."); return; }
        const { data, error } = await supabase.from('families')
            .insert({ name: newGroupName, owner_id: user.id })
            .select()
            .maybeSingle();
        if (error) { console.error(error); alert("Failed to create group. Check RLS policies."); return; }
        if (!data) return;

        setFamilies([...families, data]);
        setSelectedFamily(data);
        setNewGroupName("");

        const { error: memberError } = await supabase.from('family_members').insert({
            family_id: data.id,
            user_id: user.id,
            user_email: user.email,
            role: 'parent'
        });
        if (memberError) console.error("Failed to add current user as member:", memberError);
        else loadMembers(data.id);
    }

    if (!user) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center">
                <button onClick={signInWithGoogle} className="btn-primary">Sign in with Google</button>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-100 via-purple-100 to-pink-100 p-6">
            <div className="max-w-4xl mx-auto space-y-6">
                <Header role={role} setRole={setRole} members={members} kids={kids.length} />
                <p className="text-gray-700">Welcome {userEmail}</p>
                {role === "parent" && selectedFamily ? (
                    <ParentDashboard family={selectedFamily} user_id={user.id} />
                ) : role === 'kid' && selectedKid ? (
                    <>
                        <KidTabs kids={kids} selectedKid={selectedKid} setSelectedKid={setSelectedKid} />
                        <KidDashboard kid={selectedKid} family={selectedFamily} />
                    </>
                ) : (
                    <div className="mb-4">
                        <h2 className="font-semibold mb-2">Your Groups:</h2>
                        { families.length > 0 && <div className="flex gap-2 overflow-x-auto">
                            {families.map(f => (
                                <button
                                    key={f.id}
                                    className={`px-4 py-2 rounded-full font-semibold ${selectedFamily?.id === f.id ? 'bg-indigo-600 text-white' : 'bg-white text-indigo-600 shadow'}`}
                                    onClick={() => {
                                        setSelectedFamily(f);
                                        setRole('parent');
                                        loadMembers(f.id);
                                        loadKids(f.id);
                                    }}
                                >
                                    {f.name}
                                </button>
                            ))}
                        </div> }
                        <input
                            type="text"
                            value={newGroupName}
                            onChange={e => setNewGroupName(e.target.value)}
                            placeholder="Enter new group name"
                            className="border rounded px-3 py-2 mr-2"
                        />
                        <button onClick={createFamilyGroup} className="btn-primary">
                            Create Family Group
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
