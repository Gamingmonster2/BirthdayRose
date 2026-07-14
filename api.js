// api.js - Manages storage, Pixabay API, and free Wikipedia integration

const ApiManager = {
    // Get Pixabay key from local storage
    getPixabayKey() {
        return localStorage.getItem('pixabay_api_key') || '';
    },

    // Set Pixabay key into local storage
    setPixabayKey(pixabayKey) {
        localStorage.setItem('pixabay_api_key', pixabayKey.trim());
    },

    // Check if Pixabay key is configured
    hasKeys() {
        return this.getPixabayKey() !== '';
    },

    // Fetch images from Pixabay (Requires User Key)
    async fetchImages(query, page = 1) {
        const key = this.getPixabayKey();
        if (!key) {
            throw new Error('Pixabay API Key is missing.');
        }

        const url = `https://pixabay.com/api/?key=${encodeURIComponent(key)}&q=${encodeURIComponent(query)}&image_type=photo&per_page=12&page=${page}&safesearch=true`;
        
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error('Failed to fetch images from Pixabay.');
        }
        return await response.json();
    },

    // Fetch plant data from FREE Wikipedia API (No Key Required!)
    async fetchWikipediaData(query) {
        // نستخدم واجهة البحث وجلب الخلاصات من ويكيبيديا العربية والإنجليزية لضمان نتائج ممتازة
        const url = `https://en.wikipedia.org/w/api.php?action=query&format=json&origin=*&prop=extracts|pageimages|info&exintro=1&explaintext=1&generator=search&gsrsearch=${encodeURIComponent(query + ' plant')}&gsrlimit=3&piprop=thumbnail&pithumbsize=400&inprop=url`;
        
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error('Failed to fetch data from Wikipedia.');
        }
        return await response.json();
    }
};
