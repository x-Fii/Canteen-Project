<?php
// Database connection
$host = 'localhost';
$dbname = 'canteen_db';
$username = 'root';
$password = '';

try {
    $pdo = new PDO("mysql:host=$host;dbname=$dbname", $username, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
} catch (PDOException $e) {
    die("Database connection failed: " . $e->getMessage());
}

// Get current day for dynamic filtering - Wednesday, March 11, 2026
$currentDay = date('l'); // This returns 'Wednesday'

// Get selected level from query parameter (default to 2)
$canteenLevel = isset($_GET['level']) ? (int)$_GET['level'] : 2;

// SQL query with dynamic Wednesday filtering
// Fetch items where day_to_display is 'Wednesday' OR 'Daily' and is_available is true
$sql = "SELECT * FROM menu_items 
        WHERE (day_to_display = ? OR day_to_display = 'Daily') 
        AND is_available = 1 
        AND canteen_level = ?
        ORDER BY category, name";
$stmt = $pdo->prepare($sql);
$stmt->execute([$currentDay, $canteenLevel]);
$items = $stmt->fetchAll(PDO::FETCH_ASSOC);

// Get current date for display
$currentDate = date('l, M d, Y');
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Canteen Menu System - Level <?php echo $canteenLevel; ?></title>
    <style>
/**
 * Chinese Style Portrait Signage - Canteen System
 * 
 * Theme: Deep Imperial Red (#8B0000), Pale Gold/Cream (#FFF8DC), Gold Accents (#D4AF37)
 * Dimensions: 1080x1920 Portrait
 * Compatible with Chromium 87 - No external resources
 */

/* Font face - Using system fonts for Chromium 87 compatibility */
@font-face {
    font-family: 'Inter';
    src: local('Inter'), local('Inter-Regular'), local('Arial'), local('Helvetica');
    font-weight: normal;
    font-style: normal;
}

/* Reset and base styles */
* {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
}

:root {
    /* Chinese Aesthetic Color Palette */
    --imperial-red: #8B0000;
    --imperial-red-dark: #5a0000;
    --cream: #FFF8DC;
    --cream-light: #FFFEF5;
    --gold: #D4AF37;
    --gold-light: #E8D48B;
    --gold-dark: #B8962E;
    --dark-brown: #3D2914;
    --brown: #5D4D35;
    --brown-light: #8F7751;
    
    /* Additional colors */
    --white: #FFFFFF;
    --black: #1a1a1a;
    --gray-light: #f5f5f5;
    --gray: #666666;
    
    /* Typography */
    --font-sans: 'Inter', 'Arial', 'Helvetica', sans-serif;
    --font-display: 'Georgia', 'Times New Roman', serif;
    
    /* Spacing */
    --spacing-xs: 0.25rem;
    --spacing-sm: 0.5rem;
    --spacing-md: 1rem;
    --spacing-lg: 1.5rem;
    --spacing-xl: 2rem;
    --spacing-2xl: 3rem;
    
    /* Border radius */
    --radius-sm: 4px;
    --radius-md: 8px;
    --radius-lg: 12px;
    --radius-full: 50%;
}

/* Portrait Display - Fixed Dimensions */
html, body {
    width: 1080px;
    height: 1920px;
    overflow: hidden;
    font-family: var(--font-sans);
    background: var(--cream);
    color: var(--black);
    line-height: 1.4;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
}

/* Main Container */
.signage-container {
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    background: linear-gradient(180deg, var(--cream-light) 0%, var(--cream) 100%);
}

/* Header Styles */
.header {
    background: linear-gradient(135deg, var(--imperial-red) 0%, var(--imperial-red-dark) 100%);
    padding: var(--spacing-xl) var(--spacing-2xl);
    border-bottom: 6px solid var(--gold);
    box-shadow: 0 4px 20px rgba(139, 0, 0, 0.3);
}

.header-content {
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.level-badge {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 180px;
    height: 180px;
    background: linear-gradient(135deg, var(--gold) 0%, var(--gold-light) 50%, var(--gold) 100%);
    border-radius: var(--radius-full);
    border: 8px solid var(--gold-dark);
    box-shadow: 0 8px 32px rgba(212, 175, 55, 0.5), inset 0 2px 10px rgba(255, 255, 255, 0.5);
}

.level-text {
    font-size: 3.5rem;
    font-weight: 800;
    color: var(--imperial-red);
    text-transform: uppercase;
    letter-spacing: 0.1em;
    text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.2);
}

.time-display {
    text-align: right;
    color: var(--white);
}

#timeDisplay {
    font-size: 4rem;
    font-weight: 700;
    letter-spacing: 0.05em;
    text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.3);
    display: block;
    margin-bottom: var(--spacing-sm);
}

