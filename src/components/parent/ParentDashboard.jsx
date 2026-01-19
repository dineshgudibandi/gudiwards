import { useEffect, useState } from "react";
import {Card} from "../shared/Card";
import {supabase} from "../../supabase";
import {FaCoins} from "react-icons/fa";

export function ParentDashboard({ family, user_id }) {
    const [chores, setChores] = useState([]);
    const [rewards, setRewards] = useState([]);
    const [completions, setCompletions] = useState([]);
    const [redemptions, setRedemptions] = useState([]);
    const [choreTitle, setChoreTitle] = useState("");
    const [choreCoins, setChoreCoins] = useState(5);
    const [daily, setDaily] = useState(true);

    const [rewardTitle, setRewardTitle] = useState("");
    const [rewardCoins, setRewardCoins] = useState(5);

    const [kids, setKids] = useState([]);
    const [newKidName, setNewKidName] = useState("");

    useEffect(() => {
        load();
    }, []);

    async function load() {
        const { data: c } = await supabase.from("chores").select("*");
        const { data: r } = await supabase.from("rewards").select("*");
        const { data: k } = await supabase.from("kids").select("*");
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
            cost: rewardCoins
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

    return (
        <div className="grid md:grid-cols-2 gap-6">
            <h3>{family.name}</h3>
            <Card>
                <h2 className="text-xl font-bold mb-4">Add Kid</h2>
                <input className="input" placeholder="Kid name" value={newKidName} onChange={e => setNewKidName(e.target.value)} />
                <button className="btn-primary mt-4" onClick={addKid}>Add Kid</button>

                <h3 className="mt-6 font-semibold mb-2">Kids</h3>
                <ul className="space-y-2">
                    {kids.map(k => (
                        <li key={k.id} className="flex justify-between items-center">
                            <span>{k.name}</span>
                            <button className="btn-success" onClick={() => removeKid(k.id)}>Delete</button>
                        </li>
                    ))}
                </ul>
            </Card>

            <Card>
                <h2 className="text-xl font-bold mb-4">Create Chore</h2>
                <input className="input" placeholder="Chore title" value={choreTitle} onChange={e => setChoreTitle(e.target.value)} />
                <input type="number" className="input mt-3" value={choreCoins} onChange={e => setChoreCoins(+e.target.value)} />
                <label className="flex items-center gap-2 mt-3">
                    <input type="checkbox" checked={daily} onChange={e => setDaily(e.target.checked)} />
                    Daily chore
                </label>
                <button className="btn-primary mt-4" onClick={addChore}>Add Chore</button>
            </Card>

            <Card>
                <h2 className="text-xl font-bold mb-4">Reward Store</h2>
                <input className="input" placeholder="Reward title" value={rewardTitle} onChange={e => setRewardTitle(e.target.value)} />
                <input type="number" className="input mt-3" value={rewardCoins} onChange={e => setRewardCoins(+e.target.value)} />
                <button className="btn-success mt-4" onClick={addReward}>Add Reward</button>
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