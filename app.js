
(() => {
  const C = window.MBA_CONTENT;
  let lang = localStorage.getItem("mba83-lang") || C.meta.defaultLang || "es";
  let deferredPrompt = null;
  let remoteData = null;
  let currentMemoriamItems = [];

  const $ = (s, el=document) => el.querySelector(s);
  const $$ = (s, el=document) => [...el.querySelectorAll(s)];
  const t = (key) => C.copy[lang][key] || key;

  function escapeHtml(value){
    return String(value ?? "").replace(/[&<>"']/g, ch => ({
      "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"
    })[ch]);
  }

  function loadPublicData(){
    const endpoint = C.meta.publicDataEndpoint;
    if(!endpoint) return Promise.resolve(null);

    return new Promise((resolve) => {
      const callbackName = "__mbaPublicData_" + Date.now();
      const script = document.createElement("script");
      const timeout = setTimeout(() => finish(null), 7000);

      function finish(data){
        clearTimeout(timeout);
        try { delete window[callbackName]; } catch(e) {}
        script.remove();
        resolve(data || null);
      }

      window[callbackName] = (data) => finish(data);
      script.onerror = () => finish(null);
      const sep = endpoint.includes("?") ? "&" : "?";
      script.src = endpoint + sep + "action=publicData&callback=" + encodeURIComponent(callbackName) + "&_=" + Date.now();
      document.head.appendChild(script);
    });
  }

  function logo(srcClass=""){
    return `<img class="${srcClass}" src="assets/mba83-85-fam-logo.png" alt="MBA 83-85 fam">`;
  }

  function header(){
    const nav = C.nav[lang].map(([route,label]) =>
      `<a class="nav-link" data-route="${route}" href="#${route}">${label}</a>`
    ).join("");
    return `
      <header class="site-header">
        <div class="container header-inner">
          <a href="#home" class="brand-mini">${logo()}<strong>MBA 83-85 fam</strong></a>
          <nav class="desktop-nav">${nav}</nav>
          <div class="header-actions">
            <button id="installBtn" class="install-btn" aria-label="${t("install")}">${t("install")}</button>
            <div class="lang-switch" aria-label="Language">
              <button data-lang="es" class="${lang==="es"?"active":""}">ES</button>
              <button data-lang="en" class="${lang==="en"?"active":""}">EN</button>
            </div>
            <button id="menuBtn" class="menu-btn" aria-label="Menu">☰</button>
          </div>
        </div>
        <div id="mobilePanel" class="mobile-panel">
          <div class="container">
            ${C.nav[lang].map(([r,l])=>`<a href="#${r}">${l}</a>`).join("")}
          </div>
        </div>
      </header>`;
  }

  function footer(){
    return `
      <footer class="site-footer">
        <div class="container footer-inner">
          <div class="footer-logo">${logo()}<span>${t("footer")}</span></div>
          <div class="footer-note">© MBA 83-85 fam</div>
        </div>
      </footer>`;
  }

  const homeCards = () => [
    ["madrid2023","2023", lang==="es"?"40 Aniv. Madrid 2023":"40th Anniversary Madrid 2023", lang==="es"?"Recuerdos del encuentro de Madrid.":"Memories from the Madrid gathering."],
    ["anniversary2025","2025", lang==="es"?"40 Aniv. 2025":"40th Anniversary 2025", lang==="es"?"Fotos, vídeos y documentos.":"Photos, videos and documents."],
    ["moments",lang==="es"?"83–hoy":"83–today", t("moments"), lang==="es"?"Encuentros y recuerdos fuera de las celebraciones generales.":"Gatherings and memories outside the main class celebrations."],
    ["next","2028 · 2030", lang==="es"?"Próximamente":"Next", lang==="es"?"Las próximas grandes celebraciones.":"The next major reunions."]
  ];

  function home(){
    const cards = homeCards().map(([route,year,title,desc]) => `
      <a class="card" href="#${route}">
        <div class="card-media red"><div class="card-year">${year}</div></div>
        <div class="card-body"><h3>${title}</h3><p>${desc}</p><div class="card-cta">${t("explore")} →</div></div>
      </a>`).join("");
    return `
      <main>
        <section class="hero">
          <div class="container hero-grid">
            ${logo("hero-logo")}
            <div>
              <div class="eyebrow">MBA 83-85 · IESE</div>
              <h1>${t("sharedStory")}</h1>
              <p>${t("intro")}</p>
              <div class="hero-buttons">
                <a class="btn btn-primary" href="#next">${lang==="es"?"Ver próximas celebraciones":"See next reunions"}</a>
                <a class="btn btn-secondary" href="#madrid2023">${lang==="es"?"Explorar recuerdos":"Explore memories"}</a>
              </div>
            </div>
          </div>
        </section>
        <section class="section soft">
          <div class="container">
            <div class="section-head"><h2>${lang==="es"?"Nuestra historia":"Our story"}</h2>
              <p>${lang==="es"?"Un archivo vivo de encuentros, fotografías, vídeos y documentos de la promoción.":"A living archive of gatherings, photographs, videos and documents from the class."}</p>
            </div>
            <div class="card-grid">${cards}</div>
          </div>
        </section>
      </main>`;
  }


  function visualPhotoCarousel(item,placeholderHtml,altText){
    let photos = Array.isArray(item?.photos) ? item.photos.filter(p=>p && p.url).slice(0,4) : [];
    if(!photos.length && item?.coverUrl){
      photos=[{url:item.coverUrl,primary:true}];
    }
    if(!photos.length) return `<div class="media-placeholder">${placeholderHtml}</div>`;

    const carouselId = `car-${String(item?.id || Math.random()).replace(/[^A-Za-z0-9_-]/g,"")}`;
    const slides = photos.map((p,i)=>`
      <div class="carousel-slide" data-slide="${i}">
        <img src="${p.url}" alt="${escapeHtml(altText||"")} ${i+1}" loading="lazy">
      </div>`).join("");

    const dots = photos.length>1
      ? `<div class="carousel-dots" aria-label="${lang==="es"?"Posición de la galería":"Gallery position"}">
          ${photos.map((_,i)=>`<button type="button" class="carousel-dot ${i===0?"active":""}" data-carousel-dot="${carouselId}" data-index="${i}" aria-label="${lang==="es"?"Foto":"Photo"} ${i+1}"></button>`).join("")}
        </div>`
      : "";

    const arrows = photos.length>1
      ? `<button type="button" class="carousel-arrow prev" data-carousel-prev="${carouselId}" aria-label="${lang==="es"?"Foto anterior":"Previous photo"}">‹</button>
         <button type="button" class="carousel-arrow next" data-carousel-next="${carouselId}" aria-label="${lang==="es"?"Foto siguiente":"Next photo"}">›</button>`
      : "";

    return `
      <div class="photo-carousel" id="${carouselId}" data-count="${photos.length}">
        <div class="carousel-track">${slides}</div>
        ${arrows}
        ${dots}
      </div>`;
  }

  function historical(key){
    const item = C.historical[key];
    const celebrationId = key==="madrid2023" ? "MADRID2023" : "ANIV2025";

    let events = null;
    if(remoteData && Array.isArray(remoteData.events)){
      events = remoteData.events.filter(x => x.celebrationId === celebrationId);
    } else if(C.historicalEvents && Array.isArray(C.historicalEvents[key])) {
      events = C.historicalEvents[key];
    }

    function linkButton(url,label){
      if(!url || url==="#pending") return `<span class="event-link disabled">${label} · ${t("pending")}</span>`;
      return `<a class="event-link" href="${url}" target="_blank" rel="noopener">${label} →</a>`;
    }

    function multiLinks(items,label){
      if(!Array.isArray(items) || !items.length) return "";
      return items.map((url,i)=>linkButton(url, items.length>1 ? `${label} ${i+1}` : label)).join("");
    }

    const eventCards = events && events.length ? events.map(ev => `
      <article class="event-card">
        <div class="event-cover">
          ${visualPhotoCarousel(ev,`<div class="event-placeholder">${item.year}</div>`,ev.name||"")}
        </div>
        <div class="event-body">
          ${ev.sample ? `<span class="badge">${t("sample")}</span>` : ``}
          <h3>${escapeHtml(ev.name || t("event"))}</h3>
          <div class="event-meta">
            ${ev.date ? `<span>${escapeHtml(ev.date)}</span>` : ``}
            ${ev.time ? `<span>${escapeHtml(ev.time)}</span>` : ``}
            ${ev.place ? `<span>${escapeHtml(ev.place)}</span>` : ``}
          </div>
          <div class="event-links">
            ${linkButton(ev.photosUrl,t("eventPhotos"))}
            ${multiLinks(ev.documents,t("eventDocs"))}
            ${multiLinks(ev.videos,t("eventVideos"))}
          </div>
        </div>
      </article>
    `).join("") : `<p>${lang==="es"?"Todavía no hay eventos cargados.":"No events have been added yet."}</p>`;

    return `
      <main>
        <section class="page-hero"><div class="container">
          <div class="eyebrow">${item.year} · MBA 83-85</div>
          <h1>${item.title[lang]}</h1><p>${item.subtitle[lang]}</p>
        </div></section>
        <section class="section"><div class="container">
          <div class="section-head">
            <h2>${t("events")}</h2>
            <p>${lang==="es"
              ?"Cada celebración contiene varios eventos. Cada evento puede tener sus propias fotos, documentos y vídeos."
              :"Each celebration contains several events. Each event can have its own photos, documents and videos."}</p>
          </div>
          <div class="event-grid">${eventCards}</div>
        </div></section>
      </main>`;
  }

  function lunches(city){
    const cityName = city==="madrid" ? "Madrid" : "Barcelona";
    const note = city==="madrid" ? t("lunchNoteMadrid") : t("lunchNoteBarcelona");

    let items = null;
    if(remoteData && remoteData.lunches && Array.isArray(remoteData.lunches[city])){
      items = remoteData.lunches[city];
    } else {
      items = C.lunches[city].map(x => ({...x, sample:true}));
    }

    const cards = items.length ? items.map(x => {
      const href = x.url && x.url !== "#pending" ? x.url : "#pending";
      const label = x.title?.[lang] || x.title || (city==="madrid" ? (lang==="es"?"Comida de Madrid":"Madrid lunch") : (lang==="es"?"Comida de Barcelona":"Barcelona lunch"));
      return `
      <div class="lunch-card">
        <div class="lunch-art"><span>${x.date || ""}</span></div>
        <div class="body">
          ${x.sample ? `<span class="badge">${t("sample")}</span>` : ``}
          <h3>${label}</h3>
          ${href==="#pending"
            ? `<div class="card-cta">${t("photos")} · ${t("pending")}</div>`
            : `<a class="card-cta" href="${href}" target="_blank" rel="noopener">${t("photos")} →</a>`}
        </div>
      </div>`;
    }).join("") : `<p>${lang==="es"?"Todavía no hay comidas publicadas.":"No lunches have been published yet."}</p>`;

    return `
      <main>
        <section class="page-hero"><div class="container">
          <div class="eyebrow">${t("lunchArchive")}</div>
          <h1>${cityName}</h1><p>${note}</p>
        </div></section>
        <section class="section"><div class="container">
          <div class="note-box">${note}</div>
          <div class="lunch-grid">${cards}</div>
        </div></section>
      </main>`;
  }

  function moments(){
    let items = null;
    if(remoteData && Array.isArray(remoteData.moments)){
      items = remoteData.moments;
    } else {
      items = (C.otherMoments || []).map(x => ({...x, sample:true}));
    }

    const cards = items && items.length ? items.map(x => {
      const title = x.title?.[lang] || x.title || "";
      const href = x.photosUrl && x.photosUrl !== "#pending" ? x.photosUrl : "#pending";
      return `
        <article class="moment-card">
          <div class="moment-cover">
            ${visualPhotoCarousel(x,`<div class="moment-placeholder">MBA<br>83-85</div>`,title)}
          </div>
          <div class="moment-body">
            ${x.sample ? `<span class="badge">${t("sample")}</span>` : ``}
            <h3>${escapeHtml(title)}</h3>
            <div class="event-meta">
              ${x.date ? `<span>${escapeHtml(x.date)}</span>` : ``}
              ${x.place ? `<span>${escapeHtml(x.place)}</span>` : ``}
            </div>
            ${href==="#pending"
              ? `<span class="event-link disabled">${t("viewAlbum")} · ${t("pending")}</span>`
              : `<a class="event-link" href="${href}" target="_blank" rel="noopener">${t("viewAlbum")} →</a>`}
          </div>
        </article>`;
    }).join("") : `<p>${lang==="es"?"Todavía no hay otros momentos publicados.":"No other moments have been published yet."}</p>`;

    return `
      <main>
        <section class="page-hero"><div class="container">
          <div class="eyebrow">MBA 83-85</div>
          <h1>${t("moments")}</h1>
          <p>${t("momentsLead")}</p>
        </div></section>
        <section class="section"><div class="container">
          <div class="moments-grid">${cards}</div>
        </div></section>
      </main>`;
  }

  function memoriam(){
    let items = null;
    if(remoteData && Array.isArray(remoteData.memoriam)){
      items = remoteData.memoriam;
    } else {
      items = (C.memoriamSample || []).map(x => ({...x, sample:true}));
    }

    // Compatibility with the older one-photo model.
    items = (items || []).map(x => {
      let photos = Array.isArray(x.photos) ? x.photos : [];
      if(!photos.length && x.photoUrl){
        photos = [{id:`${x.id || "mem"}-legacy`,url:x.photoUrl,primary:true}];
      }
      return {...x, photos};
    });
    currentMemoriamItems = items;

    let cards = "";
    if(items.length){
      cards = items.map(x=>{
        const primary = x.photos.find(p=>p.primary) || x.photos[0] || null;
        const count = x.photos.length;
        return `
          <button class="mem-card mem-open" type="button" data-mem-id="${escapeHtml(x.id || "")}" aria-label="${escapeHtml(x.name || "")}">
            ${primary && primary.url
              ? `<img class="memoriam-photo" src="${primary.url}" alt="${escapeHtml(x.name || "")}" loading="lazy" onerror="this.outerHTML='<div class=&quot;silhouette&quot; aria-hidden=&quot;true&quot;></div>'">`
              : `<div class="silhouette" aria-hidden="true"></div>`}
            <strong>${escapeHtml(x.name || "")}</strong>
            <div class="mem-card-foot">
              ${x.sample ? `<span class="badge">${t("sample")}</span>` : ``}
              ${count>1 ? `<span class="photo-count">${count} ${t("photosCount")}</span>` : ``}
            </div>
          </button>`;
      }).join("");
    } else if(remoteData) {
      cards = `<p>${lang==="es"?"Todavía no hay compañeros publicados en este espacio.":"No classmates have been published in this space yet."}</p>`;
    }

    return `
      <main>
        <section class="page-hero"><div class="container">
          <div class="eyebrow">MBA 83-85</div><h1>In Memoriam</h1><p>${t("memoriamLead")}</p>
        </div></section>
        <section class="section soft"><div class="container"><div class="memoriam-grid">${cards}</div></div></section>
      </main>
      <div id="memModal" class="mem-modal" aria-hidden="true">
        <div class="mem-modal-backdrop" data-close-mem></div>
        <div class="mem-modal-dialog" role="dialog" aria-modal="true" aria-labelledby="memModalTitle">
          <button class="mem-modal-close" type="button" data-close-mem aria-label="${t("close")}">×</button>
          <h2 id="memModalTitle"></h2>
          <div id="memGallery" class="mem-gallery"></div>
        </div>
      </div>`;
  }

  function openMemoriamGallery(id){
    const item = currentMemoriamItems.find(x => String(x.id) === String(id));
    if(!item) return;
    const modal = $("#memModal");
    const title = $("#memModalTitle");
    const gallery = $("#memGallery");
    if(!modal || !title || !gallery) return;

    title.textContent = item.name || "";
    gallery.innerHTML = (item.photos || []).length
      ? item.photos.map((p,i)=> p.url
          ? `<figure><img src="${p.url}" alt="${escapeHtml(item.name || "")} ${i+1}" loading="lazy"><figcaption>${p.primary ? (lang==="es"?"Foto principal":"Main photo") : ""}</figcaption></figure>`
          : `<figure><div class="gallery-placeholder"><div class="silhouette" aria-hidden="true"></div></div><figcaption>${p.primary ? (lang==="es"?"Foto principal":"Main photo") : ""}</figcaption></figure>`
        ).join("")
      : `<p>${lang==="es"?"No hay fotografías disponibles.":"No photographs are available."}</p>`;

    modal.classList.add("open");
    modal.setAttribute("aria-hidden","false");
    document.body.classList.add("modal-open");
  }

  function closeMemoriamGallery(){
    const modal = $("#memModal");
    if(!modal) return;
    modal.classList.remove("open");
    modal.setAttribute("aria-hidden","true");
    document.body.classList.remove("modal-open");
  }

  function futureCard(key){
    const x=C.future[key], img=C.meta[x.imageKey];
    return `
      <a class="future-card" href="#future-${key}">
        <div class="future-image">
          <img src="${img}" alt="IESE ${x.city}" loading="lazy"
               onerror="this.style.display='none'; this.parentElement.style.background='linear-gradient(135deg,#d9d5d0,#aaa29b)'">
          <div class="future-caption"><small>IESE · ${x.city}</small><h3>${x.title[lang]}</h3></div>
        </div>
        <div class="future-body"><p>${x.text[lang]}</p><div class="card-cta">${t("explore")} →</div></div>
      </a>`;
  }

  function next(){
    return `
      <main>
        <section class="page-hero"><div class="container">
          <div class="eyebrow">NEXT</div><h1>${lang==="es"?"Próximamente":"Next"}</h1><p>${t("nextLead")}</p>
        </div></section>
        <section class="section"><div class="container"><div class="future-grid">
          ${futureCard("madrid2028")}${futureCard("barcelona2030")}
        </div></div></section>
      </main>`;
  }

  function futureDetail(key){
    const x=C.future[key], img=C.meta[x.imageKey];
    return `
      <main>
        <section class="page-hero"><div class="container">
          <div class="eyebrow">IESE · ${x.city}</div><h1>${x.title[lang]}</h1>
        </div></section>
        <section class="section"><div class="container future-detail">
          <div class="hero-photo"><img src="${img}" alt="IESE ${x.city}"
            onerror="this.style.display='none'; this.parentElement.style.background='linear-gradient(135deg,#d9d5d0,#aaa29b)'"></div>
          <div>
            <p style="font-size:20px;color:#555;margin-top:0">${x.text[lang]}</p>
            <div class="status-box">${t("futureRegistration")}</div>
            <div style="margin-top:22px"><a class="btn btn-secondary" href="#next">← ${lang==="es"?"Volver":"Back"}</a></div>
          </div>
        </div></section>
      </main>`;
  }

  function routeContent(route){
    if(route==="home") return home();
    if(route==="madrid2023") return historical("madrid2023");
    if(route==="anniversary2025") return historical("anniversary2025");
    if(route==="madrid") return lunches("madrid");
    if(route==="barcelona") return lunches("barcelona");
    if(route==="moments") return moments();
    if(route==="memoriam") return memoriam();
    if(route==="next") return next();
    if(route==="future-madrid2028") return futureDetail("madrid2028");
    if(route==="future-barcelona2030") return futureDetail("barcelona2030");
    return home();
  }

  function currentRoute(){
    return (location.hash || "#home").slice(1);
  }

  function render(){
    const route=currentRoute();
    document.documentElement.lang=lang;
    document.title = `${C.meta.name} · ${route==="home"?(lang==="es"?"Inicio":"Home"):route}`;
    document.getElementById("app").innerHTML = header()+routeContent(route)+footer();
    $$(".nav-link").forEach(a=>a.classList.toggle("active",a.dataset.route===route));
    bindUI();
    window.scrollTo(0,0);
  }


  function initCarousels(){
    $$(".photo-carousel").forEach(carousel=>{
      const track=carousel.querySelector(".carousel-track");
      const slides=[...carousel.querySelectorAll(".carousel-slide")];
      const dots=[...carousel.querySelectorAll(".carousel-dot")];
      if(!track || slides.length<2) return;

      let index=0;

      const goTo=(nextIndex,smooth=true)=>{
        index=Math.max(0,Math.min(slides.length-1,nextIndex));
        track.scrollTo({
          left:index*track.clientWidth,
          behavior:smooth?"smooth":"auto"
        });
        dots.forEach((d,i)=>d.classList.toggle("active",i===index));
      };

      const prev=carousel.querySelector(".carousel-arrow.prev");
      const next=carousel.querySelector(".carousel-arrow.next");
      if(prev) prev.addEventListener("click",()=>goTo(index-1));
      if(next) next.addEventListener("click",()=>goTo(index+1));

      dots.forEach((dot,i)=>dot.addEventListener("click",()=>goTo(i)));

      let timer=null;
      track.addEventListener("scroll",()=>{
        clearTimeout(timer);
        timer=setTimeout(()=>{
          const width=track.clientWidth||1;
          index=Math.round(track.scrollLeft/width);
          dots.forEach((d,i)=>d.classList.toggle("active",i===index));
        },70);
      },{passive:true});

      window.addEventListener("resize",()=>goTo(index,false));
    });
  }

  function bindUI(){
    initCarousels();
    $$("[data-lang]").forEach(btn=>btn.addEventListener("click",()=>{
      lang=btn.dataset.lang;localStorage.setItem("mba83-lang",lang);render();
    }));
    const menu=$("#menuBtn"), panel=$("#mobilePanel");
    if(menu) menu.addEventListener("click",()=>panel.classList.toggle("open"));
    $$("#mobilePanel a").forEach(a=>a.addEventListener("click",()=>panel.classList.remove("open")));
    $$(".mem-open").forEach(btn=>btn.addEventListener("click",()=>openMemoriamGallery(btn.dataset.memId)));
    $$("[data-close-mem]").forEach(el=>el.addEventListener("click",closeMemoriamGallery));
    document.onkeydown = e=>{ if(e.key==="Escape") closeMemoriamGallery(); };
    const install=$("#installBtn");
    if(install){
      updateInstallButton();
      // Bind independently of when Chrome decides the app is installable.
      install.addEventListener("click",async()=>{
        const prompt = deferredPrompt;
        if(!prompt) return;
        deferredPrompt=null;
        updateInstallButton();
        try {
          await prompt.prompt();
          await prompt.userChoice;
        } catch(error) {
          console.warn("PWA installation prompt failed:", error);
        }
      });
    }
  }

  function updateInstallButton(){
    const button=$("#installBtn");
    if(button) button.style.display=deferredPrompt && !window.matchMedia("(display-mode: standalone)").matches ? "inline-flex" : "none";
  }

  window.addEventListener("beforeinstallprompt",(e)=>{
    e.preventDefault();
    deferredPrompt=e;
    updateInstallButton();
  });

  window.addEventListener("appinstalled",()=>{
    deferredPrompt=null;
    updateInstallButton();
  });

  // Registration must not wait for the external content endpoint.
  if("serviceWorker" in navigator && window.isSecureContext){
    navigator.serviceWorker.register("./sw.js", {updateViaCache:"none"}).catch(error=>{
      console.warn("PWA service worker registration failed:", error);
    });
  }

  if(/iphone|ipad|ipod/i.test(navigator.userAgent) && !window.matchMedia("(display-mode: standalone)").matches){
    window.addEventListener("load",()=>setTimeout(()=>{
      const toast=$("#installToast"); if(toast) toast.classList.add("show");
    },1400));
  }

  window.addEventListener("hashchange",render);
  window.addEventListener("DOMContentLoaded",async()=>{
    remoteData = await loadPublicData();
    render();
  });
})();
