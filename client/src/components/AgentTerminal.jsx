import React, { useState, useEffect, useRef } from 'react';
import { Terminal as TerminalIcon, Circle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const getAgentLogs = (product) => [
    `[Price Watcher] Initializing search for top 5 competitors in ${product}...`,
    `[Price Watcher] Scanning Amazon for ${product} price benchmarks...`,
    `[Price Watcher] Found Walmart listing for ${product} - Analyzing price delta...`,
    `[Price Watcher] Extracting technical specs for ${product} comparison...`,
    `[Sentiment Critic] Scanning Reddit and Amazon reviews for ${product} failures...`,
    `[Sentiment Critic] Detected recurring complaint: 'Build quality issues' in this category`,
    `[Sentiment Critic] Noted user preference for durability in ${product} designs.`,
    `[Strategy Consultant] Synthesizing ${product} pricing trends and pain points...`,
    `[Strategy Consultant] Identifying market gap for a premium ${product} brand...`,
    `[Strategy Consultant] Formulating winning value proposition for ${product}...`,
    `[System] Finalizing comprehensive ${product} strategy report...`
];

const AgentTerminal = ({ isVisible, product }) => {
    const [logs, setLogs] = useState([]);
    const scrollRef = useRef(null);
    const AGENT_THOUGHTS = getAgentLogs(product || "Category");

    useEffect(() => {
        let interval;
        if (isVisible) {
            let index = 0;
            // Clear previous logs when starting fresh
            setLogs([]);

            interval = setInterval(() => {
                if (index < AGENT_THOUGHTS.length) {
                    const thought = AGENT_THOUGHTS[index];
                    setLogs(prev => [...prev, {
                        id: `log-${index}-${Date.now()}`,
                        text: thought || "Agent is processing...",
                        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
                    }]);
                    index++;
                } else {
                    clearInterval(interval);
                }
            }, 2500);
        } else {
            setLogs([]);
        }
        return () => clearInterval(interval);
    }, [isVisible]);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [logs]);

    return (
        <div className="w-full max-w-4xl glass-card overflow-hidden flex flex-col h-[400px] border-slate-800 shadow-2xl">
            <div className="bg-slate-900/80 px-4 py-2 flex items-center justify-between border-b border-slate-800">
                <div className="flex items-center gap-2">
                    <TerminalIcon className="w-4 h-4 text-brand-teal" />
                    <span className="text-xs font-mono font-bold text-slate-400 uppercase tracking-widest">Agent Think-Tank</span>
                </div>
                <div className="flex gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-slate-700"></div>
                    <div className="w-2.5 h-2.5 rounded-full bg-slate-700"></div>
                    <div className="w-2.5 h-2.5 rounded-full bg-brand-teal/50 animate-pulse"></div>
                </div>
            </div>

            <div
                ref={scrollRef}
                className="flex-1 p-4 font-mono text-sm overflow-y-auto space-y-2 scrollbar-hide bg-black/20"
            >
                <AnimatePresence initial={false}>
                    {logs.map((log) => (
                        <motion.div
                            key={log.id}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="flex gap-3"
                        >
                            <span className="text-slate-600 shrink-0">[{log.time}]</span>
                            <span className={
                                log.text?.includes('Price') ? 'text-blue-400' :
                                    log.text?.includes('Sentiment') ? 'text-purple-400' :
                                        log.text?.includes('Strategy') ? 'text-brand-teal' : 'text-slate-300'
                            }>
                                {log.text}
                            </span>
                        </motion.div>
                    ))}
                </AnimatePresence>
                {isVisible && logs.length < AGENT_THOUGHTS.length && (
                    <div className="flex gap-2 items-center text-brand-teal mt-2">
                        <span className="w-2 h-4 bg-brand-teal animate-pulse"></span>
                        <span className="text-xs italic opacity-50">Agent is thinking...</span>
                    </div>
                )}
            </div>
        </div>
    );
};


export default AgentTerminal;
