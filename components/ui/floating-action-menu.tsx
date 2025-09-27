"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { cn } from "@/lib/utils";

type FloatingActionMenuProps = {
  options: {
    label: string;
    onClick: () => void;
    Icon?: React.ReactNode;
  }[];
  className?: string;
};

const FloatingActionMenu = ({
  options,
  className,
}: FloatingActionMenuProps) => {
  const [isOpen, setIsOpen] = useState(false);

  const toggleMenu = () => setIsOpen((prev) => !prev);

  const handleOptionClick = (onClick: () => void) => {
    onClick();
    setIsOpen(false);
  };

  return (
    <div className={cn("fixed bottom-8 right-8 z-50", className)}>
      {/* ปุ่มหลัก */}
      <Button
        onClick={toggleMenu}
        className="w-14 h-14 rounded-full bg-gradient-to-br from-sky-600 to-blue-800 shadow-lg shadow-sky-500/40 flex items-center justify-center transition-all duration-300 hover:scale-110"
      >
        <motion.div
          animate={{ rotate: isOpen ? 45 : 0 }}
          transition={{
            duration: 0.3,
            ease: "easeInOut",
            type: "spring",
            stiffness: 300,
            damping: 20,
          }}
        >
          <Plus className="w-7 h-7 text-white" />
        </motion.div>
      </Button>

      {/* เมนูย่อย */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{
              duration: 0.4,
              type: "spring",
              stiffness: 250,
              damping: 18,
            }}
            className="absolute bottom-16 right-0 mb-3 flex flex-col items-end gap-3"
          >
            {options.map((option, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 30 }}
                transition={{
                  duration: 0.3,
                  delay: index * 0.05,
                }}
              >
                <Button
                  onClick={() => handleOptionClick(option.onClick)}
                  size="sm"
                  className="flex items-center gap-2 px-4 py-2 rounded-xl 
                    shadow-md backdrop-blur-md border border-white/20 
                    bg-black/70 text-white hover:bg-sky-600 hover:scale-105 transition-transform"
                >
                  {option.Icon && <span>{option.Icon}</span>}
                  <span className="font-medium">{option.label}</span>
                </Button>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default FloatingActionMenu;
