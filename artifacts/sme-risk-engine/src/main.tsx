import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import "./app-theme.css";
import "./pages/advanced-tab-system.css";
import "./pages/injury-hologram-pointcloud.css";
import "./pages/medication-hologram-asset.css";

createRoot(document.getElementById("root")!).render(<App />);
