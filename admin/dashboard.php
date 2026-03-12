<?php
// Start session
session_start();

// Check if user is logged in
if (!isset($_SESSION['user_id'])) {
    // Redirect to login page
    header("Location: login.php");
    exit;
}

// Include database connection
include_once '../includes/db.php';

// Create database connection
$database = new Database();
$db = $database->getConnection();

// Get user role
$user_role = isset($_SESSION['role']) ? $_SESSION['role'] : '';

// Initialize variables
$success_message = "";
$error_message = "";

// Handle form submissions
if ($_SERVER["REQUEST_METHOD"] == "POST") {
    // Handle user management actions (admin only)
    if (isset($_POST['add_user']) || isset($_POST['update_user']) || isset($_POST['delete_user'])) {
        if ($user_role !== 'admin') {
            $error_message = "Access denied. Admin only.";
        } else {
            // Add new user
            if (isset($_POST['add_user'])) {
                $username = htmlspecialchars(strip_tags($_POST['username']));
                $email = htmlspecialchars(strip_tags($_POST['email']));
                $password = $_POST['password'];
                $role = htmlspecialchars(strip_tags($_POST['role']));
                
                // Validate input
                if (empty($username) || empty($password) || empty($role)) {
                    $error_message = "Please fill in all required fields";
                } elseif (!in_array($role, ['admin', 'content_manager'])) {
                    $error_message = "Invalid role selected";
                } else {
                    // Check if username already exists
                    $query = "SELECT id FROM users WHERE username = :username";
                    $stmt = $db->prepare($query);
                    $stmt->bindParam(':username', $username);
                    $stmt->execute();
                    
                    if ($stmt->rowCount() > 0) {
                        $error_message = "Username already exists";
                    } else {
                        // Hash password
                        $password_hash = password_hash($password, PASSWORD_DEFAULT);
                        
                        // Insert new user
                        $query = "INSERT INTO users (username, email, password, role) VALUES (:username, :email, :password, :role)";
                        $stmt = $db->prepare($query);
                        $stmt->bindParam(':username', $username);
                        $stmt->bindParam(':email', $email);
                        $stmt->bindParam(':password', $password_hash);
                        $stmt->bindParam(':role', $role);
                        
                        if ($stmt->execute()) {
                            $success_message = "User added successfully";
                        } else {
                            $error_message = "Failed to add user";
                        }
                    }
                }
            } elseif (isset($_POST['update_user'])) {
                // Update user
                $id = htmlspecialchars(strip_tags($_POST['id']));
                $username = htmlspecialchars(strip_tags($_POST['username']));
                $email = htmlspecialchars(strip_tags($_POST['email']));
                $role = htmlspecialchars(strip_tags($_POST['role']));
                $password = $_POST['password'];
                
                // Validate input
                if (empty($id) || empty($username) || empty($role)) {
                    $error_message = "Please fill in all required fields";
                } elseif (!in_array($role, ['admin', 'content_manager'])) {
                    $error_message = "Invalid role selected";
                } else {
                    // Check if username already exists for another user
                    $query = "SELECT id FROM users WHERE username = :username AND id != :id";
                    $stmt = $db->prepare($query);
                    $stmt->bindParam(':username', $username);
                    $stmt->bindParam(':id', $id);
                    $stmt->execute();
                    
                    if ($stmt->rowCount() > 0) {
                        $error_message = "Username already exists";
                    } else {
                        // Build update query
                        $query = "UPDATE users SET username = :username, email = :email, role = :role";
                        if (!empty($password)) {
                            $query .= ", password = :password";
                        }
                        $query .= " WHERE id = :id";
                        
                        $stmt = $db->prepare($query);
                        $stmt->bindParam(':id', $id);
                        $stmt->bindParam(':username', $username);
                        $stmt->bindParam(':email', $email);
                        $stmt->bindParam(':role', $role);
                        if (!empty($password)) {
                            $password_hash = password_hash($password, PASSWORD_DEFAULT);
                            $stmt->bindParam(':password', $password_hash);
                        }
                        
                        if ($stmt->execute()) {
                            $success_message = "User updated successfully";
                        } else {
                            $error_message = "Failed to update user";
                        }
                    }
                }
            } elseif (isset($_POST['delete_user'])) {
                // Delete user
                $id = htmlspecialchars(strip_tags($_POST['id']));
                
                // Prevent deleting own account
                if ($id == $_SESSION['user_id']) {
                    $error_message = "Cannot delete your own account";
                } else {
                    $query = "DELETE FROM users WHERE id = :id";
                    $stmt = $db->prepare($query);
                    $stmt->bindParam(':id', $id);
                    
                    if ($stmt->execute()) {
                        $success_message = "User deleted successfully";
                    } else {
                        $error_message = "Failed to delete user";
                    }
                }
            }
        }
    } elseif (isset($_POST['add_item'])) {
        // Add new menu item
        $name = htmlspecialchars(strip_tags($_POST['name']));
        $price = htmlspecialchars(strip_tags($_POST['price']));
        $category = htmlspecialchars(strip_tags($_POST['category']));
        $canteen_level = htmlspecialchars(strip_tags($_POST['canteen_level']));
        $unit_num = isset($_POST['unit_num']) ? (int)$_POST['unit_num'] : 1;
        $unit_type = htmlspecialchars(strip_tags($_POST['unit_type']));
        $day_to_display = htmlspecialchars(strip_tags($_POST['day_to_display']));
        
        // Validate input
        if (empty($name) || empty($price) || empty($category) || empty($canteen_level)) {
            $error_message = "Please fill in all fields";
        } else {
            // Prepare query with new fields
            $query = "INSERT INTO menu_items (name, price, category, canteen_level, unit_num, unit_type, day_to_display) VALUES (:name, :price, :category, :canteen_level, :unit_num, :unit_type, :day_to_display)";
            
            // Prepare statement
            $stmt = $db->prepare($query);
            
            // Bind parameters
            $stmt->bindParam(':name', $name);
            $stmt->bindParam(':price', $price);
            $stmt->bindParam(':category', $category);
            $stmt->bindParam(':canteen_level', $canteen_level);
            $stmt->bindParam(':unit_num', $unit_num);
            $stmt->bindParam(':unit_type', $unit_type);
            $stmt->bindParam(':day_to_display', $day_to_display);
            
            // Execute query
            if ($stmt->execute()) {
                $success_message = "Menu item added successfully";
            } else {
                $error_message = "Failed to add menu item";
            }
        }
    } elseif (isset($_POST['update_item'])) {
        // Update menu item
        $id = htmlspecialchars(strip_tags($_POST['id']));
        $name = htmlspecialchars(strip_tags($_POST['name']));
        $price = htmlspecialchars(strip_tags($_POST['price']));
        $category = htmlspecialchars(strip_tags($_POST['category']));
        $canteen_level = htmlspecialchars(strip_tags($_POST['canteen_level']));
        $unit_num = isset($_POST['unit_num']) ? (int)$_POST['unit_num'] : 1;
        $unit_type = htmlspecialchars(strip_tags($_POST['unit_type']));
        $day_to_display = htmlspecialchars(strip_tags($_POST['day_to_display']));
        
        // Validate input
        if (empty($id) || empty($name) || empty($price) || empty($category) || empty($canteen_level)) {
            $error_message = "Please fill in all fields";
        } else {
            // Prepare query with new fields
            $query = "UPDATE menu_items SET name = :name, price = :price, category = :category, canteen_level = :canteen_level, unit_num = :unit_num, unit_type = :unit_type, day_to_display = :day_to_display WHERE id = :id";
            
            // Prepare statement
            $stmt = $db->prepare($query);
            
            // Bind parameters
            $stmt->bindParam(':id', $id);
            $stmt->bindParam(':name', $name);
            $stmt->bindParam(':price', $price);
            $stmt->bindParam(':category', $category);
            $stmt->bindParam(':canteen_level', $canteen_level);
            $stmt->bindParam(':unit_num', $unit_num);
            $stmt->bindParam(':unit_type', $unit_type);
            $stmt->bindParam(':day_to_display', $day_to_display);
            
            // Execute query
            if ($stmt->execute()) {
                $success_message = "Menu item updated successfully";
            } else {
                $error_message = "Failed to update menu item";
            }
        }
    } elseif (isset($_POST['delete_item'])) {
        // Delete menu item
        $id = htmlspecialchars(strip_tags($_POST['id']));
        
        // Validate input
        if (empty($id)) {
            $error_message = "Invalid menu item ID";
        } else {
            // Prepare query
            $query = "DELETE FROM menu_items WHERE id = :id";
            
            // Prepare statement
            $stmt = $db->prepare($query);
            
            // Bind parameters
            $stmt->bindParam(':id', $id);
            
            // Execute query
            if ($stmt->execute()) {
                $success_message = "Menu item deleted successfully";
            } else {
                $error_message = "Failed to delete menu item";
            }
        }
    }
}

