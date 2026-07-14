// api.js - Manages storage and fetching of Pixabay and Perenual APIs

const ApiManager = {
    // Get keys from local storage
    getPixabayKey() {
        return localStorage.getItem('pixabay_api_key') || '';
    },

    getBotanicalKey() {
        return localStorage.getItem('botanical_api_key') || '';
    },

    // Set keys into local storage
    setKeys(pixabayKey, botanicalKey) {
        localStorage.setItem('pixabay_api_key', pixabayKey.trim());
        localStorage.setItem('botanical_api_key', botanicalKey.trim());
    },

    // Check if keys are available
    hasKeys() {
        return this.getPixabayKey() !== '' && this.getBotanicalKey() !== '';
    },

    // Fetch images from Pixabay
    async fetchImages(query, page = 1) {
        const key = this.getPixabayKey();
        if (!key) {
            throw new Error('Pixabay API Key is missing. Please configure it in settings.');
        }

        const url = `https://pixabay.com/api/?key=${encodeURIComponent(key)}&q=${encodeURIComponent(query)}&image_type=photo&per_page=12&page=${page}&safesearch=true`;
        
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error('Failed to fetch images from Pixabay. Please check your API Key.');
        }
        return await response.json();
    },

    // Fetch plant data from Perenual (Botanical API)
    async fetchBotanicalData(query) {
        const key = this.getBotanicalKey();
        if (!key) {
            throw new Error('Plant Data API Key is missing. Please configure it in settings.');
        }

        const url = `https://perenual.com/api/species-list?key=${encodeURIComponent(key)}&q=${encodeURIComponent(query)}`;
        
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error('Failed to fetch botanical data. Please check your API Key.');
        }
        return await response.json();
    }
};
