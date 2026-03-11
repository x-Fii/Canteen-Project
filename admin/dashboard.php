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

// Initialize variables
$success_message = "";
$error_message = "";

// Handle form submissions
if ($_SERVER["REQUEST_METHOD"] == "POST") {
    // Check which form was submitted
    if (isset($_POST['add_item'])) {
        // Add new menu item
        $name = htmlspecialchars(strip_tags($_POST['name']));
        $price = htmlspecialchars(strip_tags($_POST['price']));
        $category = htmlspecialchars(strip_tags($_POST['category']));
        $canteen_level = htmlspecialchars(strip_tags($_POST['canteen_level']));
        
        // Validate input
        if (empty($name) || empty($price) || empty($category) || empty($canteen_level)) {
            $error_message = "Please fill in all fields";
        } else {
            // Prepare query
            $query = "INSERT INTO menu_items (name, price, category, canteen_level) VALUES (:name, :price, :category, :canteen_level)";
            
            // Prepare statement
            $stmt = $db->prepare($query);
            
            // Bind parameters
            $stmt->bindParam(':name', $name);
            $stmt->bindParam(':price', $price);
            $stmt->bindParam(':category', $category);
            $stmt->bindParam(':canteen_level', $canteen_level);
            
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
        
        // Validate input
        if (empty($id) || empty($name) || empty($price) || empty($category) || empty($canteen_level)) {
            $error_message = "Please fill in all fields";
        } else {
            // Prepare query
            $query = "UPDATE menu_items SET name = :name, price = :price, category = :category, canteen_level = :canteen_level WHERE id = :id";
            
            // Prepare statement
            $stmt = $db->prepare($query);
            
            // Bind parameters
            $stmt->bindParam(':id', $id);
            $stmt->bindParam(':name', $name);
            $stmt->bindParam(':price', $price);
            $stmt->bindParam(':category', $category);
            $stmt->bindParam(':canteen_level', $canteen_level);
            
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
        <!-- Sidebar -->
        <aside class="sidebar">
            <h1>Admin Dashboard</h1>
            
            <div class="mt-4">
                <p>Welcome, <?php echo htmlspecialchars($_SESSION['username']); ?>!</p>
            </div>
            
            <div class="mt-4">
                <a href="../index.php" class="btn btn-secondary">View Menu</a>
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
                            <input type="text" id="category" name="category" class="form-input" required>
                        </div>
                        
                        <div class="form-group">
                            <label for="canteen_level" class="form-label">Canteen Level</label>
                            <select id="canteen_level" name="canteen_level" class="form-select" required>
                                <option value="1">Level 1</option>
                                <option value="2">Level 2</option>
                                <option value="3">Level 3</option>
                            </select>
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
                                    <td colspan="7" class="text-center">No menu items found</td>
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
                                <input type="text" id="edit-category" name="category" class="form-input" required>
                            </div>
                            
                            <div class="form-group">
                                <label for="edit-canteen_level" class="form-label">Canteen Level</label>
                                <select id="edit-canteen_level" name="canteen_level" class="form-select" required>
                                    <option value="1">Level 1</option>
                                    <option value="2">Level 2</option>
                                    <option value="3">Level 3</option>
                                </select>
                            </div>
                            
                            <div class="form-group">
                                <button type="submit" name="update_item" class="btn">Update Item</button>
                                <button type="button" class="btn btn-secondary" onclick="closeEditModal()">Cancel</button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </main>
    </div>
    
    <script>
        // Function to open edit modal and populate form
        function editItem(item) {
            document.getElementById('edit-id').value = item.id;
            document.getElementById('edit-name').value = item.name;
            document.getElementById('edit-price').value = item.price;
            document.getElementById('edit-category').value = item.category;
            document.getElementById('edit-canteen_level').value = item.canteen_level;
            document.getElementById('edit-modal').style.display = 'block';
        }
        
        // Function to close edit modal
        function closeEditModal() {
            document.getElementById('edit-modal').style.display = 'none';
        }
        
        // Close modal when clicking outside
        window.onclick = function(event) {
            const modal = document.getElementById('edit-modal');
            if (event.target === modal) {
                modal.style.display = 'none';
            }
        }
    </script>
</body>
</html>
