const root = document.body.dataset.root, page = +document.body.dataset.page, app = document.querySelector('#app');
const paths = ['index.html', 'sub/lists/lists.html', 'sub/detail/detail.html', 'sub/payment/payment.html', 'sub/payment_finish/payment_finish.html', 'sub/cart/cart.html', 'sub/about/about.html', 'sub/community/community.html', 'sub/login/login.html', 'sub/mypage/mypage.html'];
const url = (i, q = '') => root + paths[i] + q, img = f => root + 'img/' + f, won = n => n.toLocaleString('ko-KR') + '원', $ = s => document.querySelector(s), esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const menus = [['오리지널 입덕볶이', 9900, '매콤달콤한 특제 소스', 'menu_1.jpg', '떡볶이'], ['쫄깃 밀떡볶이', 10900, '쫄깃한 밀떡과 어묵', 'menu_2.jpg', '떡볶이'], ['계란 듬뿍 떡볶이', 11900, '든든한 계란 토핑', 'menu_3.jpg', '떡볶이'], ['짜장 떡볶이', 11900, '달콤하고 고소한 소스', 'menu_4.jpg', '떡볶이'], ['치즈 폭탄 떡볶이', 12900, '고소한 치즈 토핑', 'recommend_img.jpg', '떡볶이'], ['입덕 한상 세트', 19900, '떡볶이와 사이드 한상', 'main_1.jpg', '세트'], ['모둠 튀김', 5500, '바삭한 사이드', 'fried.jpg', '사이드'], ['주먹밥', 3500, '매운맛과 잘 어울리는 한입', 'rice.jpg', '사이드'], ['콜라', 2000, '시원한 탄산음료', 'cola_v35.jpg', '음료']];
const extras = [['치즈 추가', 2000], ['양배추 추가', 1000], ['비엔나 추가', 1500], ['콘치즈 추가', 2000], ['중국당면 추가', 2000], ['모둠 튀김', 5500], ['주먹밥', 3500], ['콜라', 2000]];
const scoped = k => ['coupon', 'couponUse', 'couponIssued', 'receipt', 'orders', 'addresses', 'cart'].includes(k) ? k + ':' + (user === null ? 'guest' : 'member:' + user) : k;
let user = null;
const get = (k, d) => { 
    try {
    return JSON.parse(localStorage.getItem('ipdeok4:' + scoped(k))) ?? d;
}
catch {
    return d;
} 
}, set = (k, v) => localStorage.setItem('ipdeok4:' + scoped(k), JSON.stringify(v));
user = get('user', null);
let cart = get('cart', []);
let checkoutItems = null;
const orderItems = () => checkoutItems || cart;
const amount = o => (menus[o.id][1] + o.opts.reduce((a, i) => a + extras[i][1], 0)) * o.qty, subtotal = () => orderItems().reduce((a, o) => a + amount(o), 0), delivery = () => orderItems().length ? 3000 : 0, discount = () => get('coupon', false) && get('couponUse', true) ? Math.min(1000, subtotal()) : 0, total = () => subtotal() + delivery() - discount();
let profiles = get('profiles', {});
const profile = () => Object.hasOwn(profiles, user) ? profiles[user] : null;
const saveProfile = d => { 
    profiles = { ...profiles, [user]: d }; 
    set('profiles', profiles); 
};
const options = o => [o.spicy, o.rice, ...o.opts.map(i => extras[i][0]), o.note].filter(Boolean).map(esc).join(' · ') || '기본 구성';
function toast(s) { 
    $('.toast')?.remove(); 
    const d = document.createElement('div'); 
    d.className = 'toast'; 
    d.textContent = s; 
    d.setAttribute('role', 'status'); 
    document.body.append(d); 
    setTimeout(() => d.remove(), 2200); 
}
// Shared empty states and confirmation dialogs.
const uiIcon = (path) => `<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${path}</svg>`;
const lockIcon = uiIcon('<rect x="5" y="10" width="14" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3 M12 14v3"/>');
function emptyState(kind, title, description, action = '') {
    const paths = {cart:'<path d="M3 3h2l3 13h11l2-10H6"/><circle cx="9" cy="21" r="1"/><circle cx="19" cy="21" r="1"/>', orders:'<path d="M5 3h14v18l-3-2-4 2-4-2-3 2zM9 8h6M9 12h6"/>', coupons:'<path d="M3 6h18v4a2 2 0 0 0 0 4v4H3v-4a2 2 0 0 0 0-4z"/>', addresses:'<path d="M20 10c0 6-8 11-8 11S4 16 4 10a8 8 0 1 1 16 0z"/><circle cx="12" cy="10" r="2.5"/>', posts:'<path d="M4 4h16v12H9l-5 4zM8 8h8M8 12h5"/>'};
    return `<div class="empty-state"><span class="empty-symbol">${uiIcon(paths[kind])}</span><h3>${title}</h3><p>${description}</p>${action}</div>`;
}
function confirmAction(message) {
    return new Promise(resolve => {
        const d = document.createElement('dialog');
        d.className = 'added-dialog confirm-dialog';
        d.innerHTML = `<div class="added-icon">${uiIcon('<path d="M12 8v5m0 4h.01"/><circle cx="12" cy="12" r="10"/>')}</div><h2>${esc(message)}</h2><p class="muted">삭제한 내용은 복구할 수 없어요.</p><div class="row"><button class="secondary" data-no>취소</button><button class="primary" data-yes>삭제</button></div>`;
        document.body.append(d);
        d.onclose = () => { resolve(d.returnValue === 'yes'); d.remove(); };
        d.querySelector('[data-no]').onclick = () => d.close('no');
        d.querySelector('[data-yes]').onclick = () => d.close('yes');
        d.showModal();
    });
}
function shell(content) { 
    app.innerHTML = `<header>
        <a class="brand" href="${url(0)}">
        <img src="${img('mascot_v34.png')}" alt="입덕볶이">
        </a>
        <div class="row">
        <a class="auth-pill ${user ? 'signed' : ''}" href="${url(user ? 9 : 8)}">${userIcon} ${user ? '마이페이지' : '로그인'}</a>
        <a class="bag" href="${url(5)}" aria-label="장바구니">
        <svg viewBox="0 0 24 24" width="25" height="25" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <path d="M2 3h3l3 13h11l3-10H6"/>
        <circle cx="9" cy="21" r="1"/>
        <circle cx="19" cy="21" r="1"/>
        </svg> <span id="badge">${cart.reduce((a, o) => a + o.qty, 0)}</span>
        </a>
        <button id="open" aria-label="메뉴 열기" aria-expanded="false">☰</button>
        </div>
        </header>
        <main>${content}</main>
        <footer><b>입덕볶이 · IPDEOK</b>
        <p>주문 서비스 실습용 프로토타입 · 실제 결제 없음</p>
        </footer>
        <div class="overlay" id="overlay">
        </div>
        <nav class="drawer" id="drawer" aria-label="전체 메뉴" inert>
            <div class="drawer-top">
                <div class="row between"><b>입덕볶이</b><button id="close" aria-label="메뉴 닫기">${uiIcon('<path d="m6 6 12 12M18 6 6 18"/>')}</button></div>
                <div class="drawer-profile">
                    <span class="drawer-avatar">${userIcon}</span>
                    <div><strong>${user ? esc(user) + '님' : '입덕을 환영합니다!'}</strong><p>${user ? '오늘도 맛있게 입덕하세요 ♡' : '로그인하고 맛있게 입덕하세요.'}</p></div>
                </div>
                <div class="drawer-shortcuts">${(user ? [[url(9),'마이페이지'],[url(9,'?view=orders'),'주문 내역']] : [[url(8),'로그인'],[url(8,'?signup=1'),'회원가입']]).map(([href,label]) => `<a href="${href}">${label}</a>`).join('')}</div>
            </div>
            <div class="drawer-body">
                <p class="drawer-label">입덕볶이 둘러보기</p>
                ${[
                    [url(0),'홈','<path d="m3 10 9-7 9 7v11h-6v-7H9v7H3z"/>'],
                    [url(1),'메뉴 보기','<path d="M4 3v7a3 3 0 0 0 6 0V3M7 3v18M20 3c-4 2-5 6-5 10h5m0-10v18"/>'],
                    [url(5),'장바구니','<path d="M2 3h3l3 13h11l3-10H6"/><circle cx="9" cy="21" r="1"/><circle cx="19" cy="21" r="1"/>'],
                    [url(0,'#eventSection'),'이벤트 · 쿠폰','<path d="M3 6h18v4a2 2 0 0 0 0 4v4H3v-4a2 2 0 0 0 0-4zM14 6v3m0 3v1m0 3v2"/>'],
                    [url(7),'커뮤니티','<path d="M4 4h16v12H9l-5 4zM8 8h8M8 12h5"/>'],
                    [url(6),'브랜드 소개','<path d="M3 9h18l-2-6H5zM5 9v12h14V9M9 21v-7h6v7"/>']
                ].map(([href,label,path]) => `<a class="drawer-link" href="${href}">${uiIcon(path)}<span>${label}</span><span class="drawer-chevron" aria-hidden="true">›</span></a>`).join('')}
                ${user ? `<button id="navLogout" class="drawer-logout">${uiIcon('<path d="M10 4H4v16h6M10 12h11m-4-4 4 4-4 4"/>')} 로그아웃</button>` : ''}
                <div class="drawer-signoff"><b>오늘도 입덕 완료 ♡</b><small>IPDEOK BOKKI</small></div>
            </div>
        </nav>`;
    if (user)
    $('#navLogout').onclick = () => { 
        sessionStorage.removeItem('ipdeok:checkout');
        set('user', null); 
        location.href = url(0); 
    }; 
    const toggle = b => { 
        $('#drawer').classList.toggle('open', b);
        $('#drawer').inert = !b;
        if (b) $('#close').focus();
        else if ($('#drawer').contains(document.activeElement)) $('#open').focus(); 
        $('#overlay').classList.toggle('open', b); 
        $('#open').setAttribute('aria-expanded', b); 
    }; 
    $('#open').onclick = () => toggle(true);
    $('#drawer').querySelectorAll('a').forEach(a => a.addEventListener('click', () => toggle(false))); 
    $('#close').onclick = $('#overlay').onclick = () => toggle(false); 
    document.onkeydown = e => { 
        if (e.key === 'Escape')
    toggle(false); 
    }; 
}
const card = (m, i) => `<a class="card fade" href="${url(2, '?menu=' + i)}">
        <div class="photo">
        <img src="${img(m[3])}" alt="${m[0]}">${i === 0 || i === 4 ? '<span class="tag">BEST</span>' : i > 4 ? '<span class="tag">NEW</span>' : ''}</div>
        <div class="info">
        <small>${m[4]}</small>
        <h3>${m[0]}</h3>
        <p class="muted">${m[2]}</p>
        <p class="price">${won(m[1])}</p>
        </div>
        </a>`;
