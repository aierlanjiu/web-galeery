        const { useState, useEffect, useRef, useMemo } = React;
        const { motion, AnimatePresence } = window.Motion;

        const THEME_KEY = "web-gallery-theme";

        function getInitialTheme() {
            try {
                const stored = window.localStorage.getItem(THEME_KEY);
                if (stored === "dark" || stored === "light") return stored;
            } catch (error) {
                console.warn("theme storage unavailable", error);
            }
            return window.matchMedia && window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark";
        }

        function applyTheme(theme) {
            document.documentElement.setAttribute("data-theme", theme);
        }

        async function loadJson(path, cacheBust = false) {
            const url = cacheBust ? `${path}?t=${Date.now()}` : path;
            const response = await fetch(url);
            if (!response.ok) throw new Error(`${path} failed with ${response.status}`);
            return response.json();
        }

        const ThemeToggle = ({ theme, onToggle }) => (
            <button className="theme-toggle glass-chip" onClick={onToggle} type="button" aria-label={theme === "dark" ? "切换浅色模式" : "切换深色模式"}>
                {theme === "dark" ? <SvgIcon name="sun" className="w-4 h-4"/> : <SvgIcon name="moon" className="w-4 h-4"/>}
            </button>
        );


        const SvgIcon = ({ name, className = "w-4 h-4" }) => {
            const common = { fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round", strokeLinejoin: "round", className };
            const paths = {
                sun: <><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.42 1.42M17.65 17.65l1.42 1.42M2 12h2M20 12h2M4.93 19.07l1.42-1.42M17.65 6.35l1.42-1.42"/></>,
                moon: <path d="M21 12.8A8.5 8.5 0 1111.2 3 6.6 6.6 0 0021 12.8z"/>,
                lab: <><path d="M9 3h6"/><path d="M10 3v5l-5 9a3 3 0 002.6 4.5h8.8A3 3 0 0019 17l-5-9V3"/><path d="M8 15h8"/></>,
                signal: <><path d="M4 18.5a14 14 0 0116 0"/><path d="M7 14.5a9 9 0 0110 0"/><path d="M10 10.5a4 4 0 014 0"/><circle cx="12" cy="20" r="1" fill="currentColor"/></>,
                art: <><circle cx="7" cy="8" r="2"/><path d="M4 20c5-8 11-8 16-2"/><path d="M14 4l6 6-8 8H6v-6l8-8z"/></>,
                building: <><path d="M4 21V7l8-4 8 4v14"/><path d="M9 21v-6h6v6"/><path d="M8 9h.01M12 9h.01M16 9h.01M8 12h.01M16 12h.01"/></>,
                keyboard: <><rect x="3" y="6" width="18" height="12" rx="2"/><path d="M7 10h.01M10 10h.01M13 10h.01M16 10h.01M7 14h10"/></>,
                racing: <><path d="M4 16l2-6h12l2 6"/><path d="M6 16h12"/><circle cx="7" cy="17" r="2"/><circle cx="17" cy="17" r="2"/><path d="M8 10l1-3h6l1 3"/></>,
                coffee: <><path d="M5 8h11v6a4 4 0 01-4 4H9a4 4 0 01-4-4V8z"/><path d="M16 10h2a2 2 0 010 4h-2"/><path d="M7 3v2M11 3v2M15 3v2"/></>,
            };
            return <svg {...common}>{paths[name] || paths.signal}</svg>;
        };


        // UI-Layouts adapted helpers: LiquidGlassCard + SpotlightItem
        // Original inspiration: ui-layouts Liquid Glass / Spotlight Cards. Adapted for this static React+Babel page.
        const LiquidGlassCard = ({ children, className = "", blurIntensity = "xl", glowIntensity = "sm", shadowIntensity = "md", borderRadius = "32px", draggable = false, expandable = false, expandedWidth, expandedHeight, width, height, ...props }) => {
            const [expanded, setExpanded] = useState(false);
            const [spot, setSpot] = useState({ x: "18%", y: "0%" });
            const blurMap = { sm: "24px", md: "34px", lg: "42px", xl: "54px" };
            const glowMap = { none: "0px", xs: "14px", sm: "28px", md: "40px", lg: "54px", xl: "70px" };
            const insetMap = { none: "0px", xs: "1px", sm: "2px", md: "3px", lg: "4px", xl: "6px" };
            const handleMove = (event) => {
                const rect = event.currentTarget.getBoundingClientRect();
                setSpot({ x: `${event.clientX - rect.left}px`, y: `${event.clientY - rect.top}px` });
            };
            const style = {
                "--ui-liquid-radius": borderRadius,
                "--ui-liquid-blur": blurMap[blurIntensity] || blurMap.xl,
                "--ui-liquid-glow": glowMap[glowIntensity] || glowMap.sm,
                "--ui-liquid-inset": insetMap[shadowIntensity] || insetMap.md,
                "--spot-x": spot.x,
                "--spot-y": spot.y,
                width: expanded ? (expandedWidth || width) : width,
                height: expanded ? (expandedHeight || height) : height,
                borderRadius,
            };
            const toggle = (event) => {
                if (!expandable) return;
                if (event.target.closest && event.target.closest('a, button, input, select, textarea')) return;
                setExpanded((value) => !value);
            };
            const Component = (draggable || expandable) ? motion.div : 'div';
            const motionProps = (draggable || expandable) ? { whileHover: { scale: 1.01 }, whileTap: { scale: 0.985 }, drag: draggable, dragConstraints: draggable ? { left: 0, right: 0, top: 0, bottom: 0 } : undefined, dragElastic: draggable ? 0.28 : undefined } : {};
            return <Component className={`ui-liquid-card ${className}`} style={style} onMouseMove={handleMove} onClick={toggle} {...motionProps} {...props}><div className="ui-liquid-content">{children}</div></Component>;
        };

        const SpotlightItem = ({ children, className = "" }) => {
            const [spot, setSpot] = useState({ x: "50%", y: "50%" });
            const handleMove = (event) => {
                const rect = event.currentTarget.getBoundingClientRect();
                setSpot({ x: `${event.clientX - rect.left}px`, y: `${event.clientY - rect.top}px` });
            };
            return <div className={`ui-spotlight ${className}`} style={{ "--spot-x": spot.x, "--spot-y": spot.y }} onMouseMove={handleMove}>{children}</div>;
        };

        const HeroTitle = () => (
            <h1 className="hero-title font-display text-4xl md:text-5xl tracking-tight">
                {["VISUAL", "ARCHITECT"].map((word, index) => (
                    <motion.span
                        key={word}
                        className={index === 1 ? "hero-word text-va-mercury" : "hero-word"}
                        initial={{ opacity: 0, y: 18, filter: "blur(8px)" }}
                        animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                        transition={{ duration: 0.7, delay: index * 0.12, ease: [0.22, 1, 0.36, 1] }}
                    >
                        {word}
                    </motion.span>
                ))}
            </h1>
        );

        const Header = ({ totalCount, theme, toggleTheme, latestNews, wechatData, onOpenData }) => (
            <motion.header
                initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="max-w-7xl mx-auto mt-6 mb-10 px-4 md:mt-12 md:mb-14 md:px-5 grid grid-cols-1 lg:grid-cols-3 gap-6"
            >
                <div className="hero-visual lg:col-span-2 relative overflow-hidden rounded-[28px] aspect-[2912/1440] metal-card group">
                    <img src={theme === "dark" ? './images/card-night.png' : './images/card-day.png'} alt="Header" className="absolute inset-0 w-full h-full object-cover opacity-80 mix-blend-overlay transition-opacity duration-700"/>
                    <div className="absolute inset-0 bg-gradient-to-br from-white/[0.04] via-transparent to-white/[0.02]"></div>
                    <div className="absolute top-4 right-4 border border-white/14 px-3 py-1 text-[10px] font-mono text-white/55 rounded-full bg-white/5 backdrop-blur-sm z-10">
                        区域 01 // {theme === "dark" ? 'LIQUID_GLASS_DARK' : 'LIQUID_GLASS_LIGHT'}
                    </div>
                    <div className="absolute bottom-6 left-6 z-10">
                        <HeroTitle/>
                        <p className="font-mono text-[10px] text-white/45 tracking-[0.3em] mt-1 uppercase">雪沐江南 · 汽车概念可视化</p>
                    </div>
                </div>

                <LiquidGlassCard className="metal-card text-white p-6 md:p-8 flex flex-col justify-center relative" borderRadius="28px" blurIntensity="lg" glowIntensity="sm" shadowIntensity="md">
                    <div className="absolute -top-0.5 right-3 z-20"><ThemeToggle theme={theme} onToggle={toggleTheme}/></div>
                    <div className="space-y-4 font-mono text-xs relative z-10 pt-14">
                        <div className="flex justify-between border-b border-white/10 pb-2"><span className="text-white/50">资产总数 (TOTAL)</span><span className="text-va-mercury font-bold">{totalCount}</span></div>
                        <div className="flex justify-between border-b border-white/10 pb-2"><span className="text-white/50">系统状态 (STATUS)</span><span className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-va-mercury"></span><span className="text-white/55 text-[11px]">在线</span></span></div>
                        <button onClick={onOpenData} className="w-full flex justify-between border-b border-white/10 pb-2 hover:bg-white/5 transition-colors text-left group rounded px-1">
                            <span className="text-white/50 group-hover:text-va-mercury transition-colors flex items-center gap-2">社区订阅 (SUBSCRIBERS)<svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6"/></svg></span>
                            <span>{wechatData ? (<span className="flex items-center gap-2"><motion.span className="metric-value font-bold text-white group-hover:scale-105 transition-transform block" initial={{opacity:0,y:6}} animate={{opacity:1,y:0}}>{wechatData.total_followers}</motion.span>{wechatData.daily_growth !== 0 && <span className="text-va-mercury text-[10px] bg-white/5 px-1 rounded">{wechatData.daily_growth > 0 ? '+' : ''}{wechatData.daily_growth}</span>}</span>) : (<span className="text-white/30">SYNCING...</span>)}</span>
                        </button>
                        <div className="pt-4 mt-2 border-t border-white/10 space-y-3">
                            <a href="news.html" className="relative overflow-hidden block group">
                                <div className="glass-card p-4 rounded-xl flex items-center justify-between transition-all border-white/10 group-hover:border-white/18 group-hover:bg-white/[0.06] relative z-10">
                                    <div className="flex flex-col w-full overflow-hidden">
                                        <span className="font-mono text-[10px] text-va-rose uppercase tracking-widest mb-1 flex items-center gap-2"><span className="w-1.5 h-1.5 bg-va-rose rounded-full"></span>LIVE FEED // {latestNews ? latestNews.date : 'LOADING...'}</span>
                                        <div className="relative h-8 overflow-hidden w-full">
                                            {latestNews ? (
                                                <div className="animate-marquee whitespace-nowrap flex items-center gap-8 text-sm font-bold tracking-wide absolute text-white/80">
                                                    {latestNews.items.slice(0,5).map((n,i)=>(<span key={i} className="flex items-center gap-2"><span className="text-va-mercury text-[10px]">◆</span>{n.title}</span>))}
                                                    {latestNews.items.slice(0,5).map((n,i)=>(<span key={`d${i}`} className="flex items-center gap-2"><span className="text-va-mercury text-[10px]">◆</span>{n.title}</span>))}
                                                </div>
                                            ) : (<span className="font-display text-lg font-bold tracking-wide text-white/45">今日前沿 · DAILY NEWS</span>)}
                                        </div>
                                    </div>
                                    <div className="w-9 h-9 bg-white/5 rounded-full flex items-center justify-center group-hover:bg-white/12 transition-all flex-shrink-0 ml-2">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 transform group-hover:translate-x-0.5 transition-transform text-white/65" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3"/></svg>
                                    </div>
                                </div>
                            </a>
                            <div className="grid grid-cols-2 gap-3">
                                <a href="student_showcase.html" className="relative overflow-hidden block group">
                                    <div className="bg-white/[0.025] p-3 rounded-xl flex flex-col justify-between h-full border border-white/10 group-hover:border-white/20 transition-all group-hover:bg-white/[0.06] relative z-10">
                                        <span className="font-mono text-[8px] text-white/55 uppercase tracking-widest mb-1">SHOWCASE</span><span className="font-display text-sm font-bold leading-tight text-white">学员作品展</span>
                                        <div className="mt-2 self-end opacity-35 group-hover:opacity-75 transition-all text-white"><svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h14a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg></div>
                                    </div>
                                </a>
                                <a href="./assets/camp_brochure.pdf" target="_blank" className="relative overflow-hidden block group">
                                    <div className="bg-white/[0.025] p-3 rounded-xl flex flex-col justify-between h-full border border-white/10 group-hover:border-white/20 transition-all group-hover:bg-white/[0.06] relative z-10">
                                        <span className="font-mono text-[10px] text-va-rose font-bold uppercase tracking-widest mb-1 flex items-center gap-1"><span className="w-1.5 h-1.5 bg-va-rose rounded-full inline-block"></span>本期已满员</span><span className="font-display text-sm font-bold leading-tight text-white">特训营简章</span>
                                        <div className="mt-2 self-end opacity-35 group-hover:opacity-75 group-hover:-translate-y-0.5 transition-all"><svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg></div>
                                    </div>
                                </a>
                            </div>
                        </div>
                    </div>
                    <div className="hidden md:block mt-auto self-end opacity-[0.025] font-display text-6xl text-white select-none">V.A.</div>
                </LiquidGlassCard>
            </motion.header>
        );

        const useCountUp = (target, decimals = 0, duration = 1400) => {
            const [value, setValue] = useState(0);
            useEffect(() => {
                let raf = 0;
                let startTime = 0;
                const animate = (timestamp) => {
                    if (!startTime) startTime = timestamp;
                    const progress = Math.min((timestamp - startTime) / duration, 1);
                    const eased = 1 - Math.pow(1 - progress, 3);
                    setValue(target * eased);
                    if (progress < 1) raf = requestAnimationFrame(animate);
                };
                raf = requestAnimationFrame(animate);
                return () => cancelAnimationFrame(raf);
            }, [target, duration]);
            return value.toFixed(decimals);
        };

        const CountUpMetric = ({ target, decimals = 0, suffix = "", prefix = "", className = "" }) => {
            const value = useCountUp(target, decimals);
            return <span className={`racing-number ${className}`}>{prefix}{value}{suffix}</span>;
        };

        const TiltGlassCard = ({ children, className = "", delay = 0, id }) => {
            const [tilt, setTilt] = useState({ x: "0deg", y: "0deg" });
            const handleMove = (event) => {
                if (window.innerWidth < 900) return;
                const rect = event.currentTarget.getBoundingClientRect();
                const px = (event.clientX - rect.left) / rect.width;
                const py = (event.clientY - rect.top) / rect.height;
                setTilt({
                    x: `${(0.5 - py) * 5.5}deg`,
                    y: `${(px - 0.5) * 7.5}deg`,
                });
            };
            return (
                <motion.div
                    id={id}
                    className={`racing-card-motion ${className}`}
                    initial={{ opacity: 0, y: 26, filter: "blur(8px)" }}
                    animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                    transition={{ duration: 0.72, delay, ease: [0.22, 1, 0.36, 1] }}
                >
                    <div
                        className="racing-glass-card"
                        style={{ "--tilt-x": tilt.x, "--tilt-y": tilt.y }}
                        onMouseMove={handleMove}
                        onMouseLeave={() => setTilt({ x: "0deg", y: "0deg" })}
                    >
                        {children}
                    </div>
                </motion.div>
            );
        };

        const GlassNav = ({ theme, toggleTheme }) => (
            <motion.nav
                className="racing-nav"
                initial={{ opacity: 0, y: -24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            >
                <a className="racing-brand" href="#top" aria-label="返回首页">
                    <span className="brand-track"></span>
                    <span className="brand-slice"></span>
                </a>
                <div className="racing-nav-links" aria-label="首页导航">
                    <a className="active" href="#top">首页</a>
                    <a href="#gallery">图谱</a>
                    <a href="news.html">资讯</a>
                    <a href="#pricing">服务</a>
                </div>
                <div className="racing-nav-status">
                    <span className="live-dot"></span>
                    <span>LIVE</span>
                    <span className="nav-divider"></span>
                    <span>26°C</span>
                    <span className="nav-divider"></span>
                    <span><strong>CN</strong> / EN</span>
                    <ThemeToggle theme={theme} onToggle={toggleTheme}/>
                    <a className="menu-button" href="#gallery" aria-label="打开画廊入口"><span></span><span></span><span></span></a>
                </div>
            </motion.nav>
        );

        const TrackMap = ({ compact = false }) => (
            <img className={compact ? "track-map compact" : "track-map"} src="./images/home-route-map.png" alt="内容生产链路" loading="eager"/>
        );

        const RacingCarVisual = () => (
            <div className="racing-car-visual" aria-label="汽车视觉速度主视觉">
                <div className="speed-ribbon ribbon-one"></div>
                <div className="speed-ribbon ribbon-two"></div>
                <img src="./images/home-liquid-racer.png" alt="液态金属汽车视觉资产" loading="eager"/>
            </div>
        );

        const HeroPanel = ({ totalCount, wechatData, onOpenData }) => (
            <TiltGlassCard className="hero-panel-card" delay={0.1}>
                <div className="hero-panel">
                    <div className="hero-copy">
                        <div className="racing-kicker"><span></span>雪沐江南 / VISUAL GARAGE</div>
                        <h1>把汽车黑科技看懂</h1>
                        <h2>AI视觉图谱 × 每日硬核汽车情报</h2>
                        <p>用一张图拆透底盘、电驱、智能化与工程美学。关注雪沐江南，少看参数堆料，多看真正的技术逻辑。</p>
                        <div className="hero-actions">
                            <a href="#gallery" className="racing-primary-btn">看技术图谱</a>
                            <a href="news.html" className="racing-secondary-btn">读今日情报</a>
                            <a href="#pricing" className="racing-secondary-btn">商业合作</a>
                        </div>
                    </div>
                    <div className="hero-hud">
                        <TrackMap />
                        <div className="sector-readout">
                            <span>VISUAL ROUTE</span>
                            <strong>Decode</strong>
                        </div>
                        <RacingCarVisual />
                    </div>
                    <div className="hero-stat-strip">
                        <div><span>VISUAL ASSETS</span><CountUpMetric target={Number(totalCount) || 0}/></div>
                        <div><span>SUBSCRIBERS</span><CountUpMetric target={Number(wechatData?.total_followers) || 0}/></div>
                        <button type="button" onClick={onOpenData}><span>DATA PANEL</span><strong>OPEN</strong></button>
                    </div>
                </div>
            </TiltGlassCard>
        );

        const AeroCard = () => (
            <TiltGlassCard className="aero-card" delay={0.2}>
                <div className="racing-card-kicker">PROMPT FACTORY</div>
                <h3>视觉协议工厂</h3>
                <img className="prompt-flow-img" src="./images/home-prompt-flow.png" alt="提示词视觉协议层" loading="eager"/>
                <p className="card-label">可复用结构 / REUSABLE SYSTEM</p>
                <div className="metric-row"><CountUpMetric target={98.6} decimals={1}/><small>%</small></div>
                <div className="trend up">提示词资产持续沉淀</div>
            </TiltGlassCard>
        );

        const RaceDataCard = ({ totalCount, onOpenData }) => (
            <TiltGlassCard className="race-data-card" delay={0.26} id="race-data">
                <div className="card-split">
                    <div>
                        <div className="racing-card-kicker">TOPIC RADAR</div>
                        <h3>选题雷达</h3>
                        <p className="track-name">资讯筛选 / 技术拆解 / 视觉表达<br/><span>CONTENT PIPELINE</span></p>
                        <TrackMap compact />
                    </div>
                    <div className="race-data-side">
                        <p>图谱资产<br/><span>GALLERY ASSETS</span></p>
                        <strong><CountUpMetric target={Number(totalCount) || 0}/></strong>
                        <p>订阅价值<br/><span>WHY FOLLOW</span></p>
                        <div><small>看懂趋势<br/>复用图谱</small></div>
                        <button type="button" onClick={onOpenData}>打开增长看板</button>
                    </div>
                </div>
            </TiltGlassCard>
        );

        const PerformanceGauge = () => {
            const score = useCountUp(87, 0, 1500);
            return (
                <TiltGlassCard className="performance-card" delay={0.32}>
                    <div className="racing-card-kicker">ACCOUNT FLYWHEEL</div>
                    <h3>账号飞轮</h3>
                    <div className="performance-layout">
                        <div className="gauge" style={{ "--score": 87 }}>
                            <svg viewBox="0 0 120 120">
                                <circle cx="60" cy="60" r="46" className="gauge-bg"/>
                                <circle cx="60" cy="60" r="46" className="gauge-red"/>
                                <circle cx="60" cy="60" r="34" className="gauge-inner"/>
                            </svg>
                            <div><strong>{score}</strong><span>/100</span></div>
                        </div>
                        <div className="bars">
                            {[
                                ["图谱覆盖", 92],
                                ["提示词复用", 85],
                                ["训练营转化", 88],
                                ["商务交付", 83],
                            ].map(([label, value]) => (
                                <div className="bar-row" key={label}><span>{label}</span><i><b style={{ width: `${value}%` }}></b></i><strong>{value}</strong></div>
                            ))}
                        </div>
                    </div>
                </TiltGlassCard>
            );
        };

        const LapChart = ({ growthData = [] }) => {
            const rows = growthData.slice(-14);
            const values = rows.map((item) => Number(item.net_growth) || 0);
            const maxAbs = Math.max(4, ...values.map((value) => Math.abs(value)));
            const points = rows.length > 1
                ? rows.map((item, index) => {
                    const x = 26 + (index / (rows.length - 1)) * 492;
                    const y = 126 - ((Number(item.net_growth) || 0) / maxAbs) * 76;
                    return `${x.toFixed(1)},${y.toFixed(1)}`;
                }).join(" ")
                : "26,126 518,126";
            const recentNet = growthData.reduce((total, item) => total + (Number(item.net_growth) || 0), 0);
            const latest = growthData[growthData.length - 1];
            const latestNet = latest ? Number(latest.net_growth) || 0 : 0;
            return (
            <TiltGlassCard className="lap-card" delay={0.38}>
                <div className="lap-header">
                    <div><div className="racing-card-kicker">SUBSCRIPTION GROWTH</div><h3>订阅增长</h3></div>
                    <div className="chart-legend"><span className="red"></span>净增<span></span>零线</div>
                </div>
                <div className="lap-layout">
                    <svg className="lap-chart" viewBox="0 0 560 240" role="img" aria-label="订阅增长折线图">
                        {[50, 88, 126, 164, 202].map(y => <line key={y} x1="24" y1={y} x2="530" y2={y} className="grid-line"/>)}
                        <line x1="24" y1="126" x2="530" y2="126" className="grid-line zero"/>
                        {rows.map((item, index) => {
                            const x = rows.length > 1 ? 26 + (index / (rows.length - 1)) * 492 : 26;
                            return index % 4 === 0 ? <text key={item.date} x={x - 10} y="226" className="sector-text">{item.date.slice(5)}</text> : null;
                        })}
                        <polyline className="lap-line" points={points}/>
                    </svg>
                    <div className="sector-list">
                        <div><span>当前订阅</span><strong>{latest ? latest.total_followers : "..."}</strong><em>{latest ? latest.date.slice(5) : ""}</em></div>
                        <div><span>最新净增</span><strong>{latestNet > 0 ? "+" : ""}{latestNet}</strong><em className={latestNet < 0 ? "loss" : ""}>day</em></div>
                        <div><span>31日净增</span><strong>{recentNet > 0 ? "+" : ""}{recentNet}</strong><em>trend</em></div>
                        <div><span>看板</span><strong>OPEN</strong><em className="loss">click data</em></div>
                    </div>
                </div>
            </TiltGlassCard>
            );
        };

        const EngineCard = ({ wechatData }) => (
            <TiltGlassCard className="engine-card" delay={0.44}>
                <div className="engine-content">
                    <div>
                        <div className="racing-card-kicker">SERVICE SYSTEM</div>
                        <h3>商业转化</h3>
                        <img className="service-core-img" src="./images/home-service-core.png" alt="服务转化模块" loading="lazy"/>
                    </div>
                    <div className="engine-metrics">
                        <p>训练营人数<br/><span>BOOTCAMP</span><strong><CountUpMetric target={12}/><small> 人</small></strong></p>
                        <p>社区订阅<br/><span>FOLLOWERS</span><strong><CountUpMetric target={Number(wechatData?.total_followers) || 0}/></strong></p>
                        <p>B端变现<br/><span>B2B REVENUE</span><strong><CountUpMetric target={8600}/><small> CNY</small></strong></p>
                    </div>
                </div>
            </TiltGlassCard>
        );

        const FeatureDock = () => {
            const features = [
                ["创作工具", "CREATION"],
                ["知识资源", "KNOWLEDGE"],
                ["演示中心", "DEMOS"],
                ["关注博主", "CREATORS"],
                ["服务报价", "SERVICE"],
            ];
            return (
                <motion.div className="feature-dock" initial={{ opacity: 0, y: 22 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.75, delay: 0.52, ease: [0.22, 1, 0.36, 1] }}>
                    {features.map(([title, sub], index) => (
                        <a href={title === "服务报价" ? "#pricing" : "#innovation"} className="feature-item" key={title}>
                            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 18V7l8-3 8 3v11l-8 3-8-3Z"/><path d="M8 9h8M8 13h8M12 5v14"/></svg>
                            <span>{title}</span>
                            <small>{sub}</small>
                            <i style={{ "--delay": `${index * 80}ms` }}></i>
                        </a>
                    ))}
                </motion.div>
            );
        };

        const EntryDock = ({ latestNews, totalCount }) => (
            <motion.div className="racing-entry-dock" initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.6 }}>
                {[
                    ["作品画廊", `${Number(totalCount) || 0}+ 工业视觉资产`, "#gallery"],
                    ["每日资讯", latestNews ? `${latestNews.date} 前沿信号` : "自动化资讯流", "news.html"],
                    ["学员作品", "训练营成果展示", "student_showcase.html"],
                    ["服务报价", "高客单价交付入口", "./quotes/Xuemu_Lab_视觉设计服务报价单_2026.html"],
                ].map(([title, desc, href]) => (
                    <a key={title} href={href} className="entry-pill">
                        <span>{title}</span>
                        <small>{desc}</small>
                    </a>
                ))}
            </motion.div>
        );

        const RacingHomePage = ({ totalCount, latestNews, wechatData, growthData, theme, toggleTheme, onOpenData }) => (
            <section id="top" className="racing-home">
                <GlassNav theme={theme} toggleTheme={toggleTheme}/>
                <div id="technical" className="racing-dashboard">
                    <HeroPanel totalCount={totalCount} wechatData={wechatData} onOpenData={onOpenData}/>
                    <AeroCard />
                    <RaceDataCard totalCount={totalCount} onOpenData={onOpenData}/>
                    <PerformanceGauge />
                    <LapChart growthData={growthData}/>
                    <EngineCard wechatData={wechatData}/>
                </div>
                <FeatureDock />
                <EntryDock latestNews={latestNews} totalCount={totalCount}/>
            </section>
        );

        const GalleryIntro = ({ totalCount }) => (
            <motion.div
                className="gallery-intro max-w-7xl mx-auto px-4 md:px-5"
                initial={{ opacity: 0, y: 18 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5 }}
            >
                <span>VISUAL GARAGE</span>
                <h2>画廊作为独立内容舱保留</h2>
                <p>首页首屏已切换为液态玻璃内容驾驶舱，原有 {totalCount} 个汽车概念视觉资产、提示词复制、筛选和编辑入口仍在这里完整可用。</p>
            </motion.div>
        );

        const CoCreationModal = ({ isOpen, onClose }) => {
            const [wechatCopied, setWechatCopied] = useState(false);
            if (!isOpen) return null;
            const handleCopyWechat = () => { navigator.clipboard.writeText('oaoa5yt'); setWechatCopied(true); setTimeout(() => setWechatCopied(false), 2000); };
            return (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[110] flex items-center justify-center p-4 md:p-8 bg-black/80 backdrop-blur-md">
                    <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="glass-shell w-full max-w-[1400px] h-[85vh] rounded-3xl overflow-hidden flex flex-col md:flex-row shadow-2xl border-white/14">
                        <div className="md:w-[30%] p-10 text-white flex flex-col justify-between relative overflow-hidden bg-white/[0.02]">
                            <div className="absolute inset-0 bg-gradient-to-b from-white/[0.03] to-white/[0.01] pointer-events-none"></div>
                            <div className="relative z-10">
                                <div className="text-va-mercury font-mono text-sm mb-4 tracking-[0.3em]">PROJECT // 001</div>
                                <h2 className="font-display text-4xl mb-6 leading-[0.95]">VISUAL<br/><span className="text-va-mercury">ARCHITECT</span></h2>
                                <div className="space-y-5 text-white/50 font-mono text-xs leading-relaxed uppercase tracking-widest">
                                    <p className="flex items-center gap-3"><span className="w-1.5 h-1.5 bg-va-mercury rounded-full"></span>Status: Precipitating</p>
                                    <p className="flex items-center gap-3"><span className="w-1.5 h-1.5 bg-va-mercury rounded-full"></span>Publisher: Mechanical Industry Press</p>
                                    <p className="flex items-center gap-3"><span className="w-1.5 h-1.5 bg-va-mercury rounded-full"></span>Target: 300 Hardcore Creators</p>
                                </div>
                            </div>
                            <div className="relative z-10 glass p-5 rounded-2xl border-white/10 mt-auto">
                                <p className="font-mono text-[10px] text-va-rose mb-3 uppercase tracking-widest">Support the Creator</p>
                                <div className="flex items-center gap-4"><img src="./images/coffe.jpg" alt="Coffee" className="w-16 h-16 rounded-xl shadow-lg border border-white/10"/><div><p className="font-bold text-sm leading-tight text-white">赞赏与支持</p><p className="text-[10px] text-white/30 font-mono mt-0.5">SUPPORT VIA QR</p></div></div>
                            </div>
                            <div className="absolute -bottom-10 -left-10 text-[12rem] font-display text-white/[0.02] pointer-events-none select-none">V.A.</div>
                        </div>
                        <div className="md:w-[70%] p-10 md:p-14 overflow-y-auto flex flex-col">
                            <div className="flex justify-between items-start mb-10">
                                <div><h3 className="font-display text-2xl text-white mb-2 tracking-tight">图书共创项目看板</h3><p className="font-mono text-xs text-va-mercury tracking-[0.3em] uppercase">THE CO-CREATION DASHBOARD</p></div>
                                <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors"><svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 text-white/55" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12"/></svg></button>
                            </div>
                            <div className="space-y-10 flex-grow">
                                <section>
                                    <h4 className="font-mono text-lg font-bold text-va-mercury mb-6 flex items-center gap-3 tracking-widest uppercase"><span className="w-3 h-3 rounded-full bg-va-mercury"></span>入群验证说明</h4>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                        {[{title:"作品提交",desc:"提交你的 AI 汽车可视化作品或个人 Portfolio"},{title:"身份认证",desc:"汽车行业从业者 / 设计专业学生 / AI 开发者"},{title:"防伪门槛",desc:"发送 0.01 元验证红包 (旨在过滤低质流量/机器人)"}].map((item,i)=>(
                                            <div key={i} className="p-6 glass rounded-2xl border-white/10 hover:border-white/20 transition-colors group"><div className="font-mono text-sm text-va-mercury mb-3 opacity-50">#0{i+1}</div><div className="font-bold text-lg text-white mb-2 group-hover:text-va-mercury transition-colors">{item.title}</div><div className="text-sm text-white/40 leading-relaxed">{item.desc}</div></div>
                                        ))}
                                    </div>
                                </section>
                                <section>
                                    <h4 className="font-mono text-lg font-bold text-va-mercury mb-6 flex items-center gap-3 tracking-widest uppercase"><span className="w-3 h-3 rounded-full bg-va-mercury"></span>共创愿景 (VISION)</h4>
                                    <p className="text-xl text-white/60 font-body leading-relaxed md:pr-12">我们拒绝快餐式的信息堆砌。在这里，我们深耕 <strong className="text-white font-bold">"汽车底座 + AI 表达"</strong> 的专业交集。</p>
                                </section>
                            </div>
                            <div className="mt-14 pt-8 border-t border-white/10 flex flex-col md:flex-row items-center justify-between gap-6">
                                <div className="flex items-center gap-5">
                                    <div className="w-14 h-14 bg-white/[0.03] flex items-center justify-center rounded-2xl border border-white/12">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 text-va-mercury" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/></svg>
                                    </div>
                                    <div><p className="font-bold text-white text-base mb-0.5">联系作者申请入群</p><button onClick={handleCopyWechat} className="flex items-center gap-2 group"><span className="font-mono text-sm text-va-mercury font-bold tracking-wider group-hover:underline">ID: oaoa5yt</span>{wechatCopied ? <motion.span initial={{scale:0}} animate={{scale:1}} className="text-[10px] bg-va-mercury/20 text-va-mercury px-2 py-0.5 rounded-full font-mono uppercase">COPIED</motion.span> : <span className="text-[10px] text-white/30 font-mono group-hover:text-va-mercury transition-colors">CLICK TO COPY</span>}</button></div>
                                </div>
                                <button className="px-8 py-3 glass text-white/30 font-bold font-mono text-xs rounded-2xl cursor-not-allowed border-white/5 whitespace-nowrap tracking-widest" disabled>知识库建设中 (WIKI COMING SOON)</button>
                            </div>
                        </div>
                    </motion.div>
                </motion.div>
            );
        };

        const CoCreationWidget = ({ onOpen }) => (
            <motion.div initial={{ x: -50, opacity: 0 }} animate={{ x: 0, opacity: 1 }} whileHover={{ x: 8 }} className="fixed left-0 top-1/2 -translate-y-1/2 z-50 hidden md:block">
                <button onClick={onOpen} className="glass-shell py-7 px-3 rounded-r-2xl border-y border-r border-white/12 shadow-xl flex flex-col items-center gap-5 group transition-all hover:bg-white/10">
                    <span className="font-display text-lg tracking-[0.3em] [writing-mode:vertical-lr] font-bold text-white/65 group-hover:text-white transition-colors">CO-CREATION</span>
                    <div className="w-1 h-10 bg-va-mercury group-hover:h-14 transition-all rounded-full"></div>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-va-mercury group-hover:rotate-12 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5S19.832 5.477 21 6.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/></svg>
                </button>
            </motion.div>
        );

        const PromptEditor = ({ isOpen, onClose, initialPrompt, onSave }) => {
            const [sections, setSections] = useState([]); const [fullPrompt, setFullPrompt] = useState(initialPrompt || ''); const [copied, setCopied] = useState(false);
            useEffect(() => { if (isOpen) { document.body.style.overflow = 'hidden'; if (initialPrompt) parsePrompt(initialPrompt); } else { document.body.style.overflow = 'unset'; } return () => { document.body.style.overflow = 'unset'; }; }, [isOpen, initialPrompt]);
            const parsePrompt = (text) => { const r = /(\/\/ --- .+ ---)/g; const p = text.split(r); let s = [], h = "PREAMBLE"; for (let i=0;i<p.length;i++){ const pt=p[i].trim(); if(!pt) continue; if(pt.startsWith("// ---")){h=pt}else{s.push({header:h,content:pt})} } setSections(s); setFullPrompt(text); };
            const handleSectionChange = (i, v) => { const u=[...sections]; u[i].content=v; setSections(u); setFullPrompt(u.map(s=>`${s.header}\n\n${s.content}`).join('\n\n')); };
            const handleCopy = () => { navigator.clipboard.writeText(fullPrompt); setCopied(true); setTimeout(()=>setCopied(false),2000); };
            if (!isOpen) return null;
            return (
                <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-8 bg-black/80 backdrop-blur-md">
                    <motion.div initial={{scale:0.95,y:20}} animate={{scale:1,y:0}} className="glass-shell w-full max-w-5xl h-[90vh] rounded-3xl overflow-hidden flex flex-col shadow-2xl border-white/14">
                        <div className="p-5 border-b border-white/10 flex justify-between items-center bg-white/[0.01]"><div><h2 className="font-display text-xl text-white">PROMPT <span className="text-va-mercury">ARCHITECT</span></h2><p className="font-mono text-[10px] text-white/30 tracking-tighter">STRUCTURAL DECOMPOSITION</p></div><button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors"><svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white/55" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg></button></div>
                        <div className="flex-grow overflow-y-auto p-5 space-y-6">
                            {sections.map((s,idx)=>(
                                <div key={idx} className="space-y-2">
                                    <div className="flex items-center gap-2"><div className="h-px flex-grow bg-white/10"></div><span className="font-mono text-[10px] font-bold text-va-mercury uppercase tracking-widest">{s.header.replace(/\/\/ --- | ---/g,'')}</span><div className="h-px flex-grow bg-white/10"></div></div>
                                    <textarea value={s.content} onChange={(e)=>handleSectionChange(idx,e.target.value)} className="w-full bg-white/[0.02] border border-white/10 rounded-2xl p-4 font-mono text-sm text-white/80 focus:ring-1 focus:ring-va-mercury/30 outline-none transition-all min-h-[100px] resize-none" spellCheck="false"/>
                                </div>
                            ))}
                        </div>
                        <div className="p-5 border-t border-white/10 bg-white/[0.01] flex flex-col md:flex-row gap-3 items-center">
                            <div className="flex-grow w-full"><p className="font-mono text-[10px] text-white/20 mb-1.5">FINAL OUTPUT STREAM</p><div className="bg-white/[0.02] p-3 rounded-xl border border-white/5 font-mono text-[10px] text-white/40 line-clamp-2">{fullPrompt}</div></div>
                            <div className="flex gap-3 w-full md:w-auto"><button onClick={handleCopy} className={`w-full md:w-40 px-6 py-2.5 font-bold font-mono text-xs rounded-xl transition-all ${copied?'bg-va-mercury/15 text-va-mercury border border-va-mercury/25':'glass-card text-white/75 hover:bg-white/10 hover:text-white border-white/10'}`}>{copied?'COPIED':'COPY PROMPT'}</button></div>
                        </div>
                    </motion.div>
                </motion.div>
            );
        };

        const FilterBar = ({ activeFilter, setFilter, categories }) => (
            <motion.div initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.4 }} className="max-w-7xl mx-auto px-4 md:px-5 mb-11 pb-2">
                <div className="flex flex-wrap gap-2.5 font-mono text-xs justify-center lg:justify-start">
                    <button onClick={()=>setFilter('all')} className={`relative px-5 py-2 uppercase tracking-wider transition-all duration-300 rounded-full border ${activeFilter==='all'?'bg-white/14 text-white border-white/22':'glass-chip text-white/50 border-white/10 hover:text-white/80 hover:bg-white/6'}`}><span className="relative z-10 font-bold">全部图谱</span></button>
                    {categories.map(cat=>(<button key={cat} onClick={()=>setFilter(cat)} className={`relative px-5 py-2 uppercase tracking-wider transition-all duration-300 rounded-full border ${activeFilter===cat?'bg-white/14 text-white border-white/22':'glass-chip text-white/50 border-white/10 hover:text-white/80 hover:bg-white/6'}`}><span className="relative z-10 font-bold">{cat}</span></button>))}
                </div>
            </motion.div>
        );

        const Toolbox = () => {
            const [activeTab, setActiveTab] = useState('creation');
            const categories = {
                creation: { label:"创作工具", icon:<svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>, items:[
                    {name:"Flowith",icon:<svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M2 12h4l3-9 6 18 3-9h4"/></svg>,url:"https://flowith.net?inv=T03FW0ULWRZQ1GZ3",desc:"Flux生图/领积分"},
                    {name:"Refly.ai",icon:<svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M22 2L11 13"/><path d="M22 2l-7 20-4-9-9-4 20-7z"/></svg>,url:"https://refly.ai",desc:"邀请码: HBX11Z"},
                    {name:"纳米AI",icon:<svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="3" y="11" width="18" height="10" rx="2"/><circle cx="12" cy="5" r="2"/><path d="M12 7v4"/></svg>,url:"https://www.n.cn/tools/aiagent/chat/9365deb7d82c455b8e2b94045a50ae08",desc:"邀请码: 962RKZ"},
                    {name:"YOUMIND",icon:<svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M12 2a10 10 0 100 20 10 10 0 000-20z"/><path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3"/><path d="M12 17h.01"/></svg>,url:"https://youmind.com/invite/YRC54C",desc:"注册领200积分"},
                    {name:"AI Studio",icon:<svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M9 3h6v3H9zM10 14v4M14 14v4M5 6h14l-2 14H7L5 6z"/></svg>,url:"https://aistudio.google.com/",desc:"Google API"},
                    {name:"Gemini",icon:<svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>,url:"https://Gemini.google.com",desc:"Google AI助手"},
                ]},
                knowledge: { label:"知识资源", icon:<svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 19.5A2.5 2.5 0 016.5 17H20"/><path d="M4 4.5A2.5 2.5 0 016.5 7H20v14H6.5A2.5 2.5 0 014 18.5v-14z"/></svg>, items:[
                    {name:"香蕉库",icon:<svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><ellipse cx="12" cy="6" rx="8" ry="3"/><path d="M4 6v6c0 1.66 3.58 3 8 3s8-1.34 8-3V6"/><path d="M4 12v6c0 1.66 3.58 3 8 3s8-1.34 8-3v-6"/></svg>,url:"https://aiart.pics/",desc:"提示词大全"},
                    {name:"香蕉库Pro",icon:<svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><ellipse cx="12" cy="6" rx="8" ry="3"/><path d="M4 6v6c0 1.66 3.58 3 8 3s8-1.34 8-3V6"/><path d="M4 12v6c0 1.66 3.58 3 8 3s8-1.34 8-3v-6"/><path d="M12 3v18"/></svg>,url:"https://opennana.com/awesome-prompt-gallery",desc:"OpenNana"},
                    {name:"Youmind库",icon:<svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M12 2a10 10 0 100 20 10 10 0 000-20z"/><path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3"/><path d="M12 17h.01"/></svg>,url:"https://youmind.com/zh-CN/nano-banana-pro-prompts",desc:"香蕉提示词"},
                    {name:"乔木文档",icon:<svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>,url:"https://xiangyangqiaomu.feishu.cn/wiki/Ud2sw5LDViXKNokhH5fcaMzinOe?table=tblHZoTYED9b7Mgl&view=vewGCaGk8C",desc:"AI知识库"},
                ]},
                demos: { label:"演示中心", icon:<svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>, items:[
                    {name:"计算美学实验室",icon:<SvgIcon name="lab"/>,url:"./demo_computational_aesthetics",desc:"底层逻辑验证"},
                    {name:"每日资讯看板",icon:<SvgIcon name="signal"/>,url:"./news.html",desc:"自动化资讯流"},
                    {name:"学员作品集",icon:<SvgIcon name="art"/>,url:"./student_showcase.html",desc:"特训营成果展示"},
                    {name:"工作室介绍",icon:<SvgIcon name="building"/>,url:"./ppts/studio_intro/",desc:"雪沐江南 · 品牌杂志风PPT",badge:"PPT"},
                    {name:"Claude Code指南",icon:<SvgIcon name="keyboard"/>,url:"./ppts/claude_code_guide/",desc:"DeepSeek V4 Pro 1M 上手指导",badge:"PPT"},
                    {name:"赛车科普卡片",icon:<SvgIcon name="racing"/>,url:"./ppts/racing_cards/",desc:"赛车史三大赛事科普",badge:"PPT"},
                ]},
                influencers: { label:"关注博主", icon:<svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 4l11.733 16h2.534L7.733 4H4z"/><path d="M4 20l7.768-10.4"/><path d="M18.267 4L12 12.8"/></svg>, items:[
                    {name:"Berry",icon:<SvgIcon name="signal"/>,url:"https://x.com/berryxia",desc:"AI博主"},{name:"Servas",icon:<SvgIcon name="signal"/>,url:"https://x.com/servasyy_ai",desc:"AI博主"},{name:"TTMouse",icon:<SvgIcon name="signal"/>,url:"https://x.com/ttmouse",desc:"AI博主"},{name:"Xiaojie",icon:<SvgIcon name="signal"/>,url:"https://x.com/xiaojietongxue",desc:"AI博主"},{name:"Lufzz",icon:<SvgIcon name="signal"/>,url:"https://x.com/LufzzLiz",desc:"AI博主"},{name:"Josh",icon:<SvgIcon name="signal"/>,url:"https://x.com/joshesye",desc:"AI博主"},{name:"Emily",icon:<SvgIcon name="signal"/>,url:"https://x.com/IamEmily2050",desc:"AI博主"},{name:"AYi",icon:<SvgIcon name="signal"/>,url:"https://x.com/AYi_AInotes",desc:"AI笔记"},
                ]}
            };
            const currentItems = categories[activeTab].items;
            return (
                <motion.div initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.1, duration: 0.4 }} className="max-w-7xl mx-auto px-4 md:px-5 mb-8">
                    <div className="glass-card rounded-2xl p-4 flex flex-col gap-4 transition-all duration-300 shadow-xl">
                        <div className="flex flex-wrap items-center gap-2 border-b border-white/10 pb-2">
                            <div className="flex items-center gap-2 px-2 text-white/30 mr-2">
                                <svg className="w-4 h-4 text-va-mercury" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
                                <span className="font-mono text-xs tracking-widest hidden md:block">工具箱 // TOOLBOX</span>
                            </div>
                            {Object.entries(categories).map(([key,cat])=>(
                                <button key={key} onClick={()=>setActiveTab(key)} className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all duration-300 flex items-center gap-2 ${activeTab===key?'bg-white/12 text-va-mercury border border-white/18':'text-white/40 hover:text-white/70 hover:bg-white/5 border border-transparent'}`}><span>{cat.icon}</span><span>{cat.label}</span></button>
                            ))}
                        </div>
                        <div className="flex flex-wrap justify-center md:justify-start gap-2.5 w-full min-h-[72px]">
                            <AnimatePresence mode="wait">
                                {currentItems.map(tool=>(
                                    <motion.a key={tool.name} layout initial={{opacity:0,scale:0.95}} animate={{opacity:1,scale:1}} exit={{opacity:0,scale:0.95}} transition={{duration:0.2}} href={tool.url} target="_blank" rel="noopener noreferrer" className="group flex items-center gap-3 px-4 py-2.5 glass-chip rounded-xl border-white/8 transition-all hover:bg-white/8 hover:border-white/20 flex-shrink-0">
                                        <span className="text-lg text-white/55 group-hover:text-white transition-colors">{tool.icon}</span>
                                        <div className="flex flex-col"><span className="text-xs font-bold text-white/80 leading-tight flex items-center gap-1.5">{tool.name}{tool.badge&&<span className="text-[8px] font-mono text-va-mercury border border-va-mercury/30 rounded px-1 py-px leading-none">{tool.badge}</span>}</span><span className="text-[10px] text-white/30 font-mono scale-95 origin-left">{tool.desc}</span></div>
                                    </motion.a>
                                ))}
                            </AnimatePresence>
                        </div>
                    </div>
                </motion.div>
            );
        };

        // --- Gallery Card with scroll-triggered pop-in ---
        const Card = ({ item, index, isMobile, onEdit }) => {
            const [copied, setCopied] = useState(false);
            const handleCopy = () => { navigator.clipboard.writeText(item.prompt); setCopied(true); setTimeout(()=>setCopied(false),2000); };
            const displayId = (index + 1).toString().padStart(2, '0');

            return (
                <motion.div
                    layout
                    initial={{ opacity: 0, y: 40, scale: 0.96 }}
                    whileInView={{ opacity: 1, y: 0, scale: 1 }}
                    viewport={{ once: true, margin: "-40px" }}
                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
                    className="mb-8 break-inside-avoid"
                >
                    <SpotlightItem className="rounded-2xl"><LiquidGlassCard className="metal-card overflow-hidden flex flex-col transition-all duration-500 hover:-translate-y-1 shadow-xl group" borderRadius="18px" blurIntensity="lg" glowIntensity="xs" shadowIntensity="sm">
                        <div className="relative border-b border-white/10 overflow-hidden bg-white/[0.01]">
                            <img src={item.image_path} alt={item.title} loading="lazy" className="w-full h-auto object-cover transition-all duration-700 group-hover:scale-[1.03]" onError={(e)=>{e.target.src='https://placehold.co/600x800/080c14/c8d0da?text=NO+SIGNAL';}}/>
                        </div>
                        <div className="p-5 flex flex-col flex-grow">
                            <div className="flex flex-wrap gap-2 items-center mb-3">
                                <span className="font-mono text-[10px] glass-chip px-2 py-0.5 text-white/40 rounded-full border-white/8">IMG // {displayId}</span>
                                <span className="font-mono text-[10px] bg-white/[0.04] px-2.5 py-0.5 text-va-mercury rounded-full font-bold border border-white/12">{item.category || "未分类"}</span>
                            </div>
                            <h3 className="font-display text-lg md:text-xl font-bold text-white mb-3 leading-tight group-hover:text-va-mercury transition-colors">{item.title}</h3>
                            <div className="glass-chip p-3.5 rounded-xl text-xs font-mono relative mb-4 border-white/8 mt-auto">
                                <div className="absolute top-0 right-0 bg-white/[0.04] text-[8px] px-2 py-0.5 text-va-mercury rounded-bl-lg font-bold tracking-widest">PROMPT</div>
                                <div className="max-h-20 overflow-y-auto pr-1 whitespace-pre-wrap leading-relaxed text-white/40 group-hover:text-white/60 transition-colors duration-500">{item.prompt}</div>
                            </div>
                            <div className="flex gap-2">
                                <button onClick={handleCopy} className={`font-mono text-[10px] uppercase tracking-wider px-4 py-2 border transition-all duration-300 flex-grow rounded-xl ${copied?'bg-va-mercury/15 text-va-mercury border-va-mercury/25':'glass-card text-white/50 border-white/10 hover:bg-white/10 hover:text-white hover:border-white/20'}`}>{copied?'已复制 (COPIED)':'复制提示词 (COPY)'}</button>
                                <button onClick={()=>onEdit(item.prompt)} className="bg-va-rose/10 text-va-rose p-2 rounded-xl hover:bg-va-rose/20 transition-all border border-va-rose/15" title="编辑"><svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg></button>
                            </div>
                        </div>
                    </LiquidGlassCard></SpotlightItem>
                </motion.div>
            );
        };

        const DataDashboard = ({ isOpen, onClose }) => {
            const [growthData, setGrowthData] = useState([]); const [maxGrowth, setMaxGrowth] = useState(1); const [hoverIdx, setHoverIdx] = useState(null);
            useEffect(()=>{if(isOpen){loadJson('./user_growth.json', true).then(d=>{const r=d.slice(-31);setGrowthData(r);setMaxGrowth(Math.max(...r.map(x=>Math.abs(Number(x.net_growth)||0)),10));}).catch(console.error);}},[isOpen]);
            if(!isOpen) return null;
            const latest = growthData[growthData.length - 1];
            const recentNet = growthData.reduce((a,c)=>a+(Number(c.net_growth)||0),0);
            return (
                <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="fixed inset-0 z-[120] flex items-center justify-center p-4 md:p-8 bg-black/80 backdrop-blur-md">
                    <motion.div initial={{scale:0.95,y:20}} animate={{scale:1,y:0}} className="glass-shell w-full max-w-5xl h-auto max-h-[90vh] rounded-3xl overflow-hidden flex flex-col relative shadow-2xl border-white/14">
                        <div className="p-6 md:p-9 border-b border-white/10 flex justify-between items-center bg-white/[0.01]"><div><h2 className="font-display text-3xl md:text-4xl text-white mb-1">GROWTH <span className="text-va-mercury">METRICS</span></h2><p className="font-mono text-[10px] text-va-rose tracking-[0.3em] uppercase">社区增长动态看板</p></div><button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors"><svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white/45" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg></button></div>
                        <div className="p-6 md:p-10 flex-grow overflow-hidden flex flex-col">
                            <div className="grid grid-cols-2 gap-3 mb-6 font-mono text-xs">
                                <div className="glass-chip rounded-xl p-3 border-white/10"><p className="text-white/35 text-[9px] uppercase tracking-widest mb-1">数据更新</p><p className="text-va-mercury font-bold">{latest ? latest.date : 'LOADING'}</p></div>
                                <div className="glass-chip rounded-xl p-3 border-white/10"><p className="text-white/35 text-[9px] uppercase tracking-widest mb-1">近 31 日净增</p><p className="text-white font-bold">{recentNet > 0 ? '+' : ''}{recentNet}</p></div>
                            </div>
                            <div className="flex-grow relative h-56 md:h-72 flex items-end justify-between gap-1 md:gap-2 border-b border-white/10 pb-2">
                                <div className="absolute inset-0 flex flex-col justify-between pointer-events-none opacity-8">{[0,1,2,3].map(i=><div key={i} className="w-full h-px bg-white"></div>)}</div>
                                {growthData.map((item,index)=>{const net=Number(item.net_growth)||0;const hP=Math.max((Math.abs(net)/maxGrowth)*100,4);const isH=hoverIdx===index;const isNeg=net<0;return (<div key={index} className="relative flex-1 group flex flex-col items-center h-full justify-end" onMouseEnter={()=>setHoverIdx(index)} onMouseLeave={()=>setHoverIdx(null)}><motion.div initial={{height:0}} animate={{height:`${hP}%`}} transition={{duration:0.8,delay:index*0.03,type:"spring"}} className={`w-full max-w-[36px] rounded-t-lg transition-all duration-300 relative ${isNeg?'bg-gradient-to-t from-va-rose/60 to-va-rose/25':isH?'bg-gradient-to-t from-va-mercury to-va-mercury/60 shadow-[0_0_20px_rgba(200,210,225,0.25)]':'bg-gradient-to-t from-va-mercury/55 to-va-mercury/25'}`}><AnimatePresence>{isH&&(<motion.div initial={{opacity:0,y:10}} animate={{opacity:1,y:-36}} exit={{opacity:0,y:10}} className="absolute -top-2 left-1/2 -translate-x-1/2 z-30 glass-shell px-3 py-1.5 rounded-lg text-[10px] font-mono whitespace-nowrap shadow-xl border-white/15"><span className="text-va-mercury">{item.date}</span><br/><span className="font-bold text-sm text-white">{net>0?'+':''}{net}</span></motion.div>)}</AnimatePresence></motion.div><span className={`mt-2 text-[9px] font-mono transition-colors duration-300 transform -rotate-45 md:rotate-0 ${isH?'text-va-mercury font-bold':'text-white/30'}`}>{item.date.slice(5)}</span></div>);})}
                            </div>
                        </div>
                        <div className="p-7 md:p-9 border-t border-white/10 grid grid-cols-3 gap-4 bg-white/[0.005]"><div className="text-center border-r border-white/8"><p className="text-2xl md:text-3xl font-display text-white">{growthData.reduce((a,c)=>a+c.new_followers,0)}</p><p className="text-[9px] font-mono text-white/40 uppercase">New Subs</p></div><div className="text-center border-r border-white/8"><p className="text-2xl md:text-3xl font-display text-va-mercury">{growthData.reduce((a,c)=>a+c.net_growth,0)}</p><p className="text-[9px] font-mono text-white/40 uppercase">Net Growth</p></div><div className="text-center"><p className="text-2xl md:text-3xl font-display text-va-rose">{growthData.length>0?growthData[growthData.length-1].total_followers:0}</p><p className="text-[9px] font-mono text-white/40 uppercase">Total</p></div></div>
                    </motion.div>
                </motion.div>
            );
        };

        // --- Pricing Section with scroll pop-in ---
        const PricingSection = () => {
            const tiers = [
                {
                    id: 'basic', name: '基础档', subtitle: 'AI 视觉生成训练营', price: '699', unit: 'CNY',
                    features: ['结构化 AI 视觉训练课程', '2 期训练营 / 12 名学员已毕业', '系统提示词工程方法论', '社区准入及作品指导'],
                    cta: '了解训练营', href: './ppts/studio_intro/',
                    extra: { text: '查看完整报价 →', href: './quotes/Xuemu_Lab_AI视觉训练营服务报价页_2026.html' },
                },
                {
                    id: 'professional', name: '专业档', subtitle: '视觉设计服务', price: '6,800', unit: 'CNY/套起',
                    features: [
                        '品牌视觉系统搭建（色彩/构图/材质）',
                        'AI 概念拆解 × 技术图解 × 视觉叙事',
                        '传播图包策划（公众号/朋友圈/视频封面）',
                        '商用级高清成图 · 含精修迭代',
                    ],
                    cta: '查看视觉设计报价单',
                    href: './quotes/Xuemu_Lab_视觉设计服务报价单_2026.html',
                    featured: true,
                },
                {
                    id: 'enterprise', name: '旗舰档', subtitle: '图文内容战略合作', price: '面议', unit: '',
                    features: [
                        '选题判断 · 结构策划 · 品牌语气稳定性',
                        '深度行业观点表达与专题深稿',
                        '正文成稿 + 微信排版 + 头条发布',
                        '月度内容管家 / 长期栏目统筹',
                    ],
                    cta: '查看图文内容报价单',
                    href: './quotes/Xuemu_Lab_微信图文内容服务报价单_2026.html',
                },
            ];

            return (
                <section id="pricing" className="max-w-7xl mx-auto px-4 md:px-5 mt-24 mb-16">
                    <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5 }} className="text-center mb-12">
                        <span className="font-mono text-[10px] text-va-mercury uppercase tracking-[0.3em]">服务报价 // SERVICE PRICING</span>
                        <h2 className="font-display text-3xl md:text-4xl text-white mt-3 tracking-tight">选择适合你的合作方案</h2>
                        <p className="text-white/40 text-sm mt-2 max-w-xl mx-auto font-body">透明定价，专注价值 —— 从个人创作者到企业级合作</p>
                    </motion.div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-7 items-start">
                        {tiers.map((tier, index) => (
                            <motion.div
                                key={tier.id}
                                initial={{ opacity: 0, y: 30 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true, margin: "-30px" }}
                                transition={{ delay: index * 0.12, duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
                                className={`relative rounded-2xl transition-all duration-500 overflow-hidden ${tier.featured ? 'pricing-featured-glow' : 'hover:-translate-y-1'}`}
                            >
                                <div className={`relative h-full flex flex-col p-7 ${tier.featured ? 'glass-shell rounded-2xl' : 'glass rounded-2xl'}`}>
                                    {tier.featured && (
                                        <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-white/[0.08] backdrop-blur-md text-white text-[9px] font-mono font-bold uppercase tracking-widest px-4 py-1 rounded-full shadow-lg border border-white/15">推荐方案</div>
                                    )}
                                    <div className="mb-5"><span className="font-mono text-[10px] text-white/30 uppercase tracking-wider">Tier 0{index + 1}</span><h3 className="font-display text-xl text-white mt-1">{tier.name}</h3><p className="text-sm text-white/50 mt-0.5">{tier.subtitle}</p></div>
                                    <div className="mb-6"><span className="font-display text-3xl text-white">{tier.price}</span>{tier.unit && <span className="text-sm text-white/40 ml-1">{tier.unit}</span>}</div>
                                    <ul className="space-y-2.5 mb-5 flex-grow">
                                        {tier.features.map((f, i) => (<li key={i} className="flex items-start gap-2 text-sm text-white/60"><span className="text-va-mercury mt-0.5 shrink-0">—</span>{f}</li>))}
                                    </ul>
                                    <div className="space-y-2">
                                        <a href={tier.href} target="_blank"
                                            className={`block text-center py-2.5 px-5 rounded-xl font-bold text-sm font-mono uppercase tracking-wider transition-all duration-200 ${tier.featured ? 'bg-white/10 text-white hover:bg-white/15 border border-white/15 active:scale-[0.98]' : 'glass text-white/65 border border-white/10 hover:bg-white/10 hover:text-white active:scale-[0.98]'}`}>
                                            {tier.cta}
                                        </a>
                                        {tier.extra && (
                                            <a href={tier.extra.href} target="_blank" className="block text-center text-[11px] text-va-mercury hover:text-va-accent transition-colors font-mono tracking-wider">{tier.extra.text}</a>
                                        )}
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </section>
            );
        };

        const PromotionBanner = () => (
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.4 }} className="max-w-7xl mx-auto px-4 md:px-5 mt-10 mb-8">
                <a href="https://www.aliyun.com/daily-act/ecs/activity_selection?userCode=pwy21djx" target="_blank" rel="noopener noreferrer" className="block group relative overflow-hidden rounded-2xl glass border-white/10 hover:border-white/18 transition-all duration-300">
                    <div className="relative z-10 p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-5">
                        <div className="flex-1 text-center md:text-left"><h3 className="font-display text-xl text-white mb-1 flex items-center justify-center md:justify-start gap-2"><svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-va-mercury" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"/></svg><span>DEPLOY <span className="text-va-mercury">DIGITAL GARAGE</span></span></h3><p className="font-mono text-xs text-white/40">CLOUD INFRASTRUCTURE FOR ENGINEERS</p></div>
                        <div className="px-5 py-2.5 bg-white/[0.04] text-va-mercury font-bold font-mono text-sm rounded-full group-hover:bg-white/[0.08] transition-all flex items-center gap-2 border border-white/12"><span>INITIATE</span><svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z"/></svg></div>
                    </div>
                </a>
            </motion.div>
        );

        const Footer = () => (
            <footer className="mt-10 md:mt-16 border-t border-white/10 py-8 md:py-10 text-center">
                <p className="font-mono text-[10px] text-va-mercury tracking-widest mb-1 opacity-45">雪沐江南 · 视觉架构系统</p>
                <p className="font-mono text-[10px] text-white/30">&copy; 2026 雪沐江南 (SNOWY) LABS</p>
            </footer>
        );

        const BackToTopButton = () => {
            const [isVisible, setIsVisible] = useState(false);
            useEffect(()=>{const t=()=>setIsVisible(window.scrollY>300);window.addEventListener("scroll",t);return ()=>window.removeEventListener("scroll",t);},[]);
            return (<AnimatePresence>{isVisible&&(<motion.button initial={{opacity:0,scale:0.5}} animate={{opacity:1,scale:1}} exit={{opacity:0,scale:0.5}} whileHover={{scale:1.1}} whileTap={{scale:0.9}} onClick={()=>window.scrollTo({top:0,behavior:"smooth"})} className="fixed bottom-28 right-8 z-40 p-3 glass-shell rounded-full shadow-lg border-white/14 hover:bg-white/10 transition-all group"><svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white/55 group-hover:-translate-y-0.5 transition-transform duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18"/></svg></motion.button>)}</AnimatePresence>);
        };

        const CoffeeButton = () => {
            const [showQR, setShowQR] = useState(false);
            return (<div className="fixed bottom-8 right-8 z-50 flex flex-col items-end"><AnimatePresence>{showQR&&(<motion.div initial={{opacity:0,scale:0.8,y:10}} animate={{opacity:1,scale:1,y:0}} exit={{opacity:0,scale:0.8,y:10}} className="mb-4 glass-shell p-2 rounded-2xl shadow-xl border-white/14"><img src="./images/coffe.jpg" alt="Coffee" className="w-44 h-auto rounded-xl"/><div className="text-center mt-2 pb-1 text-xs font-mono text-white/50">谢谢你的支持</div></motion.div>)}</AnimatePresence><motion.button whileHover={{scale:1.05}} whileTap={{scale:0.95}} onClick={()=>setShowQR(!showQR)} className="glass-shell p-3.5 rounded-full shadow-lg border-white/14 hover:bg-white/10 transition-all flex items-center gap-2 group"><SvgIcon name="coffee" className="w-5 h-5"/><span className="max-w-0 overflow-hidden group-hover:max-w-xs transition-all duration-300 font-bold text-xs whitespace-nowrap text-white/65">请作者喝咖啡</span></motion.button></div>);
        };

        const App = () => {
            const [data, setData] = useState([]); const [filteredData, setFilteredData] = useState([]);
            const [filter, setFilter] = useState('all'); const [loading, setLoading] = useState(true);
            const [categories, setCategories] = useState([]); const [isMobile, setIsMobile] = useState(false);
            const [theme, setTheme] = useState(getInitialTheme); const [editorOpen, setEditorOpen] = useState(false);
            const [editingPrompt, setEditingPrompt] = useState(''); const [isCoCreationOpen, setIsCoCreationOpen] = useState(false);
            const [isDataOpen, setIsDataOpen] = useState(false); const [latestNews, setLatestNews] = useState(null);
            const [wechatData, setWechatData] = useState(null); const [visibleCount, setVisibleCount] = useState(12);
            const [growthPreview, setGrowthPreview] = useState([]);

            useEffect(() => applyTheme(theme), [theme]);
            const toggleTheme = () => {
                setTheme((current) => {
                    const next = current === "dark" ? "light" : "dark";
                    try { window.localStorage.setItem(THEME_KEY, next); } catch (error) { console.warn("theme storage unavailable", error); }
                    return next;
                });
            };
            const openEditor = (prompt) => { setEditingPrompt(prompt); setEditorOpen(true); };

            useEffect(() => {
                const cm = () => setIsMobile(window.innerWidth < 768); cm(); window.addEventListener('resize', cm);
                loadJson('./web_data.json', true).then(jd=>{setData(jd);setFilteredData(jd);setCategories([...new Set(jd.map(i=>i.category))].filter(Boolean).sort());setLoading(false);}).catch(e=>{console.error(e);setLoading(false);});
                loadJson('./news_data.json').then(nd=>{if(nd&&nd.length>0)setLatestNews(nd[0]);}).catch(console.error);
                loadJson('./wechat_data.json', true).then(setWechatData).catch(console.error);
                loadJson('./user_growth.json', true).then(d=>setGrowthPreview(Array.isArray(d) ? d.slice(-31) : [])).catch(console.error);
                return () => window.removeEventListener('resize', cm);
            }, []);

            useEffect(() => { setVisibleCount(12); setFilteredData(filter==='all'?data:data.filter(i=>i.category===filter)); }, [filter, data]);

            return (
                <div className={`${theme === "dark" ? 'dark' : ''}`}>
                    <div className="racing-page-shell min-h-screen flex flex-col relative transition-colors duration-700 bg-va-base text-va-ink overflow-hidden">

                        <div className="liquid-stage">
                            <div className="liquid-bg-img" style={{ backgroundImage: `url('./images/${theme === "dark" ? 'bg-night' : 'bg-day'}.png')` }}></div>
                            <div className="liquid-metal-overlay"></div>
                            <div className="liquid-blob liquid-blob-1 animate-blob1"></div>
                            <div className="liquid-blob liquid-blob-2 animate-blob2"></div>
                            <div className="liquid-blob liquid-blob-3 animate-blob3"></div>
                        </div>
                        <div className="va-vignette fixed inset-0 pointer-events-none z-[1]" style={{ background: 'radial-gradient(ellipse at 50% 50%, transparent 55%, rgba(8,12,20,0.35) 100%)' }}></div>

                        <div className="relative z-10">
                            <RacingHomePage totalCount={data.length.toString().padStart(2,'0')} latestNews={latestNews} wechatData={wechatData} growthData={growthPreview} theme={theme} toggleTheme={toggleTheme} onOpenData={()=>setIsDataOpen(true)}/>
                            <CoCreationWidget onOpen={()=>setIsCoCreationOpen(true)}/>
                            <AnimatePresence>{isCoCreationOpen && <CoCreationModal isOpen={isCoCreationOpen} onClose={()=>setIsCoCreationOpen(false)}/>}</AnimatePresence>
                            <AnimatePresence>{isDataOpen && <DataDashboard isOpen={isDataOpen} onClose={()=>setIsDataOpen(false)}/>}</AnimatePresence>

                            <section id="innovation" className="innovation-zone">
                                <Toolbox/>
                            </section>

                            <section id="gallery" className="gallery-zone">
                                <GalleryIntro totalCount={data.length.toString().padStart(2,'0')}/>
                                <FilterBar activeFilter={filter} setFilter={setFilter} categories={categories}/>

                                <main className="flex-grow max-w-7xl mx-auto px-4 md:px-5 w-full">
                                    {loading ? (
                                        <div className="flex justify-center items-center h-64 font-mono text-va-mercury/55">数据流加载中 (INITIALIZING)...</div>
                                    ) : (
                                        <>
                                            <div className="columns-1 md:columns-2 lg:columns-3 gap-8 space-y-8">
                                                <AnimatePresence mode="popLayout">
                                                    {filteredData.slice(0, visibleCount).map((item, index) => (
                                                        <Card key={`${item.title}-${index}`} item={item} index={index} isMobile={isMobile} onEdit={openEditor}/>
                                                    ))}
                                                </AnimatePresence>
                                            </div>
                                            {visibleCount < filteredData.length && (
                                                <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.4 }} className="flex justify-center mt-12 mb-8">
                                                    <button onClick={()=>setVisibleCount(p=>p+12)} className="group relative px-8 py-3 glass rounded-full font-mono text-xs font-bold text-white/60 tracking-widest hover:bg-white/10 hover:text-white transition-all duration-300 shadow-lg hover:scale-105 border-white/10">
                                                        <span className="flex items-center gap-2">加载更多 // LOAD MORE [{filteredData.length - visibleCount}]<svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 group-hover:animate-bounce" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3"/></svg></span>
                                                    </button>
                                                </motion.div>
                                            )}
                                        </>
                                    )}
                                </main>
                            </section>

                            <AnimatePresence>{editorOpen && <PromptEditor isOpen={editorOpen} onClose={()=>setEditorOpen(false)} initialPrompt={editingPrompt} onSave={(np)=>{navigator.clipboard.writeText(np);setEditorOpen(false);}}/>}</AnimatePresence>

                            <PricingSection/>
                            <PromotionBanner/>
                            <Footer/>
                            <BackToTopButton/>
                            <CoffeeButton/>
                        </div>
                    </div>
                </div>
            );
        };

        const root = ReactDOM.createRoot(document.getElementById('root'));
        root.render(<App />);
