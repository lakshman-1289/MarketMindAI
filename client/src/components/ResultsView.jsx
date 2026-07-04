import React from 'react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis
} from 'recharts';
import { CheckCircle2, AlertCircle, TrendingUp, Download, Eye } from 'lucide-react';
import { motion } from 'framer-motion';
import axios from 'axios';

const API_BASE = "http://127.0.0.1:8001";

const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.1,
            delayChildren: 0.2
        }
    }
};

const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
        opacity: 1,
        y: 0,
        transition: { type: "spring", stiffness: 50 }
    }
};

const ResultsView = ({ report }) => {
    if (!report) return null;

    // Prepare data for Radar Chart
    const radarData = report.sentiment_analysis.map(item => ({
        subject: item.theme,
        A: item.impact_level === 'High' ? 100 : item.impact_level === 'Medium' ? 75 : 50,
        fullMark: 100
    }));

    // Handle PDF Download
    const handleDownloadPDF = async () => {
        try {
            const response = await axios.get(`${API_BASE}/reports/${report.report_id || report._id}/download`, {
                responseType: 'blob', // Important
            });
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            const category = report.product_category || 'report';
            link.setAttribute('download', `BrandBuster_${category.replace(/\s+/g, '_')}.pdf`);
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (error) {
            console.error("Error downloading PDF:", error);
            alert("Failed to download PDF. Please try again.");
        }
    };

    return (
        <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="w-full max-w-6xl space-y-8"
        >
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

                {/* Pricing Comparison Chart */}
                <motion.div variants={itemVariants} className="glass-card p-6 border-slate-800">
                    <div className="flex items-center gap-2 mb-6">
                        <TrendingUp className="text-brand-teal w-5 h-5" />
                        <h3 className="text-xl font-bold text-white">Price Benchmark</h3>
                    </div>
                    <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={report.price_analysis}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                                <XAxis dataKey="brand_name" stroke="#94a3b8" fontSize={12} tick={{ fill: '#94a3b8' }} />
                                <YAxis stroke="#94a3b8" fontSize={12} prefix="$" tick={{ fill: '#94a3b8' }} />
                                <Tooltip
                                    cursor={{ fill: '#1e293b', opacity: 0.4 }}
                                    contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '8px', color: '#fff' }}
                                    itemStyle={{ color: '#14b8a6' }}
                                />
                                <Bar dataKey="price" fill="#14b8a6" radius={[4, 4, 0, 0]} barSize={40} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </motion.div>

                {/* Sentiment Analysis Radar & List */}
                <motion.div variants={itemVariants} className="glass-card p-6 border-slate-800 flex flex-col">
                    <div className="flex items-center gap-2 mb-6">
                        <AlertCircle className="text-purple-400 w-5 h-5" />
                        <h3 className="text-xl font-bold text-white">Pain Point Radar</h3>
                    </div>

                    {/* Radar Chart */}
                    <div className="h-[200px] w-full mb-6 -ml-4">
                        <ResponsiveContainer width="100%" height="100%">
                            <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
                                <PolarGrid stroke="#334155" />
                                <PolarAngleAxis dataKey="subject" tick={{ fill: '#94a3b8', fontSize: 10 }} />
                                <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                                <Radar
                                    name="Impact"
                                    dataKey="A"
                                    stroke="#c084fc"
                                    strokeWidth={2}
                                    fill="#c084fc"
                                    fillOpacity={0.3}
                                />
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '8px', color: '#fff' }}
                                    itemStyle={{ color: '#c084fc' }}
                                />
                            </RadarChart>
                        </ResponsiveContainer>
                    </div>

                    {/* Scrollable list for details */}
                    <div className="space-y-3 overflow-y-auto max-h-[160px] pr-2 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
                        {report.sentiment_analysis.map((item, idx) => (
                            <div key={idx} className="p-3 bg-slate-900/50 rounded-lg border border-slate-800 hover:border-purple-400/30 transition-colors">
                                <div className="flex justify-between items-center mb-1">
                                    <h4 className="text-purple-300 font-bold text-xs uppercase truncate">{item.theme}</h4>
                                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${item.impact_level === 'High' ? 'bg-red-500/10 text-red-400' : 'bg-orange-500/10 text-orange-400'}`}>
                                        {item.impact_level}
                                    </span>
                                </div>
                                <p className="text-slate-500 text-xs line-clamp-2" title={item.description}>{item.description}</p>
                            </div>
                        ))}
                    </div>
                </motion.div>
            </div>

            {/* Winning Strategy Hero Card */}
            <motion.div variants={itemVariants} className="glass-card p-8 border-brand-teal/30 bg-gradient-to-br from-brand-slate/50 to-brand-teal/5 shadow-2xl shadow-brand-teal/5 relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-6 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                        onClick={handleDownloadPDF}
                        className="flex items-center gap-2 bg-slate-900 border border-slate-700 hover:border-brand-teal text-white px-4 py-2 rounded-lg text-sm font-medium transition-all shadow-lg hover:shadow-brand-teal/20 active:scale-95"
                    >
                        <Download className="w-4 h-4" /> Export PDF
                    </button>
                </div>

                <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 bg-brand-teal rounded-lg flex items-center justify-center shadow-lg shadow-brand-teal/20">
                        <CheckCircle2 className="text-white w-6 h-6" />
                    </div>
                    <div>
                        <h3 className="text-2xl font-bold text-white tracking-tight font-inter">Winning Offensive Strategy</h3>
                        <p className="text-brand-teal text-xs font-bold uppercase tracking-widest">Confidential • Generated by AI</p>
                    </div>
                </div>

                <div className="prose prose-invert max-w-none mb-8">
                    <p className="text-slate-300 text-lg leading-relaxed whitespace-pre-wrap font-light border-l-4 border-brand-teal/50 pl-6 italic">
                        "{report.winning_strategy}"
                    </p>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-slate-900/50 px-4 py-3 rounded-xl border border-slate-800">
                        <span className="text-slate-500 text-[10px] uppercase font-bold block mb-1">Target Category</span>
                        <span className="text-white font-semibold text-sm truncate block" title={report.product_category}>{report.product_category}</span>
                    </div>
                    <div className="bg-slate-900/50 px-4 py-3 rounded-xl border border-slate-800">
                        <span className="text-slate-500 text-[10px] uppercase font-bold block mb-1">Competitors Scanned</span>
                        <span className="text-white font-semibold text-sm">{report.price_analysis.length} Brands</span>
                    </div>
                    <div className="bg-slate-900/50 px-4 py-3 rounded-xl border border-slate-800">
                        <span className="text-slate-500 text-[10px] uppercase font-bold block mb-1">Top Pain Point</span>
                        <span className="text-white font-semibold text-sm truncate block">
                            {report.sentiment_analysis.find(i => i.impact_level === 'High')?.theme || "N/A"}
                        </span>
                    </div>
                    <div className="bg-slate-900/50 px-4 py-3 rounded-xl border border-slate-800 flex items-center justify-between group-hover:bg-brand-teal/10 transition-colors cursor-pointer" onClick={handleDownloadPDF}>
                        <div>
                            <span className="text-slate-500 text-[10px] uppercase font-bold block mb-1">Action</span>
                            <span className="text-brand-teal font-bold text-sm">Download Report</span>
                        </div>
                        <Download className="w-4 h-4 text-brand-teal" />
                    </div>
                </div>
            </motion.div>
        </motion.div>
    );
};

export default ResultsView;
