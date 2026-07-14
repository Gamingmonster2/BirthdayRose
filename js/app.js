// js/app.js
// Handles UI, State, and localStorage interactions.

// DOM Elements
const pixabayGrid = document.getElementById('pixabayGrid');
const botanicalGrid = document.getElementById('botanicalGrid');
const searchInput = document.getElementById('searchInput');
const placeholder = document.getElementById('placeholder-text');
const gallerySection = document.getElementById('gallerySection');
const dataSection = document.getElementById('dataSection');
const loadMoreBtn = document.getElementById('loadMoreBtn');
const scrollLoader = document.getElementById('scrollLoader');

// API Modal Elements
const apiModal = document.getElementById('apiModal');
const pixabayKeyInput = document.getElementById('pixabayKeyInput');
const perenualKeyInput = document.getElementById('perenualKeyInput');
const saveKeysBtn = document.getElementById('saveKeysBtn');

// State Management
let currentQuery = '';
let currentPage = 1;
let autoScrollCount = 0;
let isFetching = false;
const RESULTS_PER_PAGE = 10;
const MAX_AUTO_SCROLLS = 2;

// --- API MODAL & CREDENTIALS LOGIC ---
function showApiModal() {
    pixabayKeyInput.value = localStorage.getItem('br_pixabay_key') || '';
    perenualKeyInput.value = localStorage.getItem('br_perenual_key') || '';
    apiModal.style.display = 'flex';
}

function hideApiModal() {
    apiModal.style.display = 'none';
}

saveKeysBtn.addEventListener('click', function() {
    const pixKey = pixabayKeyInput.value.trim();
    const perKey = perenualKeyInput.value.trim();
    
    if (pixKey && perKey) {
        localStorage.setItem('br_pixabay_key', pixKey);
        localStorage.setItem('br_perenual_key', perKey);
        hideApiModal();
        
        // Initialize or Re-initialize search after keys are saved
        if (currentQuery) {
            startNewSearch(currentQuery);
        } else {
            startNewSearch('rose');
        }
    } else {
        alert("Please enter both API keys to continue.");
    }
});

// --- MAIN SEARCH FUNCTION ---
async function startNewSearch(query = 'rose') {
    query = query.toLowerCase().trim();
    if (!query) return;

    // Check if keys exist before proceeding
    if (!ApiManager.hasKeys()) {
        showApiModal();
        return;
    }

    // Update Input
    if (searchInput.value.toLowerCase() !== query) {
        searchInput.value = query;
    }

    // Reset State
    currentQuery = query;
    currentPage = 1;
    autoScrollCount = 0;
    isFetching = false;

    // Clear UI
    pixabayGrid.innerHTML = '';
    botanicalGrid.innerHTML = '';
    loadMoreBtn.style.display = 'none';
    gallerySection.style.display = 'none';
    dataSection.style.display = 'none';
    placeholder.style.display = 'block';
    placeholder.innerText = `Scanning Global Database for "${query}"...`;

    // 1. Fetch Botanical Data
    fetchAndRenderBotanical(query);

    // 2. Fetch First Page of Images
    await fetchAndRenderImages(1);
    
    placeholder.style.display = 'none';
    gallerySection.style.display = 'block';

    // Re-attach scroll listener
    window.addEventListener('scroll', handleScroll);
}

// --- IMAGE FETCHING & RENDERING ---
async function fetchAndRenderImages(page) {
    if (isFetching) return;
    isFetching = true;
    scrollLoader.style.display = 'block';

    const cacheKey = `br_pix_${currentQuery}_p${page}`;
    let images = [];

    // Cache Check
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
        images = JSON.parse(cached);
    } else {
        try {
            images = await ApiManager.fetchPixabay(currentQuery, page, RESULTS_PER_PAGE);
            localStorage.setItem(cacheKey, JSON.stringify(images));
        } catch (e) {
            console.error("Image Fetch Error", e);
            placeholder.style.display = 'block';
            placeholder.innerText = "Error fetching images. Check your API Key.";
        }
    }

    // Render
    if (images && images.length > 0) {
        images.forEach((img, index) => {
            const div = document.createElement('div');
            div.className = 'pix-item';
            div.style.animationDelay = `${index * 0.05}s`;
            div.innerHTML = `
                <img src="${img.webformatURL}" alt="${img.tags}" loading="lazy">
                <div class="pix-credit">
                    <span style="font-size:10px; opacity:0.8">PHOTOGRAPHER</span><br>
                    ${img.user}
                </div>
            `;
            pixabayGrid.appendChild(div);
        });
    } else if (page === 1) {
        placeholder.style.display = 'block';
        placeholder.innerText = "No visual results found.";
    }

    // Cleanup
    isFetching = false;
    scrollLoader.style.display = 'none';
}

