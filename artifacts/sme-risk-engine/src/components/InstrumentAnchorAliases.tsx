import { useEffect } from "react";
import { useLocation } from "wouter";

export default function InstrumentAnchorAliases() {
  const [location] = useLocation();

  useEffect(() => {
    if (location !== "/aor") return;
    let attempts = 0;
    let timer = 0;
    const attach = () => {
      const header = document.querySelector(".workstation-header");
      if (header) {
        header.classList.add("aor-header");
        return;
      }
      attempts += 1;
      if (attempts < 40) timer = window.setTimeout(attach, 50);
    };
    attach();
    return () => {
      if (timer) window.clearTimeout(timer);
      document.querySelector(".workstation-header.aor-header")?.classList.remove("aor-header");
    };
  }, [location]);

  return null;
}
