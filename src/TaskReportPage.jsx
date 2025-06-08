import { useEffect, useState } from "react";
import { motion, AnimatePresence, useAnimation, useMotionValue, useTransform, animate } from "framer-motion";
import confetti from "canvas-confetti";
import { Flame, BookOpen, Clock, Leaf } from "lucide-react";
import {
    PieChart,
    RadarChart,
    PolarGrid,
    PolarAngleAxis,
    PolarRadiusAxis,
    Pie,
    Cell,
    Tooltip,
    ResponsiveContainer,
    Radar,
} from "recharts";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

const quadrantMap = {
    IU: { name: "重要而紧急", icon: <Flame size={28} color="#EF4444" />, color: "#EF4444" },
    IN: { name: "重要而不紧急", icon: <Clock size={28} color="#F59E0B" />, color: "#F59E0B" },
    UU: { name: "不重要而紧急", icon: <Leaf size={28} color="#10B981" />, color: "#10B981" },
    UN: { name: "不重要而不紧急", icon: <BookOpen size={28} color="#3B82F6"/> , color: "#3B82F6" },
};

function generateDetailedReport(tasks) {
    const date = `🗓️ 当前日期：${new Date().toLocaleDateString()}`;
    let total = 0,
        completed = 0;
    const quadrants = [];

    for (const key in tasks) {
        const list = tasks[key] || [];
        const compTasks = list.filter((t) => t.completed);

        total += list.length;
        completed += compTasks.length;

        quadrants.push({
            key,
            name: quadrantMap[key].name,
            icon: quadrantMap[key].icon,
            color: quadrantMap[key].color,
            total: list.length,
            completed: compTasks.length,
            completedTasks: compTasks.map((t) => t.name || t.text || "(未命名任务)"),
        });
    }

    const rate = total > 0 ? ((completed / total) * 100).toFixed(1) : "0.0";

    return { date, quadrants, rate };
}

// 数字滚动动画组件
function AnimatedNumber({ value }) {
    const motionValue = useMotionValue(0);
    const rounded = useTransform(motionValue, (latest) => Math.round(latest));

    const [displayValue, setDisplayValue] = useState(0);

    useEffect(() => {
        const controls = animate(motionValue, value, { duration: 3, ease: "easeOut" });
        rounded.onChange((v) => setDisplayValue(v));
        return () => controls.stop();
    }, [value, motionValue, rounded]);

    return <motion.span className="inline-block w-12 tabular-nums">{displayValue}</motion.span>;
}

const cardVariants = {
    front: { rotateY: 0 },
    back: { rotateY: 180 },
};

function FlipCard({ quadrant }) {
    const [flipped, setFlipped] = useState(false);

    return (
        <motion.div
            className="relative w-full h-72 cursor-pointer perspective-1000"
            onClick={() => setFlipped(!flipped)}
            whileHover={{ scale: 1.05 }}
        >
            {/* 正面 */}
            <motion.div
                className="absolute w-full h-full rounded-2xl shadow-2xl bg-white p-6 flex flex-col justify-center items-center text-center"
                variants={cardVariants}
                initial="front"
                animate={flipped ? "back" : "front"}
                transition={{ duration: 0.8 }}
                style={{
                    backfaceVisibility: "hidden",
                    WebkitBackfaceVisibility: "hidden",
                    position: "absolute",
                    top: 0,
                    left: 0,
                    rotateY: 0,
                }}
            >
                <div
                    className="flex items-center justify-center rounded-full w-16 h-16 mb-4"
                    style={{ backgroundColor: quadrant.color + "33" }}
                >
                    {quadrant.icon}
                </div>
                <h3 className="text-2xl font-bold mb-2">{quadrant.name}</h3>
                <p className="text-lg">
                    总任务: <AnimatedNumber value={quadrant.total} />
                </p>
                <p className="text-lg text-green-600">
                    已完成: <AnimatedNumber value={quadrant.completed} />
                </p>
                <p className="mt-4 text-sm text-gray-400">点击卡片查看详情</p>
            </motion.div>

            {/* 背面 */}
            <motion.div
                className="absolute w-full h-full rounded-2xl shadow-2xl bg-white p-6 overflow-auto text-left"
                variants={cardVariants}
                initial="back"
                animate={flipped ? "front" : "back"}
                transition={{ duration: 0.8 }}
                style={{
                    backfaceVisibility: "hidden",
                    WebkitBackfaceVisibility: "hidden",
                    transform: "rotateY(180deg)",
                    position: "absolute",
                    top: 0,
                    left: 0,
                }}
            >
                <h4 className="text-xl font-semibold mb-3">📝 {quadrant.name}</h4>
                {quadrant.completedTasks.length ? (
                    <ul className="list-disc list-inside text-sm max-h-48 overflow-y-auto text-gray-700">
                        {quadrant.completedTasks.map((task, i) => (
                            <li key={i}>{task}</li>
                        ))}
                    </ul>
                ) : (
                    <p className="text-gray-500">暂无已完成任务</p>
                )}
                {/* <button
                    className="mt-6 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
                    onClick={(e) => {
                        e.stopPropagation();
                        setFlipped(false);
                    }}
                >
                    返回
                </button> */}
            </motion.div>
        </motion.div>
    );
}

