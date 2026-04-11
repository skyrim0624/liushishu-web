/* 愿望加速器 JS Logic - Auth + Profile Version */
const SUPABASE_URL = 'https://ntzbtmnzwapgxwocffkc.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im50emJ0bW56d2FwZ3h3b2NmZmtjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU2MzAyNzQsImV4cCI6MjA5MTIwNjI3NH0.VrnNTDT5DcwjhnE1OqU3VCkBG31kOeT3LgNT7ZT8cF8';

// State management
window.state = { 
    currentScreen: 'auth', 
    checkInCount: 0, 
    totalSessions: 4, 
    money: 0, 
    tags: new Set(), 
    user_id: null, 
    category: 'wealth', 
    lifetimeXP: 0,
    displayName: '',
    authMode: 'login' // 'login' or 'register'
};

// Global Navigation — must be available before DOMContentLoaded
window.showScreen = function(id, hideNav = false) {
    const screens = document.querySelectorAll('.screen');
    const navItems = document.querySelectorAll('.nav-item');
    const bottomNav = document.getElementById('bottom-nav');
    const btnGlobalBack = document.getElementById('btn-global-back');
    const headerMenu = document.getElementById('header-menu-icon');

    screens.forEach(s => s.classList.remove('active'));
    const target = document.getElementById(`screen-${id}`);
    if(target) target.classList.add('active');

    // Active Nav styling
    navItems.forEach(n => {
        const isActive = n.dataset.target === id;
        if(isActive){
            n.classList.add('bg-gradient-to-tr', 'from-[#f2ca50]/10', 'to-[#d4af37]/5', 'rounded-2xl', 'text-[#f2ca50]');
            n.classList.remove('opacity-60', 'text-[#d0c5af]');
            const icon = n.querySelector('.material-symbols-outlined');
            if(icon) icon.style.fontVariationSettings = "'FILL' 1";
            const text = n.querySelector('span:last-child');
            if(text) text.classList.add('font-bold');
        } else {
            n.classList.remove('bg-gradient-to-tr', 'from-[#f2ca50]/10', 'to-[#d4af37]/5', 'rounded-2xl', 'text-[#f2ca50]');
            n.classList.add('opacity-60', 'text-[#d0c5af]');
            const icon = n.querySelector('.material-symbols-outlined');
            if(icon) icon.style.fontVariationSettings = "'FILL' 0";
            const text = n.querySelector('span:last-child');
            if(text) text.classList.remove('font-bold');
        }
    });

    // 在 auth 页面隐藏底部导航
    const isAuthScreen = (id === 'auth');
    if(bottomNav) {
        bottomNav.style.transform = (hideNav || isAuthScreen) ? 'translateY(100%)' : 'translateY(0)';
    }
    if(btnGlobalBack) {
        btnGlobalBack.classList.toggle('hidden', !hideNav || isAuthScreen);
    }
    if(headerMenu) {
        headerMenu.textContent = hideNav ? '' : 'person';
    }
    window.state.currentScreen = id;
    window.scrollTo(0, 0);
};

