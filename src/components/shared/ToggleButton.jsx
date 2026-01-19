// ToggleButton.jsx
// TODO: move corresponding logic here
export function ToggleButton({ active, onClick, label }) {
    return (
        <button
            className={`px-4 py-2 font-semibold ${active ? "bg-indigo-600 text-white" : "text-indigo-600"}`}
            onClick={onClick}
        >
            {label}
        </button>
    );
}