#dateDisplay {
    font-size: 2rem;
    font-weight: 500;
    opacity: 0.95;
    letter-spacing: 0.02em;
}

/* Decorative Header Border */
.header-decoration {
    height: 12px;
    background: linear-gradient(90deg, 
        var(--gold) 0%, 
        var(--gold-light) 25%, 
        var(--gold) 50%, 
        var(--gold-light) 75%, 
        var(--gold) 100%
    );
    border-top: 3px solid var(--gold-dark);
    border-bottom: 3px solid var(--gold-dark);
}

/* Main Content */
.main-content {
    flex: 1;
    overflow-y: auto;
    padding: var(--spacing-lg);
    scrollbar-width: none;
    -ms-overflow-style: none;
}

.main-content::-webkit-scrollbar {
    display: none;
}

/* Hospital Directory Table */
.directory-table {
    width: 100%;
    border-collapse: collapse;
    background: var(--white);
    border: 4px solid var(--gold);
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
}

/* Double-line gold border effect */
.directory-table::before {
    content: '';
    position: absolute;
    top: -8px;
    left: -8px;
    right: -8px;
    bottom: -8px;
    border: 2px solid var(--gold);
    pointer-events: none;
}

/* Category Header Row */
.category-row {
    background: linear-gradient(135deg, var(--imperial-red) 0%, var(--imperial-red-dark) 100%);
    border-bottom: 4px solid var(--gold);
}

.category-cell {
    padding: var(--spacing-lg) var(--spacing-xl);
    font-size: 2.2rem;
    font-weight: 700;
    color: var(--white);
    text-transform: uppercase;
    letter-spacing: 0.15em;
    text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.3);
    border-right: 2px solid var(--gold);
}

.category-cell:last-child {
    border-right: none;
}

/* Menu Item Row */
.menu-row {
    border-bottom: 2px solid var(--cream);
    transition: background-color 0.2s;
}

.menu-row:hover {
    background-color: var(--cream-light);
}

.menu-row:nth-child(even) {
    background-color: var(--gray-light);
}

.menu-row:nth-child(even):hover {
    background-color: var(--cream-light);
}

/* Doctor Column (Left) - Item Name */
.doctor-cell {
    padding: var(--spacing-lg) var(--spacing-xl);
    width: 55%;
    vertical-align: middle;
}

.doctor-name {
    font-size: 1.8rem;
    font-weight: 600;
    color: var(--dark-brown);
    display: block;
    margin-bottom: var(--spacing-xs);
}

.doctor-name span {
    font-size: 1.3rem;
    font-weight: 400;
    color: var(--brown-light);
    display: block;
    margin-top: var(--spacing-xs);
}

/* Residentsessional Column (Middle) - Status */
.residentsessional-cell {
    padding: var(--spacing-lg);
    width: 15%;
    text-align: center;
    vertical-align: middle;
    border-left: 1px solid var(--cream);
    border-right: 1px solid var(--cream);
}

.status-indicator {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 60px;
    height: 60px;
    background: linear-gradient(135deg, #2ecc71 0%, #27ae60 100%);
    border-radius: var(--radius-full);
    font-size: 1.8rem;
    font-weight: 700;
    color: var(--white);
    text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.2);
    box-shadow: 0 4px 12px rgba(46, 204, 113, 0.4);
}

/* Floor Column (Right) - Price */
.floor-cell {
    padding: var(--spacing-lg) var(--spacing-xl);
    width: 30%;
    text-align: right;
    vertical-align: middle;
}

.price {
    font-size: 2.2rem;
    font-weight: 700;
    color: var(--imperial-red);
    letter-spacing: 0.02em;
}

/* Empty State */
.empty-state {
    padding: var(--spacing-2xl);
    text-align: center;
    color: var(--gray);
}

.empty-state p {
    font-size: 1.5rem;
    margin-bottom: var(--spacing-md);
}

/* Footer */
.footer {
    background: linear-gradient(135deg, var(--imperial-red) 0%, var(--imperial-red-dark) 100%);
    padding: var(--spacing-lg) var(--spacing-2xl);
    border-top: 6px solid var(--gold);
    text-align: center;
    color: var(--white);
}

.footer-text {
    font-size: 1.2rem;
    letter-spacing: 0.1em;
    opacity: 0.9;
}

/* Decorative corner elements */
.corner-decoration {
    position: absolute;
    width: 60px;
    height: 60px;
    border: 4px solid var(--gold);
}

.corner-top-left {
    top: var(--spacing-lg);
    left: var(--spacing-lg);
    border-right: none;
    border-bottom: none;
}