// Get all menu items
$query = "SELECT * FROM menu_items ORDER BY canteen_level, category, name";
$stmt = $db->prepare($query);
$stmt->execute();
$menu_items = $stmt->fetchAll(PDO::FETCH_ASSOC);
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Admin Dashboard - Canteen Menu System</title>
    <style>

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

/* Base Display - Fluid Layout */
html, body {
    width: 100%;
    height: 100%;
    overflow: hidden;
    font-family: var(--font-sans);
    background: var(--cream);
    color: var(--black);
    line-height: 1.4;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
}

/* Main Canvas Wrapper - Fluid Layout */
.app-canvas {
    width: 100%;
    height: 100%;
    background: var(--cream);
    position: relative;
    overflow: hidden;
}

/* Main Container - Chinese Style */
.main-layout {
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: row;
    background: linear-gradient(180deg, var(--cream-light) 0%, var(--cream) 100%);
}

/* Sidebar - Chinese Style */
.sidebar {
    width: 20%;
    min-width: 200px;
    background: linear-gradient(180deg, var(--imperial-red) 0%, var(--imperial-red-dark) 100%);
    padding: var(--spacing-xl);
    border-right: 0.4vw solid var(--gold);
    color: var(--white);
    display: flex;
    flex-direction: column;
    box-shadow: 0.3vw 0 1.5vw rgba(139, 0, 0, 0.3);
}

