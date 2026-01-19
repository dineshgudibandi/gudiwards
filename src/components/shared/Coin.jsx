export function Coin({ value }) {
    return (
        <span className="inline-flex items-center gap-1">
      {value} <FaCoins className="text-yellow-500" />
    </span>
    );
}