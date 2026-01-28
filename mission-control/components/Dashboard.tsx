/* src/components/Dashboard.tsx */
'use client';

import { useState, useEffect, useRef } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import startOtel from '../utils/otel';
import { Play, Square, RotateCcw, Activity, Zap, TrendingUp, Cpu, Gauge, Pause } from 'lucide-react';

// Types matches Backend state
type MissionState = {
    status: 'IDLE' | 'COUNTDOWN' | 'FLYING' | 'ABORT' | 'ORBIT';
    fuel: number;
    altitude: number;
    speed: number;
    countdown: number;
    mission_time: number;
    events?: { timestamp: string; message: string; type: string }[];
};

// Color Helper
const getChartColor = (status: string) => {
    switch (status) {
        case 'FLYING': return '#10b981'; // emerald-500
        case 'ORBIT': return '#8b5cf6'; // violet-500
        case 'ABORT': return '#ef4444'; // red-500
        case 'COUNTDOWN': return '#f59e0b'; // amber-500
        default: return '#3b82f6'; // blue-500
    }
};

// Smooth Number Component
const AnimatedNumber = ({ value }: { value: number }) => {
    const [displayValue, setDisplayValue] = useState(value);
    const previousValue = useRef(value);
    const startTime = useRef(0);

    useEffect(() => {
        previousValue.current = displayValue;
        startTime.current = performance.now();
        const duration = 900; // Slightly less than 1000ms interval

        let raf: number;

        const animate = (now: number) => {
            const elapsed = now - startTime.current;
            const progress = Math.min(elapsed / duration, 1);
            // Ease-out cubic
            const ease = 1 - Math.pow(1 - progress, 3);

            const nextValue = previousValue.current + (value - previousValue.current) * ease;
            setDisplayValue(nextValue);

            if (progress < 1) {
                raf = requestAnimationFrame(animate);
            }
        };

        raf = requestAnimationFrame(animate);
        return () => cancelAnimationFrame(raf);
    }, [value]);

    return <span className="tabular-nums">{Math.floor(displayValue)}</span>;
};

