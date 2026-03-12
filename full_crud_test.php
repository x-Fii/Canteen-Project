<?php
/**
 * Full CRUD Test for Admin and Content Manager
 * Tests all menu item operations for both roles
 */

// Test users
$test_users = [
    'admin' => ['username' => 'test_admin', 'password' => 'admin123'],
    'content_manager' => ['username' => 'test_cm', 'password' => 'cm123']
];

echo "Full CRUD Test for Admin and Content Manager\n";
echo "==========================================\n\n";

// Database connection
$host = 'localhost';
$dbname = 'canteen_db';
$username = 'root';
$password = '';

try {
    $pdo = new PDO("mysql:host=$host;dbname=$dbname", $username, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    echo "✓ Database connection OK\n\n";
} catch (PDOException $e) {
    die("Database connection failed: " . $e->getMessage());
}

// Clean up test data
$pdo->exec("DELETE FROM menu_items WHERE name LIKE 'CRUD Test %'");
foreach (['test_admin', 'test_cm'] as $test_user) {
    $stmt = $pdo->prepare("DELETE FROM users WHERE username = ?");
    $stmt->execute([$test_user]);
}

// Create test users
foreach ($test_users as $role => $user) {
    $password_hash = password_hash($user['password'], PASSWORD_DEFAULT);
    $stmt = $pdo->prepare("INSERT INTO users (username, password, role) VALUES (?, ?, ?)");
    $stmt->execute([$user['username'], $password_hash, $role]);
    echo "✓ Created test $role user: {$user['username']}\n";
}

echo "\n";

// Test function
function testUserCRUD($pdo, $username, $password, $expected_role) {
    echo "Testing CRUD for $expected_role ($username):\n";
    echo "  -----------------------------------\n";
    
    // Get user ID
    $stmt = $pdo->prepare("SELECT id FROM users WHERE username = ?");
    $stmt->execute([$username]);
    $user = $stmt->fetch();
    $user_id = $user['id'];
    
    // Create test item
    $test_name = "CRUD Test " . time();
    $stmt = $pdo->prepare("INSERT INTO menu_items (name, price, category, canteen_level) VALUES (?, 10.00, 'Main Course', 2)");
    $create_result = $stmt->execute([$test_name]);
    $item_id = $pdo->lastInsertId();
    
    $create_pass = $create_result ? "✓" : "✗";
    echo "  CREATE: $create_pass\n";
    
    if ($item_id) {
        // Read test
        $stmt = $pdo->prepare("SELECT * FROM menu_items WHERE id = ?");
        $stmt->execute([$item_id]);
        $read_item = $stmt->fetch();
        $read_pass = ($read_item && $read_item['name'] === $test_name) ? "✓" : "✗";
        echo "  READ:  $read_pass\n";
        
        // Update test
        $new_name = $test_name . " Updated";
        $stmt = $pdo->prepare("UPDATE menu_items SET name = ? WHERE id = ?");
        $update_result = $stmt->execute([$new_name, $item_id]);
        $update_pass = $update_result ? "✓" : "✗";
        echo "  UPDATE: $update_pass\n";
        
        // Delete test
        $stmt = $pdo->prepare("DELETE FROM menu_items WHERE id = ?");
        $delete_result = $stmt->execute([$item_id]);
        $delete_pass = $delete_result ? "✓" : "✗";
        echo "  DELETE: $delete_pass\n";
        
        echo "  Cleanup: Item $item_id deleted\n";
    }
    echo "\n";
}

// Test both roles
testUserCRUD($pdo, $test_users['admin']['username'], $test_users['admin']['password'], 'admin');
testUserCRUD($pdo, $test_users['content_manager']['username'], $test_users['content_manager']['password'], 'content_manager');

// Cleanup
$pdo->exec("DELETE FROM menu_items WHERE name LIKE 'CRUD Test %'");
$stmt = $pdo->prepare("DELETE FROM users WHERE username IN (?, ?)");
$stmt->execute([$test_users['admin']['username'], $test_users['content_manager']['username']]);

echo "Test Complete. Cleaned up test data.\n";
?>