function tabs(el, labels, active, fn) { 
    const n = document.getElementById(el); 
    n.innerHTML = labels.map((x, i) => `<button class="chip ${i === active ? 'active' : ''}" aria-pressed="${i === active}">${x}</button>`).join(''); 
    [...n.children].forEach((b, i) => b.onclick = () => fn(i)); 
}
function filter(el) { 
    const cats = ['전체', '떡볶이', '사이드', '세트', '음료']; 
    const draw = i => { 
        tabs('filters', cats, i, draw); 
        document.getElementById(el).innerHTML = menus.map((m, j) => !i || m[4] === cats[i] ? card(m, j) : '').join(''); 
    }; 
    draw(0); 
}
function home() { 
    shell(`<section class="hero">
        <img src="${img('hero_v34.jpg')}" alt="입덕볶이 — 떡볶이 속 요리사 캐릭터">
        </section>
        <section class="quick-actions">
        <a class="dive-order" href="${url(1)}">
        <span class="dive-scene" aria-hidden="true">
        <svg viewBox="0 -20 120 145" xmlns="http://www.w3.org/2000/svg">
        <ellipse cx="60" cy="85" rx="46" ry="13" fill="#f87326" stroke="#75371c" stroke-width="2.5"/>
        <g class="mascot37" stroke="#75371c" stroke-width="2.5" stroke-linejoin="round">
        <path d="M43 53Q60 45 77 53L80 76Q60 84 40 76Z" fill="#ce3424"/>
        <path d="M48 52L50 62H70L72 52" fill="#fff3d9"/>
        <path d="M46 27L46 20Q35 13 43 7Q50 2 56 7Q65 -1 72 7Q85 4 85 15Q84 22 76 23L75 29Z" fill="#fffdf6"/>
        <ellipse cx="60" cy="41" rx="23" ry="19" fill="#fff1d6"/>
        <circle cx="52" cy="39" r="2.6" fill="#75371c" stroke="none"/>
        <path d="M65 39l6 -4m-6 4l6 3" fill="none" stroke-linecap="round"/>
        <ellipse cx="45" cy="46" rx="4" ry="2.7" fill="#ff9d81" stroke="none"/>
        <ellipse cx="75" cy="46" rx="4" ry="2.7" fill="#ff9d81" stroke="none"/>
        <path d="M55 46H65Q60 59 55 46Z" fill="#a42d20" stroke-width="1.5"/>
        <circle cx="38" cy="59" r="7" fill="#fff1d6"/>
        <circle cx="82" cy="59" r="7" fill="#fff1d6"/>
        </g>
        <path d="M14 85Q60 111 106 85Q101 119 60 120Q19 119 14 85Z" fill="#fff1d6" stroke="#75371c" stroke-width="2.5"/>
        <path d="M15 85Q60 98 105 85Q60 111 15 85Z" fill="#f87326"/>
        <ellipse cx="32" cy="88" rx="9" ry="3.5" fill="#ffb46a"/>
        <ellipse cx="88" cy="88" rx="9" ry="3.5" fill="#ffb46a"/>
        <g class="drops37" fill="#ff9b42">
        <circle cx="15" cy="65" r="4"/>
        <circle cx="105" cy="61" r="4"/>
        <path d="M27 81Q9 51 22 60L39 84ZM83 84Q109 48 100 71L96 85Z"/>
        </g>
        </svg>
        </span>
        <span class="action-copy"><b>주문하기</b>
        <small>매콤한 입덕의 세계로 풍덩!</small>
        </span>
        </a>
        <div class="quick-pair">
        <button id="phone">
        <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7l.7 3a2 2 0 0 1-.5 2.1L8 10a16 16 0 0 0 6 6l1.2-1.3a2 2 0 0 1 2.1-.5l3 .7a2 2 0 0 1 1.7 2Z"/>
        </svg>전화 주문</button>
        <button id="coupon">
        <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <path d="M3 5h18v4a3 3 0 0 0 0 6v4H3v-4a3 3 0 0 0 0-6Z"/>
        <path d="m9 15 6-6"/>
        <circle cx="9" cy="9" r=".6"/>
        <circle cx="15" cy="15" r=".6"/>
        </svg>쿠폰 받기</button>
        </div>
        </section>
        <section class="recommend">
        <div class="row between">
        <h2>추천 메뉴</h2>
        <span class="eyebrow">BEST PICK</span>
        </div>
        <div class="rec-window" id="rec">
        <div class="rec-track">${[5, 0, 4, 2, 3, 5, 0].map(i => `<article class="rec-slide">
        <a class="rec-link" href="${url(2, '?menu=' + i)}">
        <p>IPDEOK PICK</p>
        <h3>${menus[i][0]}</h3>
        <span class="rec-order">${won(menus[i][1])} · 주문하기</span>
        <img src="${img(menus[i][3])}" alt="${menus[i][0]}">
        </a>
        </article>`).join('')}</div>
        </div>
        <div class="rec-controls">
        <div id="dots">
        </div>
        </div>
        </section>
        <section>
        <div class="row between">
        <h2>메뉴</h2>
        <a href="${url(1)}">전체 보기 →</a>
        </div>
        <div class="chips" id="filters">
        </div>
        <div class="grid" id="grid">
        </div>
        </section>
        <section class="event" id="eventSection">
        <h2>이벤트</h2>
        <div class="chips" id="events">
        </div>
        <div id="eventBody">
        </div>
        </section>`); 
    let n = 1, busy = false, timer; 
    const track = $('.rec-track'); 
    const move = (animate = true) => { 
        track.style.transition = animate ? '' : 'none'; 
        track.style.transform = `translateX(calc(${-n * 100}% - ${n * 16}px))`; 
        [...track.children].forEach((c, i) => { 
            c.classList.toggle('selected', i === n); 
            c.querySelector('a').tabIndex = i === n ? 0 : -1; 
        }); 
        const active = (n + 4) % 5; 
        $('#dots').innerHTML = Array.from({ length: 5 }, (_, i) => `<button class="dot ${i === active ? 'active' : ''}" aria-label="추천 ${i + 1}">
        </button>`).join(''); 
        [...$('#dots').children].forEach((b, i) => b.onclick = () => { 
            if (busy)
    return; 
            n = i + 1; 
            move(); 
        }); 
    }; 
    const settle = () => { 
        clearTimeout(timer); 
        if (n === 0 || n === 6) {
    n = n === 0 ? 5 : 1;
    move(false);
    track.getBoundingClientRect();
    track.style.transition = '';
} 
        busy = false; 
    }; 
    const step = d => { 
        if (busy)
    return; 
        busy = true; 
        n += d; 
        move(); 
        timer = setTimeout(settle, 460); 
    }; 
    track.addEventListener('transitionend', e => { 
        if (e.target === track && e.propertyName === 'transform')
    settle(); 
    }); 
    // Distinguish horizontal gestures from ordinary card clicks.
    const rec = $('#rec');
    let gesture = null, dragged = false;
    rec.addEventListener('dragstart', e => e.preventDefault());
    rec.addEventListener('pointerdown', e => {
        if (!e.isPrimary || e.button !== 0) return;
        dragged = false;
        gesture = { id: e.pointerId, x: e.clientX, y: e.clientY };
    });
    window.addEventListener('pointerup', e => {
        if (!gesture || gesture.id !== e.pointerId) return;
        const dx = e.clientX - gesture.x, dy = e.clientY - gesture.y;
        gesture = null;
        if (Math.abs(dx) > 35 && Math.abs(dx) > Math.abs(dy)) {
            dragged = true;
            step(dx < 0 ? 1 : -1);
        }
    });
    window.addEventListener('pointercancel', () => { gesture = null; });
    rec.addEventListener('click', e => {
        if (dragged || busy) {
            e.preventDefault();
            dragged = false;
            return;
        }
        const card = e.target.closest(".rec-slide");
        if (card && !card.classList.contains("selected")) {
            e.preventDefault();
            step([...track.children].indexOf(card) < n ? -1 : 1);
        }
    }, true);
    move(false); 
    filter('grid'); 
    const coupon = () => { 
        if (!user) {
    loginPrompt('coupon');
    return;
} 
        if (get('couponIssued', false))
    return; 
        set('couponIssued', true); 
        set('coupon', true); 
        set('couponUse', true); 
        toast('시연용 1,000원 쿠폰을 받았어요'); 
        ev(0); 
    }; 
    $('#coupon').onclick = () => { 
        ev(0); 
        $('#eventSection').scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' }); 
    }; 
    $('#phone').onclick = () => toast('실습용 사이트로 전화 주문은 제공하지 않습니다.'); 
    const ev = i => { 
        tabs('events', ['진행 중', '종료', '당첨자'], i, ev); 
        $('#eventBody').innerHTML = i ? '<div class="summary muted">등록된 내용이 없습니다.</div>' : `<div class="card">
        <img src="${img('event_1.jpg')}" alt="이벤트">
        <div class="info">
        <span class="eyebrow">WELCOME EVENT</span>
        <h3>첫 입덕의 즐거움</h3>
        <p>시연용 1,000원 할인 쿠폰을 받아보세요.</p>
        <button class="event-coupon" id="getCoupon" ${get('couponIssued', false) ? 'disabled' : ''}>
        <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <path d="M3 5h18v4a3 3 0 0 0 0 6v4H3v-4a3 3 0 0 0 0-6Z"/>
        <path d="m9 15 6-6"/>
        <circle cx="9" cy="9" r=".6"/>
        <circle cx="15" cy="15" r=".6"/>
        </svg> ${get('couponIssued', false) ? '쿠폰 받기 완료' : '이벤트 쿠폰 받기'}</button>
        </div>
        </div>
        <div class="card event-extra">
        <img src="${img('event_2.jpg')}" alt="입덕 한상">
        <div class="info">
        <span class="eyebrow">SET MENU</span>
        <h3>오늘은 입덕 한상!</h3>
        <p>떡볶이와 사이드를 한 번에.</p>
        <a class="set-action" href="${url(2, '?menu=5')}">
        <span class="set-icon">
        <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <path d="M3 3v7a3 3 0 0 0 6 0V3M6 3v18M20 3c-5 3-5 9 0 10v8M20 3v10"/>
        </svg>
        </span>
        <span class="action-copy"><b>세트 메뉴 보기</b>
        <small>더 푸짐하게, 더 맛있게!</small>
        </span>
        <span class="action-arrow">›</span>
        </a>
        </div>
        </div>`; 
        if (!i)
    $('#getCoupon').onclick = coupon; 
    }; 
    ev(0); 
    if (new URLSearchParams(location.search).has("coupon"))
    $("#eventSection").scrollIntoView(); 
}
function list() { 
    shell(`<section>
        <span class="eyebrow">OUR MENU</span>
        <h1>오늘 뭐 먹을까?</h1>
        <p class="muted">취향대로 골라 담는 입덕의 맛.</p>
        <div class="chips" id="filters">
        </div>
        <div class="grid" id="grid">
        </div>
        </section>${cart.length ? `<div class="floating-cart">
        <a class="primary row between" href="${url(5)}">
        <span>🛍 ${cart.reduce((a, o) => a + o.qty, 0)}개 · 장바구니 보기</span><b>${won(subtotal())}</b>
        </a>
        </div>` : ''}`); 
    filter('grid'); 
}
function orderSteps(active) {
    return `<nav class="order-steps" aria-label="주문 진행 단계">${['메뉴 선택','주문 확인','결제','주문 완료'].map((label,i)=>`<div class="order-step ${i < active ? 'done' : i === active ? 'current' : ''}" ${i === active ? 'aria-current="step"' : ''}><span>${i < active ? '✓' : i+1}</span><b>${label}</b></div>`).join('')}</nav>`;
}
const checkoutDraft = () => { try { return JSON.parse(sessionStorage.getItem('ipdeok:checkout')); } catch { return null; } };
const saveCheckout = d => sessionStorage.setItem('ipdeok:checkout', JSON.stringify(d));
function startCheckout(mode, items) {
    saveCheckout({mode, items, owner:user, details:null});
    if (user) location.href = url(3); else loginPrompt('payment');
}
function detail() { 
    let id = Number(new URLSearchParams(location.search).get('menu') || 0); 
    if (!menus[id])
    id = 0; 
    const ep = new URLSearchParams(location.search).get('edit'), ei = ep === null ? -1 : Number(ep), editing = Number.isInteger(ei) && ei >= 0 && cart[ei]?.id === id; 
    const m = menus[id], is = m[4] === '떡볶이' || m[4] === '세트', o = { id, qty: 1, opts: [], spicy: is ? '보통맛' : '', rice: is ? '밀떡' : '', note: '' }; 
    if (editing)
    Object.assign(o, cart[ei], { opts: [...cart[ei].opts] }); 
    const radios = (key, values) => `<div class="choices">${values.map((v, i) => `<label><input type="radio" name="${key}" value="${v}" ${v === o[key] ? 'checked' : ''}>${v}</label>`).join('')}</div>`; 
    shell(`${orderSteps(0)}<img class="detail-photo" src="${img(m[3])}" alt="${m[0]}">
        <section>
        <span class="eyebrow">${m[4]}</span>
        <h1>${m[0]}</h1>
        <p>${m[2]}</p>
        <h2 class="price">${won(m[1])}</h2>
        </section>${is ? `<section class="panel">
        <h3>맵기 선택 <small>필수</small>
        </h3>${spicyMarkup(o.spicy)}<h3>떡 종류 <small>필수</small>
        </h3>${radios('rice', ['밀떡', '쌀떡'])}</section>` : ''}<section class="panel">
        <h3>${is ? '토핑 및 사이드 추가' : '함께 먹으면 좋은 메뉴'}</h3>${extras.map((e, i) => is || i >= 5 ? `<label class="option">
        <span><input type="checkbox" data-opt="${i}" ${o.opts.includes(i) ? 'checked' : ''}> ${e[0]}</span><b>+${won(e[1])}</b>
        </label>` : '').join('')}</section>
        <section>
        <label>조리 요청사항<textarea id="note" maxlength="200" placeholder="예: 어묵은 빼주세요">${esc(o.note)}</textarea>
        </label>
        <p class="muted">알레르기 정보는 실제 매장에 확인해 주세요.</p>
        <div class="row between">
        <h3>수량</h3>
        <div class="qty">
        <button id="minus">−</button><b id="qty">1</b>
        <button id="plus">+</button>
        </div>
        </div>
        </section>
        <div class="sticky">
        <div class="row between"><b>총 상품금액</b>
        <h2 id="amount" class="price">
        </h2>
        </div>
        <div class="row">
        <button class="secondary" id="add">장바구니 담기</button>
        <button class="primary" id="buy">바로 주문하기</button>
        </div>
        </div>`); 
    const update = () => { 
        $('#qty').textContent = o.qty; 
        $('#amount').textContent = won(amount(o)); 
    }; 
    update(); 
    document.querySelectorAll('[data-opt]').forEach(c => c.onchange = () => { 
        let i = +c.dataset.opt; 
        o.opts = c.checked ? [...o.opts, i] : o.opts.filter(x => x !== i); 
        update(); 
    }); 
    document.querySelectorAll('input[type=radio]').forEach(c => c.onchange = () => o[c.name] = c.value); 
    $('#minus').onclick = () => { 
        o.qty = Math.max(1, o.qty - 1); 
        update(); 
    }; 
    $('#plus').onclick = () => { 
        o.qty = Math.min(99, o.qty + 1); 
        update(); 
    }; 
    const add = () => { 
        o.note = $('#note').value.trim(); 
        if (editing)
    cart[ei] = { ...o, opts: [...o.opts] };
else
    cart.push({ ...o, opts: [...o.opts] }); 
        set('cart', cart); 
        $('#badge').textContent = cart.reduce((a, o) => a + o.qty, 0); 
    }; 
    if (editing) {
    $('#add').textContent = '변경 저장';
    $('#buy').textContent = '취소';
    $('#add').onclick = () => { 
            add(); 
            location.href = url(5); 
        };
    $('#buy').onclick = () => location.href = url(5);
    return;
} 
    $('#add').onclick = () => { 
        add(); 
        const d = document.createElement('dialog'); 
        d.className = 'added-dialog'; 
        d.innerHTML = `<div class="added-icon">✓</div>
        <h2>장바구니에 담았어요!</h2>
        <p class="muted">맛있는 메뉴를 더 담아보세요.</p>
        <div class="summary row between"><b>${m[0]} × ${o.qty}</b><b class="price">${won(amount(o))}</b>
        </div>
        <div class="row">
        <a class="secondary" href="${url(1)}">메뉴 더 담기</a>
        <a class="primary" href="${url(5)}">장바구니 보기</a>
        </div>
        <button class="block" id="dismissAdded">닫기</button>`; 
        document.body.append(d); 
        d.addEventListener('close', () => d.remove()); 
        d.showModal(); 
        d.querySelector('#dismissAdded').onclick = () => d.close(); 
    }; 
    $('#buy').onclick = () => {
        $('#buy').disabled = true;
        add();
        startCheckout('cart', cart);
    }; 
}
function summary() { 
    return `<div class="summary">
        <div class="row between">상품금액 <b>${won(subtotal())}</b>
        </div>
        <div class="row between">배달비 <b>${won(delivery())}</b>
        </div>
        <div class="row between">쿠폰 할인 <b>−${won(discount())}</b>
        </div><hr>
        <div class="row between"><b>총 결제금액</b>
        <h2 class="price">${won(total())}</h2>
        </div>
        </div>`; 
}
function item(o, i, editable = false) { 
    const groups = [['추가 재료', o.opts.filter(k => k < 5).map(k => extras[k][0])], ['사이드', o.opts.filter(k => k >= 5).map(k => extras[k][0])], ['조리 요청', o.note ? [o.note] : []]]; 
    return `<div class="summary cart-item">
        <div class="item-top">
        <img src="${img(menus[o.id][3])}" alt="">
        <div class="item-main">
        <h3>${menus[o.id][0]}</h3>
        <p class="muted">${[o.spicy, o.rice].filter(Boolean).map(esc).join(' · ') || '기본 구성'}${editable ? '' : ' · ' + o.qty + '개'}</p><b class="price">${won(amount(o))}</b>
        </div>${editable ? `<button class="item-remove" data-remove="${i}" aria-label="삭제">✕</button>` : ''}</div>${groups.some(g => g[1].length) ? `<div class="item-options">${groups.filter(g => g[1].length).map(([label, values]) => `<div>
        <span>${label}</span>
        <p>${values.map(esc).join(', ')}</p>
        </div>`).join('')}</div>` : ''}${editable ? `<div class="item-bottom">
        <a class="secondary" href="${url(2, '?menu=' + o.id + '&edit=' + i)}">옵션 변경</a>
        <div class="qty">
        <button data-dec="${i}" aria-label="수량 감소">−</button><b>${o.qty}</b>
        <button data-inc="${i}" aria-label="수량 증가">+</button>
        </div>
        </div>` : ''}</div>`; 
}
function cartPage() { 
    shell(`<section>
        <span class="eyebrow">YOUR BAG</span>
        <h1>장바구니</h1>
        <p class="muted">맛있는 메뉴를 함께 담아보세요.</p>${cart.length ? cart.map((o, i) => item(o, i, true)).join('') : emptyState('cart','장바구니가 비었어요','맛있는 메뉴를 담아보세요!')}<a class="${cart.length ? 'secondary' : 'primary'} block" href="${url(1)}">${cart.length ? '＋ 메뉴 더 담기' : '메뉴 둘러보기'}</a>
        </section>${cart.length ? `<section>${summary()}</section>
        <div class="sticky">
        <button class="primary" id="checkout">${won(total())} 주문하기</button>
        </div>` : ''}`); 
    const change = (i, d) => { 
        if (d === 0)
    cart.splice(i, 1);
else
    cart[i].qty = Math.min(99, Math.max(1, cart[i].qty + d)); 
        set('cart', cart); 
        cartPage(); 
    }; 
    for (const [k, d] of [['remove', 0], ['dec', -1], ['inc', 1]])
    document.querySelectorAll(`[data-${k}]`).forEach(b => b.onclick = () => change(+b.dataset[k], d)); 
    if (cart.length)
    $('#checkout').onclick = () => startCheckout('cart', cart); 
}
const pinIcon = `<svg width="23" height="23" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <path d="M20 10c0 6-8 11-8 11S4 16 4 10a8 8 0 1 1 16 0Z"/>
        <circle cx="12" cy="10" r="2.5"/>
        </svg>`;
