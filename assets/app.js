/* ------------------------------------------------------------------
   BARTS — app.js
   content/*.yml 파일을 읽어서 화면을 그립니다.
   내용 수정은 content 폴더에서만 하시면 됩니다. (이 파일은 그대로 두세요)
------------------------------------------------------------------- */
(async function () {
  const UI = {
    ko: { about: '소개', research: '연구', people: '구성원', publications: '논문', news: '소식', gallery: '갤러리', contact: '연락처',
      joinBtn: '지원하기', researchTitle: '연구 분야', peopleTitle: '구성원', members: '연구원', alumni: '졸업생',
      pubTitle: '논문', all: '전체', journal: '저널', chapters: '북챕터', corrNote: '* 교신저자', newsTitle: '소식',
      allNews: '전체 소식 보기', more: '학력 · 경력 · 수상 · 학술활동 자세히 보기', less: '접기', interests: '연구 분야', noDetail: '자세한 내용은 준비 중입니다.', lessNews: '접기', emailUs: '이메일 보내기', education: '학력', career: '경력', awards: '수상',
      journalPapers: '저널 논문', bookChapters: '북챕터', since: '연구 시작', recruit: '함께할 연구원을 모집합니다',
      recruitSub: '아래 Join BARTS 참고', noResult: '검색 결과가 없습니다.', search: '제목, 저자, 저널 검색…',
      service: '학술 활동', committee: '학위논문 심사', professor: '지도교수', recruiting: '모집 중', recruitingSub: '함께할 분을 기다립니다',
      comingSoon: '업데이트 예정', papers: '편', journalPapersN: '저널 논문 {j}편 · 북챕터 {c}편', showAll: '전체 보기', viewPhotos: '사진',
      tags: { award: '수상', talk: '발표·초청', conference: '학회', seminar: '세미나', service: '학술활동', grant: '연구과제', people: '연구실', event: '행사' },
      groups: { Postdoc: '박사후연구원', PhD: '박사과정', Integrated: '석박통합과정', MS: '석사과정', Intern: '학부연구생', Staff: '연구원', Alumni: '졸업생' },
      role: { PhD: '박사과정', Integrated: '석박통합과정', MS: '석사과정', Intern: '학부연구생', Postdoc: '박사후연구원', Staff: '연구원' } },
    en: { about: 'About', research: 'Research', people: 'People', publications: 'Publications', news: 'News', gallery: 'Gallery', contact: 'Contact',
      joinBtn: 'Join BARTS', researchTitle: 'Research areas', peopleTitle: 'People', members: 'Researchers', alumni: 'Alumni',
      pubTitle: 'Publications', all: 'All', journal: 'Journal', chapters: 'Book chapters', corrNote: '* Corresponding author', newsTitle: 'News',
      allNews: 'All news', more: 'Education · Career · Honors · Service', less: 'Hide details', interests: 'Research interests', noDetail: 'Details coming soon.', lessNews: 'Show less', emailUs: 'Email us', education: 'Education', career: 'Career', awards: 'Honors & Awards',
      journalPapers: 'Journal papers', bookChapters: 'Book chapters', since: 'Publishing since', recruit: 'We are recruiting',
      recruitSub: 'See Join BARTS below', noResult: 'No matching publications.', search: 'Search title, author, journal…',
      service: 'Professional Service', committee: 'Dissertation Committee (M.S./Ph.D.)', professor: 'Professor', recruiting: 'Now recruiting', recruitingSub: 'We would love to hear from you',
      comingSoon: 'Coming soon', papers: '', journalPapersN: '{j} journal papers · {c} book chapters', showAll: 'Show all', viewPhotos: 'Photo',
      tags: { award: 'Award', talk: 'Talk', conference: 'Conference', seminar: 'Seminar', service: 'Service', grant: 'Grant', people: 'Lab life', event: 'Event' },
      groups: { Postdoc: 'Postdoctoral Researchers', PhD: 'Ph.D. Students', Integrated: 'Integrated M.S.–Ph.D. Students', MS: 'M.S. Students', Intern: 'Undergraduate Interns', Staff: 'Staff', Alumni: 'Alumni' },
      role: { PhD: 'Ph.D. Student', Integrated: 'Integrated M.S.–Ph.D. Student', MS: 'M.S. Student', Intern: 'Undergraduate Intern', Postdoc: 'Postdoctoral Researcher', Staff: 'Researcher' } }
  };
  const HIGHLIGHT = /(Kim, Sung Hoo\*?|Sung Hoo Kim\*?)/g;   // 굵게 표시할 이름

  let lang = 'en';   // 기본 언어 (en = 영어, ko = 한국어)
  try { lang = localStorage.getItem('barts-lang') || 'en'; } catch (e) {}

  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const T = v => v == null ? '' : typeof v === 'object' ? (v[lang] ?? v.en ?? v.ko ?? '') : String(v);
  const L = k => UI[lang][k] ?? k;
  const get = (o, path) => path.split('.').reduce((a, k) => a?.[k], o);
  const initials = n => String(n || '?').split(/\s+/).map(w => w[0]).join('').slice(0, 2).toUpperCase();

  async function load(name) {
    let r = await fetch(`content/${name}.yml`, { cache: 'no-cache' });
    if (!r.ok) r = await fetch(`content/${name}.txt`, { cache: 'no-cache' });  // preview hosting fallback
    if (!r.ok) throw new Error(`${name}.yml (${r.status})`);
    return jsyaml.load(await r.text()) || {};
  }

  let D;
  try {
    const [site, people, pubs, news] = await Promise.all(['site', 'people', 'publications', 'news'].map(load));
    D = { site, people, pubs,
      news: (Array.isArray(news) ? news : (news.items || [])).map(n => {   // news.yml: 목록 그대로 또는 items: 아래 목록 둘 다 지원
        const imgs = [...(Array.isArray(n.photos) ? n.photos : n.photos ? [n.photos] : []), n.image, n.image_url].filter(Boolean);
        return { ...n, imgs, image: imgs[0] || '' };
      }) };
    D.people.members ||= []; D.people.alumni ||= [];
  } catch (err) {
    const box = document.createElement('div');
    box.className = 'load-error wrap';
    box.innerHTML = `<b>내용 파일을 읽지 못했습니다.</b> ${esc(err.message)}<br>
      YAML 파일의 들여쓰기나 따옴표를 확인해 주세요. (컴퓨터에서 index.html 을 더블클릭해 열면 동작하지 않습니다 — README 참고)`;
    $('#main').prepend(box);
    console.error(err);
    return;
  }

  /* ---------------- renderers ---------------- */
  function renderBinds() {
    $$('[data-bind]').forEach(el => { const v = get(D.site, el.dataset.bind); if (v != null) el.textContent = T(v); });
    $$('[data-i18n]').forEach(el => { el.textContent = L(el.dataset.i18n); });
    $('#pub-search').placeholder = L('search');
    $$('.lang button').forEach(b => b.classList.toggle('on', b.dataset.lang === lang));
    document.documentElement.lang = lang;
    const mail = D.site.lab?.email || '';
    $('#foot-mail').textContent = mail; $('#foot-mail').href = 'mailto:' + mail;
    $('#join-mail').href = 'mailto:' + mail + '?subject=' + encodeURIComponent('[BARTS] Inquiry');
    $('#join-mail-text').textContent = mail;
    $$('.q-mail').forEach(a => { a.textContent = mail; a.href = 'mailto:' + mail; });
    $('#year').textContent = new Date().getFullYear();
  }

  function renderStats() {
    const j = (D.pubs.journal || []).length, c = (D.pubs.chapters || []).length;
    $('#pub-count').textContent = L('journalPapersN').replace('{j}', j).replace('{c}', c);
  }

  const R_ICONS = [
    '<path d="M12 4a2 2 0 1 1 0 4 2 2 0 0 1 0-4zM8 21l2-7-2-2V9l4-1 3 3 3 1M10 14l3 2v5"/>',
    '<circle cx="5" cy="6" r="2"/><circle cx="5" cy="18" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="19" cy="6" r="2"/><circle cx="19" cy="18" r="2"/><path d="M7 6.8 10.3 11M7 17.2l3.3-4.2M13.7 11 17 6.8M13.7 13l3.3 4.2"/>',
    '<circle cx="6" cy="18" r="3"/><circle cx="18" cy="18" r="3"/><path d="M6 18h7l4-10h3M14 8h3"/>',
    '<path d="M3 21V9l5-3v15M8 21V4l7 3v14M15 21v-9l6 2v7M2 21h20"/>'
  ];
  function renderResearch() {
    $('#research-list').innerHTML = (D.site.research || []).map((r, i) => `
      <article class="card reveal">
        <div class="card-top"><span class="num">${String(i + 1).padStart(2, '0')}</span>
        <svg class="card-ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">${R_ICONS[i % R_ICONS.length]}</svg></div>
        <h3>${esc(T(r.title))}</h3>
        <p>${esc(T(r.body))}</p>
        <div class="tags">${(r.tags || []).map(t => `<span class="tag">${esc(T(t))}</span>`).join('')}</div>
      </article>`).join('');
  }

  function renderTicker() {
    const words = [...new Set((D.site.research || []).flatMap(r => (r.tags || []).map(T)))];
    if (!words.length) return;
    const row = words.map(w => `<span>${esc(w)}</span>`).join('');
    $('#ticker').innerHTML = row + row;
  }

  function avatar(p, cls = '') {
    const n = T(p.name);
    return p.photo ? `<img class="avatar ${cls}" src="${esc(p.photo)}" alt="${esc(n)}" loading="lazy">`
                   : `<div class="avatar ${cls}" aria-hidden="true">${esc(initials(p.name?.en || n))}</div>`;
  }
  const list = arr => (arr || []).length ? `<ul>${arr.map(x => `<li>${esc(T(x))}</li>`).join('')}</ul>` : '';

  const GROUPS = ['Postdoc', 'PhD', 'MS', 'Intern', 'Staff'];
  const roleOf = m => (m.role === 'Integrated' ? 'PhD' : (m.role || 'Staff'));
  // 링크 버튼 (LinkedIn, Google Scholar, GitHub, 홈페이지, CV, 기타)
  const ICONS = {
    linkedin: '<svg viewBox="0 0 24 24"><path fill="currentColor" d="M4.98 3.5a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5zM3 9h4v12H3zM9 9h3.8v1.7h.05c.53-1 1.83-2.05 3.77-2.05C20.6 8.65 21 11.2 21 14.5V21h-4v-5.8c0-1.4-.03-3.2-1.95-3.2-1.95 0-2.25 1.52-2.25 3.1V21H9z"/></svg>',
    scholar: '<svg viewBox="0 0 24 24"><path fill="currentColor" d="M12 3 1 9l11 6 9-4.9V17h2V9zm-7 9.2V16c0 2.2 3.1 4 7 4s7-1.8 7-4v-3.8l-7 3.8z"/></svg>',
    github: '<svg viewBox="0 0 24 24"><path fill="currentColor" d="M12 2a10 10 0 0 0-3.16 19.49c.5.09.68-.22.68-.48v-1.7c-2.78.6-3.37-1.34-3.37-1.34-.45-1.16-1.1-1.46-1.1-1.46-.9-.62.07-.6.07-.6 1 .07 1.53 1.03 1.53 1.03.9 1.52 2.34 1.08 2.91.83.09-.65.35-1.08.63-1.33-2.22-.25-4.55-1.11-4.55-4.94 0-1.1.39-1.99 1.03-2.69-.1-.25-.45-1.27.1-2.65 0 0 .84-.27 2.75 1.02a9.5 9.5 0 0 1 5 0c1.91-1.3 2.75-1.02 2.75-1.02.55 1.38.2 2.4.1 2.65.64.7 1.03 1.6 1.03 2.69 0 3.84-2.34 4.68-4.57 4.93.36.31.68.92.68 1.85v2.75c0 .27.18.58.69.48A10 10 0 0 0 12 2z"/></svg>',
    cv: '<svg viewBox="0 0 24 24"><path fill="currentColor" d="M6 2h9l5 5v15H6zm8 1.5V8h4.5zM8 12h8v1.5H8zm0 3h8v1.5H8zm0 3h5v1.5H8z"/></svg>',
    homepage: '<svg viewBox="0 0 24 24"><path fill="currentColor" d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm6.9 6h-2.95a15.7 15.7 0 0 0-1.38-3.56A8 8 0 0 1 18.9 8zM12 4.04c.83 1.2 1.48 2.53 1.91 3.96h-3.82c.43-1.43 1.08-2.76 1.91-3.96zM4.26 14a8.2 8.2 0 0 1 0-4h3.38a16.5 16.5 0 0 0 0 4zm.84 2h2.95c.32 1.25.78 2.45 1.38 3.56A8 8 0 0 1 5.1 16zM8.05 8H5.1a8 8 0 0 1 4.33-3.56A15.7 15.7 0 0 0 8.05 8zM12 19.96A14 14 0 0 1 10.09 16h3.82A14 14 0 0 1 12 19.96zM14.34 14H9.66a14.7 14.7 0 0 1 0-4h4.68a14.7 14.7 0 0 1 0 4zm.25 5.56c.6-1.11 1.06-2.31 1.38-3.56h2.95a8 8 0 0 1-4.33 3.56zM16.36 14a16.5 16.5 0 0 0 0-4h3.38a8.2 8.2 0 0 1 0 4z"/></svg>',
    email: '<svg viewBox="0 0 24 24"><path fill="currentColor" d="M3 5h18v14H3zm9 7.2L5 7.5V17h14V7.5zM5.6 7l6.4 4.3L18.4 7z"/></svg>'
  };
  const KIND_LABEL = { linkedin: 'LinkedIn', scholar: 'Google Scholar', github: 'GitHub', homepage: 'Homepage', cv: 'CV', email: 'Email' };
  function guessKind(l) {
    if (l.kind && l.kind !== 'other') return l.kind;
    const u = (l.url || '') + ' ' + (l.label || '');
    if (/linkedin/i.test(u)) return 'linkedin';
    if (/scholar\.google/i.test(u)) return 'scholar';
    if (/github\.com/i.test(u)) return 'github';
    if (/\bcv\b|\.pdf/i.test(u)) return 'cv';
    return 'homepage';
  }
  // 메일: 파란 버튼 / 링크(LinkedIn 등): 아이콘+이름 버튼
  function mailButton(email) {
    return email ? `<a class="btn btn-primary btn-sm mail-btn" href="mailto:${esc(email)}" title="${esc(email)}">✉ <span>${esc(email)}</span></a>` : '';
  }
  function linkButtons(person) {
    const ls = (person.links || []).filter(l => l && l.url).map(l => {
      const k = guessKind(l), label = l.label || KIND_LABEL[k];
      return `<a class="link-btn lk-${k}" href="${esc(l.url)}" target="_blank" rel="noopener">${ICONS[k] || ICONS.homepage}<span>${esc(label)}</span></a>`;
    });
    return ls.length ? `<div class="m-links">${ls.join('')}</div>` : '';
  }
  function personCard(m, kicker, extra) {
    const other = lang === 'ko' ? m.name?.en : m.name?.ko;
    return `<article class="person reveal">
      <div class="person-photo">${avatar(m)}</div>
      <div class="person-body">
        ${kicker ? `<p class="pi-kicker">${esc(kicker)}</p>` : ''}
        <h4>${esc(T(m.name))}</h4>
        ${other && other !== T(m.name) ? `<p class="alt-name">${esc(other)}</p>` : ''}
        ${m.email ? `<div class="mail-row">${mailButton(m.email)}</div>` : ''}
        ${extra || ''}
        ${linkButtons(m)}
      </div></article>`;
  }
  function memberCard(m) {
    return personCard(m, '', m.interests ? `<p class="interests">${esc(T(m.interests))}</p>` : '');
  }
  function renderPeople() {
    const p = D.people.professor || {};
    const links = linkButtons(p);
    const chips = (D.site.research || []).map(r => `<span class="tag">${esc(T(r.title))}</span>`).join('');
    $('#pi').innerHTML = `
      <h3 class="group-h" id="g-Professor">${L('professor')}</h3>
      <div class="pi reveal">
        <div class="pi-photo">${avatar(p)}</div>
        <div class="pi-main">
          <p class="pi-kicker">${esc(T(p.title))}</p>
          <h3>${esc(T(p.name))}</h3>
          <p class="role">${esc(T(D.site.lab?.affiliation))}</p>
          <div class="links">${mailButton(p.email)}${links}</div>
          ${chips ? `<p class="pi-sub">${L('interests')}</p><div class="tags">${chips}</div>` : ''}
          <details class="pi-more">
            <summary><span class="sm-open">${L('more')}</span><span class="sm-close">${L('less')}</span></summary>
            <div class="pi-cols">
              <div><h4>${L('education')}</h4>${list(p.education)}<h4>${L('career')}</h4>${list(p.career)}</div>
              <div><h4>${L('awards')}</h4>${list(p.awards)}
                ${(p.service || []).length ? `<h4>${L('service')}</h4>${list(p.service)}` : ''}
                ${(p.committee || []).length ? `<h4>${L('committee')}</h4><p class="committee">${p.committee.map(x => esc(T(x))).join(' · ')}</p>` : ''}</div>
            </div>
          </details>
        </div>
      </div>`;

    const members = D.people.members || [];
    const alumni = D.people.alumni || [];
    const blocks = GROUPS.map(g => {
      const ms = members.filter(m => roleOf(m) === g);
      if (g === 'Staff' && !ms.length) return '';
      if (!ms.length) return `<h3 class="group-h empty" id="g-${g}">${L('groups')[g]}<a class="group-empty" href="#join">${L('recruiting')} →</a></h3>`;
      const hiring = g !== 'Staff' ? `<a class="group-empty" href="#join">${L('recruiting')} →</a>` : '';   // 학생 그룹은 항상 '모집 중' 버튼 표시
      return `<h3 class="group-h" id="g-${g}">${L('groups')[g]} <span>${ms.length}</span>${hiring}</h3><div class="people-grid">${ms.map(memberCard).join('')}</div>`;
    });
    blocks.push(alumni.length
      ? `<h3 class="group-h" id="g-Alumni">${L('groups').Alumni} <span>${alumni.length}</span></h3><div class="people-grid">${
          alumni.map(a => personCard(a, T(a.degree), a.now ? `<p class="interests">→ ${esc(T(a.now))}</p>` : '')).join('')}</div>`
      : `<h3 class="group-h empty" id="g-Alumni">${L('groups').Alumni}<span class="group-empty soon">${L('comingSoon')}</span></h3>`);
    $('#groups').innerHTML = blocks.join('');

    const tabs = ['Professor', ...GROUPS.filter(g => g !== 'Staff' || members.some(m => m.role === 'Staff')), 'Alumni'];
    $('#people-tabs').innerHTML = tabs.map(g => {
      const n = g === 'Professor' ? 1 : g === 'Alumni' ? alumni.length : members.filter(m => roleOf(m) === g).length;
      return `<a href="#g-${g}">${g === 'Professor' ? L('professor') : L('groups')[g]}<span>${n}</span></a>`;
    }).join('');
  }

  let pubFilter = 'all', pubQuery = '';
  function renderPubs() {
    const items = [
      ...(D.pubs.journal || []).map(p => ({ ...p, kind: 'journal' })),
      ...(D.pubs.chapters || []).map(p => ({ ...p, kind: 'chapters' }))
    ].filter(p => pubFilter === 'all' || p.kind === pubFilter)
     .filter(p => !pubQuery || `${p.title} ${p.authors} ${p.venue} ${p.year}`.toLowerCase().includes(pubQuery));
    const byYear = {};
    items.forEach(p => (byYear[p.year] ||= []).push(p));
    const years = Object.keys(byYear).sort((a, b) => b - a);
    $('#pub-list').innerHTML = years.length ? years.map(y => `
      <div class="year-group"><div class="yr">${esc(y)}</div><ol class="pubs">
        ${byYear[y].map(p => `<li class="pub">
          ${p.link ? `<a class="t" href="${esc(p.link)}" target="_blank" rel="noopener">${esc(p.title)}</a>` : `<span class="t">${esc(p.title)}</span>`}
          <div class="a">${esc(p.authors).replace(HIGHLIGHT, '<b>$1</b>')}</div>
          <div class="v">${esc(p.venue)}${p.kind === 'chapters' ? `<span class="kind">${L('chapters')}</span>` : ''}</div>
        </li>`).join('')}
      </ol></div>`).join('') : `<p class="empty">${L('noResult')}</p>`;
  }

  let newsAll = false, newsTag = 'all';
  const NEWS_LIMIT = 10;
  function renderNews() {
    const tags = [...new Set(D.news.map(n => n.tag).filter(Boolean))];
    $('#news-filter').innerHTML = ['all', ...tags].map(t =>
      `<button data-t="${esc(t)}" class="${t === newsTag ? 'on' : ''}">${t === 'all' ? L('all') : esc(L('tags')[t] || t)}</button>`).join('');
    const filtered = D.news.filter(n => newsTag === 'all' || n.tag === newsTag);
    const items = newsAll ? filtered : filtered.slice(0, NEWS_LIMIT);
    const byYear = [];
    items.forEach(n => {
      const y = n.year || String(n.date || '').slice(0, 4) || '';
      let g = byYear.find(x => x.y == y); if (!g) byYear.push(g = { y, list: [] }); g.list.push(n);
    });
    $('#news-list').innerHTML = byYear.map(g => `
      <div class="year-group"><div class="yr">${esc(g.y)}</div><ul class="news">
      ${g.list.map(n => `<li class="${n.image ? 'has-img' : ''} clickable" data-n="${D.news.indexOf(n)}">
        <div class="n-meta"><time>${esc(n.date)}</time><span class="ntag t-${esc(n.tag)}">${esc(L('tags')[n.tag] || n.tag || '')}</span></div>
        <div class="n-body">
          <span class="n-title">${esc(T(n.title))}</span>
          ${T(n.body) ? `<p>${esc(T(n.body))}</p>` : ''}
        </div>
        ${n.image ? `<span class="n-thumb"><img src="${esc(n.image)}" alt="" loading="lazy" referrerpolicy="no-referrer" onerror="this.parentNode.remove()">${n.imgs.length > 1 ? `<span class="n-count">+${n.imgs.length - 1}</span>` : ''}</span>` : ''}
      </li>`).join('')}</ul></div>`).join('') || `<p class="empty">—</p>`;
    const more = $('#news-more');
    more.hidden = filtered.length <= NEWS_LIMIT;
    more.textContent = newsAll ? L('lessNews') : `${L('allNews')} (${filtered.length})`;
  }

  // 소식 상세 창
  const modal = document.createElement('div');
  modal.className = 'modal'; modal.hidden = true; modal.setAttribute('role', 'dialog'); modal.setAttribute('aria-modal', 'true');
  document.body.appendChild(modal);
  function openNews(i) {
    const n = D.news[i]; if (!n) return;
    modal.innerHTML = `<div class="modal-card">
      <button class="modal-close" aria-label="Close">×</button>
      <div class="modal-meta"><time>${esc(n.date)}</time><span class="ntag t-${esc(n.tag)}">${esc(L('tags')[n.tag] || n.tag || '')}</span></div>
      <h3>${esc(T(n.title))}</h3>
      ${T(n.body) ? `<p class="modal-body">${esc(T(n.body))}</p>` : (n.imgs.length ? '' : `<p class="modal-empty">${L('noDetail')}</p>`)}
      ${n.imgs.length ? `<div class="modal-photos ${n.imgs.length === 1 ? 'one' : ''}">${n.imgs.map(src =>
        `<button data-src="${esc(src)}" data-cap="${esc(T(n.title))}"><img src="${esc(src)}" alt="" referrerpolicy="no-referrer" onerror="this.parentNode.remove()"></button>`).join('')}</div>` : ''}
      ${n.link ? `<a class="modal-link" href="${esc(n.link)}" target="_blank" rel="noopener">${lang === 'ko' ? '관련 링크' : 'Related link'} →</a>` : ''}
    </div>`;
    modal.hidden = false; document.body.style.overflow = 'hidden';
  }
  function closeModal() { modal.hidden = true; document.body.style.overflow = ''; }

  function renderJoin() {
    $('#positions').innerHTML = (D.site.join?.positions || []).map(p => `<li>${esc(T(p))}</li>`).join('');
  }

  function renderAll() {
    renderBinds(); renderStats(); renderResearch(); renderPeople(); renderPubs(); renderNews(); renderJoin(); renderTicker();
    observe();
  }

  /* ---------------- interactions ---------------- */
  $$('.lang button').forEach(b => b.addEventListener('click', () => {
    lang = b.dataset.lang; try { localStorage.setItem('barts-lang', lang); } catch (e) {}
    renderAll();
  }));
  $('#pub-filter').addEventListener('click', e => {
    const b = e.target.closest('button'); if (!b) return;
    pubFilter = b.dataset.f; $$('#pub-filter button').forEach(x => x.classList.toggle('on', x === b)); renderPubs();
  });
  $('#pub-search').addEventListener('input', e => { pubQuery = e.target.value.trim().toLowerCase(); renderPubs(); });
  $('#news-more').addEventListener('click', () => { newsAll = !newsAll; renderNews(); });
  $('#news-filter').addEventListener('click', e => { const b = e.target.closest('button'); if (!b) return; newsTag = b.dataset.t; newsAll = false; renderNews(); });
  const lb = $('#lightbox');
  document.addEventListener('click', e => {
    if (!lb.hidden) { if (e.target === lb || e.target.closest('.lb-close') || e.target.tagName === 'IMG') lb.hidden = true; return; }
    const z = e.target.closest('.modal-photos button, .g-open[data-src]');
    if (z) { $('img', lb).src = z.dataset.src; $('img', lb).referrerPolicy = 'no-referrer'; $('p', lb).textContent = z.dataset.cap || ''; lb.hidden = false; return; }
    if (!modal.hidden && (e.target === modal || e.target.closest('.modal-close'))) { closeModal(); return; }
    const row = e.target.closest('.news li.clickable, .g-open[data-n]');
    if (row && !e.target.closest('a')) openNews(+row.dataset.n);
  });
  document.addEventListener('keydown', e => { if (e.key !== 'Escape') return; if (!lb.hidden) lb.hidden = true; else if (!modal.hidden) closeModal(); });
  const burger = $('.burger'), menu = $('#menu');
  burger.addEventListener('click', () => { const o = menu.classList.toggle('open'); burger.setAttribute('aria-expanded', o); });
  menu.addEventListener('click', e => { if (e.target.tagName === 'A') { menu.classList.remove('open'); burger.setAttribute('aria-expanded', false); } });

  let io;
  function observe() {
    if (!('IntersectionObserver' in window)) { $$('.reveal').forEach(el => el.classList.add('in')); return; }
    io ||= new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { threshold: 0.12 });
    $$('.reveal:not(.in)').forEach(el => io.observe(el));
  }

  renderAll();
})();
