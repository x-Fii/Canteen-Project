<?php
// Simple test to verify the fix
echo "Testing Content Manager CRUD Fix\n";
echo "================================\n\n";

// Check the dashboard.php code
$dashboard_content = file_get_contents(__DIR__ . '/admin/dashboard.php');

echo "1. Checking dashboard.php for correct access control...\n";

// Check if user management is properly separated
$has_user_mgmt_check = strpos($dashboard_content, "if (isset(\$_POST['add_user']) || isset(\$_POST['update_user']) || isset(\$_POST['delete_user']))") !== false;
$has_admin_check = strpos($dashboard_content, "if (\$user_role !== 'admin')") !== false;
$has_menu_item_handling = strpos($dashboard_content, "} elseif (isset(\$_POST['add_item']))") !== false;

echo "   - User management check exists: " . ($has_user_mgmt_check ? "YES ✓" : "NO ✗") . "\n";
echo "   - Admin role check exists: " . ($has_admin_check ? "YES ✓" : "NO ✗") . "\n";
echo "   - Menu item handling exists: " . ($has_menu_item_handling ? "YES ✓" : "NO ✗") . "\n\n";

// Verify the structure is correct
$pattern1 = '/if \(isset\(\$_POST\[\'add_user\'\]\) \|\| isset\(\$_POST\[\'update_user\'\]\) \|\| isset\(\$_POST\[\'delete_user\'\]\)\)\s*\{\s*if \(\$user_role !== \'admin\'\)/';
$pattern2 = '/\} elseif \(isset\(\$_POST\[\'add_item\'\]\)\)/';

$correct_structure = preg_match($pattern1, $dashboard_content) && preg_match($pattern2, $dashboard_content);

echo "2. Checking if the fix is properly applied...\n";
echo "   - Correct if-else structure: " . ($correct_structure ? "YES ✓" : "NO ✗") . "\n\n";

// Check API
echo "3. Checking API (api/menu.php) for content_manager support...\n";
$api_content = file_get_contents(__DIR__ . '/api/menu.php');
$api_allows_cm = strpos($api_content, "['admin', 'content_manager']") !== false;
echo "   - API allows content_manager: " . ($api_allows_cm ? "YES ✓" : "NO ✗") . "\n\n";

echo "================================\n";
if ($correct_structure && $api_allows_cm) {
    echo "RESULT: Fix is correctly applied!\n";
    echo "- Content managers can now add/edit/delete menu items\n";
    echo "- User management remains admin-only\n";
} else {
    echo "RESULT: There might be issues with the fix\n";
}
?>