document.addEventListener('DOMContentLoaded', () => {
    console.log("Liushishu App Initializing...");
    
    // ============ SUPABASE INIT ============
    let supabase;
    try {
        supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    } catch(e) {
        console.warn("Supabase not available, running in offline mode.");
    }

    // ============ AUTH HELPERS ============
    function showAuthError(msg) {
        const el = document.getElementById('auth-error');
        if(el) { el.textContent = msg; el.classList.remove('hidden'); }
    }
    function clearAuthError() {
        const el = document.getElementById('auth-error');
        if(el) el.classList.add('hidden');
    }
    function setAuthLoading(loading) {
        const loginBtn = document.getElementById('btn-auth-login');
        const regBtn = document.getElementById('btn-auth-register');
        if(loginBtn) loginBtn.disabled = loading;
        if(regBtn) regBtn.disabled = loading;
        if(loading) {
            if(loginBtn) loginBtn.style.opacity = '0.5';
            if(regBtn) regBtn.style.opacity = '0.5';
        } else {
            if(loginBtn) loginBtn.style.opacity = '1';
            if(regBtn) regBtn.style.opacity = '1';
        }
    }

    // 切换登录/注册模式
    function toggleAuthMode() {
        const nameField = document.getElementById('auth-name-field');
        const loginBtn = document.getElementById('btn-auth-login');
        const regBtn = document.getElementById('btn-auth-register');
        const hint = document.getElementById('auth-toggle-hint');
        clearAuthError();

        if(window.state.authMode === 'login') {
            window.state.authMode = 'register';
            if(nameField) nameField.classList.remove('hidden');
            if(loginBtn) loginBtn.classList.add('hidden');
            if(regBtn) { regBtn.classList.remove('hidden'); regBtn.textContent = '创建账号'; }
            if(hint) hint.innerHTML = '已有账号？<span class="text-primary font-bold" id="auth-toggle-link">去登录</span>';
        } else {
            window.state.authMode = 'login';
            if(nameField) nameField.classList.add('hidden');
            if(loginBtn) { loginBtn.classList.remove('hidden'); }
            if(regBtn) { regBtn.classList.remove('hidden'); regBtn.textContent = '注册新账号'; }
            if(hint) hint.innerHTML = '还没有账号？<span class="text-primary font-bold" id="auth-toggle-link">去注册</span>';
        }
        // 重新绑定 toggle link 的点击事件
        document.getElementById('auth-toggle-link')?.addEventListener('click', toggleAuthMode);
    }

    // 登录成功后的初始化
    async function onAuthSuccess(user) {
        window.state.user_id = user.id;
        
        // 加载或创建 profile
        if(supabase) {
            const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single();
            if(profile) {
                window.state.displayName = profile.display_name || user.email?.split('@')[0] || '记录者';
            } else {
                // 新用户，创建 profile
                const defaultName = user.email?.split('@')[0] || '记录者';
                await supabase.from('profiles').insert([{ id: user.id, display_name: defaultName }]);
                window.state.displayName = defaultName;
            }
        }
        
        updateDisplayName();
        loadTodayData();
        window.showScreen('home');
    }

    // 更新所有显示用户名的地方
    function updateDisplayName() {
        const name = window.state.displayName || '记录者';
        const greetEl = document.getElementById('greeting-text');
        if(greetEl) greetEl.textContent = `你好，${name}`;
        
        const profileNameEl = document.getElementById('profile-display-name');
        if(profileNameEl) profileNameEl.textContent = name;
        
        const editInput = document.getElementById('edit-display-name');
        if(editInput) editInput.value = name;
    }

    // ============ AUTH EVENT BINDINGS ============
    
    // 登录
    document.getElementById('btn-auth-login')?.addEventListener('click', async () => {
        clearAuthError();
        const email = document.getElementById('auth-email')?.value?.trim();
        const password = document.getElementById('auth-password')?.value;
        
        if(!email || !password) { showAuthError('请填写邮箱和密码'); return; }
        
        setAuthLoading(true);
        try {
            const { data, error } = await supabase.auth.signInWithPassword({ email, password });
            if(error) {
                // 友好的错误提示
                if(error.message.includes('Invalid login')) showAuthError('邮箱或密码不正确');
                else if(error.message.includes('Email not confirmed')) showAuthError('请先到邮箱确认注册链接');
                else showAuthError(error.message);
                setAuthLoading(false);
                return;
            }
            if(data?.user) await onAuthSuccess(data.user);
        } catch(e) {
            showAuthError('网络错误，请重试');
        }
        setAuthLoading(false);
    });

    // 注册
    document.getElementById('btn-auth-register')?.addEventListener('click', async () => {
        clearAuthError();
        
        if(window.state.authMode === 'login') {
            // 第一次点击"注册新账号"按钮时，切换到注册模式
            toggleAuthMode();
            return;
        }
        
        const email = document.getElementById('auth-email')?.value?.trim();
        const password = document.getElementById('auth-password')?.value;
        const displayName = document.getElementById('auth-display-name')?.value?.trim();
        
        if(!email || !password) { showAuthError('请填写邮箱和密码'); return; }
        if(password.length < 6) { showAuthError('密码至少需要 6 位'); return; }
        
        setAuthLoading(true);
        try {
            const { data, error } = await supabase.auth.signUp({ email, password });
            if(error) {
                if(error.message.includes('already registered')) showAuthError('该邮箱已注册，请直接登录');
                else showAuthError(error.message);
                setAuthLoading(false);
                return;
            }
            if(data?.user) {
                // 注册成功后创建 profile
                const name = displayName || email.split('@')[0];
                await supabase.from('profiles').insert([{ id: data.user.id, display_name: name }]);
                window.state.displayName = name;
                
                // 检查是否需要邮箱确认
                if(data.session) {
                    // 如果 Supabase 没强制邮箱确认，直接进入
                    await onAuthSuccess(data.user);
                } else {
                    showAuthError('注册成功！请检查邮箱确认链接后再登录');
                    // 切回登录模式
                    toggleAuthMode();
                }
            }
        } catch(e) {
            showAuthError('网络错误，请重试');
        }
        setAuthLoading(false);
    });

    // Toggle link
    document.getElementById('auth-toggle-link')?.addEventListener('click', toggleAuthMode);

    // 退出登录
    document.getElementById('btn-logout')?.addEventListener('click', async () => {
        if(supabase) await supabase.auth.signOut();
        window.state.user_id = null;
        window.state.displayName = '';
        window.state.checkInCount = 0;
        window.state.money = 0;
        window.state.lifetimeXP = 0;
        window.state.authMode = 'login';
        // 清理登录表单
        const emailInput = document.getElementById('auth-email');
        const passInput = document.getElementById('auth-password');
        if(emailInput) emailInput.value = '';
        if(passInput) passInput.value = '';
        clearAuthError();
        window.showScreen('auth');
    });

    // 保存个人资料
    document.getElementById('btn-save-profile')?.addEventListener('click', async () => {
        const newName = document.getElementById('edit-display-name')?.value?.trim();
        if(!newName) return;
        
        window.state.displayName = newName;
        updateDisplayName();
        
        if(supabase && window.state.user_id) {
            await supabase.from('profiles').update({ display_name: newName }).eq('id', window.state.user_id);
        }
        
        const feedback = document.getElementById('profile-save-feedback');
        if(feedback) {
            feedback.classList.remove('hidden');
            setTimeout(() => feedback.classList.add('hidden'), 2000);
        }
    });

    // ============ CHECK SESSION ON LOAD ============
    // 如果用户已经登录过（session 持久化），自动跳转
    if(supabase) {
        (async () => {
            try {
                const { data: { session } } = await supabase.auth.getSession();
                if(session?.user) {
                    await onAuthSuccess(session.user);
                }
            } catch(e) {
                console.warn("Session check failed:", e);
            }
        })();
    }

    // ============ NAVIGATION ============
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(btn => {
        btn.addEventListener('click', () => {
            const target = btn.getAttribute('data-target');
            window.showScreen(target);
        });
    });

    const btnGlobalBack = document.getElementById('btn-global-back');
    if(btnGlobalBack) btnGlobalBack.addEventListener('click', () => window.showScreen('home'));

    // ============ CHECKIN LOGIC ============
    const triggerCheckin = (category) => {
        window.state.category = category;
        window.state.tags.clear();
        
        document.querySelectorAll('.checkin-panel').forEach(p => p.classList.add('hidden'));
        const panel = document.getElementById(`panel-${category}`);
        if(panel) panel.classList.remove('hidden');
        
        const labelMap = { 'wealth': '布施记录', 'kindness': '善意时刻', 'debug': '自我觉察' };
        const label = document.getElementById('checkin-session-label');
        if(label) label.textContent = labelMap[category] || '记录中...';
        
        updateCheckinTags(category);
        window.showScreen('checkin', true);
        startTimer();
    };

    document.getElementById('btn-quick-flash')?.addEventListener('click', () => triggerCheckin('wealth'));
    document.getElementById('seed-wealth')?.addEventListener('click', () => triggerCheckin('wealth'));
    document.getElementById('seed-kindness')?.addEventListener('click', () => triggerCheckin('kindness'));
    document.getElementById('seed-debug')?.addEventListener('click', () => triggerCheckin('debug'));

    // Timer Logic
    let timerInt;
    function startTimer() {
        if(timerInt) clearInterval(timerInt);
        const ring = document.getElementById('checkin-timer-ring');
        const text = document.getElementById('checkin-seconds');
        if(!ring || !text) return;

        let sec = 60;
        ring.style.strokeDashoffset = '0';
        text.textContent = sec;
        
        timerInt = setInterval(() => {
            sec--;
            text.textContent = Math.max(0, sec);
            const progress = 1 - (sec / 60);
            ring.style.strokeDashoffset = progress * 464.96;
            if(sec <= 0) clearInterval(timerInt);
        }, 1000);
    }

    document.getElementById('timer-box')?.addEventListener('click', () => {
        if(timerInt) clearInterval(timerInt);
        const ring = document.getElementById('checkin-timer-ring');
        const text = document.getElementById('checkin-seconds');
        if(text) text.textContent = "0";
        if(ring) ring.style.strokeDashoffset = 464.96;
    });

    // Submitting Checkin
    document.getElementById('btn-submit-checkin')?.addEventListener('click', async () => {
        if(timerInt) clearInterval(timerInt);
        const moneyInput = document.getElementById('checkin-money-input');
        const addedMoney = window.state.category === 'wealth' ? (parseInt(moneyInput?.value) || 0) : 0;
        const note = document.getElementById('checkin-note')?.value || '';
        
        if (supabase && window.state.user_id) {
            await supabase.from('checkins').insert([{ 
                user_id: window.state.user_id, 
                money_amount: addedMoney, 
                tags: Array.from(window.state.tags), 
                category: window.state.category,
                note: note 
            }]);
        }
        
        window.state.checkInCount++;
        window.state.money += addedMoney;
        window.state.lifetimeXP += 10;
        
        const successLabel = document.getElementById('success-label');
        if(successLabel) {
            const labelMap = { 'wealth': '完成布施记录', 'kindness': '记录善意时刻', 'debug': '完成自我觉察' };
            successLabel.textContent = labelMap[window.state.category];
        }
        const successMoney = document.getElementById('success-money');
        if(successMoney) successMoney.textContent = addedMoney;
        
        updateHomeUI();
        window.showScreen('success', true);
    });

    document.getElementById('btn-success-home')?.addEventListener('click', () => {
        updateHomeUI();
        window.showScreen('home');
    });

    function updateCheckinTags(category) {
        const tagsMap = {
            'wealth': ['慷慨布施', '赞美他人', '买单意愿', '分享智慧', '随喜他人'],
            'kindness': ['耐心倾听', '协助同事', '陪伴家人', '认真承诺', '温柔言语'],
            'debug': ['负面评判', '傲慢心', '愤怒', '拖延', '对立情绪']
        };
        const list = tagsMap[category] || [];
        const grid = document.getElementById(`${category}-tags-grid`);
        if (!grid) return;
        
        grid.innerHTML = '';
        list.forEach(w => {
            const btn = document.createElement('button');
            const isActive = window.state.tags.has(w);
            btn.className = `px-4 py-2 rounded-xl border text-[11px] font-bold transition-all ${isActive ? 'bg-primary/20 border-primary text-primary' : 'bg-surface-container-highest/20 border-outline-variant/5 text-on-surface-variant'}`;
            btn.textContent = w;
            btn.onclick = () => {
                if(window.state.tags.has(w)) window.state.tags.delete(w);
                else window.state.tags.add(w);
                updateCheckinTags(category);
            };
            grid.appendChild(btn);
        });
    }

    // AI Insight
    document.getElementById('btn-goto-ai')?.addEventListener('click', () => {
        const reportContent = document.getElementById('ai-report-content');
        if (reportContent) {
            const insights = [
                `本周趋势：你的布施记录集中在清晨时段，说明你的慰慨习惯正在稳定形成。`,
                `值得留意：本周有 3 次"对立情绪"的觉察记录。试试明天多留意一件让你感恩的小事，作为平衡。`,
                `小成就：你已连续 4 天完成睡前复盘，持续记录是改变的开始。`
            ];
            reportContent.innerHTML = insights.map(i => `<div class="p-3 bg-surface-container rounded-2xl border border-outline-variant/10 text-xs leading-relaxed text-on-surface/90">${i}</div>`).join('');
        }
        window.showScreen('ai-insight', true);
    });

    // Profile Freq Settings
    document.querySelectorAll('.freq-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const freq = parseInt(btn.dataset.freq);
            if(!isNaN(freq)) {
                window.state.totalSessions = freq;
                updateHomeUI();
                document.querySelectorAll('.freq-btn').forEach(b => {
                    const isTarget = b === btn;
                    if(isTarget) {
                        b.classList.add('bg-primary/10', 'border-primary', 'ring-1', 'ring-primary', 'ring-inset', 'shadow-lg');
                        b.classList.remove('bg-surface-container', 'opacity-60');
                    } else {
                        b.classList.remove('bg-primary/10', 'border-primary', 'ring-1', 'ring-primary', 'ring-inset', 'shadow-lg');
                        b.classList.add('bg-surface-container', 'opacity-60');
                    }
                });
            }
        });
    });

    // Bedtime
    document.getElementById('btn-bedtime-done')?.addEventListener('click', async () => {
        const btn = document.getElementById('btn-bedtime-done');
        const originalHTML = btn.innerHTML;
        btn.innerHTML = '<span class="material-symbols-outlined text-xl">nightlight</span> 晚安，好梦';
        
        if (supabase && window.state.user_id) {
            const q1 = document.getElementById('bedtime-q1').value;
            const q2 = document.getElementById('bedtime-q2').value;
            const q3 = document.getElementById('bedtime-q3').value;
            await supabase.from('bedtime_reviews').insert([{ user_id: window.state.user_id, q1_good: q1, q2_bad: q2, q3_plan: q3 }]);
            window.state.lifetimeXP += 20;
            updateHomeUI();
        }

        setTimeout(() => {
            btn.innerHTML = originalHTML;
            window.showScreen('home');
        }, 1500);
    });

    document.getElementById('btn-show-tutorial')?.addEventListener('click', () => window.showScreen('tutorial', true));
    document.getElementById('btn-tutorial-back')?.addEventListener('click', () => window.showScreen('home'));

    // ============ HELPERS ============
    function updateHomeUI() {
        const moneyEl = document.getElementById('seed-money-today');
        if(moneyEl) moneyEl.textContent = window.state.money;
        
        const xpEl = document.getElementById('profile-xp');
        if(xpEl) xpEl.textContent = window.state.lifetimeXP;
        
        const badgeEl = document.getElementById('profile-level-badge');
        if(badgeEl) {
            const xp = window.state.lifetimeXP;
            let level = 1, title = '刚刚起步';
            if(xp >= 50) { level = 2; title = '初见成效'; }
            if(xp >= 150) { level = 3; title = '渐入佳境'; }
            if(xp >= 350) { level = 4; title = '习惯养成'; }
            if(xp >= 700) { level = 5; title = '知行合一'; }
            badgeEl.textContent = `Lv.${level} ${title}`;
        }

        const profileMoneyEl = document.getElementById('profile-money');
        if(profileMoneyEl) profileMoneyEl.textContent = window.state.money;
        
        const doneEl = document.getElementById('home-ring-done');
        if(doneEl) doneEl.textContent = window.state.checkInCount;
        
        const totalEl = document.getElementById('home-ring-total');
        if(totalEl) totalEl.textContent = window.state.totalSessions;
        
        const ring = document.getElementById('home-ring-progress');
        if(ring) {
            const ratio = window.state.checkInCount / window.state.totalSessions;
            ring.style.strokeDashoffset = 464.96 * (1 - Math.min(ratio, 1));
        }
    }

    async function loadTodayData() {
        if (!supabase || !window.state.user_id) return;
        const todayStr = new Date().toISOString().split('T')[0];
        const { data } = await supabase.from('checkins').select('*').eq('user_id', window.state.user_id).gte('created_at', todayStr + 'T00:00:00Z');
        if (data) {
            window.state.checkInCount = data.length;
            window.state.money = data.reduce((sum, item) => sum + (item.money_amount || 0), 0);
        }
        const { count: c1 } = await supabase.from('checkins').select('*', { count: 'exact', head: true }).eq('user_id', window.state.user_id);
        const { count: c2 } = await supabase.from('bedtime_reviews').select('*', { count: 'exact', head: true }).eq('user_id', window.state.user_id);
        window.state.lifetimeXP = (c1 || 0) * 10 + (c2 || 0) * 20;
        updateHomeUI();
    }
});