// --- SCROLL & PAGINATION LOGIC ---
function handleScroll() {
    if (loadMoreBtn.style.display === 'block') return;

    const { scrollTop, scrollHeight, clientHeight } = document.documentElement;
    
    if (scrollTop + clientHeight >= scrollHeight - 300) {
        if (!isFetching) {
            if (autoScrollCount < MAX_AUTO_SCROLLS) {
                autoScrollCount++;
                currentPage++;
                fetchAndRenderImages(currentPage);
            } else {
                loadMoreBtn.style.display = 'inline-block';
                window.removeEventListener('scroll', handleScroll);
            }
        }
    }
}

function manualLoadMore() {
    currentPage++;
    loadMoreBtn.style.display = 'none';
    fetchAndRenderImages(currentPage).then(() => {
        loadMoreBtn.style.display = 'inline-block';
    });
}

// --- BOTANICAL DATA LOGIC ---
async function fetchAndRenderBotanical(query) {
    const cacheKey = `br_bot_${query}`;
    const cached = localStorage.getItem(cacheKey);
    
    let items = [];
    if (cached) {
        items = JSON.parse(cached);
    } else {
        try {
            items = await ApiManager.fetchBotanical(query);
            localStorage.setItem(cacheKey, JSON.stringify(items));
        } catch (e) {
            console.error("Botanical API Error", e);
            return;
        }
    }

    if (items && items.length > 0) {
        dataSection.style.display = 'block';
        items.forEach((flower, index) => {
            const sciName = flower.scientific_name ? flower.scientific_name[0] : 'Unknown Species';
            const cycle = flower.cycle || 'Unknown';
            const watering = flower.watering || 'Average';
            const sunlight = Array.isArray(flower.sunlight) ? flower.sunlight.join(', ') : (flower.sunlight || 'Sun');

            const card = document.createElement('div');
            card.className = 'flower-card';
            card.style.animationDelay = `${index * 0.1}s`;
            
            card.innerHTML = `
                <div class="flower-content">
                    <h3>${flower.common_name}</h3>
                    <span class="sci-name">${sciName}</span>
                    
                    <div class="data-point">
                        <span>Category</span>
                        <b>${cycle}</b>
                    </div>
                    <div class="data-point">
                        <span>Watering Care</span>
                        <b>${watering}</b>
                    </div>
                    <div class="data-point">
                        <span>Sunlight</span>
                        <b>${sunlight}</b>
                    </div>
                </div>
            `;
            botanicalGrid.appendChild(card);
        });
    }
}

// --- EVENT LISTENERS ---
searchInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        const val = searchInput.value.trim();
        if(val) startNewSearch(val);
    }
});

// Expose functions to global scope for HTML inline events
window.startNewSearch = startNewSearch;
window.manualLoadMore = manualLoadMore;
window.showApiModal = showApiModal;

// --- INITIALIZATION ---
window.addEventListener('load', () => {
    // Hide Intro Overlay
    setTimeout(() => {
        const overlay = document.getElementById('intro-overlay');
        if (overlay) {
            overlay.style.opacity = '0';
            overlay.style.visibility = 'hidden';
            setTimeout(() => { overlay.style.display = 'none'; }, 800);
        }
    }, 3000);

    // Start initial search or prompt for API keys
    if (ApiManager.hasKeys()) {
        startNewSearch('rose');
    } else {
        showApiModal();
    }
});
