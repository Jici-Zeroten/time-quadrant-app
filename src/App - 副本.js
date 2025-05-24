import React, { useState, useEffect, useRef } from "react";
import { Card, CardContent } from "./components/ui/card.js";
import { Button } from "./components/ui/button.js";
import { Input } from "./components/ui/input.js";
import { PlusCircle, CheckCircle, Circle, Trash2, Edit3, Save, ChevronDown, ChevronRight } from "lucide-react";
import { DndProvider, useDrag, useDrop } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import update from "immutability-helper";
import { motion, AnimatePresence } from "framer-motion";
import confetti from "canvas-confetti";

const ITEM_TYPE = "TASK";

const colors = {
  IU: "bg-red-100",
  IN: "bg-orange-100",
  UU: "bg-green-100",
  UN: "bg-blue-100",
};

const Quadrant = ({ title, tasks, onDrop, children, color, showCompleted, onToggleShowCompleted }) => {
  const [collapsed, setCollapsed] = useState(false);
  const [hasCelebrated, setHasCelebrated] = useState(false);
  const prevCompletedCount = useRef(0);

  const [{ isOver }, drop] = useDrop({
    accept: ITEM_TYPE,
    drop: (item) => {
      if (item.fromCategory !== title) onDrop(item.id);
    },
    collect: (monitor) => ({ isOver: monitor.isOver() }),
  });

  const completedCount = tasks.filter((t) => t.completed).length;
  const allCompleted = tasks.length > 0 && completedCount === tasks.length;

  useEffect(() => {
    if (allCompleted && !hasCelebrated) {
      var end = Date.now() + (15 * 100);
      // go Buckeyes!
      var colors = ['#bb0000', '#ffffff'];
      (function frame() {
        confetti({
          particleCount: 2,
          angle: 60,
          spread: 55,
          origin: { x: 0 },
          colors: colors
        });
        confetti({
          particleCount: 2,
          angle: 120,
          spread: 55,
          origin: { x: 1 },
          colors: colors
        });
        if (Date.now() < end) {
          requestAnimationFrame(frame);
        }
      }());
      setHasCelebrated(true);
    } else if (!allCompleted) {
      setHasCelebrated(false);
    }
  }, [allCompleted, hasCelebrated]);

  return (
    <div
      ref={drop}
      className={`rounded-2xl shadow-xl p-4 ${color} flex-1 transition-all duration-200 ${isOver ? "ring-2 ring-orange-500" : ""
        }`}
    >
    <div className="flex justify-between items-center mb-2">
      <h2 className="text-xl font-bold">
        {title} ({tasks.filter((t) => t.completed).length}/{tasks.length})
      </h2>
      <div className="flex items-center gap-2">
        <motion.button
          onClick={onToggleShowCompleted}
          whileTap={{ scale: 0.95 }}
          whileHover={{ backgroundColor: "#dbeafe" }} // hover 蓝色
          transition={{ duration: 0.2 }}
          className={`text-sm font-medium text-blue-600 hover:text-blue-800 px-2 py-1 rounded-md transition-colors`}
        >
          {showCompleted ? "隐藏完成" : "显示完成"}
        </motion.button>
        <button
          onClick={() => setCollapsed((prev) => !prev)}
          className="text-gray-600 hover:text-black transition"
          title={collapsed ? "展开" : "收起"}
        >
          {collapsed ? <ChevronRight size={20} /> : <ChevronDown size={20} />}
        </button>
      </div>
    </div>

      <AnimatePresence initial={false}>
        {!collapsed && (
          <motion.div
            key="content"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="overflow-hidden space-y-2"
          >
            {children}
            {allCompleted && (
              <div className="text-green-700 font-semibold text-center pt-2">🎉 全部完成！</div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const Task = ({
  id, text, completed, onToggle, onDelete, onSaveEdit,
  onStartEdit, isEditing, index, moveTask, fromCategory
}) => {
  const ref = useRef(null);

  const [{ isDragging }, drag] = useDrag({
    type: ITEM_TYPE,
    item: { id, index, fromCategory },
    collect: (monitor) => ({ isDragging: monitor.isDragging() }),
  });

  const [, drop] = useDrop({
    accept: ITEM_TYPE,
    hover(item, monitor) {
      if (!ref.current) return;
      const dragIndex = item.index;
      const hoverIndex = index;
      if (dragIndex === hoverIndex) return;

      const hoverRect = ref.current.getBoundingClientRect();
      const hoverMiddleY = (hoverRect.bottom - hoverRect.top) / 2;
      const clientOffset = monitor.getClientOffset();
      const hoverClientY = clientOffset.y - hoverRect.top;

      if (dragIndex < hoverIndex && hoverClientY < hoverMiddleY) return;
      if (dragIndex > hoverIndex && hoverClientY > hoverMiddleY) return;

      moveTask(dragIndex, hoverIndex);
      item.index = hoverIndex;
    },
  });

  drag(drop(ref));

  return (
    <motion.div
      ref={ref}
      layout
      initial={{ opacity: 0, scale: 0.9, y: -10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9, y: 10 }}
      transition={{ duration: 0.25, type: "spring", stiffness: 300 }}
      className={`p-2 rounded-xl shadow-md bg-white cursor-move flex justify-between items-center ${isDragging ? "opacity-50" : ""
        }`}
    >
      <div className="flex items-center gap-2 flex-1">
        <button onClick={() => onToggle(id)} className="text-green-600">
          {completed ? <CheckCircle className="w-5 h-5" /> : <Circle className="w-5 h-5" />}
        </button>
        {isEditing ? (
          <input
            className="border rounded px-2 py-1 w-full"
            autoFocus
            defaultValue={text}
            onKeyDown={(e) => e.key === "Enter" && onSaveEdit(id, e.target.value)}
            onBlur={(e) => onSaveEdit(id, e.target.value)}
          />
        ) : (
          <span className={`${completed ? "line-through text-gray-400" : ""}`}>{text}</span>
        )}
      </div>
      <div className="flex items-center gap-2">
        <button onClick={() => onStartEdit(id)} className="text-blue-500">
          {isEditing ? <Save className="w-4 h-4" /> : <Edit3 className="w-4 h-4" />}
        </button>
        <button onClick={() => onDelete(id)} className="text-red-500">
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </motion.div>
  );
};

export default function App() {
  const [taskInput, setTaskInput] = useState("");
  const [tasks, setTasks] = useState({ IU: [], IN: [], UU: [], UN: [] });
  const [editingTaskId, setEditingTaskId] = useState(null);
  const [hasInitialized, setHasInitialized] = useState(false);
  const [reportVisible, setReportVisible] = useState(false);
  const [reportText, setReportText] = useState("");
  const SHOW_COMPLETED_KEY = "showCompletedPrefs";
  const [showCompleted, setShowCompleted] = useState(() => {
    try {
      const stored = localStorage.getItem(SHOW_COMPLETED_KEY);
      return stored
        ? JSON.parse(stored)
        : { IU: true, IN: true, UU: true, UN: true };
    } catch {
      return { IU: true, IN: true, UU: true, UN: true };
    }
  });
  useEffect(() => {
    try {
      const saved = localStorage.getItem("tasks");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (typeof parsed === "object" && parsed !== null) {
          setTasks(parsed);
        }
      }
    } catch (e) {
      console.error("本地任务数据读取失败：", e);
      localStorage.removeItem("tasks");
    }
    setHasInitialized(true);
  }, []);

  useEffect(() => {
    if (hasInitialized) {
      localStorage.setItem("tasks", JSON.stringify(tasks));
    }
  }, [tasks, hasInitialized]);
  
  useEffect(() => {
    try {
      localStorage.setItem(SHOW_COMPLETED_KEY, JSON.stringify(showCompleted));
    } catch (e) {
      console.error("保存显示偏好失败：", e);
    }
  }, [showCompleted]);
  
  const addTask = () => {
    if (!taskInput.trim()) return;
    const id = Date.now().toString();
    setTasks((prev) => ({
      ...prev,
      IN: [...prev.IN, { id, text: taskInput, completed: false }],
    }));
    setTaskInput("");
  };

  const moveTaskToCategory = (taskId, toCategory) => {
    let movedTask = null;
    const updated = { ...tasks };
    for (const cat in updated) {
      updated[cat] = updated[cat].filter((task) => {
        if (task.id === taskId) {
          movedTask = task;
          return false;
        }
        return true;
      });
    }
    if (movedTask) updated[toCategory].push(movedTask);
    setTasks(updated);
  };

  const toggleComplete = (taskId) => {
    const updated = { ...tasks };
    for (const cat in updated) {
      updated[cat] = updated[cat].map((task) =>
        task.id === taskId ? { ...task, completed: !task.completed } : task
      );
    }
    setTasks(updated);
  };

  const deleteTask = (taskId) => {
    const updated = { ...tasks };
    for (const cat in updated) {
      updated[cat] = updated[cat].filter((task) => task.id !== taskId);
    }
    setTasks(updated);
  };

  const startEditTask = (taskId) => setEditingTaskId(taskId);

  const saveEditedTask = (taskId, newText) => {
    const updated = { ...tasks };
    for (const cat in updated) {
      updated[cat] = updated[cat].map((task) =>
        task.id === taskId ? { ...task, text: newText } : task
      );
    }
    setTasks(updated);
    setEditingTaskId(null);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") addTask();
  };

  const handleExport = () => {
    const dataStr = JSON.stringify(tasks, null, 2);
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `tasks-${new Date().toISOString().split("T")[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
    confetti({ particleCount: 80, spread: 60, origin: { y: 0.3 } });
  };

  const handleImport = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target.result);
        if (
          typeof parsed === "object" &&
          parsed !== null &&
          ["IU", "IN", "UU", "UN"].every((k) => Array.isArray(parsed[k]))
        ) {
          setTasks(parsed);
          confetti({ particleCount: 60, spread: 50, origin: { y: 0.5 } });
          alert("✅ 导入成功！");
        } else throw new Error("无效任务结构");
      } catch {
        alert("❌ 导入失败，请选择有效的任务列表文件");
      }
    };
    reader.readAsText(file);
    e.target.value = ""; // reset input
  };

  const handleClearAll = () => {
    const confirmed = window.confirm("⚠️ 是否确认清空所有任务？该操作不可恢复！");
    if (confirmed) {
      setTasks({ IU: [], IN: [], UU: [], UN: [] });
      confetti({
        particleCount: 60,
        spread: 70,
        origin: { y: 0.5 },
        colors: ['#333333', '#ff6666', '#cccccc'],
      });
    }
  };

  const generateReport = () => {
    const today = new Date().toLocaleDateString();
  
    let total = 0, completed = 0;
    let quadrantSummary = [];
  
    const names = {
      IN: "重要而不紧急",
      IU: "重要而紧急",
      UN: "不重要而不紧急",
      UU: "不重要而紧急",
    };
  
    for (const key in tasks) {
      const list = tasks[key];
      const comp = list.filter((t) => t.completed).length;
  
      total += list.length;
      completed += comp;
  
      quadrantSummary.push(
        `${names[key]} ${list.length} 项，完成 ${comp} 项`
      );
    }
  
    const rate = total > 0 ? ((completed / total) * 100).toFixed(1) : "0.0";
  
    const summary = `
🗓️ 当前日期：${today}
📌 共 ${total} 项任务：
${quadrantSummary.join("\n")}
✅ 已完成 ${completed} 项
🏁 完成率：${rate}%
💡 很棒！继续保持专注和高效！
`;
  
    setReportText(summary.trim());
    setReportVisible(true);
  };
  
  const createSortableTasks = (catKey, showCompleted = true) => {

    const taskList = tasks[catKey] || [];
  
    // 1. 排序：未完成在前，已完成在后
    const sortedTaskList = [...taskList]
    .filter((task) => showCompleted || !task.completed)
    .sort((a, b) => (a.completed === b.completed ? 0 : a.completed ? 1 : -1));
  
    // 2. 拖拽排序（仅在同类任务内调整位置）
    const moveTask = (from, to) => {
      setTasks((prev) =>
        update(prev, {
          [catKey]: {
            $splice: [
              [from, 1],
              [to, 0, prev[catKey][from]],
            ],
          },
        })
      );
    };
  
    return (
      <AnimatePresence>
        {sortedTaskList.map((task, index) => (
          <Task
            key={task.id}
            {...task}
            index={index}
            fromCategory={catKey}
            onToggle={toggleComplete}
            onDelete={deleteTask}
            onStartEdit={startEditTask}
            onSaveEdit={saveEditedTask}
            isEditing={editingTaskId === task.id}
            moveTask={moveTask}
          />
        ))}
      </AnimatePresence>
    );
  };
  

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="min-h-screen bg-orange-50 p-4 md:p-6">
        <div className="max-w-6xl w-full mx-auto mb-4 md:mb-6">
          <div className="flex flex-col sm:flex-row gap-2 items-center justify-center w-full">
            <Input
              className="flex-grow min-w-0 w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="输入任务内容"
              value={taskInput}
              onChange={(e) => setTaskInput(e.target.value)}
              onKeyDown={handleKeyDown}
            />
            <Button
              className="flex-shrink-0 w-full sm:w-auto flex items-center justify-center px-5 py-2 min-w-[120px]"
              onClick={addTask}
            >
              <PlusCircle className="mr-2 h-5 w-5" />
              新增任务
            </Button>
          </div>

          {/* 导出导入按钮 */}
          <div className="flex flex-col sm:flex-row gap-2 items-center justify-center mt-3">
            <Button
              className="w-full sm:w-auto flex items-center justify-center px-4 py-2"
              onClick={handleExport}
            >
              📤 导出任务列表
            </Button>
            <label className="w-full sm:w-auto flex items-center justify-center px-4 py-2 bg-white border border-gray-300 rounded-md cursor-pointer hover:bg-gray-50 transition">
              📥 导入任务列表
              <input type="file" accept=".json" onChange={handleImport} className="hidden" />
            </label>
            <Button
              variant="destructive"
              className="w-full sm:w-auto flex items-center justify-center px-4 py-2"
              onClick={handleClearAll}
            >
              🗑️ 清空任务列表
            </Button>
            <Button
              className="w-full sm:w-auto flex items-center justify-center px-4 py-2"
              onClick={() => generateReport()}
            >
              📊 生成任务报告
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6 max-w-6xl mx-auto">
          {[
            ["IN", "重要而不紧急"],
            ["IU", "重要而紧急"],
            ["UN", "不重要而不紧急"],
            ["UU", "不重要而紧急"],
          ].map(([key, label]) => (
            <Quadrant
              key={key}
              title={label}
              tasks={tasks[key]}
              onDrop={(id) => moveTaskToCategory(id, key)}
              color={colors[key]}
              showCompleted={showCompleted[key]}
              onToggleShowCompleted={() =>
                setShowCompleted((prev) => ({
                  ...prev,
                  [key]: !prev[key],
                }))
              }
            >
              {createSortableTasks(key, showCompleted[key])}
            </Quadrant>
          ))}
        </div>
      </div>

      {/* <AnimatePresence>
        {reportVisible && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 bg-black bg-opacity-30 z-50 flex items-center justify-center p-4"
          >
            <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full p-6 relative">
              <h2 className="text-xl font-bold mb-4 text-center">📊 任务报告</h2>
              <pre className="whitespace-pre-wrap text-gray-800">{reportText}</pre>
              <Button
                onClick={() => setReportVisible(false)}
                className="absolute top-2 right-2 text-gray-500 hover:text-black"
              >
                ✖
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence> */}
      
      <AnimatePresence>
        {reportVisible && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.4, ease: "easeInOut" }}
            className="fixed inset-0 bg-black bg-opacity-40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ y: -30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -30, opacity: 0 }}
              transition={{ duration: 0.4 }}
              className="bg-gradient-to-br from-white via-orange-50 to-white rounded-2xl shadow-2xl max-w-lg w-full p-6 relative border border-orange-200"
            >
              <h2 className="text-2xl font-extrabold mb-4 text-center text-orange-600 flex items-center justify-center gap-2">
                📊 任务报告
              </h2>

              <div className="text-gray-800 text-base leading-relaxed whitespace-pre-wrap space-y-3">
                {reportText.split("\n").map((line, i) => (
                  <p key={i} className="pl-2 relative">
                    <span className="absolute left-0 text-orange-400">•</span> {line}
                  </p>
                ))}
              </div>

              <div className="mt-6 text-center">
                <Button
                  onClick={() => setReportVisible(false)}
                  className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-2 rounded-lg shadow"
                >
                  关闭报告
                </Button>
              </div>

              {/* 关闭按钮（右上角） */}
              <button
                onClick={() => setReportVisible(false)}
                className="absolute top-2 right-2 text-gray-400 hover:text-gray-600"
                title="关闭"
              >
                ❌
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </DndProvider>
  );
}
