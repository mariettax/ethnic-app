// Import the Express library
const express = require('express');
// Import the Node.js path module for handling file paths
const path = require('path');
// Import the Node.js file system module for reading files
const fs = require('fs');

// Create an instance of the Express application
const app = express();
// Define the port the server will listen on
const PORT = process.env.PORT || 3000;

// --- Middleware ---
// Serve static files (like index.html, CSS, client-side JS) from the current directory
// This makes index.html accessible when you visit http://localhost:3000/
app.use(express.static(__dirname));

// --- API Endpoint for Stores ---
// Define a GET endpoint at '/api/stores'
app.get('/api/stores', (req, res) => {
    // Read the stores data from the stores.json file
    fs.readFile(path.join(__dirname, 'stores.json'), 'utf8', (err, data) => {
        if (err) {
            // If there's an error reading the file, log it and send a 500 error response
            console.error('Error reading stores.json:', err);
            return res.status(500).json({ error: 'Failed to load store data.' });
        }

        let stores = [];
        try {
            // Parse the JSON data into a JavaScript array of store objects
            stores = JSON.parse(data);
        } catch (parseErr) {
            // If there's an error parsing the JSON, log it and send a 500 error response
            console.error('Error parsing stores.json:', parseErr);
            return res.status(500).json({ error: 'Invalid store data format.' });
        }

        // --- Filtering Logic ---
        // Get filter parameters from the request query string (e.g., /api/stores?culture=African,Asian&dietary=Halal)
        const cultureFilters = req.query.culture ? req.query.culture.split(',').map(f => f.trim().toLowerCase()) : [];
        const dietaryFilters = req.query.dietary ? req.query.dietary.split(',').map(f => f.trim().toLowerCase()) : [];
        const productFilters = req.query.product ? req.query.product.split(',').map(f => f.trim().toLowerCase()) : [];
        const searchTerm = req.query.search ? req.query.search.toLowerCase() : '';

        // Filter the stores based on the active filters and search term
        const filteredStores = stores.filter(store => {
            const storeTagsLower = store.tags.map(tag => tag.toLowerCase());
            const storeNameLower = store.name.toLowerCase();
            const storeAddressLower = store.address.toLowerCase();
            const storeDescriptionLower = store.description ? store.description.toLowerCase() : '';

            // Check if all selected culture filters are present in the store's tags
            const matchesCulture = cultureFilters.length === 0 || cultureFilters.every(filter => storeTagsLower.includes(filter));
            // Check if all selected dietary filters are present in the store's tags
            const matchesDietary = dietaryFilters.length === 0 || dietaryFilters.every(filter => storeTagsLower.includes(filter));
            // Check if all selected product filters are present in the store's tags
            const matchesProduct = productFilters.length === 0 || productFilters.every(filter => storeTagsLower.includes(filter));

            // Check if the search term is present in name, address, description, or tags
            const matchesSearch = searchTerm === '' ||
                                  storeNameLower.includes(searchTerm) ||
                                  storeAddressLower.includes(searchTerm) ||
                                  storeDescriptionLower.includes(searchTerm) ||
                                  storeTagsLower.some(tag => tag.includes(searchTerm));

            // A store matches if it satisfies all active filter criteria AND the search term
            return matchesCulture && matchesDietary && matchesProduct && matchesSearch;
        });

        // Send the filtered stores as a JSON response
        res.json(filteredStores);
    });
});

// --- Start the Server ---
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
