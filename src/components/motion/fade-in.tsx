"use client";

import { motion } from "framer-motion";
import type { ReactNode } from "react";

/**
 * Wrapper animasi scroll-reveal sederhana berbasis Framer Motion.
 * Dipakai membungkus section agar muncul mulus saat masuk viewport.
 */
export function FadeIn({
  children,
  delay = 0,
  className,
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
}) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.5, delay, ease: "easeOut" }}
    >
      {children}
    </motion.div>
  );
}
