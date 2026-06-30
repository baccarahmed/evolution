"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, Briefcase, Zap, Shield, Layout, Layers, Box, Cpu, ArrowRight } from "lucide-react";

// Mock UI components to replace non-existent imports
const Badge = ({ children, className }) => (
    <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest ${className}`}>
        {children}
    </span>
);

const Button = ({ children, className }) => (
    <button className={`font-bold transition-all ${className}`}>
        {children}
    </button>
);

const navItems = [
    { name: "Products", hasDropdown: true },
    { name: "Solutions", hasDropdown: false },
    { name: "Resources", hasDropdown: false },
    { name: "Pricing", hasDropdown: false },
];

const megaMenuData = [
    {
        icon: Layout,
        title: "Frontend Platform",
        desc: "Build lightning fast web apps.",
        badge: "New"
    },
    {
        icon: Zap,
        title: "Serverless Functions",
        desc: "Deploy edge computing APIs.",
        badge: null
    },
    {
        icon: Shield,
        title: "Enterprise SSO",
        desc: "Secure biometric authentication.",
        badge: null
    },
    {
        icon: Cpu,
        title: "AI Workloads",
        desc: "Neural processing instances.",
        badge: null
    },
    {
        icon: Layers,
        title: "Database Scaling",
        desc: "Postgres horizontal shards.",
        badge: "Beta"
    },
    {
        icon: Box,
        title: "Storage Buckets",
        desc: "Global CDN object delivery.",
        badge: null
    }
];

const NavMegaMenu01 = () => {
    const [hoveredMenu, setHoveredMenu] = useState(null);

    return (
        <div className="w-full mx-auto p-4 md:p-8 flex justify-center bg-zinc-50 dark:bg-black/5 rounded-[40px] relative h-[600px]">
            
            {/* Mock Header Container */}
            <div className="w-full absolute top-8 left-0 px-4 md:px-12 z-50">
                <nav className="max-w-6xl mx-auto flex items-center justify-between h-20 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-xl border border-zinc-200 dark:border-zinc-800 rounded-3xl px-6 md:px-8 shadow-xl">
                    
                    {/* Logo */}
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-black shadow-lg shadow-indigo-500/20">
                            LW
                        </div>
                        <span className="font-black text-xl tracking-tight text-zinc-900 dark:text-zinc-100 hidden sm:block">
                            Lightswind
                        </span>
                    </div>

                    {/* Desktop Menu Center */}
                    <div className="hidden md:flex items-center h-full gap-1">
                        {navItems.map((item) => (
                            <div 
                                key={item.name}
                                className="h-full px-4 flex items-center font-bold text-sm text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 cursor-pointer transition-colors relative"
                                onMouseEnter={() => item.hasDropdown && setHoveredMenu(item.name)}
                                onMouseLeave={() => setHoveredMenu(null)}
                            >
                                {item.name}
                                {item.hasDropdown && (
                                    <ChevronDown className={`w-4 h-4 ml-1.5 transition-transform ${hoveredMenu === item.name ? 'rotate-180 text-indigo-500' : ''}`} />
                                )}
                                
                                {/* Bottom highlight line */}
                                {hoveredMenu === item.name && (
                                    <motion.div 
                                        layoutId="nav-highlight"
                                        className="absolute bottom-0 left-0 right-0 h-1 bg-indigo-500 rounded-t-full"
                                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                                    />
                                )}

                                {/* Dropdown Panel */}
                                {item.hasDropdown && (
                                    <AnimatePresence>
                                        {hoveredMenu === item.name && (
                                            <motion.div
                                                initial={{ opacity: 0, y: 15, scale: 0.95 }}
                                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                                transition={{ duration: 0.2, ease: "easeOut" }}
                                                className="absolute top-[80px] -left-[300px] w-[800px] bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 shadow-2xl rounded-[32px] p-8 cursor-default flex overflow-hidden before:absolute before:-top-4 before:left-[350px] before:w-8 before:h-8 before:rotate-45 before:-z-10 before:bg-white dark:before:bg-zinc-950 before:border-l before:border-t before:border-zinc-200 dark:before:border-zinc-800"
                                            >
                                                
                                                {/* Left Grid */}
                                                <div className="w-2/3 grid grid-cols-2 gap-x-8 gap-y-6 pr-8 border-r border-zinc-100 dark:border-zinc-800/80">
                                                    {megaMenuData.map((menuItem) => (
                                                        <div key={menuItem.title} className="flex gap-4 group cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-900 p-3 -m-3 rounded-2xl transition-colors">
                                                            <div className="w-12 h-12 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 text-indigo-500 group-hover:bg-indigo-500 group-hover:text-white flex items-center justify-center shrink-0 shadow-sm transition-all">
                                                                <menuItem.icon className="w-6 h-6" />
                                                            </div>
                                                            <div>
                                                                <div className="flex items-center gap-2 mb-1">
                                                                    <h4 className="font-bold text-sm text-zinc-900 dark:text-zinc-100">{menuItem.title}</h4> 
                                                                     {menuItem.badge && ( 
                                                                         <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400">
                                                                             {menuItem.badge}
                                                                         </Badge>
                                                                     )} 
                                                                 </div>
                                                                <p className="text-xs font-medium text-zinc-500">{menuItem.desc}</p>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>

                                                {/* Right Marketing Area */}
                                                <div className="w-1/3 pl-8 flex flex-col justify-between">
                                                    <div>
                                                        <h3 className="font-black text-xs uppercase tracking-widest text-zinc-400 mb-4">Masterclass</h3>
                                                        <div className="w-full h-32 bg-zinc-100 dark:bg-zinc-900 rounded-2xl mb-4 overflow-hidden relative group cursor-pointer">
                                                            <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/20 to-purple-600/20 group-hover:opacity-50 transition-opacity"></div>
                                                            <Briefcase className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 text-indigo-500 scale-100 group-hover:scale-125 transition-transform" />
                                                        </div>
                                                        <h4 className="font-bold text-sm text-zinc-900 dark:text-zinc-100 mb-2">Build a SaaS in 3 Hours</h4>
                                                        <p className="text-xs font-medium text-zinc-500 mb-6">Learn how to wire up Stripe, Clerk, and Prisma with our new CLI.</p>
                                                    </div>
                                                    
                                                    <button className="flex items-center font-bold text-indigo-500 text-xs hover:text-indigo-600 transition-colors">
                                                        Watch course <ArrowRight className="w-3.5 h-3.5 ml-1" />
                                                    </button>
                                                </div>

                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                )}
                            </div>
                        ))}
                    </div>

                    {/* Right CTA */}
                    <div className="flex items-center gap-3">
                        <Button className="font-bold text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hidden sm:flex">
                            Sign In
                        </Button>
                        <Button className="font-bold bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 shadow-md h-10 px-6 rounded-xl hover:-translate-y-0.5 transition-transform">
                            Start Free
                        </Button>
                    </div>

                </nav>

                {/* Body Content Context */}
                <div className="max-w-6xl mx-auto mt-24 text-center">
                    <h1 className="text-5xl md:text-7xl font-black text-zinc-900 dark:text-zinc-100 tracking-tighter mb-6">
                        Hover over <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-purple-600">Products</span><br/> to see the magic.
                    </h1>
                </div>

            </div>
        </div>
    );
};

export default NavMegaMenu01;
