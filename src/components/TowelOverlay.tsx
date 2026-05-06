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
        initial={{ x: "-220%", y: "-30%", rotate: -12 }}
        animate={{
          x: "260%",
          y: ["-30%", "-55%", "-30%"],
          rotate: 32,
        }}
        transition={{ duration: 1.0, ease: "linear" }}
      />
    </motion.div>
  );
}
