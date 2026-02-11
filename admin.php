<?php
require 'db.php';

$message = '';
$editItem = null;

// Handle Delete
if (isset($_GET['delete'])) {
    $id = $_GET['delete'];
    $stmt = $pdo->prepare("DELETE FROM menu_items WHERE id = ?");
    $stmt->execute([$id]);
    header("Location: admin.php");
    exit();
}

// Handle Edit Selection
if (isset($_GET['edit'])) {
    $id = $_GET['edit'];
    $stmt = $pdo->prepare("SELECT * FROM menu_items WHERE id = ?");
    $stmt->execute([$id]);
    $editItem = $stmt->fetch();
}

// Handle Form Submission (Create and Update)
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $name = $_POST['name'];
    $price = $_POST['price'];
    $category = $_POST['category'];
    $canteen_level = $_POST['canteen_level'];
    $id = $_POST['id'] ?? null;

    if ($id) {
        // Update
        $stmt = $pdo->prepare("UPDATE menu_items SET name = ?, price = ?, category = ?, canteen_level = ? WHERE id = ?");
        $stmt->execute([$name, $price, $category, $canteen_level, $id]);
        $message = "Menu item updated successfully!";
    } else {
        // Create
        $stmt = $pdo->prepare("INSERT INTO menu_items (name, price, category, canteen_level) VALUES (?, ?, ?, ?)");
        $stmt->execute([$name, $price, $category, $canteen_level]);
        $message = "Menu item added successfully!";
    }
    
    // Redirect to clear post data/query params if strictly needed, or just stay to show message
    if ($id) {
        header("Location: admin.php"); // Clear edit mode
        exit();
    }
}

// Fetch all items
$stmt = $pdo->query("SELECT * FROM menu_items ORDER BY canteen_level, category, name");
$items = $stmt->fetchAll();

$categories = ['Main Course', 'Dessert', 'Beverage', 'Snacks'];
$levels = ['Level 1', 'Level 2', 'Level 3'];

?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Admin - Food Menu</title>
    <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-gray-100 min-h-screen">

    <nav class="bg-blue-600 text-white p-4 shadow-md">
        <div class="container mx-auto flex justify-between items-center">
            <h1 class="text-2xl font-bold">Canteen Admin Panel</h1>
            <a href="index.php" class="hover:underline">View Live Site</a>
        </div>
    </nav>

    <div class="container mx-auto p-6">
        
        <?php if ($message): ?>
            <div class="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative mb-4" role="alert">
                <span class="block sm:inline"><?php echo htmlspecialchars($message); ?></span>
            </div>
        <?php endif; ?>

        <!-- Input Form -->
        <div class="bg-white rounded-lg shadow-md p-6 mb-8">
            <h2 class="text-xl font-semibold mb-4"><?php echo $editItem ? 'Edit Item' : 'Add New Menu Item'; ?></h2>
            <form action="admin.php" method="POST" class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input type="hidden" name="id" value="<?php echo $editItem['id'] ?? ''; ?>">

                <div>
                    <label class="block text-gray-700 text-sm font-bold mb-2">Food Name</label>
                    <input type="text" name="name" required class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" value="<?php echo htmlspecialchars($editItem['name'] ?? ''); ?>">
                </div>

                <div>
                    <label class="block text-gray-700 text-sm font-bold mb-2">Price</label>
                    <input type="number" step="0.01" name="price" required class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" value="<?php echo htmlspecialchars($editItem['price'] ?? ''); ?>">
                </div>

                <div>
                    <label class="block text-gray-700 text-sm font-bold mb-2">Category</label>
                    <select name="category" required class="shadow border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline">
                        <?php foreach ($categories as $cat): ?>
                            <option value="<?php echo $cat; ?>" <?php echo ($editItem && $editItem['category'] == $cat) ? 'selected' : ''; ?>><?php echo $cat; ?></option>
                        <?php endforeach; ?>
                    </select>
                </div>

                <div>
                    <label class="block text-gray-700 text-sm font-bold mb-2">Canteen Level</label>
                    <select name="canteen_level" required class="shadow border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline">
                        <?php foreach ($levels as $lvl): ?>
                            <option value="<?php echo $lvl; ?>" <?php echo ($editItem && $editItem['canteen_level'] == $lvl) ? 'selected' : ''; ?>><?php echo $lvl; ?></option>
                        <?php endforeach; ?>
                    </select>
                </div>

                <div class="md:col-span-2 flex gap-2">
                    <button type="submit" class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline">
                        <?php echo $editItem ? 'Update Item' : 'Add Item'; ?>
                    </button>
                    <?php if ($editItem): ?>
                        <a href="admin.php" class="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline">Cancel</a>
                    <?php endif; ?>
                </div>
            </form>
        </div>

        <!-- List Items -->
        <div class="bg-white rounded-lg shadow-md overflow-hidden">
            <h2 class="text-xl font-semibold p-6 bg-gray-50 border-b">Menu Items</h2>
            <div class="overflow-x-auto">
                <table class="min-w-full leading-normal">
                    <thead>
                        <tr>
                            <th class="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Level</th>
                            <th class="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Category</th>
                            <th class="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Name</th>
                            <th class="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Price</th>
                            <th class="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        <?php foreach ($items as $item): ?>
                            <tr>
                                <td class="px-5 py-5 border-b border-gray-200 bg-white text-sm">
                                    <span class="relative inline-block px-3 py-1 font-semibold text-green-900 leading-tight">
                                        <span aria-hidden class="absolute inset-0 bg-green-200 opacity-50 rounded-full"></span>
                                        <span class="relative"><?php echo htmlspecialchars($item['canteen_level']); ?></span>
                                    </span>
                                </td>
                                <td class="px-5 py-5 border-b border-gray-200 bg-white text-sm">
                                    <p class="text-gray-900 whitespace-no-wrap"><?php echo htmlspecialchars($item['category']); ?></p>
                                </td>
                                <td class="px-5 py-5 border-b border-gray-200 bg-white text-sm">
                                    <p class="text-gray-900 whitespace-no-wrap font-medium"><?php echo htmlspecialchars($item['name']); ?></p>
                                </td>
                                <td class="px-5 py-5 border-b border-gray-200 bg-white text-sm">
                                    <p class="text-gray-900 whitespace-no-wrap">$<?php echo number_format($item['price'], 2); ?></p>
                                </td>
                                <td class="px-5 py-5 border-b border-gray-200 bg-white text-sm">
                                    <a href="admin.php?edit=<?php echo $item['id']; ?>" class="text-blue-600 hover:text-blue-900 mr-4">Edit</a>
                                    <a href="admin.php?delete=<?php echo $item['id']; ?>" class="text-red-600 hover:text-red-900" onclick="return confirm('Are you sure?')">Delete</a>
                                </td>
                            </tr>
                        <?php endforeach; ?>
                    </tbody>
                </table>
            </div>
        </div>

    </div>
</body>
</html>