.corner-top-right {
    top: var(--spacing-lg);
    right: var(--spacing-lg);
    border-left: none;
    border-bottom: none;
}

.corner-bottom-left {
    bottom: var(--spacing-lg);
    left: var(--spacing-lg);
    border-right: none;
    border-top: none;
}

.corner-bottom-right {
    bottom: var(--spacing-lg);
    right: var(--spacing-lg);
    border-left: none;
    border-top: none;
}
    </style>
</head>
<body>
    <div class="signage-container">
        <!-- Header -->
        <header class="header">
            <div class="header-content">
                <div class="level-badge">
                    <span class="level-text">L<?php echo $canteenLevel; ?></span>
                </div>
                <div class="time-display">
                    <span id="timeDisplay">--:--</span>
                    <span id="dateDisplay"><?php echo $currentDate; ?></span>
                </div>
            </div>
        </header>
        
        <!-- Decorative gold border -->
        <div class="header-decoration"></div>
        
        <!-- Main Content - Hospital Directory Style Table -->
        <main class="main-content">
            <table class="directory-table">
                <tbody>
                    <?php
                    // Group items by category
                    $currentCategory = '';
                    $firstItem = true;
                    
                    foreach ($items as $item) {
                        // Display category header when it changes
                        if ($item['category'] !== $currentCategory) {
                            $currentCategory = $item['category'];
                            ?>
                            <tr class="category-row">
                                <td class="category-cell" colspan="3">
                                    <?php echo htmlspecialchars($currentCategory); ?>
                                </td>
                            </tr>
                            <?php
                        }
                        ?>
                        <tr class="menu-row">
                            <!-- Left Column: Doctor/Item Name -->
                            <td class="doctor-cell">
<span class="doctor-name">
                                    <?php echo htmlspecialchars($item['name']); ?>
                                    <span><?php echo $item['unit_num'] . ' ' . $item['unit_type'] . ($item['unit_num'] > 1 ? 's' : ''); ?></span>
                                </span>
                            </td>
                            
                            <!-- Middle Column: Status (R for Available) -->
                            <td class="residentsessional-cell">
                                <span class="status-indicator">R</span>
                            </td>
                            
                            <!-- Right Column: Floor/Price -->
                            <td class="floor-cell">
                                <span class="price">RM <?php echo number_format($item['price'], 2); ?></span>
                            </td>
                        </tr>
                        <?php
                    }
                    
                    // If no items found
                    if (empty($items)) {
                        ?>
                        <tr>
                            <td colspan="3" class="empty-state">
                                <p>No menu items available for today (<?php echo $currentDay; ?>).</p>
                                <p>Please check back tomorrow or contact the admin.</p>
                            </td>
                        </tr>
                        <?php
                    }
                    ?>
                </tbody>
            </table>
        </main>
        
        <!-- Footer -->
        <footer class="footer">
            <p class="footer-text">CANTEEN MENU SYSTEM</p>
        </footer>
        
        <!-- Decorative corners -->
        <div class="corner-decoration corner-top-left"></div>
        <div class="corner-decoration corner-top-right"></div>
        <div class="corner-decoration corner-bottom-left"></div>
        <div class="corner-decoration corner-bottom-right"></div>
    </div>
    
    <!-- Inline JS using PHP include for Chromium 87 compatibility -->
    <?php include_once 'assets/js/CanteenSystem.js'; ?>
    <script>
        /**
         * Update Date and Time Display
         * Keeps the time and date accurate on the screen
         * Compatible with Chromium 87
         */
        function updateDateTime() {
            var now = new Date();
            var days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
            var months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
            
            var dayName = days[now.getDay()];
            var monthName = months[now.getMonth()];
            var dateNum = now.getDate();
            var year = now.getFullYear();
            
            // Format time as HH:MM
            var hours = now.getHours();
            var minutes = now.getMinutes();
            var ampm = hours >= 12 ? 'PM' : 'AM';
            hours = hours % 12;
            hours = hours ? hours : 12; // the hour '0' should be '12'
            minutes = minutes < 10 ? '0' + minutes : minutes;
            
            var timeString = hours + ':' + minutes + ' ' + ampm;
            var dateString = dayName + ', ' + monthName + ' ' + dateNum + ', ' + year;
            
            var timeElement = document.getElementById('timeDisplay');
            var dateElement = document.getElementById('dateDisplay');
            
            if (timeElement) {
                timeElement.textContent = timeString;
            }
            if (dateElement) {
                dateElement.textContent = dateString;
            }
        }
        
        // Initialize date and time on page load
        document.addEventListener('DOMContentLoaded', function() {
            updateDateTime();
            
            // Update time every second for accurate clock
            setInterval(updateDateTime, 1000);
        });
    </script>
</body>
</html>

