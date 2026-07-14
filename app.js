// app.js - UI controller and state manager

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
const botanicalKeyInput = document.getElementById('botanical-key-input');
const gallerySkeleton = document.getElementById('gallery-skeleton');
const profileSkeleton = document.getElementById('profile-skeleton');
const navApiBtnText = document.getElementById('nav-api-btn-text');

// --- MODAL ACTIONS ---
function showApiModal() {
    pixabayKeyInput.value = ApiManager.getPixabayKey();
    botanicalKeyInput.value = ApiManager.getBotanicalKey();
    apiModal.classList.remove('hidden');
    setTimeout(() => {
        apiModal.classList.remove('opacity-0');
    }, 10);
}

function hideApiModal() {
    apiModal.classList.add('opacity-0');
    setTimeout(() => {
        apiModal.classList.add('hidden');
    }, 3000);
}

function saveApiKeys() {
    const pixKey = pixabayKeyInput.value;
    const botKey = botanicalKeyInput.value;

    ApiManager.setKeys(pixKey, botKey);
    updateApiStatusUI();
    hideApiModal();

    // Re-trigger search with saved keys
    if (ApiManager.hasKeys()) {
        startNewSearch(currentQuery);
    }
}

function updateApiStatusUI() {
    if (ApiManager.hasKeys()) {
        navApiBtnText.textContent = "API Keys Valid";
        document.documentElement.style.setProperty('--api-status-icon', '"\\f00c"'); // FontAwesome Checkmark
    } else {
        navApiBtnText.textContent = "Configure API Keys";
        document.documentElement.style.setProperty('--api-status-icon', '"\\f084"'); // FontAwesome Key
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

    if (!ApiManager.hasKeys()) {
        showApiModal();
        return;
    }

    showLoaders(true);

    try {
        await Promise.all([
            loadImages(query, currentGalleryPage, true),
            loadBotanicalProfile(query)
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
        galleryGrid.innerHTML = `<p class="text-red-500 text-xs">Error loading visuals. Check console.</p>`;
    }
}

async function loadBotanicalProfile(query) {
    try {
        const data = await ApiManager.fetchBotanicalData(query);
        botanicalGrid.innerHTML = '';

        if (data.data && data.data.length > 0) {
            renderProfiles(data.data);
            dataCount.textContent = `${data.data.length} Profiles Found`;
        } else {
            botanicalGrid.innerHTML = `<p class="text-gray-500 text-sm">No botanical profiles found for "${query}".</p>`;
            dataCount.textContent = `0 Profiles Found`;
        }
    } catch (err) {
        console.error(err);
        botanicalGrid.innerHTML = `<p class="text-red-500 text-xs">Error loading profiles. Check console.</p>`;
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

function renderProfiles(plants) {
    plants.slice(0, 5).forEach(plant => {
        const card = document.createElement('div');
        card.className = "bg-white border border-[#e8dcd5] rounded-2xl p-6 shadow-sm hover:shadow-md transition-all duration-300";
        
        const cycle = plant.cycle || 'Unknown';
        const watering = plant.watering || 'Unknown';
        const sunlight = Array.isArray(plant.sunlight) ? plant.sunlight.join(', ') : (plant.sunlight || 'Unknown');

        card.innerHTML = `
            <h4 class="serif-font text-xl font-bold text-[#1e1918] mb-1 capitalize">${plant.common_name || 'Unnamed Specimen'}</h4>
            <p class="text-xs italic text-[#8c6254] mb-4">${plant.scientific_name ? plant.scientific_name[0] : 'N/A'}</p>
            <div class="grid grid-cols-3 gap-2 border-t border-[#faf8f5] pt-4 text-center">
                <div class="p-2 bg-[#faf8f5] rounded-xl">
                    <span class="block text-[9px] uppercase tracking-wider text-gray-400 mb-1">Growth Cycle</span>
                    <b class="text-xs text-[#5c4e4a] capitalize">${cycle}</b>
                </div>
                <div class="p-2 bg-[#faf8f5] rounded-xl">
                    <span class="block text-[9px] uppercase tracking-wider text-gray-400 mb-1">Watering</span>
                    <b class="text-xs text-[#5c4e4a] capitalize">${watering}</b>
                </div>
                <div class="p-2 bg-[#faf8f5] rounded-xl">
                    <span class="block text-[9px] uppercase tracking-wider text-gray-400 mb-1">Sunlight</span>
                    <b class="text-xs text-[#5c4e4a] capitalize">${sunlight}</b>
                </div>
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

// Expose functions globally for UI actions
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

    // Initial load setup
    updateApiStatusUI();
    if (ApiManager.hasKeys()) {
        startNewSearch('rose');
    } else {
        setTimeout(() => {
            showApiModal();
        }, 3500);
    }
});
