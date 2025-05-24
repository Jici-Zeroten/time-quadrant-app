import { useDrag, useDrop } from "react-dnd";
import { motion } from "framer-motion";
import { useRef } from "react";

const TaskItem = ({ task, index, moveTask, isEditing, children }) => {
  const ref = useRef(null);

  const [{ isDragging }, drag] = useDrag({
    type: "TASK",
    item: { id: task.id, index },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  const [, drop] = useDrop({
    accept: "TASK",
    hover: (draggedItem) => {
      if (draggedItem.index !== index) {
        moveTask(draggedItem.index, index);
        draggedItem.index = index;
      }
    },
  });

  drag(drop(ref));

  return (
    <motion.div
      ref={ref}
      initial={false}
      animate={{
        scale: isDragging ? 1.05 : 1,
        boxShadow: isDragging
          ? "0px 10px 20px rgba(0, 0, 0, 0.3)"
          : "0px 2px 6px rgba(0, 0, 0, 0.1)",
        opacity: isDragging ? 0.8 : 1,
      }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
      className="bg-white p-4 rounded shadow-sm mb-2 cursor-move"
    >
      {children}
    </motion.div>
  );
};
