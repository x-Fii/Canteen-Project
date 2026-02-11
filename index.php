<?php
require 'db.php';

// Get selected level, default to 'Level 1'
$selectedLevel = $_GET['level'] ?? 'Level 1';
$levels = ['Level 1', 'Level 2', 'Level 3'];
$categories = ['Main Course', 'Dessert', 'Beverage', 'Snacks'];

// Fetch items for the selected level
$stmt = $pdo->prepare("SELECT * FROM menu_items WHERE canteen_level = ? ORDER BY category, name");
$stmt->execute([$selectedLevel]);
$allItems = $stmt->fetchAll();

// Organize items by category
$menuByCategory = [];
foreach ($categories as $cat) {
    $menuByCategory[$cat] = [];
}
foreach ($allItems as $item) {
    $menuByCategory[$item['category']][] = $item;
}

?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Daily Food Menu</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <style>
        .level-btn.active {
            background-color: #2563eb;
            color: white;
        }
    </style>
</head>
<body class="bg-gray-50 font-sans leading-normal tracking-normal flex flex-col min-h-screen">

    <!-- Header -->
    <header class="bg-white shadow">
        <div class="container mx-auto px-6 py-4 flex justify-between items-center">
            <div class="flex items-center">
                <svg class="h-8 w-8 text-blue-600 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
                <span class="font-bold text-xl text-gray-800">Campus Canteen Menu</span>
            </div>
            <a href="admin.php" class="text-gray-500 hover:text-blue-600 text-sm">Admin Login</a>
        </div>
    </header>

    <!-- Level Selection -->
    <div class="bg-white border-b">
        <div class="container mx-auto px-6 py-4">
            <h2 class="text-gray-600 text-sm font-bold uppercase mb-2">Select Canteen Level:</h2>
            <div class="flex flex-wrap gap-2">
                <?php foreach ($levels as $lvl): ?>
                    <a href="?level=<?php echo urlencode($lvl); ?>" 
                       class="level-btn px-4 py-2 rounded-full border border-blue-600 text-blue-600 hover:bg-blue-600 hover:text-white transition duration-300 ease-in-out <?php echo $selectedLevel === $lvl ? 'active' : ''; ?>">
                        <?php echo $lvl; ?>
                    </a>
                <?php endforeach; ?>
            </div>
        </div>
    </div>

    <!-- Menu Display -->
    <div class="flex-1 container mx-auto px-6 py-8">
        <h3 class="text-2xl font-bold text-gray-800 mb-6 text-center">Menu for <?php echo htmlspecialchars($selectedLevel); ?></h3>
        
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <?php foreach ($categories as $category): ?>
                <div class="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300">
                    <div class="bg-blue-600 p-4">
                        <h4 class="text-white font-bold text-lg text-center uppercase tracking-wider"><?php echo $category; ?></h4>
                    </div>
                    <div class="p-6">
                        <?php if (empty($menuByCategory[$category])): ?>
                            <p class="text-gray-500 text-center italic">No items available today.</p>
                        <?php else: ?>
                            <ul class="space-y-3">
                                <?php foreach ($menuByCategory[$category] as $item): ?>
                                    <li class="flex justify-between items-start border-b border-gray-100 pb-2 last:border-0 last:pb-0">
                                        <div class="flex items-start">
                                            <span class="text-blue-500 mr-2 mt-1.5">•</span>
                                            <span class="text-gray-700 font-medium"><?php echo htmlspecialchars($item['name']); ?></span>
                                        </div>
                                        <span class="text-green-600 font-bold ml-2 whitespace-nowrap">RM <?php echo number_format($item['price'], 2); ?></span>
                                    </li>
                                <?php endforeach; ?>
                            </ul>
                        <?php endif; ?>
                    </div>
                </div>
            <?php endforeach; ?>
        </div>
    </div>
</body>

<footer class="bg-gray-800 text-white py-6 mt-auto">
        <div class="container mx-auto px-6 text-center">
            <p>&copy; <?php echo date('Y'); ?> Campus Canteen. All rights reserved.</p>
        </div>
</footer>

</html>
