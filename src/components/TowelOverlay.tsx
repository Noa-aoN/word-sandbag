import { motion, useReducedMotion } from "framer-motion";
import towelSrc from "../assets/sandbag/towel.png";

export function TowelOverlay() {
  const reduce = useReducedMotion();

  if (reduce) {
    return (
      <motion.div
        className="towel-overlay"
        aria-hidden="true"
        initial={{ opacity: 0 }}
        animate={{ opacity: [0, 1, 1, 0] }}
        transition={{ duration: 0.8, times: [0, 0.2, 0.7, 1] }}
      >
        <img src={towelSrc} alt="" draggable={false} className="towel-overlay__img" />
      </motion.div>
    );
  }

  return (
    <motion.div
      className="towel-overlay"
      aria-hidden="true"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.16 }}
    >
      <motion.img
        src={towelSrc}
        alt=""
        draggable={false}
        className="towel-overlay__img"
        initial={{ x: "-160%", y: "-30%", rotate: -32, scale: 0.7, opacity: 0 }}
        animate={{
          x: ["-160%", "-50%", "-50%"],
          y: ["-30%", "-50%", "-50%"],
          rotate: [-32, -8, 12],
          scale: [0.7, 1, 1.05],
          opacity: [0, 1, 0.95],
        }}
        transition={{ duration: 0.95, times: [0, 0.6, 1], ease: "easeOut" }}
      />
    </motion.div>
  );
}
