// client/src/utils/cn.js
import { clsx }        from "clsx";
import { twMerge }     from "tailwind-merge";

// Merges Tailwind classes safely — use everywhere instead of template literals
const cn = (...inputs) => twMerge(clsx(inputs));
export default cn;