.sidebar h1 {
    font-size: 1.8vw;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.3);
    border-bottom: 0.2vw solid var(--gold);
    padding-bottom: var(--spacing-md);
    margin-bottom: var(--spacing-lg);
}

.sidebar .mt-4 {
    margin-top: var(--spacing-lg);
}

.sidebar p {
    font-size: 1vw;
    opacity: 0.95;
}

/* Buttons - Chinese Style */
.btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: var(--spacing-sm) var(--spacing-lg);
    background: linear-gradient(135deg, var(--gold) 0%, var(--gold-light) 50%, var(--gold) 100%);
    color: var(--imperial-red);
    border: 0.15vw solid var(--gold-dark);
    border-radius: var(--radius-md);
    font-family: var(--font-sans);
    font-size: 0.9vw;
    font-weight: 600;
    text-decoration: none;
    cursor: pointer;
    transition: all 0.2s;
    box-shadow: 0 0.3vw 0.8vw rgba(212, 175, 55, 0.4);
}

.btn:hover {
    transform: translateY(-0.15vw);
    box-shadow: 0 0.4vw 1vw rgba(212, 175, 55, 0.6);
}

.btn-secondary {
    background: linear-gradient(135deg, var(--white) 0%, var(--gray-light) 100%);
    color: var(--dark-brown);
    border-color: var(--gold);
}

