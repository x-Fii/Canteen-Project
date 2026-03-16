<?php
/**
 * Canteen Menu System - Level 2
 * 
 * This file displays the menu for Level 2 canteen with:
 * - Level filtering from URL parameter (default: 2)
 * - Day filtering: Shows items for 'Wednesday' OR 'Daily' only
 * - 2-column card layout (USP-style)
 * - Compact design that fits on screen without scrolling
 */

// Database connection
$host = 'sql100.infinityfree.com';
$dbname = 'if0_41370385_PinHwaCanteen';
$username = 'if0_41370385';
$password = 'cl1ck1x123';

try {
    $pdo = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8mb4", $username, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
} catch (PDOException $e) {
    die("Database connection failed: " . $e->getMessage());
}

// Get selected level from query parameter (default to 2)
$canteenLevel = isset($_GET['level']) ? (int)$_GET['level'] : 2;

// Dynamic day filter + Daily
$currentDay = date('l');
$sql = "SELECT * FROM menu_items 
        WHERE (day_to_display = 'Daily' OR day_to_display = ?) 
        AND is_available = 1 
        AND canteen_level = ?
        ORDER BY category, name";
$stmt = $pdo->prepare($sql);
$stmt->execute([$currentDay, $canteenLevel]);
$items = $stmt->fetchAll(PDO::FETCH_ASSOC);

// Get current date for display
$currentDate = date('d/m/Y');
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Canteen Menu - Level <?php echo $canteenLevel; ?></title>
    <style>
/* ========================================
   RESET & BASE STYLES
   ======================================== */
* {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
}

:root {
    /* Theme Colors */
    --cream: #FFF8DC;
    --cream-light: #FFFEF5;
    --imperial-red: #8B0000;
    --imperial-red-dark: #5a0000;
    --gold: #D4AF37;
    --gold-light: #E8D48B;
    --gold-dark: #B8962E;
    --dark-brown: #3D2914;
    --brown: #5D4D35;
    --brown-light: #8F7751;
    --white: #FFFFFF;
    --black: #1a1a1a;
    --gray-light: #f5f5f5;
    --gray: #666666;
    
    /* Typography */
    --font-sans: 'Inter', 'Arial', 'Helvetica', sans-serif;
}

/* ========================================
   BASE DISPLAY - FIT TO SCREEN NO SCROLL
   ======================================== */
html, body {
    width: 100%;
    height: 100%;
    overflow: hidden;
    font-family: var(--font-sans);
    background: var(--cream);
    color: var(--black);
    line-height: 1.3;
    -webkit-font-smoothing: antialiased;
}

/* ========================================
   MAIN CONTAINER
   ======================================== */
.app-canvas {
    width: 100%;
    height: 100vh;
    background: var(--cream);
    display: flex;
    flex-direction: column;
}

.signage-container {
    width: 100%;
    height: 100vh;
    display: flex;
    flex-direction: column;
    background: linear-gradient(180deg, var(--cream-light) 0%, var(--cream) 100%);
}

/* ========================================
   HEADER - COMPACT
   ======================================== */
.header {
    background: linear-gradient(135deg, var(--imperial-red) 0%, var(--imperial-red-dark) 100%);
    padding: 0.4rem 1rem;
    border-bottom: 3px solid var(--gold);
    flex-shrink: 0;
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
    width: 45px;
    height: 45px;
    background: linear-gradient(135deg, var(--gold) 0%, var(--gold-light) 50%, var(--gold) 100%);
    border-radius: 50%;
    border: 2px solid var(--gold-dark);
}

.level-text {
    font-size: 1.1rem;
    font-weight: 800;
    color: var(--imperial-red);
    text-transform: uppercase;
}

.header-title {
    flex: 1;
    text-align: center;
}

.header-title h1 {
    font-size: 1.3rem;
    font-weight: 700;
    color: var(--white);
    text-transform: uppercase;
    letter-spacing: 0.1em;
    text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.3);
    margin: 0;
}

.header-title p {
    font-size: 0.6rem;
    color: var(--gold);
    margin-top: 0.1rem;
    letter-spacing: 0.05em;
}

.time-display {
    text-align: right;
    min-width: 100px;
}

#timeDisplay {
    font-size: 1.2rem;
    font-weight: 700;
    color: var(--white);
    text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.3);
    display: block;
}

#dateDisplay {
    font-size: 0.6rem;
    font-weight: 500;
    color: var(--gold);
}

.header-decoration {
    height: 3px;
    background: linear-gradient(90deg, var(--gold) 0%, var(--gold-light) 50%, var(--gold) 100%);
}

/* ========================================
   MAIN CONTENT - MULTI CATEGORY 2-COLUMN
   Chromium 87 compatible
   ======================================== */
.main-content {
    flex: 1;
    overflow: hidden;
    padding: 0.45rem;
}

/* 4-column category layout, Chromium 87 compatible (no CSS grid required) */
.category-grid {
    display: flex;
    flex-wrap: wrap;
    gap: 0.45rem;
    width: 100%;
    height: 100%;
    align-content: flex-start;
}

.category-col {
    width: calc(25% - 0.34rem);
    min-width: 0;
}