function addressMarkup(d, label = '') { 
    return `<div class="delivery-location">
        <span class="delivery-pin">${pinIcon}</span>
        <div class="delivery-address">
        <h3>${esc(d.address)}</h3>${d.address2 ? `<p>${esc(d.address2)}</p>` : ''}${label ? `<small>${label}</small>` : ''}</div>
        </div>
        <div class="delivery-contact"><strong>${esc(d.name)}</strong>
        <span>${esc(d.phone)}</span>
        </div>`; 
}
function payment() { 
    if (!user) {
    location.replace(url(8, '?next=payment'));
    return;
} 
    let draft = checkoutDraft();
    if (!draft || (draft.owner !== null && draft.owner !== user)) draft = {mode:'cart', items:cart, owner:user, details:null};
    if (draft.owner === null) draft.owner = user;
    if (draft.mode === 'cart') draft.items = cart;
    saveCheckout(draft);
    checkoutItems = draft.items;
    if (!checkoutItems.length) {
    location.replace(url(5));
    return;
} 
    if (!defaultAddress()) {
    location.replace(url(9, '?next=payment'));
    return;
} 
    const saved = defaultAddress();
    let selected = addresses().find(a=>a.id===draft.details?.addressId) || {...saved}; 
    if (new URLSearchParams(location.search).get('step') === 'pay') {
        if (draft.details) paymentMethod(draft); else location.replace(url(3));
        return;
    }
    shell(`${orderSteps(1)}<section>
        <span class="eyebrow">CHECKOUT</span>
        <h1>주문 확인</h1>
        <p class="muted">실제 결제되지 않는 시연 화면입니다.</p>${checkoutItems.map((o, i) => item(o, i)).join('')}<a class="checkout-edit" href="${draft.mode === 'direct' ? url(2,'?menu='+checkoutItems[0].id) : url(5)}">
            ${uiIcon('<circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.7 13.4a2 2 0 0 0 2 1.6h9.6a2 2 0 0 0 2-1.6L23 6H6"/>')}
            <span>${draft.mode === 'direct' ? '메뉴 다시 선택' : '장바구니 수정하기'}</span>
            ${uiIcon('<path d="m9 18 6-6-6-6"/>')}
        </a>
        </section>
        <form id="payform">
        <section class="checkout-delivery">
        <div class="delivery-card">
        <div class="delivery-heading">
        <h2>배달 주소</h2>
        <button type="button" class="address-change" id="changeAddress" aria-expanded="false">변경</button>
        </div>
        <div id="addressView">${addressMarkup(selected, selected.id===saved.id?'기본 배달지':'이번 주문 배달지')}</div>
        <div id="addressEdit" hidden>${addressChoices(selected.id)}<button type="button" class="secondary block" id="applyAddress">변경 완료</button>
        </div>
        </div>
        <div class="delivery-card request-card">
        <h2>요청사항</h2>
        <label>가게 사장님께<textarea name="shop" placeholder="예: 일회용 수저는 빼주세요">${esc(draft.details?.shop || '')}</textarea>
        </label>
        <label>배달 기사님께<textarea name="rider" placeholder="예: 문 앞에 놓아주세요">${esc(draft.details?.rider || '')}</textarea>
        </label>
        </div>
        </section>
        <section>
        <h2>쿠폰 및 결제 금액</h2>
        <label class="option">
        <span><input type="checkbox" id="coupon" ${get('coupon', false) ? (get('couponUse', true) ? 'checked' : '') : 'disabled'}> 시연용 1,000원 쿠폰 ${get('coupon', false) ? '' : '(이벤트에서 발급 필요)'}</span>
        </label>
        <div id="sum">${summary()}</div>

        </section>
        <div class="sticky">
        <button class="primary" id="pay">${won(total())} 결제하기</button>
        </div>
        </form>`); 
    $('#changeAddress').onclick = () => { 
        $('#addressEdit').hidden = !$('#addressEdit').hidden; 
        $('#changeAddress').setAttribute('aria-expanded', !$('#addressEdit').hidden); 
    }; 
    $('#applyAddress').onclick = () => { 
        const id = $('#addressEdit input:checked')?.value; 
        const d = addresses().find(a => a.id === id); 
        if (!d)
    return; 
        selected = d; 
        $('#addressView').innerHTML = addressMarkup(d, '이번 주문 배달지'); 
        $('#addressEdit').hidden = true; 
        $('#changeAddress').setAttribute('aria-expanded', 'false'); 
    }; 
    $('#coupon').onchange = e => { 
        set('couponUse', e.target.checked); 
        $('#sum').innerHTML = summary(); 
        $('#pay').textContent = won(total()) + ' 결제하기'; 
    }; 
    $('#payform').onsubmit = e => {
        e.preventDefault();
        if (!$('#addressEdit').hidden) return toast('배달지 변경을 완료해 주세요');
        draft.details = {...Object.fromEntries(new FormData(e.target)), addressId:selected.id};
        saveCheckout(draft);
        location.href = url(3,'?step=pay');
    };
}
function paymentMethod(draft) {
    const selected = addresses().find(a=>a.id===draft.details.addressId);
    if (!selected) { location.replace(url(3)); return; }
    shell(`${orderSteps(2)}<section><span class="eyebrow">PAYMENT</span><h1>결제</h1><p class="muted">실제 결제되지 않는 시연 화면입니다.</p><a class="checkout-edit" href="${url(3)}">
            ${uiIcon('<path d="m15 18-6-6 6-6"/>')}
            ${uiIcon('<rect x="4" y="3" width="16" height="18" rx="2"/><path d="M9 3h6M8 16l1-4 6-6 3 3-6 6-4 1Z"/>')}
            <span>주문 정보 수정하기</span>
        </a></section>
        <form id="payform"><section class="panel"><h2>결제수단</h2><div class="choices">${['일반 카드','네이버페이','카카오페이','페이코','토스페이'].map((m,i)=>`<label><input type="radio" name="method" value="${m}" required ${i===0?'checked':''}>${m}</label>`).join('')}</div></section>
        <section>${summary()}<label class="option"><span><input type="checkbox" required> 모의 결제에 동의합니다.</span></label></section><div class="sticky"><button class="primary" id="pay">${won(total())} 결제하기</button></div></form>`);
    let submitting = false;
    $('#payform').onsubmit = e => {
        e.preventDefault();
        if (submitting || !checkoutDraft() || !checkoutItems.length) return;
        submitting = true;
        $('#pay').disabled = true;
        const data = Object.fromEntries(new FormData(e.target));
        const receipt = {items:checkoutItems.map(o=>({...o,menuName:menus[o.id][0],image:menus[o.id][3],paid:amount(o)})),date:new Date().toISOString(),subtotal:subtotal(),delivery:delivery(),discount:discount(),total:total(),number:Date.now().toString().slice(-10),shop:draft.details.shop,rider:draft.details.rider,...data,...selected};
        const d = document.createElement('dialog');
        d.className = 'payment-loading';
        d.setAttribute('aria-labelledby','loadingTitle');
        d.innerHTML = `<div class="payment-orbit"><div class="payment-ring"></div><div class="payment-card-icon">${uiIcon('<rect x="2" y="5" width="20" height="14" rx="3"/><path d="M2 10h20M6 15h4M14 15h4"/>')}</div></div><span class="payment-kicker">PAYMENT PROCESSING</span><h2 id="loadingTitle">맛있는 입덕까지 잠시만!</h2><p>모의 결제를 처리하고 있어요.<br>조금만 기다려 주세요.</p><div class="payment-progress"><span></span></div><small>IPDEOK BOKKI</small>`;
        d.addEventListener('cancel', e=>e.preventDefault());
        document.body.append(d); d.showModal();
        setTimeout(()=>{
            set('receipt',receipt); set('orders',[receipt,...get('orders',[])]);
            if (draft.mode==='cart') set('cart',[]);
            if (receipt.discount) set('coupon',false);
            sessionStorage.removeItem('ipdeok:checkout');
            location.replace(url(4));
        },1500);
    };
}
function finish() { 
    if (!user) {
    location.replace(url(8));
    return;
} 
    const r = get('receipt', null); 
    if (!r) {
    shell(`<section>
        <h2>완료된 주문이 없습니다.</h2>
        <a class="primary" href="${url(1)}">메뉴 보기</a>
        </section>`);
    return;
} 
    shell(`${orderSteps(3)}<div class="success">
        <div class="receipt-dive" aria-hidden="true">
        <span class="dive-scene" aria-hidden="true">
        <svg viewBox="0 -20 120 145" xmlns="http://www.w3.org/2000/svg">
        <ellipse cx="60" cy="85" rx="46" ry="13" fill="#f87326" stroke="#75371c" stroke-width="2.5"/>
        <g class="mascot37" stroke="#75371c" stroke-width="2.5" stroke-linejoin="round">
        <path d="M43 53Q60 45 77 53L80 76Q60 84 40 76Z" fill="#ce3424"/>
        <path d="M48 52L50 62H70L72 52" fill="#fff3d9"/>
        <path d="M46 27L46 20Q35 13 43 7Q50 2 56 7Q65 -1 72 7Q85 4 85 15Q84 22 76 23L75 29Z" fill="#fffdf6"/>
        <ellipse cx="60" cy="41" rx="23" ry="19" fill="#fff1d6"/>
        <circle cx="52" cy="39" r="2.6" fill="#75371c" stroke="none"/>
        <path d="M65 39l6 -4m-6 4l6 3" fill="none" stroke-linecap="round"/>
        <ellipse cx="45" cy="46" rx="4" ry="2.7" fill="#ff9d81" stroke="none"/>
        <ellipse cx="75" cy="46" rx="4" ry="2.7" fill="#ff9d81" stroke="none"/>
        <path d="M55 46H65Q60 59 55 46Z" fill="#a42d20" stroke-width="1.5"/>
        <circle cx="38" cy="59" r="7" fill="#fff1d6"/>
        <circle cx="82" cy="59" r="7" fill="#fff1d6"/>
        </g>
        <path d="M14 85Q60 111 106 85Q101 119 60 120Q19 119 14 85Z" fill="#fff1d6" stroke="#75371c" stroke-width="2.5"/>
        <path d="M15 85Q60 98 105 85Q60 111 15 85Z" fill="#f87326"/>
        <ellipse cx="32" cy="88" rx="9" ry="3.5" fill="#ffb46a"/>
        <ellipse cx="88" cy="88" rx="9" ry="3.5" fill="#ffb46a"/>
        <g class="drops37" fill="#ff9b42">
        <circle cx="15" cy="65" r="4"/>
        <circle cx="105" cy="61" r="4"/>
        <path d="M27 81Q9 51 22 60L39 84ZM83 84Q109 48 100 71L96 85Z"/>
        </g>
        </svg>
        </span>
        </div>
        <span class="eyebrow">입덕완료 ♡</span>
        <h1>주문이 완료되었어요!</h1>

        <small>모의 주문번호 ${esc(r.number)}</small>
        </div>
        <section>
        <h2>주문 내역</h2>${r.items.map((o, i) => item(o, i)).join('')}<div class="summary">
        <p>상품금액 ${won(r.subtotal)}</p>
        <p>배달비 ${won(r.delivery)}</p>
        <p>쿠폰 할인 −${won(r.discount)}</p><hr>
        <div class="row between"><b>${esc(r.method)}</b>
        <h2 class="price">${won(r.total)}</h2>
        </div>
        </div>
        </section>
        <section class="checkout-delivery">
        <div class="delivery-card">
        <div class="delivery-heading">
        <h2>배달 정보</h2>
        </div>${addressMarkup(r)}<div class="receipt-requests">
        <small>가게 요청사항</small>
        <p>${esc(r.shop) || '없음'}</p>
        <small>배달 요청사항</small>
        <p>${esc(r.rider) || '없음'}</p>
        </div>
        </div>
        <a class="primary block" href="${url(0)}">메인으로 돌아가기</a>
        </section>`); 
}
function about() { 
    shell($('#about-template').innerHTML); 
    const blocks = document.querySelectorAll('.about-reveal'); 
    if ('IntersectionObserver' in window && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
    const observer = new IntersectionObserver(entries => entries.forEach(e => { 
            if (e.isIntersecting) {
        e.target.classList.add('visible');
        observer.unobserve(e.target);
    } 
        }), { threshold: .12 });
    blocks.forEach(el => { 
            el.classList.add('reveal-ready'); 
            observer.observe(el); 
        });
} 
}
function profileFields(d = {}) { 
    return [['name', '이름', 'text', '예: 입덕회원'], ['phone', '연락처', 'tel', '예: 010-0000-0000'], ['address', '배달 주소', 'text', '예: 입덕로 123'], ['address2', '상세 주소', 'text', '예: 101동 101호']].map(([k, t, type, h]) => `<label>${t}<input name="${k}" type="${type}" value="${esc(d[k] || '')}" placeholder="${h}" ${k === 'address2' ? '' : 'required'} maxlength="120">
        </label>`).join(''); 
}
const userIcon = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="12" cy="8" r="4"/>
        <path d="M4 21v-2a8 8 0 0 1 16 0v2"/>
        </svg>`;
function loginPrompt(next) {
    const d = document.createElement('dialog');
    d.className = 'added-dialog';
    d.innerHTML = `<button class="modal-x" aria-label="닫기">×</button>
        <div class="added-icon">${lockIcon}</div>
        <h2>로그인이 필요해요!</h2>
        <p class="muted">${next === 'payment' ? '주문 및 결제는 로그인 후 이용할 수 있어요.<br>장바구니에 담은 메뉴는 그대로 유지됩니다.' : '쿠폰은 로그인 후 받을 수 있어요.'}</p>
        <a class="primary block" href="${url(8, '?next=' + next)}">로그인하기</a>
        <button class="block dismiss">계속 둘러보기</button>`;
    document.body.append(d);
    d.showModal();
    d.onclose = () => d.remove();
    d.querySelectorAll('button').forEach(b => b.onclick = () => d.close());
}
function spicyMarkup(value) {
    const levels = [['순한맛', '신라면보다 덜 매운 맛', '1,000~2,000'], ['보통맛', '신라면과 비슷한 적당히 매콤한 맛', '3,000~4,500'], ['매운맛', '신라면보다 더 매운 맛', '6,000~8,000'], ['아주 매운맛', '강렬하게 매운 맛', '10,000 이상']];
    return `<div class="spicy-list">${levels.map(([name, desc, shu], i) => `<label><input type="radio" name="spicy" value="${name}" ${value === name ? 'checked' : ''}>
        <span><b>${name}</b>
        <small>${desc}</small>
        <small class="shu">약 ${shu} SHU (예시)</small>
        </span>
        <span class="peppers">${'🌶️'.repeat(i + 1)}</span>
        </label>`).join('')}</div>`;
}
function login() {
    const next = new URLSearchParams(location.search).get('next');
    const go = () => location.href = next === 'payment' ? url(3) : next === 'community' ? url(7, '?write=1') : next === 'comment' ? url(7, '?post=' + encodeURIComponent(new URLSearchParams(location.search).get('post') || '') + '&comment=1') : next === 'coupon' ? url(0, '?coupon=1') : url(0);
    if (user) {
        go();
        return;
    }
    let signup = new URLSearchParams(location.search).get('signup') === '1';
    const accounts = () => get('accounts', {});
    const enter = id => { 
        const guest = cart; 
        user = id; 
        set('user', id); 
        cart = [...get('cart', []), ...guest]; 
        set('cart', cart);
        if (id === '__demo__' && !get('addresses', []).length) {
            set('addresses', [{id:'demo-address', label:'테스트 배달지', name:'테스트 회원', phone:'010-0000-0000', address:'가상 입덕로 123', address2:'시연용 101호', default:true}]);
        }
        user = null; 
        set('cart', []); 
        user = id; 
        go(); 
    };
    const draw = () => {
        shell(`<section class="login">
        <div class="login-profile-icon" aria-hidden="true">
            <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">
                ${signup ? '<circle cx="9" cy="7" r="4"/><path d="M2 21v-2a7 7 0 0 1 14 0v2M19 8v6M16 11h6"/>' : '<circle cx="12" cy="8" r="4"/><path d="M4 21v-2a8 8 0 0 1 16 0v2"/>'}
            </svg>
        </div>
        <h1>${signup ? '입덕을 환영합니다!' : '다시 만나서 반가워요!'}</h1>
        <p class="muted">${signup ? '가입하고 맛있는 입덕볶이를 즐겨보세요.' : '오늘도 맛있는 입덕볶이'}</p>
        <form id="login" class="summary">
        <label>아이디<input name="id" required maxlength="30" placeholder="아이디를 입력해주세요">
        </label>
        <label>비밀번호<input name="password" type="password" required maxlength="80" placeholder="비밀번호를 입력해주세요">
        </label>${signup ? '<label>비밀번호 확인<input name="confirm" type="password" required placeholder="비밀번호를 다시 입력해주세요"></label>' : ''}<p id="authError" role="alert" class="auth-error">
        </p>
        <button class="primary block">${signup ? '회원가입 완료' : '로그인'}</button>
        <p class="auth-switch">${signup ? '이미 회원이신가요?' : '아직 회원이 아니신가요?'} <button type="button" id="authSwitch">${signup ? '로그인' : '회원가입'}</button>
        </p>${signup ? '<button type="button" class="test-link block" id="demo">테스트 계정으로 시작하기</button>' : ''}</form>
        <small class="muted">시연용 계정입니다. 실제 개인정보나 비밀번호는 입력하지 마세요.</small>
        </section>`);
        $('#authSwitch').onclick = () => { 
            signup = !signup; 
            draw(); 
        };
        if (signup)
            $('#demo').onclick = () => { 
            const a = accounts(); 
            if (!Object.hasOwn(a, '__demo__')) {
                set('accounts', { ...a, __demo__: { demo: true } });
                profiles = { ...profiles, __demo__: { name: '테스트 회원', phone: '010-0000-0000' } };
                set('profiles', profiles);
            } 
            enter('__demo__'); 
        };
        $('#login').onsubmit = e => { 
            e.preventDefault(); 
            const d = Object.fromEntries(new FormData(e.target)), id = d.id.trim(), a = accounts(); 
            const error = t => $('#authError').textContent = t; 
            if (!id || (signup && id === '__demo__'))
            return error('사용할 수 없는 아이디입니다.'); 
            if (signup) {
            if (Object.hasOwn(a, id))
                return error('이미 가입된 아이디입니다.');
            if (d.password !== d.confirm)
                return error('비밀번호가 일치하지 않습니다.');
            set('accounts', { ...a, [id]: { password: d.password } });
            enter(id);
        }
        else {
            if (!Object.hasOwn(a, id) || a[id].password !== d.password)
                return error('아이디 또는 비밀번호가 올바르지 않습니다.');
            enter(id);
        } 
        };
    };
    draw();
}
const addresses = () => get('addresses', []);
const defaultAddress = () => addresses().find(a => a.default) || addresses()[0];
function addressChoices(id) { 
    return addresses().map(a => `<label class="option">
        <span><input type="radio" name="addressChoice" value="${esc(a.id)}" ${a.id === id ? 'checked' : ''}> <b>${esc(a.label)}</b> · ${esc(a.address)} ${esc(a.address2)}</span>
        </label>`).join(''); 
}
function mypage() {
    if (!user) {
        location.replace(url(8));
        return;
    }
    const next = new URLSearchParams(location.search).get('next');
    let view = next === 'payment' ? 'addresses' : new URLSearchParams(location.search).get('view') === 'orders' ? 'orders' : 'main';
    const icon = name => `<svg class="my-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${({
        profile: '<circle cx="12" cy="8" r="4"/><path d="M4 21v-2a8 8 0 0 1 16 0v2"/>',
        addresses: '<path d="M20 10c0 6-8 11-8 11S4 16 4 10a8 8 0 1 1 16 0Z"/><circle cx="12" cy="10" r="2.5"/>',
        orders: '<path d="M5 3l3 2 4-2 4 2 3-2v18l-3-2-4 2-4-2-3 2Z M9 9h6 M9 13h6"/>',
        coupons: '<path d="M3 6h18v4a2 2 0 0 0 0 4v4H3v-4a2 2 0 0 0 0-4Z M13 6v3m0 3v1m0 3v2"/>',
        posts: '<path d="M4 4h16v12H9l-5 4Z M8 8h8 M8 12h5"/>',
        logout: '<path d="M10 4H4v16h6 M10 12h11m-4-4 4 4-4 4"/>',
        lock: '<rect x="5" y="10" width="14" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3 M12 14v3"/>',
        edit: '<path d="m4 16 12-12 4 4-12 12H4Z M14 6l4 4"/>',
        delete: '<path d="M4 7h16 M9 7V4h6v3 M6 7l1 14h10l1-14 M10 11v6 M14 11v6"/>'
    })[name]}</svg>`;
    const nav = [['profile', '회원정보 수정'], ['addresses', '배달 주소 관리'], ['orders', '주문 내역'], ['coupons', '쿠폰함'], ['posts', '나의 커뮤니티 활동']];
    let activityTab = 'posts';
    const draw = () => {
        const a = defaultAddress();
        let content = '';
        if (view === 'main')
            content = `<div class="my-profile">
        <div class="my-profile-avatar">${icon('profile')}</div>
        <div class="my-profile-copy">
            <h2>${esc(profile()?.name || user)}님, 반갑습니다!</h2>
            <p>오늘도 맛있게 입덕하세요 ♡</p>
        </div>
        </div>
        <div class="summary my-default">
            <div class="my-default-heading">
                <h3>${icon('addresses')}기본 배달 주소</h3>
                <button id="defaultChange" class="secondary address-change">${a ? '변경' : '등록'} <span aria-hidden="true">›</span></button>
            </div>
            <div class="my-default-body">
                <div class="my-default-label"><b>${a ? esc(a.label) : '등록된 주소 없음'}</b>${a ? '<span class="my-default-tag">기본 배송지</span>' : ''}</div>
                ${a ? `<p>${esc(a.address)} ${esc(a.address2)}</p>` : '<p>배달받을 주소를 등록해주세요.</p>'}
            </div>
        </div>
        <div class="my-nav">${nav.map(([id, t]) => `<button data-view="${id}">
        <span class="my-nav-label">${icon(id)}${t}</span>
        <span>›</span>
        </button>`).join('')}<button id="logout"><span class="my-nav-label">${icon("logout")}로그아웃</span><span>›</span></button></div>`;
        if (view === 'profile')
            content = `<form id="memberForm" class="summary">
        <label>아이디<input value="${esc(user)}" disabled></label>
        <label>연락처<input name="phone" value="${esc(profile()?.phone || '')}">
        </label>
        <div class="password-heading">${icon("lock")}<h3>비밀번호 변경</h3></div>
        <p class="muted">변경을 원하는 경우에만 입력해주세요.</p>
        ${user === '__demo__' && !get('accounts', {})[user]?.password ? '<p class="muted">테스트 계정은 현재 비밀번호 없이 새 비밀번호를 설정할 수 있어요.</p>' : '<label>현재 비밀번호<input name="current" type="password" autocomplete="current-password"></label><p id="currentStatus" class="password-status" aria-live="polite"></p>'}
        <label>새 비밀번호<input name="newPassword" type="password" autocomplete="new-password" maxlength="80"></label>
        <label>새 비밀번호 확인<input name="confirmPassword" type="password" autocomplete="new-password" maxlength="80"></label>
        <p id="confirmStatus" class="password-status" aria-live="polite"></p>
        <p id="memberError" class="auth-error" role="alert"></p>
        <button class="primary block">변경사항 저장</button>
        </form>`;
        if (view === 'addresses')
            content = `${next === 'payment' ? '<p>주문을 위해 배달 주소를 등록해 주세요.</p>' : ''}${!addresses().length ? emptyState('addresses','등록된 배달 주소가 없어요','배달받을 주소를 추가해주세요.') : ''}${addresses().map(d => `<div class="summary">
        <div class="row between"><b>${esc(d.label)}</b>${d.default ? '<small>기본 배달 주소</small>' : ''}</div>${addressMarkup(d)}<div class="row address-actions">
        <button data-edit="${d.id}">${icon("edit")}수정</button>
        <button data-delete="${d.id}">${icon("delete")}삭제</button>
        </div>
        </div>`).join('')}<button class="secondary block" id="newAddress">＋ 새로운 배달 주소 추가</button>
        <div id="addressFormArea">
        </div>${next === 'payment' && a ? `<a class="primary block" href="${url(3)}">결제 계속하기</a>` : ''}`;
        if (view === 'orders')
            content = get('orders', []).map((r, orderIndex) => `<div class="summary my-order">
        <div class="row between">
        <small>${new Date(r.date).toLocaleString('ko-KR')}</small>
        <small class="order-status">결제완료</small>
        </div>
        <div class="item-top">
        <img src="${img(r.items[0].image)}" alt="">
        <div>
        <h3>${esc(r.items[0].menuName)}${r.items.length > 1 ? ' 외 ' + (r.items.length - 1) + '건' : ''}</h3><small>${options(r.items[0])} · ${r.items[0].qty}개</small>
        </div>
        </div>
        <div class="order-address"><b>${icon("addresses")} 배달 주소</b><p>${esc(r.address)} ${esc(r.address2)}</p></div>
        <div class="row between order-total"><b>총 결제금액</b><strong>${won(r.total)}</strong></div>
        <details>
        <summary>주문 상세보기</summary>
        <p>주문번호 ${esc(r.number)}</p>${r.items.map(o => `<p><b>${esc(o.menuName)} × ${o.qty}</b> ${won(o.paid)}<br>
        <small>${options(o)}</small>
        </p>`).join('')}<hr>
        <p>상품금액 ${won(r.subtotal)} / 배달비 ${won(r.delivery)} / 할인 ${won(r.discount)}</p>
        <p>최종 결제 ${won(r.total)} · ${esc(r.method)}</p>${addressMarkup(r)}<p>가게 요청: ${esc(r.shop) || '없음'}<br>배달 요청: ${esc(r.rider) || '없음'}</p>
        </details><button class="primary block reorder" data-reorder="${orderIndex}">다시 주문하기</button>
        </div>`).join('') || emptyState('orders','아직 주문 내역이 없어요','맛있는 입덕볶이를 만나보세요!',`<a class="primary" href="${url(1)}">첫 주문하기</a>`);
        if (view === 'coupons')
            content = !get('coupon',false) && !get('couponIssued',false) ? emptyState('coupons','보유한 쿠폰이 없어요','이벤트에서 쿠폰을 받아보세요!',`<a class="primary" href="${url(0,'?coupon=1')}">이벤트 보기</a>`) : `<div class="summary">
        <h3>보유 쿠폰 ${get('coupon', false) ? 1 : 0}장</h3>
        <p>${get('coupon', false) ? '1,000원 할인 쿠폰 · 사용 가능' : get('couponIssued', false) ? '1,000원 할인 쿠폰 · 사용 완료' : '아직 보유한 쿠폰이 없어요.'}</p>
        <a href="${url(0, '?coupon=1')}">이벤트 보기 →</a>
        </div>`;
        if (view === 'posts')
            content = activityMarkup(activityTab, icon);
        shell(`<section class="my-page">
        <div class="row">
        <button id="myBack" aria-label="뒤로">‹</button>
        <h1>${view === 'main' ? '마이페이지' : nav.find(n => n[0] === view)[1]}</h1>
        </div>${content}</section>`);
        $('#myBack').onclick = () => { 
            if (view === 'main')
            location.href = url(0);
        else {
            view = 'main';
            draw();
        } 
        };
        document.querySelectorAll('[data-view]').forEach(b => b.onclick = () => { 
            view = b.dataset.view; 
            draw(); 
        });
        if (view === 'orders') document.querySelectorAll('[data-reorder]').forEach(b => b.onclick = () => {
            const order = get('orders', [])[+b.dataset.reorder];
            if (!order) return;
            const items = order.items.filter(o => menus[o.id] && Array.isArray(o.opts) && o.opts.every(i => extras[i])).map(({id,opts,qty,spicy,rice,note}) => ({id,opts,qty,spicy,rice,note}));
            if (!items.length) return toast('현재 주문 가능한 메뉴가 없어요.');
            cart = [...cart, ...items]; set('cart',cart); location.href = url(5);
        });
        if (view === 'posts') {
            bindActivity(tab => { activityTab = tab; draw(); }, draw);
        }
        const setDefault = id => { 
            set('addresses', addresses().map(d => ({ ...d, default: d.id === id }))); 
            draw(); 
        };
        if (view === 'main') {
            $('#logout').onclick = () => { 
                sessionStorage.removeItem('ipdeok:checkout');
        set('user', null); 
                location.href = url(0); 
            };
            $('#defaultChange').onclick = () => { 
                if (!a) {
                view = 'addresses';
                draw();
                return;
            } 
                const d = document.createElement('dialog'); 
                d.className = 'added-dialog'; 
                d.innerHTML = `<h2>기본 배달 주소 선택</h2>${addressChoices(a.id)}<button class="primary block" id="choose">선택 완료</button>
        <button class="block" id="cancel">닫기</button>`; 
                document.body.append(d); 
                d.showModal(); 
                d.onclose = () => d.remove(); 
                d.querySelector('#cancel').onclick = () => d.close(); 
                d.querySelector('#choose').onclick = () => { 
                    const id = d.querySelector('input:checked')?.value; 
                    d.close(); 
                    if (id)
                setDefault(id); 
                }; 
            };
        }
        if (view === 'profile') {
            const form = $('#memberForm');
            const current = form.elements.current;
            const fresh = form.elements.newPassword;
            const confirm = form.elements.confirmPassword;
            const stored = get('accounts', {})[user]?.password;
            const status = (el, message, ok) => {
                el.textContent = message;
                el.classList.toggle('valid', ok);
            };
            const check = () => {
                const ok = !current || current.value === stored;
                if (current) status($('#currentStatus'), current.value ? (ok ? '현재 비밀번호가 일치합니다.' : '현재 비밀번호가 일치하지 않습니다.') : '', ok);
                fresh.disabled = confirm.disabled = !ok;
                if (!ok) fresh.value = confirm.value = '';
                status($('#confirmStatus'), confirm.value ? (fresh.value === confirm.value ? '새 비밀번호가 일치합니다.' : '새 비밀번호가 일치하지 않습니다.') : '', fresh.value === confirm.value);
            };
            form.addEventListener('input', check);
            check();
            form.onsubmit = e => { 
            e.preventDefault(); 
            const d = Object.fromEntries(new FormData(e.target));
            const accounts = get('accounts', {}), account = accounts[user];
            const error = message => $('#memberError').textContent = message;
            if (d.current || d.newPassword || d.confirmPassword) {
                if (!account) return error('계정 정보를 확인할 수 없습니다.');
                if (account.password !== undefined && d.current !== account.password)
                    return error('현재 비밀번호가 올바르지 않습니다.');
                if (!d.newPassword || d.newPassword !== d.confirmPassword || d.newPassword === account.password)
                    return error('새 비밀번호를 입력하고 확인 입력과 일치시켜 주세요. 기존 비밀번호와는 달라야 합니다.');
                set('accounts', { ...accounts, [user]: { ...account, password: d.newPassword } });
            }
            saveProfile({ ...profile(), phone: d.phone }); 
            toast('저장했어요'); 
            view = 'main'; 
            draw(); 
        };
        }
        if (view === 'addresses') {
            const edit = d => { 
                $('#addressFormArea').innerHTML = `<form id="addressForm" class="summary">
        <label>주소 별칭<input name="label" required value="${esc(d?.label || '')}" placeholder="우리집, 회사">
        </label>${profileFields(d || profile() || {})}<button class="primary block">저장</button>
        </form>`; 
                $('#addressForm').onsubmit = e => { 
                    e.preventDefault(); 
                    const data = Object.fromEntries(new FormData(e.target)); 
                    const list = addresses(); 
                    if (d)
                set('addresses', list.map(x => x.id === d.id ? { ...x, ...data } : x));
            else
                set('addresses', [...list, { ...data, id: String(Date.now()), default: !list.length }]); 
                    draw(); 
                }; 
            };
            $('#newAddress').onclick = () => edit();
            document.querySelectorAll('[data-edit]').forEach(b => b.onclick = () => edit(addresses().find(d => d.id === b.dataset.edit)));
            document.querySelectorAll('[data-delete]').forEach(b => b.onclick = async () => { 
                if (!await confirmAction('주소를 삭제할까요?'))
                return; 
                const list = addresses().filter(d => d.id !== b.dataset.delete); 
                if (list.length && !list.some(d => d.default))
                list[0].default = true; 
                set('addresses', list); 
                draw(); 
            });
        }
    };
    draw();
}
// Community data: stable identifiers preserve links and ownership across edits.
function communityData() {
    const posts = get('posts', []);
    const old = posts.find(p => p.notice || (p.author === '입덕볶이' && p.title === '입덕볶이 커뮤니티에 오신 것을 환영합니다'));
    const notice = { ...old, id: 'welcome', title: '입덕볶이 커뮤니티에 오신 걸 환영합니다!', body: '입덕볶이를 찾아주신 여러분, 환영합니다! 맛있는 메뉴 추천부터 솔직한 후기까지 자유롭게 이야기를 나눠주세요.', author: '입덕볶이 운영자', comments: old?.comments || [], notice: true };
    const result = [notice, ...posts.filter(p => p !== old && !p.notice)].map(p => ({
        ...p, id: p.id || activityId(), comments: (p.comments || []).map(c => ({ ...c, id: c.id || activityId() }))
    }));
    set('posts', result);
    return result;
}
function activityId() {
    return globalThis.crypto?.randomUUID?.() || Date.now().toString(36) + Math.random().toString(36).slice(2);
}
function activityDate(item) {
    return item.createdAt ? new Date(item.createdAt).toLocaleDateString('ko-KR') : '작성일 미기록';
}
function activityItems(posts, tab) {
    const items = tab === 'posts'
        ? posts.filter(p => !p.notice && p.author === user).map(p => ({ p, item: p }))
        : posts.flatMap(p => [...p.comments].reverse().filter(c => c.author === user).map(c => ({ p, item: c })));
    return items.sort((a, b) => (b.item.createdAt || 0) - (a.item.createdAt || 0));
}
function activityMarkup(tab, icon) {
    const posts = communityData();
    const pc = activityItems(posts, 'posts').length, cc = activityItems(posts, 'comments').length;
    const items = activityItems(posts, tab);
    return `<div class="activity-overview">
        <div>${icon('orders')}<span>작성한 게시글</span><strong>${pc}개</strong></div>
        <div>${icon('posts')}<span>작성한 댓글</span><strong>${cc}개</strong></div>
        </div><div class="activity-tabs" role="tablist">
        <button role="tab" aria-selected="${tab === 'posts'}" data-activity-tab="posts">게시글 ${pc}</button>
        <button role="tab" aria-selected="${tab === 'comments'}" data-activity-tab="comments">댓글 ${cc}</button>
        </div><div class="row between activity-list-heading"><b>${tab === 'posts' ? '내가 작성한 게시글' : '내가 작성한 댓글'}</b><small>최신순</small></div>
        ${items.map(({p,item}) => `<article class="activity-card">
        <small>${activityDate(item)}</small>
        <a class="activity-title ${tab === 'comments' ? 'comment-parent' : ''}" href="${url(7, '?post=' + encodeURIComponent(p.id))}">${tab === 'comments' ? '↳ ' : ''}${esc(p.title)}</a>
        <p class="activity-preview">${esc(tab === 'posts' ? item.body : item.text)}</p>
        <div class="activity-actions"><a href="${url(7, '?post=' + encodeURIComponent(p.id))}">게시글 보기 ›</a>
        <button data-activity-edit="${esc(p.id)}" data-comment-id="${tab === 'comments' ? esc(item.id) : ''}">${icon('edit')}수정</button>
        <button data-activity-delete="${esc(p.id)}" data-comment-id="${tab === 'comments' ? esc(item.id) : ''}">${icon('delete')}삭제</button></div></article>`).join('') || `<div class="activity-empty">${icon('posts')}<h3>아직 작성한 ${tab === 'posts' ? '게시글' : '댓글'}이 없어요</h3><p>입덕볶이에서 맛있는 이야기를 나눠보세요!</p><a class="primary" href="${url(7, tab === 'posts' ? '?write=1' : '')}">${tab === 'posts' ? '첫 게시글 작성하기' : '댓글 작성하러 가기'}</a></div>`}
        ${items.length ? `<a class="primary block" href="${url(7)}">커뮤니티 바로가기</a>` : ''}<div id="activityEditor"></div>`;
}
function bindActivity(changeTab, redraw) {
    document.querySelectorAll('[data-activity-tab]').forEach(b => b.onclick = () => changeTab(b.dataset.activityTab));
    const find = (posts, b, key) => {
        const p = posts.find(p => p.id === b.dataset[key]);
        const cid = b.dataset.commentId;
        const item = cid ? p?.comments.find(c => c.id === cid) : p;
        return item?.author === user && (cid || !p.notice) ? {p,item,cid} : null;
    };
    document.querySelectorAll('[data-activity-delete]').forEach(b => b.onclick = async () => {
        const posts = communityData(), found = find(posts, b, 'activityDelete');
        if (!found || !await confirmAction(found.cid ? '댓글을 삭제할까요?' : '게시글과 모든 댓글을 삭제할까요?')) return;
        if (found.cid) found.p.comments = found.p.comments.filter(c => c.id !== found.cid);
        set('posts', found.cid ? posts : posts.filter(p => p.id !== found.p.id));
        redraw(); toast('삭제했어요.');
    });
    document.querySelectorAll('[data-activity-edit]').forEach(b => b.onclick = () => {
        const found = find(communityData(), b, 'activityEdit');
        if (!found) return;
        const area = $('#activityEditor');
        area.innerHTML = `<form class="activity-card activity-editor"><h3>${found.cid ? '댓글' : '게시글'} 수정</h3>
            ${found.cid ? '' : `<label>제목<input name="title" required maxlength="80" value="${esc(found.item.title)}"></label>`}
            <label>내용<textarea name="body" required maxlength="${found.cid ? 200 : 2000}">${esc(found.cid ? found.item.text : found.item.body)}</textarea></label>
            <div class="row"><button type="button" class="secondary" data-cancel>취소</button><button class="primary">저장</button></div></form>`;
        area.querySelector('[data-cancel]').onclick = () => area.innerHTML = '';
        area.querySelector('form').onsubmit = e => {
            e.preventDefault();
            const posts = communityData(), latest = find(posts, b, 'activityEdit');
            if (!latest) return redraw();
            const d = new FormData(e.target), body = d.get('body').trim();
            if (!body || (!latest.cid && !d.get('title').trim())) return toast('내용을 입력해주세요.');
            if (latest.cid) latest.item.text = body;
            else { latest.item.title = d.get('title').trim(); latest.item.body = body; }
            set('posts', posts); redraw(); toast('수정했어요.');
        };
        area.scrollIntoView({behavior:'smooth', block:'center'});
    });
}
function community() {
    const params = new URLSearchParams(location.search);
    const opened = params.get('post');
    const link = id => url(7, '?post=' + encodeURIComponent(id));
    const icons = {user:'<circle cx="12" cy="8" r="3"/><path d="M5 21v-2a7 7 0 0 1 14 0v2"/>', comment:'<path d="M21 11.5a9 9 0 0 1-9 9 10 10 0 0 1-4-.9L3 21l1.4-4.6A9 9 0 1 1 21 11.5Z"/>', notice:'<path d="m3 11 16-6v14L3 14zM7 15l2 6h3l-2-5"/>', edit:'<path d="m4 16 12-12 4 4L8 20H4z"/>'};
    const icon = name => `<svg class="club-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${icons[name]}</svg>`;
    const date = item => item.createdAt ? new Date(item.createdAt).toLocaleString('ko-KR', {year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit'}) : item.notice ? '상시 공지' : '작성일 미기록';
    const own = item => !!user && item.author === user && !item.notice;
    const actions = (item, cid = '') => own(item) ? `<details class="club-more"><summary aria-label="더보기">⋯</summary><div><button type="button" data-club-edit="${esc(cid)}">수정</button><button type="button" data-club-delete="${esc(cid)}">삭제</button></div></details>` : '';
    const draw = () => {
        const posts = communityData();
        const p = posts.find(p => p.id === opened);
        if (opened && !p) {
            shell(`<section class="club"><a href="${url(7)}">‹ 목록으로</a><p class="club-empty">삭제되었거나 존재하지 않는 게시글입니다.</p></section>`);
            return;
        }
        if (!p) {
            shell(`<section class="club club-list"><div class="club-heading"><h1>커뮤니티</h1><p>입덕러들과 맛있는 이야기를 나눠보세요.</p></div>
                <div class="club-toolbar"><b>전체 게시글</b><button class="club-primary" id="write">${icon('edit')} 글쓰기</button></div><div id="editor"></div>
                ${posts.filter(p => p.notice).map(p => `<a class="club-notice" href="${link(p.id)}"><span>${icon('notice')} 공지사항</span><strong>${esc(p.title)}</strong><small>${esc(p.author)} · ${date(p)}</small></a>`).join('')}
                <div class="club-feed">${posts.filter(p => !p.notice).map(p => `<a class="club-entry" href="${link(p.id)}"><strong>${esc(p.title)}</strong><p>${esc(p.body)}</p><div class="club-meta">${icon('user')}<span>${esc(p.author)} · ${date(p)}</span><span class="club-count">${icon('comment')} ${p.comments.length}</span></div></a>`).join('') || '<p class="club-empty">아직 게시글이 없어요. 첫 이야기를 남겨보세요!</p>'}</div></section>`);
            $('#write').onclick = () => {
                if (!user) { location.href = url(8, '?next=community'); return; }
                $('#editor').innerHTML = `<form class="club-editor" id="postform"><h3>게시글 작성</h3><label>제목<input name="title" required maxlength="80"></label><label>내용<textarea name="body" required maxlength="2000" rows="5"></textarea></label><div class="club-form-actions"><button type="button" id="cancelWrite">취소</button><button class="club-primary">등록</button></div></form>`;
                $('#cancelWrite').onclick = () => $('#editor').innerHTML = '';
                $('#postform').onsubmit = e => {
                    e.preventDefault();
                    const d = new FormData(e.target), title = d.get('title').trim(), body = d.get('body').trim();
                    if (!title || !body) return toast('제목과 내용을 입력해주세요.');
                    const posts = communityData(), id = activityId();
                    posts.splice(1, 0, {title, body, id, createdAt:Date.now(), author:user, comments:[]});
                    set('posts', posts); location.href = link(id);
                };
            };
            return;
        }
        shell(`<section class="club club-detail"><a class="club-back" href="${url(7)}">‹ 목록으로</a><article class="club-article"><div class="club-title-row"><h1>${p.notice ? '<span class="club-notice-tag">공지사항</span>' : ''}${esc(p.title)}</h1>${actions(p)}</div><div class="club-author"><span class="club-avatar">${icon('user')}</span><div><b>${esc(p.author)}</b><small>${date(p)}</small></div></div><div class="club-body">${esc(p.body)}</div><div class="club-body-count">${icon('comment')} 댓글 ${p.comments.length}개</div></article>
            <div class="club-comments"><div class="club-toolbar"><h2>댓글 <em>${p.comments.length}</em></h2><small>등록순</small></div>${p.comments.map(c => `<article class="club-comment"><span class="club-avatar">${icon('user')}</span><div class="club-comment-main"><div class="club-comment-head"><b>${esc(c.author)}</b>${actions(c,c.id)}</div><p>${esc(c.text)}</p><small>${date(c)}</small></div></article>`).join('') || '<p class="club-empty">아직 댓글이 없어요. 첫 댓글을 남겨보세요!</p>'}
            <form id="clubComment" class="club-editor"><label for="commentText">댓글 작성</label><textarea id="commentText" name="comment" required maxlength="200" rows="3" placeholder="따뜻한 댓글을 남겨주세요."></textarea><div class="club-form-actions"><button class="club-primary">등록</button></div></form><div id="clubEdit"></div></div></section>`);
        $('#clubComment').onsubmit = e => {
            e.preventDefault();
            if (!user) { location.href = url(8, '?next=comment&post=' + encodeURIComponent(opened)); return; }
            const text = new FormData(e.target).get('comment').trim();
            if (!text) return toast('댓글을 입력해주세요.');
            const posts = communityData(), latest = posts.find(x => x.id === opened);
            if (!latest) return draw();
            latest.comments.push({id:activityId(), createdAt:Date.now(), author:user, text});
            set('posts', posts); draw();
        };
        const find = cid => {
            const posts = communityData(), post = posts.find(x => x.id === opened), item = cid ? post?.comments.find(c => c.id === cid) : post;
            return item && own(item) ? {posts,post,item} : null;
        };
        document.querySelectorAll('[data-club-delete]').forEach(b => b.onclick = async () => {
            const cid = b.dataset.clubDelete, f = find(cid);
            if (!f || !await confirmAction(cid ? '댓글을 삭제할까요?' : '게시글과 모든 댓글을 삭제할까요?')) return;
            if (cid) { f.post.comments = f.post.comments.filter(c => c.id !== cid); set('posts', f.posts); draw(); }
            else { set('posts', f.posts.filter(x => x.id !== opened)); location.href = url(7); }
        });
        document.querySelectorAll('[data-club-edit]').forEach(b => b.onclick = () => {
            const cid = b.dataset.clubEdit, f = find(cid);
            if (!f) return;
            const area = $('#clubEdit');
            area.innerHTML = `<form class="club-editor"><h3>${cid ? '댓글' : '게시글'} 수정</h3>${cid ? '' : `<label>제목<input name="title" required maxlength="80" value="${esc(f.item.title)}"></label>`}<label>내용<textarea name="body" required maxlength="${cid ? 200 : 2000}" rows="4">${esc(cid ? f.item.text : f.item.body)}</textarea></label><div class="club-form-actions"><button type="button" data-cancel>취소</button><button class="club-primary">저장</button></div></form>`;
            area.querySelector('[data-cancel]').onclick = () => area.innerHTML = '';
            area.querySelector('form').onsubmit = e => {
                e.preventDefault();
                const latest = find(cid), d = new FormData(e.target), body = d.get('body').trim();
                if (!latest) return draw();
                if (!body || (!cid && !d.get('title').trim())) return toast('내용을 입력해주세요.');
                if (cid) latest.item.text = body;
                else { latest.item.title = d.get('title').trim(); latest.item.body = body; }
                set('posts', latest.posts); draw(); toast('수정했어요.');
            };
            area.scrollIntoView({behavior:'smooth',block:'center'});
        });
    };
    draw();
    if (!opened && params.get('write') === '1') $('#write')?.click();
    if (opened && params.get('comment') === '1') $('#commentText')?.focus();
}
[home, list, detail, payment, finish, cartPage, about, community, login, mypage][page]();
if (page === 0 && sessionStorage.getItem('ipdeok:profileSaved')) {
    sessionStorage.removeItem('ipdeok:profileSaved');
    toast('회원 정보가 저장되었습니다.');
}
