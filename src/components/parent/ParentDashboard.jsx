import { useEffect, useState } from "react";
import {Card} from "../shared/Card";
import {supabase} from "../../supabase";
import {FaCoins, FaEdit, FaSave} from "react-icons/fa";

export function ParentDashboard({ family, user_id }) {
    const [chores, setChores] = useState([]);
    const [rewards, setRewards] = useState([]);
    const [completions, setCompletions] = useState([]);
    const [redemptions, setRedemptions] = useState([]);
    const [choreTitle, setChoreTitle] = useState("");
    const [choreCoins, setChoreCoins] = useState(5);
    const [daily, setDaily] = useState(true);

    const [kids, setKids] = useState([]);
    const [newKidName, setNewKidName] = useState("");

    const [rewardTitle, setRewardTitle] = useState("");
    const [rewardCoins, setRewardCoins] = useState(5);

    const [editingChoreId, setEditingChoreId] = useState(null);
    const [editingRewardId, setEditingRewardId] = useState(null);
    const [editingKidId, setEditingKidId] = useState(null);

    const [editChoreTitle, setEditChoreTitle] = useState("");
    const [editChoreCoins, setEditChoreCoins] = useState(0);

    const [editRewardTitle, setEditRewardTitle] = useState("");
    const [editRewardCoins, setEditRewardCoins] = useState(0);

    const [editKidName, setEditKidName] = useState("");


    useEffect(() => {
        load();
    }, []);

    async function load() {
        const { data: c } = await supabase.from("chores").select("*").eq("family_id",family.id);
        const { data: r } = await supabase.from("rewards").select("*").eq("family_id",family.id);
        const { data: k } = await supabase.from("kids").select("*").eq("family_id",family.id);
        const { data: cc } = await supabase.from("chore_completions").select("*, chores(*), kids(*)").eq("approved", false);
        const { data: red } = await supabase.from("redemptions").select("*, rewards(*), kids(*)").eq("approved", false);

        setChores(c || []);
        setRewards(r || []);
        setKids(k || []);
        setCompletions(cc || []);
        setRedemptions(red || []);
    }

    async function addChore() {
        if (!choreTitle) return;
        await supabase.from("chores").insert({
            title: choreTitle,
            coins: choreCoins,
            family_id: family.id,
            is_daily: daily
        });
        setChoreTitle("");
        setChoreCoins(5);
        setDaily(true);
        await load();
    }

    async function addReward() {
        if (!rewardTitle) return;
        await supabase.from("rewards").insert({
            title: rewardTitle,
            cost: rewardCoins,
            family_id: family.id
        });
        setRewardTitle("");
        setRewardCoins(5);
        await load();
    }

    async function addKid() {
        if (!newKidName) return;
        await supabase.from("kids").insert({ name: newKidName, family_id:family.id, user_id });
        setNewKidName("");
        await load();
    }
    async function removeKid(id) {
        await supabase.from("chore_completions").delete().eq("kid_id", id);
        await supabase.from("redemptions").delete().eq("kid_id", id);
        await supabase.from("kids").delete().eq("id", id);
        await load();
    }

    async function approveChore(completionId) {
        await supabase.from("chore_completions").update({ approved: true }).eq("id", completionId);
        await load();
    }

    async function rejectCompletion(id) {
        await supabase.from("chore_completions").delete().eq("id", id);
        await load();
    }

    async function approveRedemption(id) {
        // simply mark redemption approved (coins already deducted at request time)
        await supabase.from("redemptions").update({ approved: true }).eq("id", id);
        await load();
    }

    async function rejectRedemption(id) {
        await supabase.from("redemptions").delete().eq("id", id);
        await load();
    }
    async function updateChore(choreId) {
        await supabase.from("chores").update({ title: editChoreTitle, coins: editChoreCoins }).eq("id", choreId);
        setEditingChoreId(null);
        await load();
    }

    async function updateReward(rewardId) {
        await supabase.from("rewards").update({ title: editRewardTitle, cost: editRewardCoins }).eq("id", rewardId);
        setEditingRewardId(null);
        await load();
    }

    async function updateKid(kidId) {
        await supabase.from("kids").update({ name: editKidName }).eq("id", kidId);
        setEditingKidId(null);
        await load();
    }
    return (
        <div className="grid md:grid-cols-2 gap-6">
            <h3>{family.name}</h3>
            <Card>
                <h2 className="text-xl font-bold mb-4">Kids</h2>
                <input className="input" placeholder="Kid name" value={newKidName} onChange={e => setNewKidName(e.target.value)} />
                <button className="btn-primary mt-4" onClick={async () => { await supabase.from("kids").insert({ name: newKidName, family_id:family.id, user_id }); setNewKidName(""); load(); }}>Add Kid</button>

                <ul className="space-y-2 mt-4">
                    {kids.map(k => (
                        <li key={k.id} className="flex justify-between items-center">
                            {editingKidId === k.id ? (
                                <>
                                    <input value={editKidName} onChange={e => setEditKidName(e.target.value)} className="input" />
                                    <button className="btn-success" onClick={() => updateKid(k.id)}><FaSave /></button>
                                </>
                            ) : (
                                <>
                                    <span>{k.name}</span>
                                    <div className="flex gap-2">
                                        <button className="btn-warning" onClick={() => { setEditingKidId(k.id); setEditKidName(k.name); }}><FaEdit /></button>
                                        <button className="btn-danger" onClick={async () => { await supabase.from("kids").delete().eq("id", k.id); load(); }}>Delete</button>
                                    </div>
                                </>
                            )}
                        </li>
                    ))}
                </ul>
            </Card>

            <Card>
                <h2 className="text-xl font-bold mb-4">Chores</h2>
                {chores.map(ch => (
                    <div key={ch.id} className="flex justify-between items-center mb-2">
                        {editingChoreId === ch.id ? (
                            <>
                                <input value={editChoreTitle} onChange={e => setEditChoreTitle(e.target.value)} className="input" />
                                <input type="number" value={editChoreCoins} onChange={e => setEditChoreCoins(+e.target.value)} className="input w-20 ml-2" />
                                <button className="btn-success ml-2" onClick={() => updateChore(ch.id)}><FaSave /></button>
                            </>
                        ) : (
                            <>
                                <span>{ch.title} ({ch.coins} <FaCoins className="inline" />)</span>
                                <button className="btn-warning" onClick={() => { setEditingChoreId(ch.id); setEditChoreTitle(ch.title); setEditChoreCoins(ch.coins); }}><FaEdit /></button>
                            </>
                        )}
                    </div>
                ))}
            </Card>

            <Card>
                <h2 className="text-xl font-bold mb-4">Rewards</h2>
                {rewards.map(r => (
                    <div key={r.id} className="flex justify-between items-center mb-2">
                        {editingRewardId === r.id ? (
                            <>
                                <input value={editRewardTitle} onChange={e => setEditRewardTitle(e.target.value)} className="input" />
                                <input type="number" value={editRewardCoins} onChange={e => setEditRewardCoins(+e.target.value)} className="input w-20 ml-2" />
                                <button className="btn-success ml-2" onClick={() => updateReward(r.id)}><FaSave /></button>
                            </>
                        ) : (
                            <>
                                <span>{r.title} ({r.cost} <FaCoins className="inline" />)</span>
                                <button className="btn-warning" onClick={() => { setEditingRewardId(r.id); setEditRewardTitle(r.title); setEditRewardCoins(r.cost); }}><FaEdit /></button>
                            </>
                        )}
                    </div>
                ))}
            </Card>
            <Card>
                <h2 className="font-semibold mb-3">Pending Approvals</h2>
                <ul className="space-y-2">
                    {completions.map(cc => (
                        <li key={cc.id} className="flex justify-between items-center">
                            <span>{cc.chores.title} ({cc.kids.name})</span>
                            <button  className="px-4 py-1 rounded-full bg-green-600 text-white font-semibold hover:bg-green-700" onClick={() => approveChore(cc.id)}>Approve</button>
                            <button  className="px-4 py-1 rounded-full bg-red-500 text-white font-semibold hover:bg-red-600" onClick={() => rejectCompletion(cc.id)}>Reject</button>
                        </li>
                    ))}
                    {completions.length === 0 && <li className="text-gray-500">No pending approvals</li>}
                </ul>
            </Card>

            <Card>
                <h2 className="text-xl font-bold mb-4 text-indigo-700">Pending Redemptions</h2>
                <ul className="space-y-3">
                    {redemptions.map(rd => (
                        <li key={rd.id} className="flex justify-between items-center bg-green-50 rounded-xl px-4 py-3">
                            <div>
                                <p className="font-semibold">{rd.kids?.name}</p>
                                <p className="text-sm text-gray-600">
                                    {rd.rewards?.title} · {rd.rewards?.cost} <FaCoins className="inline" />
                                </p>
                            </div>
                            <div className="flex gap-2">
                                <button className="px-4 py-1 rounded-full bg-green-600 text-white font-semibold hover:bg-green-700" onClick={() => approveRedemption(rd.id)}>Approve</button>
                                <button className="px-4 py-1 rounded-full bg-red-500 text-white font-semibold hover:bg-red-600" onClick={() => rejectRedemption(rd.id)}>Reject</button>
                            </div>
                        </li>
                    ))}
                    {redemptions.length === 0 && <li className="text-gray-500">No pending redemptions</li>}
                </ul>
            </Card>
        </div>
    );
}