<?php
/**
 * Canteen Menu System - Level 2
 * Optimized for Chromium 87
 * Features: Centered Headers, Left-Aligned Columns, Fit-to-Screen Layout
 */

// Database connection
$host = 'sql100.infinityfree.com';
$dbname = 'if0_41370385_PinHwaCanteen';
$username = 'if0_41370385';
$password = 'cl1ck1x123';

try {
    header('Content-Type: text/html; charset=UTF-8');
    $pdo = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8mb4", $username, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
} catch (PDOException $e) {
    die("Database connection failed: " . $e->getMessage());
}

// Get level from URL or default to 2
$canteenLevel = isset($_GET['level']) ? (int)$_GET['level'] : 2;

// Filter by Current Day or Daily items
$currentDay = date('l');
$sql = "SELECT * FROM menu_items 
        WHERE (day_to_display = 'Daily' OR day_to_display = ?) 
        AND is_available = 1 
        AND canteen_level = ?
        ORDER BY category, name";
$stmt = $pdo->prepare($sql);
$stmt->execute([$currentDay, $canteenLevel]);
$items = $stmt->fetchAll(PDO::FETCH_ASSOC);

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
    --cream: #FFF8DC;
    --cream-light: #FFFEF5;
    --imperial-red: #8B0000;
    --imperial-red-dark: #5a0000;
    --gold: #D4AF37;
    --gold-light: #E8D48B;
    --dark-brown: #3D2914;
    --brown-light: #8F7751;
    --white: #FFFFFF;
}

html, body {
    width: 100%;
    height: 100%;
    overflow: hidden;
    font-family: 'Inter', 'Arial', -apple-system, BlinkMacSystemFont, 'Segoe UI Emoji', 'Noto Color Emoji', sans-serif;
    background: var(--cream);
    line-height: 1.2;
}

.app-canvas {
    width: 100%;
    height: 100vh;
    display: flex;
    flex-direction: column;
}

/* ========================================
   HEADER - CENTERED TITLE LOGIC
   ======================================== */
.header {
    background: linear-gradient(135deg, var(--imperial-red) 0%, var(--imperial-red-dark) 100%);
    padding: 0.5rem 1.2rem;
    border-bottom: 3px solid var(--gold);
    flex-shrink: 0;
}

.header-content {
    display: flex;
    justify-content: space-between;
    align-items: center;
}

/* Left Section */
.brand-block {
    display: flex;
    align-items: center;
    gap: 0.7rem;
    flex: 1; 
}

.header-logo {
    width: 46px;
    height: 46px;
    background: rgba(255,255,255,0.15);
    padding: 3px;
    border-radius: 8px;
}

.header-name p {
font-size: 1.5rem;
    font-weight: 700;
    color: var(--white);
    text-transform: uppercase;
}

/* CENTERED SECTION */
.header-title {
    flex: 2;
    text-align: center;
}

.header-title h1 {
    font-size: 1.5rem;
    font-weight: 900;
    color: var(--white);
    text-transform: uppercase;
    letter-spacing: 0.12em;
    margin: 0;
    line-height: 1;
}

.header-title p {
    font-size: 1.1rem;
    color: var(--gold-light);
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    margin-top: 2px;
}

/* Right Section */
.time-display {
    flex: 1;
    text-align: right;
}

#timeDisplay {
    font-size: 1.25rem;
    font-weight: 700;
    color: var(--white);
    display: block;
}

#dateDisplay {
    font-size: 0.85rem;
    color: var(--gold-light);
    font-weight: 500;
}

.header-decoration {
    height: 4px;
    background: linear-gradient(90deg, var(--gold) 0%, var(--gold-light) 50%, var(--gold) 100%);
}

/* ========================================
   MAIN CONTENT - 4 COLUMN GRID
   ======================================== */
.main-content {
    flex: 1;
    overflow: hidden;
    padding: 0.4rem;
}

.category-grid {
    display: flex;
    flex-wrap: wrap;
    gap: 0.4rem;
    width: 100%;
    align-content: flex-start;
}

.category-col {
    width: calc(25% - 0.3rem); /* Strict 4 columns */
    min-width: 0;
}

.category-card {
    background: var(--white);
    border: 2px solid var(--gold);
    border-radius: 8px;
    overflow: hidden;
    box-shadow: 0 2px 5px rgba(0,0,0,0.1);
}

