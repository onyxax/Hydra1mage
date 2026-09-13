"use client";

import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { useImageContext } from "@/lib/image-context";
import { DesktopTopBar } from "./navigation/DesktopTopBar";
import { MobileTopBar, MobileDrawer } from "./navigation/MobileNav";
import { FloatingDock } from "./navigation/FloatingDock";

// Deep refactor: Sidebar is now an orchestrator. All visual/layout
// details live in navigation/* deep modules. Single responsibility:
// - read global image state
// - manage mobile drawer open + body lock
// - compose DesktopTopBar + MobileTopBar + MobileDrawer
export default function Sidebar() {
  const pathname = usePathname();
  const { imageFile, handleClearImage } = useImageContext();
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [mobileOpen]);

  return (
    <>
      <DesktopTopBar pathname={pathname} fileName={imageFile?.name ?? null} onClear={handleClearImage} />
      <MobileTopBar fileName={imageFile?.name ?? null} onClear={handleClearImage} open={mobileOpen} setOpen={setMobileOpen} />
      <MobileDrawer pathname={pathname} open={mobileOpen} setOpen={setMobileOpen} />
      <FloatingDock />
    </>
  );
}
