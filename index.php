<?php
/**
 * Canteen Menu System - Reception Page
 * 
 * This file serves as the main entry point to the Canteen Menu System,
 * providing navigation buttons to different canteen levels and admin area.
 */
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Canteen Menu System</title>
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
           BASE DISPLAY
           ======================================== */
        html, body {
            width: 100%;
            height: 100%;
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
            min-height: 100vh;
            background: linear-gradient(180deg, var(--cream-light) 0%, var(--cream) 100%);
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
        }

        /* ========================================
           HEADER
           ======================================== */
        .header {
            background: linear-gradient(135deg, var(--imperial-red) 0%, var(--imperial-red-dark) 100%);
            padding: 1.5rem;
            border-bottom: 3px solid var(--gold);
            text-align: center;
            width: 100%;
            position: fixed;
            top: 0;
            left: 0;
            z-index: 10;
        }

        .header h1 {
            font-size: 2rem;
            font-weight: 700;
            color: var(--white);
            text-transform: uppercase;
            letter-spacing: 0.1em;
            text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.3);
            margin: 0;
        }

        .header p {
            font-size: 1rem;
            color: var(--gold);
            margin-top: 0.5rem;
            letter-spacing: 0.05em;
        }

        /* ========================================
           CONTENT
           ======================================== */
        .content {
            margin-top: 120px;
            margin-bottom: 80px;
            width: 90%;
            max-width: 800px;
            background: var(--white);
            border: 3px solid var(--gold);
            border-radius: 12px;
            padding: 2rem;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
        }

        .welcome-text {
            text-align: center;
            margin-bottom: 2rem;
        }

        .welcome-text h2 {
            font-size: 1.8rem;
            color: var(--imperial-red);
            margin-bottom: 1rem;
        }

        .welcome-text p {
            font-size: 1.1rem;
            color: var(--dark-brown);
            line-height: 1.6;
        }

        /* ========================================
           BUTTONS
           ======================================== */
        .button-container {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 1.5rem;
            margin-top: 2rem;
        }

        .menu-button {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            padding: 1.5rem;
            background: linear-gradient(135deg, var(--cream-light) 0%, var(--cream) 100%);
            border: 2px solid var(--gold);
            border-radius: 8px;
            text-decoration: none;
            transition: all 0.3s ease;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }

        .menu-button:hover {
            transform: translateY(-5px);
            box-shadow: 0 10px 15px rgba(0, 0, 0, 0.1);
            border-color: var(--imperial-red);
        }

        .level-badge {
            display: flex;
            align-items: center;
            justify-content: center;
            width: 60px;
            height: 60px;
            background: linear-gradient(135deg, var(--gold) 0%, var(--gold-light) 50%, var(--gold) 100%);
            border-radius: 50%;
            border: 2px solid var(--gold-dark);
            margin-bottom: 1rem;
        }

        .level-text {
            font-size: 1.5rem;
            font-weight: 800;
            color: var(--imperial-red);
            text-transform: uppercase;
        }

        .admin-icon {
            font-size: 1.8rem;
            font-weight: 800;
            color: var(--imperial-red);
        }

        .button-title {
            font-size: 1.2rem;
            font-weight: 700;
            color: var(--dark-brown);
            margin-bottom: 0.5rem;
            text-align: center;
        }

        .button-desc {
            font-size: 0.9rem;
            color: var(--brown);
            text-align: center;
        }

        /* ========================================
           FOOTER
           ======================================== */
        .footer {
            background: linear-gradient(135deg, var(--imperial-red) 0%, var(--imperial-red-dark) 100%);
            padding: 1rem;
            border-top: 2px solid var(--gold);
            text-align: center;
            width: 100%;
            position: fixed;
            bottom: 0;
            left: 0;
        }

        .footer-text {
            font-size: 0.8rem;
            color: var(--white);
            letter-spacing: 0.1em;
            text-transform: uppercase;
            opacity: 0.9;
        }

        /* ========================================
           RESPONSIVE ADJUSTMENTS
           ======================================== */
        @media (max-width: 768px) {
            .header h1 {
                font-size: 1.5rem;
            }
            
            .header p {
                font-size: 0.8rem;
            }
            
            .content {
                padding: 1.5rem;
                margin-top: 100px;
            }
            
            .welcome-text h2 {
                font-size: 1.5rem;
            }
            
            .welcome-text p {
                font-size: 1rem;
            }
            
            .button-container {
                grid-template-columns: 1fr;
            }
        }
    </style>
</head>
<body>
    <div class="app-canvas">
        <!-- Header -->
        <header class="header">
            <h1>Canteen Menu System</h1>
            <p>Welcome to the Digital Menu Display System</p>
        </header>
        
        <!-- Main Content -->
        <main class="content">
            <div class="welcome-text">
                <h2>Select a Canteen Level</h2>
                <p>Choose one of the canteen levels below to view today's menu or access the admin panel to manage menu items.</p>
            </div>
            
            <div class="button-container">
                <!-- Level 2 Button -->
                <a href="index_level2.php" class="menu-button">
                    <div class="level-badge">
                        <span class="level-text">L2</span>
                    </div>
                    <h3 class="button-title">Level 2 Canteen</h3>
                    <p class="button-desc">View menu items for Level 2</p>
                </a>
                
                <!-- Level 3 Button -->
                <a href="index_level3.php" class="menu-button">
                    <div class="level-badge">
                        <span class="level-text">L3</span>
                    </div>
                    <h3 class="button-title">Level 3 Canteen</h3>
                    <p class="button-desc">View menu items for Level 3</p>
                </a>
                
                <!-- Level 4 Button -->
                <a href="index_level4.php" class="menu-button">
                    <div class="level-badge">
                        <span class="level-text">L4</span>
                    </div>
                    <h3 class="button-title">Level 4 Canteen</h3>
                    <p class="button-desc">View menu items for Level 4</p>
                </a>
                
                <!-- Admin Button -->
                <a href="admin/" class="menu-button">
                    <div class="level-badge">
                        <span class="admin-icon">⚙️</span>
                    </div>
                    <h3 class="button-title">Admin Panel</h3>
                    <p class="button-desc">Manage menu items and settings</p>
                </a>
            </div>
        </main>
        
        <!-- Footer -->
        <footer class="footer">
            <p class="footer-text">CANTEEN MENU SYSTEM • DIGITAL SIGNAGE</p>
        </footer>
    </div>
    
    <script>
        // Add any JavaScript functionality here if needed
        document.addEventListener('DOMContentLoaded', function() {
            console.log('Reception page loaded successfully');
        });
    </script>
</body>
</html>
