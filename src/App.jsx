import { useEffect, useState } from "react";
import { ParentDashboard } from "./components/parent/ParentDashboard";
import { Header } from "./components/layout/Header";
import { KidDashboard } from "./components/kid/KidDashboard";
import { KidTabs } from "./components/kid/KidTabs";
import { supabase } from "./supabase";
import {FaCoins, FaEdit, FaSave} from "react-icons/fa";

export default function App() {
    const [user, setUser] = useState(null);
    const [members, setMembers] = useState([]);
    const [role, setRole] = useState("user");
    const [kids, setKids] = useState([]);
    const [selectedKid, setSelectedKid] = useState(kids[0]);
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
                options: { redirectTo: 'https://dineshgudibandi.github.io/gudiwards/' }
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
            .insert({ name: newGroupName, user_id: user.id })
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
            <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-indigo-100 via-purple-100 to-pink-100 p-6">
                <div className="max-w-3xl w-full text-center space-y-6">
                    <h1 className="text-4xl font-bold text-purple-800">Gudiwards (Rewards for being Good)</h1>
                    <p className="text-lg text-gray-700">Help your kids learn responsibility and manage their chores. Earn coins for completing tasks and redeem them for rewards!</p>
                    <img src="./img/logo.png" alt="Gudiwards" className="mx-auto w-48 h-48 rounded-full shadow-lg" />
                    <button onClick={signInWithGoogle} className="btn-primary text-white px-6 py-3 rounded-lg shadow-lg hover:shadow-xl transition">Sign in with Google</button>
                    <div className="text-gray-600 mt-4">

                    </div>
                </div>
            </div>

        );
    }
    const toggleEditGroup = (id) => {
        setFamilies(families.map(f => f.id === id ? { ...f, isEditing: !f.isEditing } : f));
    };

    const saveGroupName = async (id) => {
        const familyToUpdate = families.find(f => f.id === id);
        if (!familyToUpdate) return;
        await supabase.from('families').update({ name: familyToUpdate.name }).eq('id', id);
        setFamilies(families.map(f => f.id === id ? { ...f, isEditing: false } : f));
        loadFamilies(user);
    };

    const deleteGroup = async (id) => {
        if (!confirm('Are you sure you want to delete this group?')) return;
        await supabase.from('families').delete().eq('id', id);
        setFamilies(families.filter(f => f.id !== id));
        if (selectedFamily?.id === id) setSelectedFamily(null);
        loadFamilies(user);
    };
    const handleLogout = async () => {
        try {
            await supabase.auth.signOut();
            window.location.href = '/gudiwards/';
        } catch (error) {
            console.error('Logout error:', error.message);
        }
    };
    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-100 via-purple-100 to-pink-100 p-6">
            <div className="flex justify-end mb-4">
                <button
                    onClick={handleLogout}
                    className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition"
                >
                    Logout
                </button>
            </div>
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
                    <div className="mb-6">
                        <h2 className="font-semibold mb-3 text-lg">Your Groups:</h2>

                        {families.length > 0 && (
                            <div className="flex gap-3 overflow-x-auto pb-2">
                                {families.map(f => (
                                    <div
                                        key={f.id}
                                        className={`flex items-center gap-2 px-4 py-2 rounded-full shadow cursor-pointer ${
                                            selectedFamily?.id === f.id ? 'bg-indigo-600 text-white' : 'bg-white text-indigo-600'
                                        }`}
                                    >
                                        {/* Group name / edit input */}
                                        {f.isEditing ? (
                                           <> <input
                                                type="text"
                                                value={f.name}
                                                onChange={e => {
                                                    const updatedFamilies = families.map(fam =>
                                                        fam.id === f.id ? { ...fam, name: e.target.value } : fam
                                                    );
                                                    setFamilies(updatedFamilies);
                                                }}
                                                className="px-2 py-1 rounded text-indigo-900"
                                                onKeyDown={e => {
                                                    if (e.key === 'Enter') saveGroupName(f.id);
                                                }}
                                            />
                                            <button
                                                onClick={() => saveGroupName(f.id)}
                                                className={`ml-2 text-sm font-medium ${
                                                    selectedFamily?.id === f.id ? 'text-white' : 'text-indigo-600'
                                                }`}
                                            >
                                                {f.isEditing ? <FaSave /> : <FaEdit />}
                                            </button>
                                           </>
                                        ) : (
                                            <span
                                                onClick={() => {
                                                    setSelectedFamily(f);
                                                    setRole('parent');
                                                    loadMembers(f.id);
                                                    loadKids(f.id);
                                                }}
                                            >
              {f.name}
            </span>
                                        )}

                                        {/* Edit button */}
                                        <button
                                            onClick={() => toggleEditGroup(f.id)}
                                            className={`ml-2 text-sm font-medium ${
                                                selectedFamily?.id === f.id ? 'text-white' : 'text-indigo-600'
                                            }`}
                                        >
                                            {f.isEditing ? '' : <FaEdit />}
                                        </button>

                                        {/* Delete button */}
                                        <button
                                            onClick={() => deleteGroup(f.id)}
                                            className={`ml-1 text-sm font-medium text-red-500 hover:text-red-700`}
                                        >
                                            &times;
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Create new group */}
                        <div className="mt-3 flex gap-2">
                            <input
                                type="text"
                                value={newGroupName}
                                onChange={e => setNewGroupName(e.target.value)}
                                placeholder="Enter new group name"
                                className="border rounded px-3 py-2 flex-1"
                            />
                            <button onClick={createFamilyGroup} className="btn-primary">
                                Create
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