.category-card {
    background: var(--white);
    border: 2px solid var(--gold);
    border-radius: 8px;
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.08);
    overflow: hidden;
}

.category-card-header {
    background: linear-gradient(135deg, var(--imperial-red) 0%, var(--imperial-red-dark) 100%);
    color: var(--white);
    padding: 0.35rem 0.5rem;
    border-bottom: 2px solid var(--gold);
}

.category-card-title {
    font-size: 0.75rem;
    font-weight: 700;
    letter-spacing: 0.03em;
    text-transform: uppercase;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.menu-list {
    padding: 0;
}

.menu-row {
    padding: 0.18rem 0.3rem;
    border-bottom: 1px solid var(--gold-light);
}

.menu-row:last-child {
    border-bottom: none;
}

.menu-name {
    font-size: 0.62rem;
    font-weight: 700;
    color: var(--dark-brown);
    display: block;
    margin-bottom: 0.02rem;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.menu-meta {
    font-size: 0.52rem;
    color: var(--brown-light);
}

.menu-price {
    font-size: 0.62rem;
    font-weight: 700;
    color: var(--imperial-red);
    float: right;
}


/* ========================================
   FOOTER - COMPACT
   ======================================== */
.footer {
    background: linear-gradient(135deg, var(--imperial-red) 0%, var(--imperial-red-dark) 100%);
    padding: 0.3rem 1rem;
    border-top: 2px solid var(--gold);
    flex-shrink: 0;
}

.footer-text {
    font-size: 0.55rem;
    color: var(--white);
    letter-spacing: 0.1em;
    text-transform: uppercase;
    text-align: center;
    opacity: 0.9;
}
    </style>
</head>
<body>
    <div class="app-canvas">
        <div class="signage-container">
            <!-- Header -->
            <header class="header">
                <div class="header-content">
                    <div class="level-badge">
                        <span class="level-text">L<?php echo $canteenLevel; ?></span>
                    </div>
                    <div class="header-title">
                        <h1>Canteen Menu</h1>
                        <p>Level <?php echo $canteenLevel; ?> </p>
                    </div>
                    <div class="time-display">
                        <span id="timeDisplay">--:--</span>
                        <span id="dateDisplay"><?php echo $currentDate; ?></span>
                    </div>
                </div>
            </header>
            
            <div class="header-decoration"></div>
            
            <!-- Main Content - Multi Category 2-Column -->
            <main class="main-content">
                <?php
                    $grouped = array();
                    foreach ($items as $item) {
                        $cat = $item['category'];
                        if (!isset($grouped[$cat])) {
                            $grouped[$cat] = array();
                        }
                        $grouped[$cat][] = $item;
                    }
                    $categories = array_keys($grouped);
                ?>
                <div class="category-grid">
                    <?php foreach ($categories as $cat): 
                        $catItems = $grouped[$cat];
                    ?>
                        <div class="category-col">
                            <div class="category-card">
                                <div class="category-card-header">
                                    <div class="category-card-title"><?php echo htmlspecialchars($cat, ENT_QUOTES, 'UTF-8'); ?></div>
                                </div>
                                <div class="menu-list">
                                    <?php foreach ($catItems as $item): ?>
                                        <div class="menu-row">
                                            <span class="menu-name"><?php echo htmlspecialchars($item['name'], ENT_QUOTES, 'UTF-8'); ?></span>
                                            <span class="menu-meta">
                                                <?php echo htmlspecialchars($item['unit_num'] . ' ' . $item['unit_type'] . ($item['unit_num'] > 1 ? 's' : ''), ENT_QUOTES, 'UTF-8'); ?>
                                                <span class="menu-price">RM <?php echo number_format($item['price'], 2); ?></span>
                                            </span>
                                        </div>
                                    <?php endforeach; ?>
                                </div>
                            </div>
                        </div>
                    <?php endforeach; ?>
                </div>
            </main>
            
            <!-- Footer -->
            <footer class="footer">
                <p class="footer-text">CANTEEN MENU SYSTEM • LEVEL <?php echo $canteenLevel; ?></p>
            </footer>
        </div>
    </div>
    
    <script>
        function updateDateTime() {
            var now = new Date();
            var dateNum = now.getDate();
            var monthNum = now.getMonth() + 1;
            var year = now.getFullYear();

            dateNum = dateNum < 10 ? '0' + dateNum : dateNum;
            monthNum = monthNum < 10 ? '0' + monthNum : monthNum;

            var hours = now.getHours();
            var minutes = now.getMinutes();
            var ampm = hours >= 12 ? 'PM' : 'AM';
            hours = hours % 12;
            hours = hours ? hours : 12;
            minutes = minutes < 10 ? '0' + minutes : minutes;

            var timeString = hours + ':' + minutes + ' ' + ampm;
            var dateString = dateNum + '/' + monthNum + '/' + year;
            
            var timeElement = document.getElementById('timeDisplay');
            var dateElement = document.getElementById('dateDisplay');
            
            if (timeElement) timeElement.textContent = timeString;
            if (dateElement) dateElement.textContent = dateString;
        }
        
        document.addEventListener('DOMContentLoaded', function() {
            updateDateTime();
            setInterval(updateDateTime, 1000);
        });
    </script>
</body>
</html>

