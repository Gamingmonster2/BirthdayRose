// app.js - UI controller, State manager and Wikipedia Renderer

// Global State
let currentQuery = 'rose';
let currentGalleryPage = 1;
let totalLoadedImages = 0;

// DOM Elements
const searchInput = document.getElementById('search-input');
const galleryGrid = document.getElementById('gallery-grid');
const botanicalGrid = document.getElementById('botanical-grid');
const galleryCount = document.getElementById('gallery-count');
const dataCount = document.getElementById('data-count');
const loadMoreBtn = document.getElementById('load-more-btn');
const apiModal = document.getElementById('api-modal');
const pixabayKeyInput = document.getElementById('pixabay-key-input');
const gallerySkeleton = document.getElementById('gallery-skeleton');
const profileSkeleton = document.getElementById('profile-skeleton');
const navApiBtnText = document.getElementById('nav-api-btn-text');

// --- MODAL ACTIONS ---
function showApiModal() {
    pixabayKeyInput.value = ApiManager.getPixabayKey();
    apiModal.classList.remove('hidden');
    setTimeout(() => {
        apiModal.classList.remove('opacity-0');
    }, 10);
}

function hideApiModal() {
    apiModal.classList.add('opacity-0');
    setTimeout(() => {
        apiModal.classList.add('hidden');
    }, 300);
}

function saveApiKeys() {
    const pixKey = pixabayKeyInput.value;
    ApiManager.setPixabayKey(pixKey);
    updateApiStatusUI();
    hideApiModal();

    if (ApiManager.hasKeys()) {
        startNewSearch(currentQuery);
    }
}

function updateApiStatusUI() {
    if (ApiManager.hasKeys()) {
        navApiBtnText.textContent = "Pixabay Connected";
        document.documentElement.style.setProperty('--api-status-icon', '"\\f00c"'); // Checkmark
    } else {
        navApiBtnText.textContent = "Configure Pixabay Key";
        document.documentElement.style.setProperty('--api-status-icon', '"\\f084"'); // Key
    }
}

// --- SEARCH & DATA HANDLING ---
async function startNewSearch(query) {
    if (!query) return;
    currentQuery = query;
    currentGalleryPage = 1;
    totalLoadedImages = 0;

    galleryGrid.innerHTML = '';
    botanicalGrid.innerHTML = '';
    loadMoreBtn.classList.add('hidden');

    // ويكيبيديا مجانية وتعمل دائماً، لكن الصور تحتاج لمفتاح بيكساباي
    if (!ApiManager.hasKeys()) {
        showApiModal();
        // نقوم بجلب معلومات ويكيبيديا فوراً حتى وإن لم يمتلك الزائر مفتاح بيكساباي للصور!
        showLoaders(true);
        try {
            await loadWikipediaProfile(query);
        } catch(e) {}
        showLoaders(false);
        return;
    }

    showLoaders(true);

    try {
        await Promise.all([
            loadImages(query, currentGalleryPage, true),
            loadWikipediaProfile(query)
        ]);
    } catch (error) {
        console.error("Search failed:", error);
    } finally {
        showLoaders(false);
    }
}

function showLoaders(show) {
    if (show) {
        gallerySkeleton.classList.remove('hidden');
        profileSkeleton.classList.remove('hidden');
    } else {
        gallerySkeleton.classList.add('hidden');
        profileSkeleton.classList.add('hidden');
    }
}

async function loadImages(query, page, reset = false) {
    try {
        const data = await ApiManager.fetchImages(query, page);
        if (reset) galleryGrid.innerHTML = '';

        if (data.hits && data.hits.length > 0) {
            renderImages(data.hits);
            totalLoadedImages += data.hits.length;
            galleryCount.textContent = `${totalLoadedImages} Images Found`;
            
            if (data.totalHits > totalLoadedImages) {
                loadMoreBtn.classList.remove('hidden');
            } else {
                loadMoreBtn.classList.add('hidden');
            }
        } else {
            if (reset) {
                galleryGrid.innerHTML = `<p class="text-gray-500 text-sm">No visuals found for "${query}".</p>`;
                galleryCount.textContent = `0 Images Found`;
            }
            loadMoreBtn.classList.add('hidden');
        }
    } catch (err) {
        console.error(err);
        galleryGrid.innerHTML = `<p class="text-red-500 text-xs">Error loading visuals. Check your Pixabay key.</p>`;
    }
}

