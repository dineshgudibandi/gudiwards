import {ToggleButton} from "../shared/ToggleButton";

export function Header({ role, setRole, kids }) {
    return (
        <header className="flex justify-between items-center">
            <h1 className="text-3xl font-extrabold text-indigo-700"><img src="https://dineshgudibandi.github.io/gudiwards/img/logo.png" alt="Gudiwards" className="mx-auto w-24 h-24 rounded-full shadow-lg" /></h1>
            <div className="flex bg-white rounded-full shadow overflow-hidden">
                <ToggleButton active={role === "user"} onClick={() => setRole("user")} label="Home" />
                <ToggleButton active={role === "parent"} onClick={() => setRole("parent")} label="Parent" />
                { kids > 0 && <ToggleButton active={role === "kid"} onClick={() => setRole("kid")} label="Kids" /> }
            </div>
        </header>
    );
}