.btn-danger {
    background: linear-gradient(135deg, #dc3545 0%, #c82333 100%);
    color: var(--white);
    border-color: #bd2130;
}

.btn-sm {
    padding: var(--spacing-xs) var(--spacing-sm);
    font-size: 0.75vw;
}

/* Main content area */
.content {
    flex: 1;
    padding: var(--spacing-xl);
    overflow-y: auto;
    overflow-x: hidden;
}

.container {
    max-width: 100%;
}

.container h1 {
    font-size: 2vw;
    font-weight: 700;
    color: var(--imperial-red);
    text-transform: uppercase;
    letter-spacing: 0.1em;
    border-bottom: 0.3vw solid var(--gold);
    padding-bottom: var(--spacing-md);
    margin-bottom: var(--spacing-xl);
}

/* Form Container */
.form-container {
    background: var(--white);
    border: 0.2vw solid var(--gold);
    border-radius: var(--radius-lg);
    padding: var(--spacing-xl);
    margin-bottom: var(--spacing-xl);
    box-shadow: 0 0.5vw 2vw rgba(0, 0, 0, 0.1);
}

.form-container h2 {
    font-size: 1.4vw;
    color: var(--imperial-red);
    margin-bottom: var(--spacing-lg);
    border-bottom: 0.15vw solid var(--gold-light);
    padding-bottom: var(--spacing-sm);
}

/* Form Elements */
.form-group {
    margin-bottom: var(--spacing-lg);
}

.form-label {
    display: block;
    margin-bottom: var(--spacing-sm);
    font-weight: 600;
    color: var(--dark-brown);
    font-size: 0.9vw;
}

.form-input,
.form-select {
    width: 100%;
    padding: var(--spacing-sm) var(--spacing-md);
    background: var(--cream-light);
    border: 0.15vw solid var(--gold);
    border-radius: var(--radius-md);
    font-family: var(--font-sans);
    font-size: 0.9vw;
    transition: border-color 0.2s, box-shadow 0.2s;
}

.form-input:focus,
.form-select:focus {
    outline: none;
    border-color: var(--imperial-red);
    box-shadow: 0 0 0 0.2vw rgba(139, 0, 0, 0.1);
}

/* Table Container */
.table-container {
    background: var(--white);
    border: 0.2vw solid var(--gold);
    border-radius: var(--radius-lg);
    overflow: hidden;
    box-shadow: 0 0.5vw 2vw rgba(0, 0, 0, 0.1);
    margin-bottom: var(--spacing-xl);
}

.table-container h2 {
    font-size: 1.4vw;
    color: var(--imperial-red);
    padding: var(--spacing-lg);
    border-bottom: 0.15vw solid var(--gold-light);
    margin: 0;
}

/* Table */
.table {
    width: 100%;
    border-collapse: collapse;
}

.table th,
.table td {
    padding: var(--spacing-md) var(--spacing-lg);
    text-align: left;
    border-bottom: 0.1vw solid var(--gold-light);
}

.table th {
    font-weight: 700;
    background: linear-gradient(135deg, var(--imperial-red) 0%, var(--imperial-red-dark) 100%);
    color: var(--white);
    text-transform: uppercase;
    letter-spacing: 0.05em;
    font-size: 0.8vw;
}

.table tr:hover {
    background-color: var(--cream-light);
}

.table tr:nth-child(even) {
    background-color: var(--gray-light);
}

.table tr:nth-child(even):hover {
    background-color: var(--cream-light);
}

/* Messages */
.success-message {
    padding: var(--spacing-lg);
    background: linear-gradient(135deg, #28a745 0%, #20c997 100%);
    color: var(--white);
    border: 0.15vw solid #28a745;
    border-radius: var(--radius-md);
    margin-bottom: var(--spacing-lg);
    font-weight: 600;
    font-size: 0.9vw;
}

.error-message {
    padding: var(--spacing-lg);
    background: linear-gradient(135deg, #dc3545 0%, #e74c3c 100%);
    color: var(--white);
    border: 0.15vw solid #dc3545;
    border-radius: var(--radius-md);
    margin-bottom: var(--spacing-lg);
    font-weight: 600;
    font-size: 0.9vw;
}

/* Text utilities */
.text-center {
    text-align: center;
}

.mt-4 {
    margin-top: var(--spacing-lg);
}

.mt-8 {
    margin-top: var(--spacing-2xl);
}

.mb-4 {
    margin-bottom: var(--spacing-lg);
}

/* User Management Section */
.mt-8 h1 {
    font-size: 2vw;
    font-weight: 700;
    color: var(--imperial-red);
    text-transform: uppercase;
    letter-spacing: 0.1em;
    border-bottom: 0.3vw solid var(--gold);
    padding-bottom: var(--spacing-md);
    margin-bottom: var(--spacing-xl);
    margin-top: var(--spacing-2xl);
}

/* Modal Styles */
#edit-modal,
#edit-user-modal {
    display: none;
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(0, 0, 0, 0.7);
    z-index: 1000;
}

#edit-modal > div,
#edit-user-modal > div {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background: var(--white);
    padding: var(--spacing-xl);
    border: 0.3vw solid var(--gold);
    border-radius: var(--radius-lg);
    width: 90%;
    max-width: 600px;
    box-shadow: 0 1vw 4vw rgba(0, 0, 0, 0.3);
}

#edit-modal h2,
#edit-user-modal h2 {
    font-size: 1.4vw;
    color: var(--imperial-red);
    margin-bottom: var(--spacing-lg);
    border-bottom: 0.2vw solid var(--gold);
    padding-bottom: var(--spacing-sm);
}

/* Responsive - Mobile */
@media (max-width: 768px) {
    .main-layout {
        flex-direction: column;
    }
    
    .sidebar {
        width: 100%;
        min-width: auto;
        border-right: none;
        border-bottom: 0.4vw solid var(--gold);
    }
    
    html, body {
        font-size: 2vw;
    }
    
    .sidebar h1 {
        font-size: 3vw;
    }
    
    .sidebar p {
        font-size: 2vw;
    }
    
    .btn {
        font-size: 1.5vw;
    }
    
    .form-label,
    .form-input,
    .form-select {
        font-size: 1.5vw;
    }
    
    .container h1 {
        font-size: 3vw;
    }
    
    .form-container h2,
    .table-container h2 {
        font-size: 2vw;
    }
    
    .table th,
    .table td {
        padding: 1vw;
    }
    
    .table th {
        font-size: 1.2vw;
    }
}

