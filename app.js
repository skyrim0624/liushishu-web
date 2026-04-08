/* 六时书 JS Logic Overhauled with Supabase */
const SUPABASE_URL = 'https://ntzbtmnzwapgxwocffkc.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im50emJ0bW56d2FwZ3h3b2NmZmtjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU2MzAyNzQsImV4cCI6MjA5MTIwNjI3NH0.VrnNTDT5DcwjhnE1OqU3VCkBG31kOeT3LgNT7ZT8cF8';
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

document.addEventListener('DOMContentLoaded', async () => {
    const state = { currentScreen: 'home', checkInCount: 0, totalSessions: 4, money: 0, tags: new Set(), user_id: null, category: 'money' };
    
    // Auth: Anonymous Login
    const { data: authData, error: authErr } = await supabase.auth.signInAnonymously();
    if (authData?.user) {
        state.user_id = authData.user.id;
        loadTodayData();
    }
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

    // Variables for timer
    let timerInt;
    
    // Start Checkin
    document.getElementById('btn-start-checkin').addEventListener('click', () => {
        showScreen('checkin', true);
        document.getElementById('checkin-session-label').textContent = `第 ${state.checkInCount + 1} 次止观`;
        state.tags.clear();
        updateCheckinTags();
        startTimer();
    });

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
        const addedMoney = parseInt(document.getElementById('checkin-money-input').value) || 0;
        
        // Save to Supabase
        if (state.user_id) {
            await supabase.from('checkins').insert([
                { user_id: state.user_id, money_amount: addedMoney, tags: Array.from(state.tags), category: state.category }
            ]);
        }
        
        state.checkInCount++;
        state.money += addedMoney;
        
        document.getElementById('success-count').textContent = state.checkInCount;
        document.getElementById('success-money').textContent = addedMoney;
        document.getElementById('success-tag-count').textContent = `${state.tags.size} 个`;
        
        showScreen('success', true);
    });

    // Checkin Tags toggle
    const tagGrid = document.getElementById('checkin-tags-grid');
    const presets = {
        'money': ['布施零钱', '赞美他人', '慷慨分享', '买单'],
        'love': ['陪伴家人', '认真倾听', '协助同事', '微笑'],
        'clean': ['焦虑', '拖延', '抱怨', '愤怒']
    };
    function updateCheckinTags(tab = 'money') {
        const words = presets[tab];
        tagGrid.innerHTML = '';
        words.forEach(w => {
            const btn = document.createElement('button');
            const isActive = state.tags.has(w);
            btn.className = `checkin-tag-btn px-5 py-2.5 rounded-full border text-sm transition-colors ${isActive ? 'bg-primary/20 border-primary text-primary' : 'bg-surface-container border-outline-variant/10 text-on-surface'}`;
            btn.textContent = w;
            btn.onclick = () => {
                if(state.tags.has(w)) state.tags.delete(w);
                else state.tags.add(w);
                updateCheckinTags(tab);
            };
            tagGrid.appendChild(btn);
        });
    }

    const checkTabBtns = document.querySelectorAll('.checkin-tab');
    checkTabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            checkTabBtns.forEach(b => {
                b.classList.remove('bg-surface-container', 'text-primary', 'shadow-sm');
                b.classList.add('text-on-surface-variant');
            });
            btn.classList.add('bg-surface-container', 'text-primary', 'shadow-sm');
            btn.classList.remove('text-on-surface-variant');
            
            // hide show money panel
            state.category = btn.dataset.tab;
            const isMoney = state.category === 'money';
            document.getElementById('panel-money').style.display = isMoney ? 'block' : 'none';
            updateCheckinTags(state.category);
        });
    });
    updateCheckinTags('money'); // initial load

    // Success to Home
    document.getElementById('btn-success-home').addEventListener('click', () => {
        updateHomeUI();
        showScreen('home');
    });

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
        updateHomeUI();
    }

    function updateHomeUI() {
        document.getElementById('seed-money-today').textContent = state.money;
        document.getElementById('wealth-monthly').textContent = 286 + state.money; // Mocking historic baseline
        document.getElementById('home-ring-done').textContent = state.checkInCount;
        
        // Use 464.96 because the SVG properties changed from 552.92
        const strokeMax = 464.96;
        const ratio = state.checkInCount / state.totalSessions;
        const el = document.getElementById('home-ring-progress');
        if (el) {
            el.style.strokeDashoffset = strokeMax * (1 - Math.min(ratio, 1));
        }
    }
});
