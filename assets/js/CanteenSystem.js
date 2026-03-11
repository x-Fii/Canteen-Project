/**
 * CanteenManager Class
 * 
 * ES6 Class to handle all API fetching and UI rendering for the Canteen System
 * Compatible with Chromium 87 - No optional chaining, nullish coalescing, or private class fields
 */
class CanteenManager {
    constructor() {
        // API endpoints
        this.menuApiUrl = 'api/menu.php';
        this.authApiUrl = 'api/auth.php';
        
        // DOM elements
        this.menuContainer = document.getElementById('menu-container');
        this.levelFilters = document.querySelectorAll('.level-filter');
        this.tvModeToggle = document.getElementById('tv-mode-toggle');
        
        // Current state
        this.currentLevel = 1; // Default level
        this.isTvMode = false;
        
        // Initialize the system
        this.init();
    }
    
    /**
     * Initialize the system
     */
    init() {
        // Check if TV mode is enabled via URL parameter
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.get('view') === 'tv') {
            this.isTvMode = true;
            document.body.classList.add('tv-layout');
            if (this.tvModeToggle) {
                this.tvModeToggle.checked = true;
            }
        }
        
        // Add event listeners for level filters
        if (this.levelFilters) {
            var self = this; // Store reference to this for use in event handlers
            this.levelFilters.forEach(function(filter) {
                filter.addEventListener('click', function(e) {
                    var level = parseInt(e.target.dataset.level);
                    self.filterByLevel(level);
                    
                    // Update active class
                    self.levelFilters.forEach(function(f) {
                        f.classList.remove('active');
                    });
                    e.target.classList.add('active');
                });
            });
        }
        
        // Add event listener for TV mode toggle
        if (this.tvModeToggle) {
            var self = this; // Store reference to this for use in event handlers
            this.tvModeToggle.addEventListener('change', function(e) {
                self.toggleTvMode(e.target.checked);
            });
        }
        
        // Load menu items for default level
        this.loadMenuItems(this.currentLevel);
    }
    
    /**
     * Load menu items by level
     * 
     * @param {number} level - Canteen level
     */
    loadMenuItems(level) {
        var self = this; // Store reference to this for use in callbacks
        
        fetch(this.menuApiUrl + '?level=' + level)
            .then(function(response) {
                return response.json();
            })
            .then(function(data) {
                if (data.message) {
                    // Error response
                    self.showError(data.message);
                } else {
                    // Success response
                    self.renderMenuItems(data);
                }
            })
            .catch(function(error) {
                self.showError('An error occurred while loading menu items');
                console.error(error);
            });
    }
    
    /**
     * Render menu items in the UI
     * 
     * @param {Array} items - Menu items to render
     */
    renderMenuItems(items) {
        if (!this.menuContainer) return;
        
        // Clear current menu items
        this.menuContainer.innerHTML = '';
        
        // Group items by category
        var categories = {};
        items.forEach(function(item) {
            if (!categories[item.category]) {
                categories[item.category] = [];
            }
            categories[item.category].push(item);
        });
        
        // Create HTML for each category
        for (var category in categories) {
            if (categories.hasOwnProperty(category)) {
                var categoryItems = categories[category];
                
                // Create category section
                var categorySection = document.createElement('div');
                categorySection.className = 'category-section';
                
                // Create category header
                var categoryHeader = document.createElement('h2');
                categoryHeader.className = 'category-header';
                categoryHeader.textContent = category;
                categorySection.appendChild(categoryHeader);
                
                // Create items container
                var itemsContainer = document.createElement('div');
                itemsContainer.className = 'items-container';
                
                // Add each item
                var self = this; // Store reference to this for use in forEach
                categoryItems.forEach(function(item) {
                    var itemElement = document.createElement('div');
                    itemElement.className = 'menu-item';
                    
                    var description = '';
                    if (item.description) {
                        description = '<p class="item-description">' + item.description + '</p>';
                    }
                    
                    itemElement.innerHTML = 
                        '<h3 class="item-name">' + item.name + '</h3>' +
                        description +
                        '<p class="item-price">$' + parseFloat(item.price).toFixed(2) + '</p>';
                    
                    itemsContainer.appendChild(itemElement);
                });
                
                categorySection.appendChild(itemsContainer);
                this.menuContainer.appendChild(categorySection);
            }
        }
    }
    
    /**
     * Filter menu items by level
     * 
     * @param {number} level - Canteen level
     */
    filterByLevel(level) {
        this.currentLevel = level;
        this.loadMenuItems(level);
    }
    
    /**
     * Toggle TV mode
     * 
     * @param {boolean} enabled - Whether TV mode is enabled
     */
    toggleTvMode(enabled) {
        this.isTvMode = enabled;
        
        if (enabled) {
            document.body.classList.add('tv-layout');
            // Update URL without reloading the page
            var url = new URL(window.location);
            url.searchParams.set('view', 'tv');
            window.history.pushState({}, '', url);
        } else {
            document.body.classList.remove('tv-layout');
            // Update URL without reloading the page
            var url = new URL(window.location);
            url.searchParams.delete('view');
            window.history.pushState({}, '', url);
        }
    }
    
    /**
     * Show error message
     * 
     * @param {string} message - Error message
     */
    showError(message) {
        if (!this.menuContainer) return;
        
        this.menuContainer.innerHTML = 
            '<div class="error-message">' +
            '<p>' + message + '</p>' +
            '</div>';
    }
    
    /**
     * Admin functions
     */
    
    /**
     * Create a new menu item
     * 
     * @param {object} item - Menu item data
     * @returns {Promise} - Promise with the result
     */
    createMenuItem(item) {
        return fetch(this.menuApiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(item)
        })
        .then(function(response) {
            return response.json();
        })
        .catch(function(error) {
            console.error('Error creating menu item:', error);
            throw error;
        });
    }
    
    /**
     * Update an existing menu item
     * 
     * @param {object} item - Menu item data with ID
     * @returns {Promise} - Promise with the result
     */
    updateMenuItem(item) {
        return fetch(this.menuApiUrl, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(item)
        })
        .then(function(response) {
            return response.json();
        })
        .catch(function(error) {
            console.error('Error updating menu item:', error);
            throw error;
        });
    }
    
    /**
     * Delete a menu item
     * 
     * @param {number} id - Menu item ID
     * @returns {Promise} - Promise with the result
     */
    deleteMenuItem(id) {
        return fetch(this.menuApiUrl, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ id: id })
        })
        .then(function(response) {
            return response.json();
        })
        .catch(function(error) {
            console.error('Error deleting menu item:', error);
            throw error;
        });
    }
    
    /**
     * Login user
     * 
     * @param {string} username - Username
     * @param {string} password - Password
     * @returns {Promise} - Promise with the result
     */
    login(username, password) {
        return fetch(this.authApiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                action: 'login',
                username: username,
                password: password
            })
        })
        .then(function(response) {
            return response.json();
        })
        .catch(function(error) {
            console.error('Error logging in:', error);
            throw error;
        });
    }
    
    /**
     * Logout user
     * 
     * @returns {Promise} - Promise with the result
     */
    logout() {
        return fetch(this.authApiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                action: 'logout'
            })
        })
        .then(function(response) {
            return response.json();
        })
        .catch(function(error) {
            console.error('Error logging out:', error);
            throw error;
        });
    }
}

// Initialize the system when the DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    window.canteenManager = new CanteenManager();
});
