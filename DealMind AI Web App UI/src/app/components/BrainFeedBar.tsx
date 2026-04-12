import { motion, AnimatePresence } from "motion/react";

interface BrainFeedBarProps {
  isActive: boolean;
  text: string;
}

export function BrainFeedBar({ isActive, text }: BrainFeedBarProps) {
  return (
    <div className="h-8 px-8 flex items-center" style={{ backgroundColor: "#141414" }}>
      <AnimatePresence mode="wait">
        <motion.span
          key={text}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4, ease: "easeInOut" }}
          style={{
            fontStyle: "italic",
            fontSize: "12px",
            color: isActive ? "#6366F1" : "#444",
          }}
        >
          {isActive ? `...${text}` : text}
        </motion.span>
      </AnimatePresence>
    </div>
  );
}
