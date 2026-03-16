import { createRoot } from "react-dom/client";
import { FullExample } from "../src/example";

const root = document.getElementById("root");
if (!root) throw new Error("Root element not found");
createRoot(root).render(<FullExample />);
