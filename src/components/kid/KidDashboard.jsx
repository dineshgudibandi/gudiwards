// KidDashboard.jsx
// TODO: move corresponding logic here
import {useEffect, useState} from "react";
import {FaCoins} from "react-icons/fa";
import {Card} from "../shared/Card";
import {supabase} from "../../supabase";

export function KidDashboard({ kid }) {
    const [chores, setChores] = useState([]);
    const [rewards, setRewards] = useState([]);
    const [coins, setCoins] = useState(0);
    const [pendingRedemptions, setPendingRedemptions] = useState([]);
    const [history, setHistory] = useState([]);
    const [redhistory, setRedHistory] = useState([]);
    const [selectedKid, setSelectedKid] = useState(null);

    useEffect(() => {
        load();
    }, [kid]);

    async function load() {
        const today = new Date().toISOString().split("T")[0];

        const { data: choresData } = await supabase.from("chores").select("*");
        const { data: rewardsData } = await supabase.from("rewards").select("*");
        const { data: completions } = await supabase.from("chore_completions").select("*").eq("kid_id", kid.id);

        const updatedChores = (choresData || []).map(ch => {
            const todayRow = (completions || []).find(c => c.chore_id === ch.id && c.completed_on === today);
            const anyApproved = (completions || []).find(c => c.chore_id === ch.id && c.approved);
            return {
                ...ch,
                done: ch.is_daily ? Boolean(todayRow?.approved) : Boolean(anyApproved),
                pending: Boolean(todayRow && !todayRow.approved)
            };
        });
        setChores(updatedChores);

        const totalCoins = (completions || []).reduce((sum, c) => {
            if (!c.approved) return sum;
            const chore = (choresData || []).find(x => x.id === c.chore_id);
            return sum + (chore?.coins || 0);
        }, 0);
        const { data: pendingRedCoins } = await supabase.from("redemptions").select("*, rewards(*)").eq("kid_id", kid.id);
        const redCoins =  (pendingRedCoins || []).reduce((sum, c) => {
            const reward = (rewardsData || []).find(x => x.id === c.reward_id);
            return sum + (reward?.cost || 0);
        }, 0);
        setCoins(totalCoins-redCoins);
        await supabase.from("kids").update({ coins: totalCoins-redCoins }).eq("id", kid.id);
        setRewards(rewardsData || []);

        const { data: pendingRed } = await supabase.from("redemptions").select("*, rewards(*)").eq("kid_id", kid.id).eq("approved", false);
        setPendingRedemptions(pendingRed || []);
        const { data: historyData } = await supabase.from("chore_completions").select("*, chores(*)").eq("kid_id", kid.id);
        const { data: redHistory } = await supabase
            .from("redemptions")
            .select("*, rewards(*)")
            .eq("kid_id", kid.id)
            .eq("approved", true);
        setRedHistory(redHistory || []);
        setHistory([...(historyData || [])]);

    }

    async function markDone(chore) {
        const today = new Date().toISOString().split("T")[0];
        const { data } = await supabase.from("chore_completions").select("id").eq("kid_id", kid.id).eq("chore_id", chore.id).eq("completed_on", today).maybeSingle();
        if (!data) {
            await supabase.from("chore_completions").insert({ kid_id: kid.id, chore_id: chore.id, completed_on: today, approved: false });
        }
        load();
    }

    async function redeemReward(reward) {
        if (coins < reward.cost) return;

        // deduct coins immediately
        await supabase
            .from("kids")
            .update({ coins: coins - reward.cost })
            .eq("id", kid.id);

        // create pending redemption
        await supabase.from("redemptions").insert({
            kid_id: kid.id,
            reward_id: reward.id,
            approved: false,
            redeemed_on: new Date().toISOString()
        });
        load();
    }

    return (
        <div className="space-y-6">
            <Card>
                <div className="text-center">
                    <p className="text-2xl font-bold">{kid.name}</p>
                    <p className="text-5xl font-extrabold text-yellow-500">{coins} <FaCoins className="inline" /></p>
                </div>
            </Card>

            <Card>
                <h2 className="font-bold mb-4">Today's Chores</h2>
                <ul className="space-y-3">
                    {chores.filter(ch => ch.is_daily || !ch.done).map(ch => (
                        <li key={ch.id} className="flex justify-between items-center">
                            <span>{ch.title} (<span className="text-yellow-500">{ch.coins} <FaCoins className="inline" /></span>) {ch.pending && <span className="ml-2 text-xs text-orange-500">Pending</span>}</span>
                            <button className="px-3 py-1 rounded bg-indigo-500 text-white disabled:opacity-50" disabled={ch.done || ch.pending} onClick={() => markDone(ch)}>
                                {ch.done ? 'Done' : ch.pending ? 'Pending' : 'Claim'}
                            </button>
                        </li>
                    ))}
                </ul>
            </Card>

            <Card>
                <h2 className="font-bold mb-4">Rewards</h2>
                <ul className="space-y-3">
                    {rewards.map(r => (
                        <li key={r.id} className="flex justify-between items-center">
                            {r.title}
                            <button className="px-3 py-1 rounded bg-emerald-500 text-white disabled:opacity-40" disabled={coins < r.cost} onClick={() => redeemReward(r)}>
                                Redeem ({r.cost} <FaCoins className="inline" />)
                            </button>
                        </li>
                    ))}
                </ul>
                {pendingRedemptions.length > 0 && (
                    <div className="mt-4">
                        <h3 className="font-semibold mb-2">Pending Redemptions</h3>
                        <ul className="space-y-2">
                            {pendingRedemptions.map(pr => (
                                <li key={pr.id} className="flex justify-between items-center bg-yellow-50 rounded-xl px-4 py-2">
                                    <span>{pr.rewards?.title} ({pr.rewards?.cost} <FaCoins className="inline" />) - Pending Approval</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
            </Card>
            <Card>
                <h2 className="font-bold mb-4">History</h2>
                <ul className="space-y-2">
                    {history.map(h => (
                        <li key={h.id} className="flex justify-between bg-gray-50 rounded-xl px-4 py-2">
                            <span>{h.chores?.title} (+{h.chores?.coins} <FaCoins className="inline text-yellow-500 ml-1" />)</span>
                            <span className="text-gray-600 text-sm">{h.completed_on}</span>
                            {h.coins && <FaCoins className="inline text-yellow-500 ml-1" />}
                        </li>
                    ))}
                    {history.length === 0 && <li className="text-gray-500">No history yet</li>}
                </ul>
            </Card>
            <Card>
                <h2 className="font-bold mb-4">Redemption History</h2>
                <ul className="space-y-2">
                    {redhistory.map(h => (
                        <li key={h.id} className="flex justify-between bg-gray-50 rounded-xl px-4 py-2">
                            <span>{h.rewards?.title} (-{h.rewards?.cost} <FaCoins className="inline text-yellow-500 ml-1" />)</span>
                            <span className="text-gray-600 text-sm">{h.redeemed_on}</span>
                            {h.coins && <FaCoins className="inline text-yellow-500 ml-1" />}
                        </li>
                    ))}
                    {redhistory.length === 0 && <li className="text-gray-500">No history yet</li>}
                </ul>
            </Card>
        </div>
    );
}