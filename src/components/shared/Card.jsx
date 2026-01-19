import {FaCoins} from "react-icons/fa";
import { motion } from "framer-motion";
export function Card({ children }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl shadow-lg p-6"
        >
            {children}
        </motion.div>
    );
}
