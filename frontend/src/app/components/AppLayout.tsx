import { AnimatePresence, motion } from "motion/react";
import { Outlet, useLocation } from "react-router";

export function AppLayout() {
  const location = useLocation();

  return (
    <div className="min-h-screen bg-[var(--voyara-surface)] text-[var(--voyara-ink)]">
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={location.pathname}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
        >
          <Outlet />
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
