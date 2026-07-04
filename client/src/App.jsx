import React, { useState, useEffect } from 'react';
import { Search, Rocket, TrendingUp, BarChart3, ChevronRight, Loader2, CheckCircle2, User, Brain, BarChart, History, X, Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import AgentTerminal from './components/AgentTerminal';
import ResultsView from './components/ResultsView';

const API_BASE = "http://127.0.0.1:8001";

function App() {
    const [product, setProduct] = useState('');
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [activeAgent, setActiveAgent] = useState(0);
    const [reports, setReports] = useState([]);
    const [currentReport, setCurrentReport] = useState(null);
    const [showHistory, setShowHistory] = useState(false);
    const [showResult, setShowResult] = useState(false);
    const [pendingReportId, setPendingReportId] = useState(null);

    // Fetch history on load
    useEffect(() => {
        fetchReports();
    }, []);

    const fetchReports = async () => {
        try {
            const res = await axios.get(`${API_BASE}/reports`);
            setReports(res.data);
        } catch (err) {
            console.error("Fetch history error:", err);
        }
    };

    useEffect(() => {
        let interval;
        let poll;
        let timeout;

        if (isAnalyzing) {
            // Simulated progress for UI feel
            interval = setInterval(() => {
                setActiveAgent(prev => (prev < 2 ? prev + 1 : prev));
            }, 10000);

            // Timeout if agents take too long (reduced from 5 to 2 minutes)
            timeout = setTimeout(() => {
                setIsAnalyzing(false);
                alert("Analysis is taking longer than expected. Please check your backend terminal for errors, or try again.");
            }, 120000);

            // Start polling for result
            poll = setInterval(async () => {
                try {
                    // First, try polling by report_id
                    if (pendingReportId) {
                        try {
                            const res = await axios.get(`${API_BASE}/reports/${pendingReportId}`);
                            const report = res.data;
                            if (report && report.status === "completed") {
                                setCurrentReport(report);
                                setIsAnalyzing(false);
                                setShowResult(true);
                                setPendingReportId(null);
                                fetchReports();
                                clearInterval(poll);
                                clearTimeout(timeout);
                                return;
                            }
                        } catch (e) {
                            // 404 is expected if not found yet, continue to fallback
                        }
                    }

                    // Fallback: Check latest report by product_category
                    const res = await axios.get(`${API_BASE}/reports`);
                    const latest = res.data[0];
                    if (latest &&
                        latest.product_category?.toLowerCase() === product.toLowerCase() &&
                        latest.status === "completed") {
                        setCurrentReport(latest);
                        setIsAnalyzing(false);
                        setShowResult(true);
                        setPendingReportId(null);
                        fetchReports();
                        clearInterval(poll);
                        clearTimeout(timeout);
                    }
                } catch (e) {
                    console.error("Polling error:", e);
                }
            }, 3000); // Poll every 3 seconds instead of 5
        }

        return () => {
            clearInterval(interval);
            clearInterval(poll);
            clearTimeout(timeout);
        };
    }, [isAnalyzing, product]);

    const handleSearch = async (e) => {
        e.preventDefault();
        if (!product) return;

        setIsAnalyzing(true);
        setActiveAgent(0);
        setShowResult(false);

        try {
            const res = await axios.post(`${API_BASE}/analyze`, {
                product_category: product
            });
            setPendingReportId(res.data.report_id);
        } catch (err) {
            console.error("Backend error:", err);
            setIsAnalyzing(false);
            alert("Failed to start analysis. Check backend.");
        }
    };

    const handleSelectReport = (report) => {
        setCurrentReport(report);
        setShowResult(true);
        setIsAnalyzing(false);
        setShowHistory(false);
    };

    return (
        <div className="min-h-screen selection:bg-brand-teal/30">
            {/* Sidebar Overlay */}
            <AnimatePresence>
                {showHistory && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setShowHistory(false)}
                            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60]"
                        />
                        <motion.div
                            initial={{ x: '100%' }}
                            animate={{ x: 0 }}
                            exit={{ x: '100%' }}
                            className="fixed right-0 top-0 bottom-0 w-80 bg-slate-900 border-l border-slate-800 z-[70] p-6 shadow-2xl"
                        >
                            <div className="flex justify-between items-center mb-8">
                                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                                    <History className="w-5 h-5 text-brand-teal" /> History
                                </h3>
                                <button onClick={() => setShowHistory(false)} className="text-slate-500 hover:text-white">
                                    <X className="w-6 h-6" />
                                </button>
                            </div>

                            <div className="space-y-4 overflow-y-auto max-h-[calc(100vh-120px)] pr-2 scrollbar-hide">
                                {reports.length === 0 ? (
                                    <p className="text-slate-500 text-sm text-center py-10 italic">No reports found yet.</p>
                                ) : reports.map((rep) => (
                                    <div
                                        key={rep._id}
                                        onClick={() => handleSelectReport(rep)}
                                        className="glass-card p-4 border-slate-800 hover:border-brand-teal/50 cursor-pointer group transition-all"
                                    >
                                        <h4 className="text-white font-bold text-sm mb-1 group-hover:text-brand-teal transition-colors line-clamp-1">
                                            {rep.product_category}
                                        </h4>
                                        <div className="flex items-center gap-2 text-slate-500 text-[10px] uppercase font-bold tracking-widest">
                                            <Clock className="w-3 h-3" />
                                            {new Date(rep.created_at).toLocaleDateString()}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            {/* Navbar */}
            <nav className="p-6 flex justify-between items-center max-w-7xl mx-auto border-b border-slate-900 mb-4 bg-brand-dark/50 backdrop-blur-lg sticky top-0 z-50">
                <div className="flex items-center gap-2 cursor-pointer" onClick={() => { setIsAnalyzing(false); setShowResult(false); }}>
                    <div className="w-10 h-10 bg-brand-teal rounded-xl flex items-center justify-center shadow-lg shadow-brand-teal/20">
                        <Rocket className="text-white w-6 h-6" />
                    </div>
                    <span className="text-2xl font-bold tracking-tight text-white">Brand<span className="text-brand-teal">Buster</span></span>
                </div>
                <div className="hidden md:flex gap-8 text-slate-400 font-medium text-sm">
                    <button className="hover:text-brand-teal transition-colors" onClick={() => { setIsAnalyzing(false); setShowResult(false); }}>Dashboard</button>
                    <button className="hover:text-brand-teal transition-colors" onClick={() => setShowHistory(true)}>History</button>
                </div>
                <button className="px-5 py-2 rounded-full bg-slate-800/50 border border-slate-700 hover:border-brand-teal text-slate-300 transition-all font-medium text-sm">
                    {reports.length} Reports
                </button>
            </nav>

            <AnimatePresence mode="wait">
                {!isAnalyzing && !showResult ? (
                    <motion.main
                        key="hero"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="max-w-7xl mx-auto px-6 py-12 flex flex-col items-center text-center"
                    >
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-900/50 border border-slate-800 text-brand-teal text-xs font-semibold uppercase tracking-widest mb-8"
                        >
                            <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-teal opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-brand-teal"></span>
                            </span>
                            Agentic Market Intelligence
                        </motion.div>

                        <motion.h1
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                            className="text-5xl md:text-7xl font-bold text-white mb-6 leading-tight pb-2"
                        >
                            Outsmart your <br />
                            <span className="text-gradient">Competitors with AI.</span>
                        </motion.h1>

                        <motion.p
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                            className="text-slate-400 text-lg md:text-xl max-w-2xl mb-12"
                        >
                            Launch smarter. Our multi-agent system tracks pricing, critiques sentiment,
                            and builds your offensive market strategy in seconds.
                        </motion.p>

                        <motion.form
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.3 }}
                            onSubmit={handleSearch}
                            className="w-full max-w-2xl relative"
                        >
                            <div className="absolute inset-y-0 left-5 flex items-center pointer-events-none">
                                <Search className="text-slate-500 w-5 h-5" />
                            </div>
                            <input
                                type="text"
                                placeholder="Search category (e.g., 'Mechanical Keyboards')"
                                value={product}
                                onChange={(e) => setProduct(e.target.value)}
                                className="w-full h-16 pl-14 pr-36 bg-slate-900/80 border border-slate-800 rounded-2xl text-white text-lg focus:outline-none focus:ring-2 focus:ring-brand-teal/50 focus:border-brand-teal transition-all shadow-2xl backdrop-blur-xl"
                            />
                            <button
                                type="submit"
                                className="absolute right-2 top-2 bottom-2 px-6 bg-brand-teal hover:bg-brand-teal-hover text-white font-bold rounded-xl flex items-center gap-2 transition-all shadow-lg active:scale-95"
                            >
                                Analyze <ChevronRight className="w-4 h-4" />
                            </button>
                        </motion.form>

                        <div className="mt-24 grid grid-cols-1 md:grid-cols-3 gap-8 w-full max-w-5xl">
                            {[
                                { icon: <TrendingUp className="text-brand-teal" />, title: "Live Pricing", desc: "Real-time scraping from major retailers." },
                                { icon: <Search className="text-brand-accent" />, title: "Sentiment Analysis", desc: "Deep dive into thousands of customer reviews." },
                                { icon: <BarChart3 className="text-emerald-400" />, title: "Strategic Roadmap", desc: "Actionable steps to dominate the market." },
                            ].map((item, idx) => (
                                <motion.div
                                    key={idx}
                                    initial={{ opacity: 0, y: 20 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ delay: idx * 0.1 }}
                                    className="glass-card p-6 text-left group hover:border-brand-teal/50 transition-all border-slate-800"
                                >
                                    <div className="w-12 h-12 bg-slate-900 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                        {item.icon}
                                    </div>
                                    <h3 className="text-white font-bold mb-2">{item.title}</h3>
                                    <p className="text-slate-400 text-sm leading-relaxed">{item.desc}</p>
                                </motion.div>
                            ))}
                        </div>
                    </motion.main>
                ) : isAnalyzing ? (
                    <motion.div
                        key="analysis"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0 }}
                        className="max-w-7xl mx-auto px-6 py-12 flex flex-col items-center"
                    >
                        <div className="text-center mb-12">
                            <h2 className="text-3xl font-bold text-white mb-2">Analyzing <span className="text-brand-teal">"{product}"</span></h2>
                            <p className="text-slate-500 max-w-md mx-auto">
                                Our multi-agent swarm is currently browsing the live web.
                                <span className="block mt-1 text-xs text-brand-teal/60 italic font-mono uppercase tracking-tighter">
                                    Real-time research takes 1-2 minutes...
                                </span>
                            </p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full mb-12 max-w-5xl">
                            {[
                                { icon: <Search />, label: "Price Watcher", status: activeAgent >= 0 ? (activeAgent === 0 ? "Working..." : "Completed") : "Waiting" },
                                { icon: <Brain />, label: "Sentiment Critic", status: activeAgent >= 1 ? (activeAgent === 1 ? "Working..." : "Completed") : "Waiting" },
                                { icon: <BarChart />, label: "Strategy Lead", status: activeAgent >= 2 ? "Finishing..." : "Waiting" },
                            ].map((agent, i) => (
                                <div key={i} className={`glass-card p-5 flex items-center gap-4 transition-all duration-500 ${activeAgent === i ? 'border-brand-teal/50 ring-1 ring-brand-teal/20' : 'opacity-40'}`}>
                                    <div className={`p-3 rounded-lg ${activeAgent === i ? 'bg-brand-teal text-white animate-pulse' : 'bg-slate-800 text-slate-500'}`}>
                                        {agent.icon}
                                    </div>
                                    <div className="flex-1">
                                        <h4 className="text-white font-bold text-sm">{agent.label}</h4>
                                        <span className={`text-[10px] uppercase tracking-widest font-bold ${agent.status.includes('...') ? 'text-brand-teal' : agent.status === 'Completed' ? 'text-emerald-400' : 'text-slate-600'}`}>
                                            {agent.status}
                                        </span>
                                    </div>
                                    {agent.status === 'Completed' && <CheckCircle2 className="w-5 h-5 text-emerald-400" />}
                                    {agent.status.includes('...') && <Loader2 className="w-5 h-5 text-brand-teal animate-spin" />}
                                </div>
                            ))}
                        </div>

                        <AgentTerminal isVisible={isAnalyzing} product={product} />

                        <button
                            onClick={() => setIsAnalyzing(false)}
                            className="mt-12 text-slate-500 text-sm hover:text-white transition-colors flex items-center gap-2 group"
                        >
                            Cancel Analysis
                        </button>
                    </motion.div>
                ) : (
                    <motion.div
                        key="results"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="max-w-7xl mx-auto px-6 py-12 flex flex-col items-center"
                    >
                        <div className="flex justify-between w-full max-w-6xl mb-8 items-end">
                            <div>
                                <div className="text-brand-teal text-xs font-bold uppercase tracking-widest mb-1">Market Snapshot</div>
                                <h2 className="text-4xl font-bold text-white">{currentReport?.product_category}</h2>
                            </div>
                            <button
                                onClick={() => setShowResult(false)}
                                className="px-6 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white font-medium hover:bg-slate-800 transition-all"
                            >
                                New Analysis
                            </button>
                        </div>

                        <ResultsView report={currentReport} />
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Decorative background */}
            <div className="fixed top-0 left-1/2 -translate-x-1/2 w-full h-full -z-10 pointer-events-none overflow-hidden">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-brand-teal/10 rounded-full blur-[120px] animate-pulse-slow"></div>
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-brand-accent/5 rounded-full blur-[120px] animate-pulse-slow"></div>
            </div>
        </div>
    );
}

export default App;
