<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Canteen Menu System</title>
    <style>
<?php 
    $cssPath = $_SERVER['DOCUMENT_ROOT'] . '/Canteen-Project/assets/css/styles.css';
    if (file_exists($cssPath)) {
        echo file_get_contents($cssPath);
    }
?>
    </style>
</head>
<body>
    <div class="main-layout">
        <!-- Sidebar for level filtering -->
        <aside class="sidebar">
            <h1S>Canteen Menu</h1>
            
            <div class="level-filters">
                <h2>Filter by Level</h2>
                <div class="mt-4">
                    <button class="level-filter active" data-level="1">Level 1</button>
                    <button class="level-filter" data-level="2">Level 2</button>
                    <button class="level-filter" data-level="3">Level 3</button>
                </div>
            </div>
            
            <div class="mt-4">
                <h2>Display Options</h2>
                <div class="flex mt-4 gap-2">
                    <label class="switch">
                        <input type="checkbox" id="tv-mode-toggle">
                        <span class="slider"></span>
                    </label>
                    <span class="switch-label">TV Mode</span>
                </div>
            </div>
            
            <div class="mt-4">
                <a href="admin/login.php" class="btn btn-secondary">Admin Login</a>
            </div>
        </aside>
        
        <!-- Main content area -->
        <main class="content">
            <div class="container">
                <h1 id="level-title">Level 1 Menu</h1>
                
                <!-- Menu items will be loaded here -->
                <div id="menu-container" class="menu-container">
                    <div class="loading">Loading menu items...</div>
                </div>
            </div>
        </main>
    </div>
    
    <script src="assets/js/CanteenSystem.js"></script>
    <script>
        // Update level title when level filter is clicked
        document.querySelectorAll('.level-filter').forEach(filter => {
            filter.addEventListener('click', (e) => {
                const level = e.target.dataset.level;
                document.getElementById('level-title').textContent = `Level ${level} Menu`;
            });
        });
    </script>
</body>
</html>
