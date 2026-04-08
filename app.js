/* 六时书 JS Logic Overhauled with Supabase */
const SUPABASE_URL = 'https://ntzbtmnzwapgxwocffkc.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im50emJ0bW56d2FwZ3h3b2NmZmtjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU2MzAyNzQsImV4cCI6MjA5MTIwNjI3NH0.VrnNTDT5DcwjhnE1OqU3VCkBG31kOeT3LgNT7ZT8cF8';
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

document.addEventListener('DOMContentLoaded', async () => {
    const state = { currentScreen: 'home', checkInCount: 0, totalSessions: 4, money: 0, tags: new Set(), user_id: null, category: 'wealth', lifetimeXP: 0 };
    
    const getLevelInfo = (xp) => {
        if(xp < 50) return {level: 1, title: '觉醒测试期'};
        if(xp < 150) return {level: 2, title: '能量蓄水池'};
        if(xp < 350) return {level: 3, title: '显化初阶'};
        if(xp < 700) return {level: 4, title: '频率共振者'};
        return {level: 5, title: '造物主玩家'};
    };
    
    // Auth: Anonymous Login
    (async () => {
        const { data: authData, error: authErr } = await supabase.auth.signInAnonymously();
        if (authData?.user) {
            state.user_id = authData.user.id;
            loadTodayData();
        }
    })();
    // Elements
    const screens = document.querySelectorAll('.screen');
    const navItems = document.querySelectorAll('.nav-item');
    const bottomNav = document.getElementById('bottom-nav');
    const btnGlobalBack = document.getElementById('btn-global-back');
    const headerMenu = document.getElementById('header-menu-icon');

    // Display Screen Logic
    function showScreen(id, hideNav = false) {
        screens.forEach(s => s.classList.remove('active'));
        const target = document.getElementById(`screen-${id}`);
        if(target) target.classList.add('active');
        
        // Active Nav styling
        navItems.forEach(n => {
            const isActive = n.dataset.target === id;
            if(isActive){
                n.classList.add('bg-gradient-to-tr', 'from-[#f2ca50]/10', 'to-[#d4af37]/5', 'rounded-2xl', 'text-[#f2ca50]');
                n.classList.remove('opacity-60', 'text-[#d0c5af]');
                n.querySelector('.material-symbols-outlined').style.fontVariationSettings = "'FILL' 1";
                n.querySelector('span:last-child').classList.add('font-bold');
            } else {
                n.classList.remove('bg-gradient-to-tr', 'from-[#f2ca50]/10', 'to-[#d4af37]/5', 'rounded-2xl', 'text-[#f2ca50]');
                n.classList.add('opacity-60', 'text-[#d0c5af]');
                n.querySelector('.material-symbols-outlined').style.fontVariationSettings = "'FILL' 0";
                n.querySelector('span:last-child').classList.remove('font-bold');
            }
        });

        // Hide/Show bottom nav and Top bar config
        if(hideNav) {
            bottomNav.style.transform = 'translateY(100%)';
            btnGlobalBack.classList.remove('hidden');
            headerMenu.textContent = ''; // hide menu icon
        } else {
            bottomNav.style.transform = 'translateY(0)';
            btnGlobalBack.classList.add('hidden');
            headerMenu.textContent = 'person';
        }
        state.currentScreen = id;
        window.scrollTo(0,0);
    }

    navItems.forEach(btn => btn.addEventListener('click', () => showScreen(btn.dataset.target)));
    btnGlobalBack.addEventListener('click', () => showScreen('home'));

    // AI Insight and Tutorial Navigation
    document.getElementById('btn-goto-ai').addEventListener('click', () => {
        initAIInsight();
        showScreen('ai-insight', true);
    });
    document.getElementById('btn-show-tutorial')?.addEventListener('click', () => showScreen('tutorial', true));
    document.getElementById('btn-tutorial-back').addEventListener('click', () => showScreen('home'));
    document.getElementById('btn-success-home').addEventListener('click', () => {
        updateHomeUI();
        showScreen('home');
    });

    // Variables for timer
    let timerInt;
    
    // Specialized Checkin Triggers
    const triggerCheckin = (category) => {
        state.category = category;
        state.tags.clear();
        
        // Setup UI for category
        document.querySelectorAll('.checkin-panel').forEach(p => p.classList.add('hidden'));
        document.getElementById(`panel-${category}`).classList.remove('hidden');
        
        const labelMap = { 'wealth': '财富吸引力注入', 'kindness': '高光善意同步', 'debug': '意识 Bug 修复' };
        document.getElementById('checkin-session-label').textContent = labelMap[category] || '能量同步中...';
        
        updateCheckinTags(category);
        showScreen('checkin', true);
        startTimer();
    };

    document.getElementById('btn-quick-flash').addEventListener('click', () => triggerCheckin('wealth'));
    document.getElementById('seed-wealth').addEventListener('click', () => triggerCheckin('wealth'));
    document.getElementById('seed-kindness').addEventListener('click', () => triggerCheckin('kindness'));
    document.getElementById('seed-debug').addEventListener('click', () => triggerCheckin('debug'));

    const timerRing = document.getElementById('checkin-timer-ring');
    const timerText = document.getElementById('checkin-seconds');
    function startTimer() {
        if(timerInt) clearInterval(timerInt);
        let sec = 60;
        timerRing.style.strokeDashoffset = '0';
        timerText.textContent = sec;
        
        timerInt = setInterval(() => {
            sec--;
            timerText.textContent = Math.max(0, sec);
            const progress = 1 - (sec / 60);
            timerRing.style.strokeDashoffset = progress * 552.92;
            if(sec <= 0) clearInterval(timerInt);
        }, 1000);
    }

    // Skip timer on click
    document.getElementById('timer-box').addEventListener('click', () => {
        if(timerInt) clearInterval(timerInt);
        timerText.textContent = "0";
        timerRing.style.strokeDashoffset = 552.92;
    });

    // Submitting Checkin
    const submitBtn = document.getElementById('btn-submit-checkin');
    submitBtn.addEventListener('click', async () => {
        if(timerInt) clearInterval(timerInt);
        const addedMoney = state.category === 'wealth' ? (parseInt(document.getElementById('checkin-money-input').value) || 0) : 0;
        const note = document.getElementById('checkin-note').value;
        
        // Save to Supabase
        if (state.user_id) {
            await supabase.from('checkins').insert([
                { 
                    user_id: state.user_id, 
                    money_amount: addedMoney, 
                    tags: Array.from(state.tags), 
                    category: state.category,
                    note: note 
                }
            ]);
        }
        
        state.checkInCount++;
        state.money += addedMoney;
        state.lifetimeXP += 10;
        
        // Success View config
        const labelMap = { 'wealth': '注入财富吸引力', 'kindness': '注入高光善意', 'debug': '完成意识 Debug' };
        document.getElementById('success-label').textContent = labelMap[state.category];
        document.getElementById('success-money').textContent = addedMoney;
        
        // Update home UI stats immediately in memory
        updateHomeUI();
        showScreen('success', true);
        document.getElementById('checkin-note').value = ''; // clear for next time
    });

    // Checkin Tags toggle
    const tagsMap = {
        'wealth': {
            grid: document.getElementById('wealth-tags-grid'), // Wait, I put kindness/debug tags grids in HTML
            list: ['慷慨布施', '赞美他人', '买单意愿', '分享智慧', '随喜他人']
        },
        'kindness': {
            grid: document.getElementById('kindness-tags-grid'),
            list: ['耐心倾听', '协助同事', '陪伴家人', '认真承诺', '温柔言语']
        },
        'debug': {
            grid: document.getElementById('debug-tags-grid'),
            list: ['负面评判', '傲慢心', '愤怒', '拖延', '对立情绪']
        }
    };

    function updateCheckinTags(category) {
        const config = tagsMap[category];
        const grid = config.grid || document.getElementById(`${category}-tags-grid`);
        if (!grid) return;
        
        grid.innerHTML = '';
        config.list.forEach(w => {
            const btn = document.createElement('button');
            const isActive = state.tags.has(w);
            btn.className = `checkin-tag-btn px-4 py-2 rounded-xl border text-[11px] font-bold transition-all ${isActive ? 'bg-primary/20 border-primary text-primary' : 'bg-surface-container-highest/20 border-outline-variant/5 text-on-surface-variant'}`;
            btn.textContent = w;
            btn.onclick = () => {
                if(state.tags.has(w)) state.tags.delete(w);
                else state.tags.add(w);
                updateCheckinTags(category);
            };
            grid.appendChild(btn);
        });
    }

    // AI Insight Logic
    function initAIInsight() {
        const reportContent = document.getElementById('ai-report-content');
        if (!reportContent) return;
        
        // Simple mock intelligence based on state
        const insights = [
            `本周你的**财富吸引力**提升了 12%，这与你每日坚持的同步动作高度相关。`,
            `你在“状态 Debug”中记录了最多的“负面评判”，这可能是你能量流失的缺口。`,
            `连续 ${state.checkInCount} 次的能量同步正在重塑你的潜意识回路。`
        ];
        
        reportContent.innerHTML = insights.map(i => `<p class="text-sm leading-relaxed text-on-surface/90">${i}</p>`).join('');
    }

    // Custom Frequency Setting in Profile
    document.querySelectorAll('.freq-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            if(btn.dataset.freq) {
                document.querySelectorAll('.freq-btn').forEach(b => {
                    b.classList.remove('bg-primary/10', 'border-primary', 'ring-2', 'shadow-xl');
                    b.classList.add('bg-surface-container', 'border-outline-variant/20', 'opacity-60');
                    const txt = b.querySelector('.text-primary');
                    if(txt) txt.className = 'text-xs font-medium text-on-surface-variant';
                    const icon = b.querySelector('.bg-primary\/20');
                    if(icon) icon.className = 'w-10 h-10 rounded-full bg-surface-container-highest flex items-center justify-center';
                });
                btn.classList.add('bg-primary/10', 'border-primary', 'ring-2', 'shadow-xl');
                btn.classList.remove('bg-surface-container', 'border-outline-variant/20', 'opacity-60');
                btn.querySelector('span').className = 'text-xs font-bold text-primary';
                btn.querySelector('div').className = 'w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center text-primary';
                
                state.totalSessions = parseInt(btn.dataset.freq);
                document.getElementById('home-ring-total').textContent = state.totalSessions;
                const ratio = state.checkInCount / state.totalSessions;
                document.getElementById('home-ring-progress').style.strokeDashoffset = 552.92 * (1 - Math.min(ratio, 1));
            }
        });
    });

    // Bedtime submit
    document.getElementById('btn-bedtime-done').addEventListener('click', async () => {
        const btn = document.getElementById('btn-bedtime-done');
        btn.innerHTML = '<span class="material-symbols-outlined text-xl">nightlight</span> 晚安，好梦';
        
        if (state.user_id) {
            const q1 = document.getElementById('bedtime-q1').value;
            const q2 = document.getElementById('bedtime-q2').value;
            const q3 = document.getElementById('bedtime-q3').value;
            await supabase.from('bedtime_reviews').insert([
                { user_id: state.user_id, q1_good: q1, q2_bad: q2, q3_plan: q3 }
            ]);
            state.lifetimeXP += 20;
            updateHomeUI();
        }

        setTimeout(() => {
            btn.innerHTML = '<span class="material-symbols-outlined text-lg">bedtime</span>保存并入睡';
            showScreen('home');
        }, 1500);
    });

    // Fill Calendar
    const calGrid = document.getElementById('calendar-grid');
    if(calGrid) {
        for(let i=0; i<30; i++) {
            const el = document.createElement('div');
            const level = Math.random() > 0.6 ? 2 : (Math.random() > 0.4 ? 1 : 0);
            el.className = `aspect-square rounded-lg flex items-center justify-center text-xs ${level===2?'bg-primary text-on-primary font-bold':(level===1?'bg-primary/30 text-on-surface-variant':'bg-surface-container text-on-surface-variant')}`;
            el.textContent = i+1;
            calGrid.appendChild(el);
        }
    }
    
    // Load remote data
    async function loadTodayData() {
        if (!state.user_id) return;
        
        const todayStr = new Date().toISOString().split('T')[0];
        const { data, error } = await supabase.from('checkins')
            .select('*')
            .eq('user_id', state.user_id)
            .gte('created_at', todayStr + 'T00:00:00Z');
            
        if (data && !error) {
            state.checkInCount = data.length;
            state.money = data.reduce((sum, item) => sum + (item.money_amount || 0), 0);
        }
        
        // Fetch XP
        const { count: checkinCount } = await supabase.from('checkins').select('*', { count: 'exact', head: true }).eq('user_id', state.user_id);
        const { count: bedtimeCount } = await supabase.from('bedtime_reviews').select('*', { count: 'exact', head: true }).eq('user_id', state.user_id);
        state.lifetimeXP = (checkinCount || 0) * 10 + (bedtimeCount || 0) * 20;
        
        updateHomeUI();
    }

    function updateHomeUI() {
        document.getElementById('seed-money-today').textContent = state.money;
        const wealthMonthlyEl = document.getElementById('wealth-monthly');
        if (wealthMonthlyEl) wealthMonthlyEl.textContent = 286 + state.money; // Mocking historic baseline
        
        const profileXpEl = document.getElementById('profile-xp');
        if (profileXpEl) profileXpEl.textContent = state.lifetimeXP;
        
        const profileLevelEl = document.getElementById('profile-level-badge');
        if (profileLevelEl) {
            const lInfo = getLevelInfo(state.lifetimeXP);
            profileLevelEl.textContent = `Lv.${lInfo.level} ${lInfo.title}`;
        }
        
        const homeRingDoneEl = document.getElementById('home-ring-done');
        if (homeRingDoneEl) homeRingDoneEl.textContent = state.checkInCount;
        
        // Use 464.96 because the SVG properties changed from 552.92
        const strokeMax = 464.96;
        const ratio = state.checkInCount / state.totalSessions;
        const el = document.getElementById('home-ring-progress');
        if (el) {
            el.style.strokeDashoffset = strokeMax * (1 - Math.min(ratio, 1));
        }
    }
});