.category-card-header {
    background: var(--imperial-red);
    color: var(--white);
    padding: 0.35rem 0.5rem;
    border-bottom: 2px solid var(--gold);
}

.category-card-title {
    font-size: 1.15rem;
    font-weight: 800;
    text-transform: uppercase;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

/* ========================================
   MENU ROW - LEFT ALIGNED COLUMNS
   ======================================== */
.menu-row {
    display: flex;
    align-items: baseline;
    padding: 0.3rem 0.4rem;
    border-bottom: 1px solid var(--gold-light);
    width: 100%;
}

.menu-row:last-child { border-bottom: none; }

.menu-name {
    flex: 0 0 52%; /* Width for Item Name */
    font-size: 0.95rem;
    font-weight: 700;
    color: var(--dark-brown);
    text-align: left;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.menu-meta {
    flex: 0 0 23%; /* Width for Unit */
    font-size: 0.9rem;
    color: var(--brown-light);
    text-align: left;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

        .menu-price {
    flex: 0 0 25%; /* Width for Price */
    font-size: 0.95rem;
    font-weight: 800;
    color: var(--imperial-red);
    text-align: left;
    white-space: nowrap;
}

.menu-list {
    max-height: none;
}
    </style>
</head>
<body>
    <div class="app-canvas">
        <header class="header">
            <div class="header-content">
                <div class="brand-block">
                    <img src="assets/logo-footer.png" alt="Logo" class="header-logo" />
                    <div class="header-name">
                        <p>Pin Hwa High School</p>
                    </div>
                </div>
                
                <div class="header-title">
                    <h1>Canteen Menu</h1>
                    <p>Level <?php echo $canteenLevel; ?></p>
                </div>
                
                <div class="time-display">
                    <span id="timeDisplay">--:--</span>
                    <span id="dateDisplay"><?php echo $currentDate; ?></span>
                </div>
            </div>
        </header>
        <div class="header-decoration"></div>

        <main class="main-content">
            <?php
                // Re-grouping items by category
                $grouped = [];
                foreach ($items as $item) {
                    $cat = $item['category'];
                    if (!isset($grouped[$cat])) { $grouped[$cat] = []; }
                    $grouped[$cat][] = $item;
                }
            ?>
            <?php if (empty($items)): ?>
                <div style="text-align: center; padding: 2rem; color: var(--brown-light);">
                    <h2>No items available today for this level.</h2>
                </div>
            <?php else: ?>

                <div class="category-grid">
                    <?php foreach ($grouped as $catName => $catItems): ?>
                        <div class="category-col">
                            <div class="category-card">
                                <div class="category-card-header">
                                    <div class="category-card-title"><?php echo htmlspecialchars($catName, ENT_QUOTES | ENT_HTML5, 'UTF-8'); ?></div>
                                </div>
                                <div class="menu-list">
                                    <?php foreach ($catItems as $item): ?>
                                        <div class="menu-row">
                                            <span class="menu-name"><?php echo htmlspecialchars($item['name'], ENT_QUOTES | ENT_HTML5, 'UTF-8'); ?></span>
                                            <span class="menu-meta"><?php echo htmlspecialchars($item['unit_num'] . ' ' . $item['unit_type'], ENT_QUOTES | ENT_HTML5, 'UTF-8'); ?></span>
                                            <span class="menu-price">RM <?php echo number_format($item['price'], 2); ?></span>
                                        </div>
                                    <?php endforeach; ?>
                                </div>
                            </div>
                        </div>
                    <?php endforeach; ?>
                </div>
            <?php endif; ?>
        </main>
    </div>

    <script>
        function updateDateTime() {
            var now = new Date();
            
            // Format Time
            var h = now.getHours();
            var m = now.getMinutes();
            var ampm = h >= 12 ? 'PM' : 'AM';
            h = h % 12;
            h = h ? h : 12;
            m = m < 10 ? '0' + m : m;
            
            // Format Date
            var d = now.getDate();
            var mon = now.getMonth() + 1;
            var y = now.getFullYear();
            d = d < 10 ? '0' + d : d;
            mon = mon < 10 ? '0' + mon : mon;

            document.getElementById('timeDisplay').textContent = h + ':' + m + ' ' + ampm;
            document.getElementById('dateDisplay').textContent = d + '/' + mon + '/' + y;
        }

        // Run immediately and then every second
        updateDateTime();
        setInterval(updateDateTime, 1000);
    </script>
</body>
</html>