export default function TaskReportPage({ tasks, onBack }) {
    const [quote, setQuote] = useState("");
    useEffect(() => {
        fetch("/time-quadrant-app/sentences.txt")
            .then((res) => res.text())
            .then((text) => {
                const lines = text.split("\n").map((line) => line.trim()).filter(Boolean);
                const randomLine = lines[Math.floor(Math.random() * lines.length)];
                setQuote(randomLine);
            });
    }, []);

    const summary = generateDetailedReport(tasks);
    useEffect(() => {
        confetti({ particleCount: 100, spread: 150, origin: { y: 0.6 } });
    }, []);

    const radarData = summary.quadrants.map((q) => ({
        subject: q.name,
        completed: q.completed,
        total: q.total,
    }));

    const pieData = summary.quadrants.map((q) => ({
        name: q.name,
        value: q.completed,
        color: q.color,
    }));

    const handleDownloadPDF = async () => {
        const reportElement = document.getElementById("task-report-content");
        if (!reportElement) return;

        const canvas = await html2canvas(reportElement, { scale: 2 });
        const imgData = canvas.toDataURL("image/png");
        const pdf = new jsPDF("p", "mm", "a4");

        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

        pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
        pdf.save("任务报告.pdf");
    };

    return (
        <div
            id="task-report-content"
            className="min-h-screen bg-gradient-to-br from-slate-100 to-indigo-200 p-10"
            style={{ minWidth: "1024px" }}
        >
            <motion.div
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="max-w-[1280px] mx-auto bg-white/90 rounded-3xl shadow-2xl p-10 backdrop-blur-md"
            >
                {/* 顶部大成就banner */}
                <motion.div
                    className="bg-gradient-to-r from-green-400 via-blue-500 to-purple-600 text-white rounded-3xl p-8 text-center shadow-lg mb-10 select-none"
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                >
                    <h2 className="text-4xl font-extrabold mb-3 drop-shadow-lg">🎉 任务报告！</h2>
                    <p className="text-xl font-medium">{summary.date}</p>
                    {quote && (
                        <p className="mt-4 italic text-lg text-indigo-100 drop-shadow-sm">
                            “{quote}”
                        </p>
                    )}
                    <p className="text-3xl font-bold mt-4 tracking-wide drop-shadow-md">
                        ✅ 当前完成率：<AnimatedNumber value={parseFloat(summary.rate)} />%
                    </p>
                </motion.div>

                {/* 四个翻转卡片，4列网格 */}
                <div className="grid grid-cols-4 gap-8 mb-12">
                    {summary.quadrants.map((q) => (
                        <FlipCard key={q.key} quadrant={q} />
                    ))}
                </div>

                {/* 图表区域 2列 */}
                <div className="grid grid-cols-2 gap-10">
                    {/* 饼图 */}
                    <div className="bg-white/80 p-6 rounded-3xl shadow-xl">
                        <h4 className="text-2xl font-semibold mb-6 text-center">已完成任务分布</h4>
                        <ResponsiveContainer width="100%" height={280}>
                            <PieChart>
                                <Pie
                                    data={pieData}
                                    dataKey="value"
                                    cx="50%"
                                    cy="50%"
                                    outerRadius={85}
                                    label={({ name, percent }) =>
                                        percent > 0 ? `${name}: ${(percent * 100).toFixed(1)}%` : ""
                                    }
                                    labelLine={false}
                                    >
                                    {pieData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Pie>
                                <Tooltip />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>

                    {/* 雷达图 */}
                    <div className="bg-white/80 p-6 rounded-3xl shadow-xl">
                        <h4 className="text-2xl font-semibold mb-6 text-center">各象限任务完成情况</h4>
                        <ResponsiveContainer width="100%" height={280}>
                            <RadarChart data={radarData} cx="50%" cy="50%" outerRadius="80%">
                                <PolarGrid />
                                <PolarAngleAxis dataKey="subject" />
                                <PolarRadiusAxis angle={30} domain={[0, Math.max(...radarData.map((d) => d.total))]} />
                                <Radar
                                    name="已完成"
                                    dataKey="completed"
                                    stroke="#8884d8"
                                    fill="#8884d8"
                                    fillOpacity={0.6}
                                />
                            </RadarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="mt-12 flex justify-center gap-8">
                    <button
                        onClick={onBack}
                        className="px-8 py-3 rounded-2xl border border-indigo-500 text-indigo-700 font-semibold hover:bg-indigo-50 transition"
                    >
                        关闭报告
                    </button>
                    {/* <button
                        onClick={handleDownloadPDF}
                        className="px-8 py-3 rounded-2xl bg-indigo-600 text-white font-semibold hover:bg-indigo-700 transition"
                    >
                        下载 PDF 报告
                    </button> */}
                </div>
            </motion.div>
        </div>
    );
}