/* Landscape orientation adjustments */
@media (orientation: landscape) {
    .sidebar {
        width: 18%;
        min-width: 180px;
    }
    
    .sidebar h1 {
        font-size: 1.5vw;
    }
}

/* Portrait orientation adjustments */
@media (orientation: portrait) {
    .sidebar {
        width: 25%;
        min-width: 150px;
    }
    
    .sidebar h1 {
        font-size: 2vw;
    }
}

/* Form Grid Layout - Clean organization for Unit Number, Unit Dropdown, Day Selector */
.form-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: var(--spacing-lg);
    margin-bottom: var(--spacing-lg);
}

.form-grid .form-group {
    margin-bottom: 0;
}

.form-grid .form-group:last-child {
    margin-bottom: 0;
}

/* Responsive form grid - 2 columns on tablet */
@media (max-width: 1200px) {
    .form-grid {
        grid-template-columns: repeat(2, 1fr);
    }
}

/* Responsive form grid - 1 column on mobile */
@media (max-width: 768px) {
    .form-grid {
        grid-template-columns: 1fr;
    }
    
    .form-grid .form-group {
        margin-bottom: var(--spacing-md);
    }
}

/* Portrait mode adjustments */
@media (orientation: portrait) and (max-width: 1080px) {
    .form-grid {
        grid-template-columns: repeat(2, 1fr);
    }
}

@media (orientation: portrait) and (max-width: 600px) {
    .form-grid {
        grid-template-columns: 1fr;
    }
}
    </style>