export default function Dashboard() {
    const [data, setData] = useState<MissionState | null>(null);
    const [history, setHistory] = useState<{ time: string; altitude: number, speed: number, fuel: number }[]>([]);


    useEffect(() => {
        startOtel();
    }, []);



    const getBackfilledHistory = () => {
        const now = new Date();
        return Array(60).fill(0).map((_, i) => {
            const t = new Date(now.getTime() - (59 - i) * 1000);
            return {
                time: t.toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' }),
                altitude: 0,
                speed: 0,
                fuel: 100
            };
        });
    };

    useEffect(() => {
        setHistory(getBackfilledHistory());



        const interval = setInterval(async () => {
            try {
                const res = await fetch('http://localhost:8080/telemetry');
                const json = await res.json();
                setData(json);


                if (json.status === 'FLYING') {
                    setHistory((prev) => {
                        const newPoint = {
                            time: new Date().toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' }),
                            altitude: Math.floor(json.altitude),
                            speed: Math.floor(json.speed),
                            fuel: Math.floor(json.fuel)
                        };
                        const newHistory = [...prev, newPoint];
                        return newHistory.slice(-60);
                    });
                } else if (json.status === 'ORBIT') {
                    setHistory((prev) => {
                        const newPoint = {
                            time: new Date().toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' }),
                            altitude: Math.floor(json.altitude),
                            speed: Math.floor(json.speed),
                            fuel: Math.floor(json.fuel)
                        };
                        return [...prev.slice(-60), newPoint].slice(-60);
                    });
                } else if (json.status === 'IDLE') {
                    setHistory((prev) => {
                        const timeNow = new Date().toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
                        const idlePoint = { time: timeNow, altitude: 0, speed: 0, fuel: 100 };
                        return [...prev.slice(-60), idlePoint];
                    });
                }

            } catch (e) {
                console.error("Telemetry link lost", e);
            }
        }, 1000);

        return () => clearInterval(interval);
    }, []);

    const sendCommand = async (cmd: 'start' | 'abort' | 'reset') => {
        await fetch(`http://localhost:8080/${cmd}`, { method: 'POST' });

        if (cmd === 'reset') {
            setHistory(getBackfilledHistory());
        }
    };

    if (!data) return (
        <div className="flex h-screen items-center justify-center bg-black text-white font-mono text-xs">
            <div className="flex gap-2 items-center">
                <div className="h-2 w-2 bg-white animate-pulse" />
                CONNECTING_TO_TELEMETRY_STREAM...
            </div>
        </div>
    );

    // Clean "Card" Component with static border
    const Card = ({ title, children, className, action }: { title?: string, children: React.ReactNode, className?: string, action?: React.ReactNode }) => (
        <div className={`border border-neutral-800 bg-black p-6 flex flex-col ${className}`}>
            {title && (
                <div className="flex justify-between items-start mb-6">
                    <h3 className="text-[12px] uppercase tracking-[0.2em] font-mono text-neutral-500 transition-colors duration-300">{title}</h3>
                    {action}
                </div>
            )}
            {children}
        </div>
    );

    const activeColor = getChartColor(data.status);

    return (
        <main className="min-h-screen bg-black text-white p-6 md:p-12 font-sans selection:bg-white selection:text-black">
            <div className="max-w-[1600px] mx-auto space-y-6">

                {/* TOP BAR / HEADER */}
                <div className="flex justify-between items-end border-b border-neutral-800 pb-6 transition-colors duration-500">
                    <div className="space-y-1">
                        <div className="flex items-center gap-2">
                            <div className={`h-2 w-2 rounded-full ${data.status === 'IDLE' ? 'bg-blue-500' :
                                data.status === 'COUNTDOWN' ? 'bg-amber-500 animate-pulse' :
                                    data.status === 'FLYING' ? 'bg-emerald-500 animate-pulse' :
                                        data.status === 'ORBIT' ? 'bg-violet-500' :
                                            data.status === 'ABORT' ? 'bg-red-500 animate-pulse' : 'bg-neutral-600'
                                }`} />
                            <span className="text-[12px] font-mono text-neutral-500 uppercase tracking-widest">System Online</span>
                        </div>
                        <h1 className="text-3xl font-light tracking-wide uppercase">Mission Lifecycle Monitor</h1>
                    </div>
                    <div className="text-right">
                        <div className="text-[10px] font-mono text-neutral-500 uppercase tracking-widest mb-1">Current Status</div>
                        <div className={`text-xl font-mono border-2 px-6 py-2 inline-block transition-all duration-300 relative overflow-hidden ${data.status === 'IDLE' ? 'border-blue-500 text-blue-500' :
                            data.status === 'COUNTDOWN' ? 'border-amber-500 text-amber-500' :
                                data.status === 'FLYING' ? 'border-emerald-500 text-emerald-500 bg-emerald-500/10' :
                                    data.status === 'ORBIT' ? 'border-violet-500 text-violet-500 bg-violet-500/10 shadow-[0_0_15px_rgba(139,92,246,0.3)]' :
                                        data.status === 'ABORT' ? 'border-red-500 text-red-500 bg-red-500/10 animate-pulse' :
                                            'border-neutral-800 text-neutral-500'
                            }`}>
                            <span>{data.status}</span>
                        </div>
                    </div>
                </div>

                {/* GRID LAYOUT */}
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">

                    {/* LEFT COLUMN: Controls & Key Data (1 Col) */}
                    <div className="space-y-6 lg:col-span-1">

                        {/* MAIN CLOCK */}
                        <Card title="Mission Clock">
                            <div className="flex flex-col items-center py-4">
                                <span className={`text-7xl font-mono font-light tracking-tighter tabular-nums transition-colors duration-300 ${data.status === 'COUNTDOWN' ? 'text-amber-500' :
                                    data.status === 'ABORT' ? 'text-red-500' :
                                        data.status === 'ORBIT' ? 'text-violet-400' : 'text-white'
                                    }`}>
                                    {data.status === 'COUNTDOWN' ? `-${data.countdown.toString().padStart(2, '0')}` :
                                        (data.status === 'FLYING' || data.status === 'ORBIT') ? `+${((data.mission_time || 0) / 1000).toFixed(0)}` :
                                            '00'}
                                </span>
                                <span className="text-[10px] text-neutral-600 uppercase tracking-[0.2em] mt-2">Seconds Elapsed</span>
                            </div>
                        </Card>

                        {/* CONTROLS */}
                        <Card title="Command Sequence">
                            <div className="space-y-3">
                                <button
                                    onClick={() => sendCommand('start')}
                                    disabled={data.status !== 'IDLE'}
                                    className="w-full h-12 border border-neutral-700 hover:border-emerald-500 hover:text-emerald-500 transition-all disabled:opacity-20 disabled:hover:border-neutral-700 disabled:hover:text-white flex items-center justify-center gap-2 text-sm uppercase tracking-widest"
                                >
                                    <Play size={16} /> Initiate Launch
                                </button>

                                <div className="grid grid-cols-2 gap-3">
                                    <button
                                        onClick={() => sendCommand('abort')}
                                        disabled={data.status === 'IDLE' || data.status === 'ABORT'}
                                        className="h-10 border border-neutral-800 text-neutral-400 hover:border-red-500 hover:text-red-500 transition-all flex items-center justify-center gap-2 text-[10px] uppercase tracking-widest"
                                    >
                                        <Square size={12} /> Abort
                                    </button>
                                    <button
                                        onClick={() => sendCommand('reset')}
                                        className="h-10 border border-neutral-800 text-neutral-400 hover:border-blue-500 hover:text-blue-500 transition-all flex items-center justify-center gap-2 text-[10px] uppercase tracking-widest"
                                    >
                                        <RotateCcw size={12} /> Reset
                                    </button>
                                </div>
                                <div className="grid grid-cols-2 gap-3 pt-4 border-t border-neutral-800 mt-4">
                                    <a
                                        href="http://localhost:16686"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="h-10 border border-neutral-800 text-neutral-500 hover:border-amber-500 hover:text-amber-500 transition-all flex items-center justify-center gap-2 text-[10px] uppercase tracking-widest no-underline"
                                    >
                                        <Activity size={12} /> Sys_Traces
                                    </a>
                                    <a
                                        href="http://localhost:9090"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="h-10 border border-neutral-800 text-neutral-500 hover:border-purple-500 hover:text-purple-500 transition-all flex items-center justify-center gap-2 text-[10px] uppercase tracking-widest no-underline"
                                    >
                                        <TrendingUp size={12} /> Sys_Metrics
                                    </a>
                                </div>
                            </div>
                        </Card>
                    </div>

                    {/* CENTER COLUMN: Visualization (2 Cols) */}
                    <div className="lg:col-span-2 flex flex-col gap-6">

                        {/* CHART */}
                        <div className="h-[350px]">
                            <Card title="Telemetry Analysis" className="h-full relative"
                                action={<div className="flex gap-2 text-[10px] text-neutral-500 font-mono">
                                    <span className={data.status !== 'IDLE' ? "text-red-500 animate-pulse" : ""}>LIVE</span>
                                    <span>REC</span>
                                </div>}
                            >
                                <div className="absolute top-16 left-8 z-10 pointer-events-none">
                                    <div className="text-4xl font-mono font-light text-white"><AnimatedNumber value={data.altitude} /></div>
                                    <div className="text-[10px] text-neutral-500 uppercase tracking-widest mt-1">Altitude (m)</div>
                                </div>

                                <div
                                    className="w-full h-full pt-8 font-mono text-[10px]"

                                >
                                    <ResponsiveContainer width="100%" height="100%">
                                        <AreaChart data={history}>
                                            <defs>
                                                <linearGradient id="colorGradient" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor={activeColor} stopOpacity={0.8} />
                                                    <stop offset="95%" stopColor={activeColor} stopOpacity={0} />
                                                </linearGradient>
                                            </defs>
                                            <CartesianGrid strokeDasharray="2 4" vertical={false} stroke="#222" />
                                            <XAxis dataKey="time" hide={true} />
                                            <YAxis hide={true} domain={[0, 'auto']} />
                                            <Tooltip
                                                isAnimationActive={false}
                                                cursor={{ stroke: '#444', strokeWidth: 1 }}
                                                content={({ payload, active, label }) => {
                                                    if (!active || !payload || payload.length === 0) return null;
                                                    return (
                                                        <div className="bg-black/90 border border-neutral-800 p-2 text-xs font-mono shadow-xl backdrop-blur-sm">
                                                            <div className="text-neutral-400 mb-1">{label}</div>
                                                            <div className="flex items-center gap-2">
                                                                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: activeColor }} />
                                                                <span className="text-white">
                                                                    {payload[0].value} <span className="text-neutral-500">m</span>
                                                                </span>
                                                            </div>
                                                        </div>
                                                    );
                                                }}
                                            />
                                            <Area
                                                type="monotone"
                                                dataKey="altitude"
                                                stroke={activeColor}
                                                strokeWidth={2}
                                                fillOpacity={1}
                                                fill="url(#colorGradient)"
                                                isAnimationActive={false}
                                            />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                </div>
                            </Card>
                        </div>

                        {/* TERMINAL LOG */}
                        <div className="h-[250px]">
                            <Card title="Flight Events" className="h-full overflow-hidden flex flex-col">
                                <div className="flex-1 min-h-0 overflow-y-scroll font-mono text-xs space-y-1 p-2 bg-neutral-900/50 border border-neutral-800/50 rounded scrollbar-thin scrollbar-thumb-neutral-700 scrollbar-track-transparent"
                                    ref={(el) => {
                                        if (el) el.scrollTop = el.scrollHeight;
                                    }}
                                >
                                    {data.events?.length === 0 && <div className="text-neutral-600 italic">No events recorded.</div>}
                                    {data.events?.map((evt, i) => (
                                        <div key={i} className="flex gap-3 animate-in fade-in slide-in-from-bottom-1 duration-300">
                                            <span className="text-neutral-600 shrink-0">
                                                [{new Date(evt.timestamp).toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })}]
                                            </span>
                                            <span className={
                                                evt.type === 'SUCCESS' ? 'text-emerald-400' :
                                                    evt.type === 'WARNING' ? 'text-amber-400' :
                                                        evt.type === 'ERROR' ? 'text-red-500 font-bold' :
                                                            'text-neutral-300'
                                            }>
                                                {evt.type !== 'INFO' && <span className="font-bold mr-2">{evt.type}</span>}
                                                {evt.message}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </Card>
                        </div>
                    </div>

                    {/* RIGHT COLUMN: Metrics (1 Col) */}
                    <div className="space-y-6 lg:col-span-1">

                        {/* VELOCITY */}
                        <Card title="Velocity" action={<Gauge size={14} className="text-neutral-600" />}>
                            <div className="mb-4">
                                <span className="text-4xl font-mono font-light tabular-nums"><AnimatedNumber value={data.speed} /></span>
                                <span className="text-xs text-neutral-500 ml-2">km/h</span>
                            </div>
                            <div className="w-full bg-neutral-900 h-px mb-1">
                                <div className={`h-px transition-all duration-300 ease-out ${data.speed > 28000 ? 'bg-red-500' : 'bg-white'
                                    }`} style={{ width: `${Math.min((data.speed / 30000) * 100, 100)}%` }} />
                            </div>
                            <div className="flex justify-between text-[8px] text-neutral-600 font-mono">
                                <span>0</span>
                                <span>30000</span>
                            </div>
                        </Card>

                        {/* FUEL */}
                        <Card title="Propellant" action={<Activity size={14} className="text-neutral-600" />}>
                            <div className="mb-4">
                                <span className="text-4xl font-mono font-light tabular-nums"><AnimatedNumber value={data.fuel} /></span>
                                <span className="text-xs text-neutral-500 ml-2">%</span>
                            </div>
                            <div className="flex gap-0.5">
                                {Array.from({ length: 20 }).map((_, i) => (
                                    <div
                                        key={i}
                                        className={`h-6 flex-1 transition-all duration-300 ${(data.fuel / 5) > i ? 'bg-white' : 'bg-neutral-900'
                                            } ${(data.fuel / 5) > i && data.fuel < 20 ? '!bg-red-600' : ''}`}
                                    />
                                ))}
                            </div>
                            <div className="mt-4 flex items-center justify-between text-[10px] text-neutral-500 uppercase tracking-widest font-mono">
                                <span>Tank 1</span>
                                <span className={data.fuel < 20 ? "text-red-500" : "text-emerald-500"}>{data.fuel < 20 ? "LOW" : "OK"}</span>
                            </div>
                        </Card>

                        {/* SYSTEMS CHECK */}
                        <Card title="Systems">
                            <div className="space-y-2">
                                {['Avionics', 'Guidance', 'Comm_Link', 'Power_Aux'].map((sys) => (
                                    <div key={sys} className="flex justify-between items-center text-xs font-mono border-b border-neutral-900 pb-2 last:border-0 last:pb-0">
                                        <span className="text-neutral-400">{sys.toUpperCase()}</span>
                                        <span className={data.status === 'ABORT' ? "text-red-500" : "text-emerald-500"}>
                                            {data.status === 'ABORT' ? 'OFFLINE' : 'ONLINE'}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </Card>

                    </div>

                </div>

                <div className="pt-12 text-center text-[10px] text-neutral-700 font-mono uppercase tracking-[0.3em]">
                    Mission Lifecycle Monitor // v0.0.1
                </div>

            </div>
        </main>
    );
}
