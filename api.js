// js/api.js
// Handles all external API requests dynamically using Client-Side API Keys.

const ApiManager = {
    getKeys: function() {
        return {
            pixabay: localStorage.getItem('br_pixabay_key'),
            botanical: localStorage.getItem('br_perenual_key')
        };
    },

    hasKeys: function() {
        const keys = this.getKeys();
        return keys.pixabay && keys.botanical;
    },

    fetchPixabay: async function(query, page, perPage) {
        const keys = this.getKeys();
        if (!keys.pixabay) {
            showApiModal();
            throw new Error("Missing Pixabay API Key");
        }
        
        const url = `https://pixabay.com/api/?key=${keys.pixabay}&q=${encodeURIComponent(query)}&image_type=photo&per_page=${perPage}&page=${page}&safesearch=true`;
        const res = await fetch(url);
        
        if (!res.ok) throw new Error("Pixabay API Error");
        const data = await res.json();
        return data.hits || [];
    },

    fetchBotanical: async function(query) {
        const keys = this.getKeys();
        if (!keys.botanical) {
            showApiModal();
            throw new Error("Missing Botanical API Key");
        }

        const url = `https://perenual.com/api/species-list?key=${keys.botanical}&q=${query}&page=1&per_page=3`;
        const res = await fetch(url);
        
        if (!res.ok) throw new Error("Botanical API Error");
        const data = await res.json();
        return data.data || [];
    }
};