</head>
<body>
    <div class="app-canvas">
        <div class="main-layout">
        <!-- Sidebar -->
        <aside class="sidebar">
            <h1>Admin Dashboard</h1>
            
            <div class="mt-4">
                <p>Welcome, <?php echo htmlspecialchars($_SESSION['username']); ?>!</p>
            </div>
            
            <div class="mt-4">
                <a href="../index_level2.php" class="btn btn-secondary">View Menu Level 2</a>
            </div>
            <div class="mt-4">
                <a href="../index_level3.php" class="btn btn-secondary">View Menu Level 3</a>
            </div>
            <div class="mt-4">
                <a href="../index_level4.php" class="btn btn-secondary">View Menu Level 4</a>
            </div>
            
            <div class="mt-4">
                <form method="POST" action="logout.php">
                    <button type="submit" class="btn btn-danger">Logout</button>
                </form>
            </div>
        </aside>
        
        <!-- Main content area -->
        <main class="content">
            <div class="container">
                <h1>Manage Menu Items</h1>
                
                <?php if (!empty($success_message)): ?>
                    <div class="success-message">
                        <?php echo $success_message; ?>
                    </div>
                <?php endif; ?>
                
                <?php if (!empty($error_message)): ?>
                    <div class="error-message">
                        <?php echo $error_message; ?>
                    </div>
                <?php endif; ?>
                
                <!-- Add New Item Form -->
                <div class="form-container mb-4">
                    <h2>Add New Item</h2>
                    <form method="POST" action="<?php echo htmlspecialchars($_SERVER["PHP_SELF"]); ?>">
                        <div class="form-group">
                            <label for="name" class="form-label">Name</label>
                            <input type="text" id="name" name="name" class="form-input" required>
                        </div>
                        
                        <div class="form-group">
                            <label for="price" class="form-label">Price</label>
                            <input type="number" id="price" name="price" class="form-input" step="0.01" min="0" required>
                        </div>
                        
                        <div class="form-group">
                            <label for="category" class="form-label">Category</label>
                            <select id="category" name="category" class="form-select" required>
                                <option value="Main Course">Main Course</option>
                                <option value="Dessert">Dessert</option>
                                <option value="Beverage">Beverage</option>
                                <option value="Snacks">Snacks</option>
                            </select>
                        </div>
                        
                        <div class="form-group">
                            <label for="canteen_level" class="form-label">Canteen Level</label>
                            <select id="canteen_level" name="canteen_level" class="form-select" required>
                                <option value="2">Level 2</option>
                                <option value="3">Level 3</option>
                                <option value="4">Level 4</option>
                            </select>
                        </div>
                        
                        <!-- Form Grid for Unit Number, Unit Type, and Day Selector -->
                        <div class="form-grid">
                            <div class="form-group">
                                <label for="unit_num" class="form-label">Quantity</label>
                                <input type="number" id="unit_num" name="unit_num" class="form-input" value="1" min="1" required>
                            </div>
                            
                            <div class="form-group">
                                <label for="unit_type" class="form-label">Unit Type</label>
                                <select id="unit_type" name="unit_type" class="form-select" required>
                                    <option value="Piece">Piece</option>
                                    <option value="Set">Set</option>
                                    <option value="Plate">Plate</option>
                                    <option value="Cup">Cup</option>
                                    <option value="Bowl">Bowl</option>
                                    <option value="Pack">Pack</option>
                                    <option value="Bottle">Bottle</option>
                                </select>
                            </div>
                            
                            <div class="form-group">
                                <label for="day_to_display" class="form-label">Display Day</label>
                                <select id="day_to_display" name="day_to_display" class="form-select" required>
                                    <option value="Daily">Daily</option>
                                    <option value="Monday">Monday</option>
                                    <option value="Tuesday">Tuesday</option>
                                    <option value="Wednesday">Wednesday</option>
                                    <option value="Thursday">Thursday</option>
                                    <option value="Friday">Friday</option>
                                    <option value="Saturday">Saturday</option>
                                    <option value="Sunday">Sunday</option>
                                </select>
                            </div>
                        </div>
                        
                        <div class="form-group">
                            <button type="submit" name="add_item" class="btn">Add Item</button>
                        </div>
                    </form>
                </div>
                
                <!-- Menu Items Table -->
                <div class="table-container">
                    <h2>All Menu Items</h2>
                    <table class="table">
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Name</th>
                                <th>Price</th>
                                <th>Category</th>
                                <th>Level</th>
                                <th>Unit</th>
                                <th>Display Day</th>
                                <th>Created At</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            <?php if (count($menu_items) > 0): ?>
                                <?php foreach ($menu_items as $item): ?>
                                    <tr>
                                        <td><?php echo htmlspecialchars($item['id']); ?></td>
                                        <td><?php echo htmlspecialchars($item['name']); ?></td>
                                        <td>$<?php echo htmlspecialchars(number_format($item['price'], 2)); ?></td>
                                        <td><?php echo htmlspecialchars($item['category']); ?></td>
                                        <td><?php echo htmlspecialchars($item['canteen_level']); ?></td>
                                        <td><?php echo htmlspecialchars(($item['unit_num'] ?? 1) . ' ' . ($item['unit_type'] ?? 'Piece')); ?></td>
                                        <td><?php echo htmlspecialchars($item['day_to_display'] ?? 'Daily'); ?></td>
                                        <td><?php echo htmlspecialchars($item['created_at']); ?></td>
                                        <td>
                                            <button class="btn btn-secondary btn-sm" onclick="editItem(<?php echo htmlspecialchars(json_encode($item)); ?>)">Edit</button>
                                            <form method="POST" action="<?php echo htmlspecialchars($_SERVER["PHP_SELF"]); ?>" style="display: inline;">
                                                <input type="hidden" name="id" value="<?php echo htmlspecialchars($item['id']); ?>">
                                                <button type="submit" name="delete_item" class="btn btn-danger btn-sm" onclick="return confirm('Are you sure you want to delete this item?')">Delete</button>
                                            </form>
                                        </td>
                                    </tr>
                                <?php endforeach; ?>
                            <?php else: ?>
                                <tr>
                                    <td colspan="9" class="text-center">No menu items found</td>
                                </tr>
                            <?php endif; ?>
                        </tbody>
                    </table>
                </div>
                
                <!-- Edit Item Modal (hidden by default) -->
                <div id="edit-modal" style="display: none; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background-color: rgba(0, 0, 0, 0.5); z-index: 1000;">
                    <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); background-color: white; padding: 20px; border-radius: 5px; width: 80%; max-width: 500px;">
                        <h2>Edit Menu Item</h2>
                        <form method="POST" action="<?php echo htmlspecialchars($_SERVER["PHP_SELF"]); ?>">
                            <input type="hidden" id="edit-id" name="id">
                            
                            <div class="form-group">
                                <label for="edit-name" class="form-label">Name</label>
                                <input type="text" id="edit-name" name="name" class="form-input" required>
                            </div>
                            
                            <div class="form-group">
                                <label for="edit-price" class="form-label">Price</label>
                                <input type="number" id="edit-price" name="price" class="form-input" step="0.01" min="0" required>
                            </div>
                            
                            <div class="form-group">
                                <label for="edit-category" class="form-label">Category</label>
                                <select id="edit-category" name="category" class="form-select" required>
                                    <option value="Main Course">Main Course</option>
                                    <option value="Dessert">Dessert</option>
                                    <option value="Beverage">Beverage</option>
                                    <option value="Snacks">Snacks</option>
                                </select>
                            </div>
                            
                            <div class="form-group">
                                <label for="edit-canteen_level" class="form-label">Canteen Level</label>
                                <select id="edit-canteen_level" name="canteen_level" class="form-select" required>
                                    <option value="2">Level 2</option>
                                    <option value="3">Level 3</option>
                                    <option value="4">Level 4</option>
                                </select>
                            </div>
                            
                            <div class="form-group">
                                <label for="edit-unit_num" class="form-label">Quantity</label>
                                <input type="number" id="edit-unit_num" name="unit_num" class="form-input" value="1" min="1" required>
                            </div>
                            
                            <div class="form-group">
                                <label for="edit-unit_type" class="form-label">Unit Type</label>
                                <select id="edit-unit_type" name="unit_type" class="form-select" required>
                                    <option value="Piece">Piece</option>
                                    <option value="Set">Set</option>
                                    <option value="Plate">Plate</option>
                                    <option value="Cup">Cup</option>
                                    <option value="Bowl">Bowl</option>
                                    <option value="Pack">Pack</option>
                                    <option value="Bottle">Bottle</option>
                                </select>
                            </div>
                            
                            <div class="form-group">
                                <label for="edit-day_to_display" class="form-label">Display Day</label>
                                <select id="edit-day_to_display" name="day_to_display" class="form-select" required>
                                    <option value="Daily">Daily</option>
                                    <option value="Monday">Monday</option>
                                    <option value="Tuesday">Tuesday</option>
                                    <option value="Wednesday">Wednesday</option>
                                    <option value="Thursday">Thursday</option>
                                    <option value="Friday">Friday</option>
                                    <option value="Saturday">Saturday</option>
                                    <option value="Sunday">Sunday</option>
                                </select>
                            </div>
                            
                            <div class="form-group">
                                <button type="submit" name="update_item" class="btn">Update Item</button>
                                <button type="button" class="btn btn-secondary" onclick="closeEditModal()">Cancel</button>
                            </div>
                        </form>
                    </div>
                </div>
                
                <!-- User Management Section (Admin Only) -->
                <?php if ($user_role === 'admin'): ?>
                <div class="mt-8">
                    <h1>Manage Users</h1>
                    
                    <!-- Add New User Form -->
                    <div class="form-container mb-4">
                        <h2>Add New User</h2>
                        <form method="POST" action="<?php echo htmlspecialchars($_SERVER["PHP_SELF"]); ?>">
                            <div class="form-group">
                                <label for="new_username" class="form-label">Username *</label>
                                <input type="text" id="new_username" name="username" class="form-input" required>
                            </div>
                            
                            <div class="form-group">
                                <label for="new_email" class="form-label">Email</label>
                                <input type="email" id="new_email" name="email" class="form-input">
                            </div>
                            
                            <div class="form-group">
                                <label for="new_password" class="form-label">Password *</label>
                                <input type="password" id="new_password" name="password" class="form-input" required>
                            </div>
                            
                            <div class="form-group">
                                <label for="new_role" class="form-label">Role *</label>
                                <select id="new_role" name="role" class="form-select" required>
                                    <option value="content_manager">Content Manager</option>
                                    <option value="admin">Admin</option>
                                </select>
                            </div>
                            
                            <div class="form-group">
                                <button type="submit" name="add_user" class="btn">Add User</button>
                            </div>
                        </form>
                    </div>
                    
                    <!-- Users Table -->
                    <div class="table-container">
                        <h2>All Users</h2>
                        <table class="table">
                            <thead>
                                <tr>
                                    <th>ID</th>
                                    <th>Username</th>
                                    <th>Email</th>
                                    <th>Role</th>
                                    <th>Created At</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                <?php 
                                // Get all users
                                $query = "SELECT id, username, email, role, created_at FROM users ORDER BY created_at DESC";
                                $stmt = $db->prepare($query);
                                $stmt->execute();
                                $users = $stmt->fetchAll(PDO::FETCH_ASSOC);
                                ?>
                                <?php if (count($users) > 0): ?>
                                    <?php foreach ($users as $user): ?>
                                        <tr>
                                            <td><?php echo htmlspecialchars($user['id']); ?></td>
                                            <td><?php echo htmlspecialchars($user['username']); ?></td>
                                            <td><?php echo htmlspecialchars($user['email']); ?></td>
                                            <td><?php echo htmlspecialchars($user['role']); ?></td>
                                            <td><?php echo htmlspecialchars($user['created_at']); ?></td>
                                            <td>
                                                <button class="btn btn-secondary btn-sm" onclick="editUser(<?php echo htmlspecialchars(json_encode($user)); ?>)">Edit</button>
                                                <?php if ($user['id'] != $_SESSION['user_id']): ?>
                                                <form method="POST" action="<?php echo htmlspecialchars($_SERVER["PHP_SELF"]); ?>" style="display: inline;">
                                                    <input type="hidden" name="id" value="<?php echo htmlspecialchars($user['id']); ?>">
                                                    <button type="submit" name="delete_user" class="btn btn-danger btn-sm" onclick="return confirm('Are you sure you want to delete this user?')">Delete</button>
                                                </form>
                                                <?php endif; ?>
                                            </td>
                                        </tr>
                                    <?php endforeach; ?>
                                <?php else: ?>
                                    <tr>
                                        <td colspan="6" class="text-center">No users found</td>
                                    </tr>
                                <?php endif; ?>
                            </tbody>
                        </table>
                    </div>
                    
                    <!-- Edit User Modal (hidden by default) -->
                    <div id="edit-user-modal" style="display: none; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background-color: rgba(0, 0, 0, 0.5); z-index: 1000;">
                        <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); background-color: white; padding: 20px; border-radius: 5px; width: 80%; max-width: 500px;">
                            <h2>Edit User</h2>
                            <form method="POST" action="<?php echo htmlspecialchars($_SERVER["PHP_SELF"]); ?>">
                                <input type="hidden" id="edit-user-id" name="id">
                                
                                <div class="form-group">
                                    <label for="edit-username" class="form-label">Username *</label>
                                    <input type="text" id="edit-username" name="username" class="form-input" required>
                                </div>
                                
                                <div class="form-group">
                                    <label for="edit-email" class="form-label">Email</label>
                                    <input type="email" id="edit-email" name="email" class="form-input">
                                </div>
                                
                                <div class="form-group">
                                    <label for="edit-role" class="form-label">Role *</label>
                                    <select id="edit-role" name="role" class="form-select" required>
                                        <option value="content_manager">Content Manager</option>
                                        <option value="admin">Admin</option>
                                    </select>
                                </div>
                                
                                <div class="form-group">
                                    <label for="edit-password" class="form-label">New Password (leave blank to keep current)</label>
                                    <input type="password" id="edit-password" name="password" class="form-input">
                                </div>
                                
                                <div class="form-group">
                                    <button type="submit" name="update_user" class="btn">Update User</button>
                                    <button type="button" class="btn btn-secondary" onclick="closeEditUserModal()">Cancel</button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
                <?php endif; ?>
            </div>
        </main>
        </div>
    </div>
    
    <script>
        // Function to open edit modal and populate form
        function editItem(item) {
            document.getElementById('edit-id').value = item.id;
            document.getElementById('edit-name').value = item.name;
            document.getElementById('edit-price').value = item.price;
            document.getElementById('edit-category').value = item.category;
            document.getElementById('edit-canteen_level').value = item.canteen_level;
            document.getElementById('edit-unit_num').value = item.unit_num || 1;
            document.getElementById('edit-unit_type').value = item.unit_type || 'Piece';
            document.getElementById('edit-day_to_display').value = item.day_to_display || 'Daily';
            document.getElementById('edit-modal').style.display = 'block';
        }
        
        // Function to close edit modal
        function closeEditModal() {
            document.getElementById('edit-modal').style.display = 'none';
        }
        
        // Function to open edit user modal and populate form
        function editUser(user) {
            document.getElementById('edit-user-id').value = user.id;
            document.getElementById('edit-username').value = user.username;
            document.getElementById('edit-email').value = user.email || '';
            document.getElementById('edit-role').value = user.role;
            document.getElementById('edit-password').value = '';
            document.getElementById('edit-user-modal').style.display = 'block';
        }
        
        // Function to close edit user modal
        function closeEditUserModal() {
            document.getElementById('edit-user-modal').style.display = 'none';
        }
        
        // Close modal when clicking outside
        window.onclick = function(event) {
            const modal = document.getElementById('edit-modal');
            if (event.target === modal) {
                modal.style.display = 'none';
            }
            const userModal = document.getElementById('edit-user-modal');
            if (event.target === userModal) {
                userModal.style.display = 'none';
            }
        }
    </script>
</body>
</html>