async function loadWikipediaProfile(query) {
    try {
        const data = await ApiManager.fetchWikipediaData(query);
        botanicalGrid.innerHTML = '';

        if (data.query && data.query.pages) {
            const pages = Object.values(data.query.pages);
            renderWikipediaProfiles(pages);
            dataCount.textContent = `${pages.length} Articles Found`;
        } else {
            botanicalGrid.innerHTML = `<p class="text-gray-500 text-sm">No encyclopedic entries found for "${query}".</p>`;
            dataCount.textContent = `0 Articles Found`;
        }
    } catch (err) {
        console.error(err);
        botanicalGrid.innerHTML = `<p class="text-red-500 text-xs">Error loading botanical details from Wikipedia.</p>`;
    }
}

async function manualLoadMore() {
    currentGalleryPage += 1;
    loadMoreBtn.classList.add('hidden');
    gallerySkeleton.classList.remove('hidden');
    await loadImages(currentQuery, currentGalleryPage, false);
    gallerySkeleton.classList.add('hidden');
}

// --- RENDERING TEMPLATES ---
function renderImages(hits) {
    hits.forEach(hit => {
        const card = document.createElement('div');
        card.className = "break-inside-avoid mb-4 group relative overflow-hidden rounded-2xl bg-white border border-[#e8dcd5] shadow-sm hover:shadow-md transition-all duration-300";
        card.innerHTML = `
            <img src="${hit.webformatURL}" alt="${hit.tags}" class="w-full h-auto object-cover transform group-hover:scale-105 transition-transform duration-500">
            <div class="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-4">
                <p class="text-white text-xs font-light capitalize tracking-wide"><i class="fa-solid fa-tag mr-1.5"></i>${hit.tags}</p>
            </div>
        `;
        galleryGrid.appendChild(card);
    });
}

function renderWikipediaProfiles(pages) {
    pages.forEach(page => {
        const card = document.createElement('div');
        card.className = "bg-white border border-[#e8dcd5] rounded-2xl p-6 shadow-sm hover:shadow-md transition-all duration-300";
        
        // جلب النبذة واختصارها إذا كانت طويلة جداً
        const snippet = page.extract ? (page.extract.length > 220 ? page.extract.substring(0, 220) + '...' : page.extract) : 'No description available.';
        const articleUrl = page.fullurl || `https://en.wikipedia.org/?curid=${page.pageid}`;

        card.innerHTML = `
            <h4 class="serif-font text-xl font-bold text-[#1e1918] mb-1 capitalize">${page.title}</h4>
            <p class="text-xs italic text-[#8c6254] mb-3">Wikipedia Encyclopedia Entry</p>
            <p class="text-xs text-[#5c4e4a] leading-relaxed mb-4">${snippet}</p>
            <div class="border-t border-[#faf8f5] pt-3 flex justify-between items-center">
                <span class="text-[10px] text-gray-400 font-medium uppercase tracking-wider"><i class="fa-solid fa-book-open mr-1"></i> Wikipedia</span>
                <a href="${articleUrl}" target="_blank" class="text-xs font-semibold text-[#8c6254] hover:text-[#1e1918] transition-colors flex items-center gap-1">
                    Read Full Article <i class="fa-solid fa-arrow-up-right-from-square text-[9px]"></i>
                </a>
            </div>
        `;
        botanicalGrid.appendChild(card);
    });
}

// --- EVENT LISTENERS ---
searchInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        const val = searchInput.value.trim();
        if (val) startNewSearch(val);
    }
});

// Expose functions globally
window.startNewSearch = startNewSearch;
window.manualLoadMore = manualLoadMore;
window.showApiModal = showApiModal;
window.hideApiModal = hideApiModal;
window.saveApiKeys = saveApiKeys;

// --- INITIALIZATION ---
window.addEventListener('load', () => {
    // Dismiss Overlay
    setTimeout(() => {
        const overlay = document.getElementById('intro-overlay');
        if (overlay) {
            overlay.style.opacity = '0';
            overlay.style.visibility = 'hidden';
            setTimeout(() => { overlay.style.display = 'none'; }, 800);
        }
    }, 3000);

    updateApiStatusUI();
    // نبدأ بالبحث دائماً، إذا لم يتوفر مفتاح بيكساباي ستظهر معلومات ويكيبيديا مع منبثق لطلب المفتاح للصور
    startNewSearch('rose');
});
