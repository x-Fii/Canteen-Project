<?php
/**
 * Menu API
 * 
 * REST API to handle GET (fetch by level), POST (create), PUT (update), and DELETE (remove) operations
 * for menu items.
 */

// Set headers for API
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

// Include database connection
include_once '../includes/db.php';

// Create database connection
$database = new Database();
$db = $database->getConnection();

// Get request method
$method = $_SERVER['REQUEST_METHOD'];

// Handle different HTTP methods
switch ($method) {
    case 'GET':
        // Get menu items by level
        getMenuItems($db);
        break;
    case 'POST':
        // Create a new menu item
        createMenuItem($db);
        break;
    case 'PUT':
        // Update an existing menu item
        updateMenuItem($db);
        break;
    case 'DELETE':
        // Delete a menu item
        deleteMenuItem($db);
        break;
    default:
        // Method not allowed
        http_response_code(405);
        echo json_encode(array("message" => "Method not allowed"));
        break;
}

/**
 * Get menu items by level
 * 
 * @param PDO $db Database connection
 */
function getMenuItems($db) {
    // Check if level parameter is provided
    $level = isset($_GET['level']) ? $_GET['level'] : null;
    
    // Prepare query
    $query = "SELECT * FROM menu_items";
    
    // Add level filter if provided
    if ($level !== null) {
        $query .= " WHERE canteen_level = :level";
        
        // Add is_available filter if not in admin mode
        if (!isset($_GET['admin'])) {
            $query .= " AND is_available = TRUE";
        }
    } else {
        // Add is_available filter if not in admin mode
        if (!isset($_GET['admin'])) {
            $query .= " WHERE is_available = TRUE";
        }
    }
    
    $query .= " ORDER BY category, name";
    
    // Prepare statement
    $stmt = $db->prepare($query);
    
    // Bind parameters if level is provided
    if ($level !== null) {
        $stmt->bindParam(':level', $level);
    }
    
    // Execute query
    $stmt->execute();
    
    // Check if any menu items found
    if ($stmt->rowCount() > 0) {
        // Menu items array
        $menu_items = array();
        
        // Fetch records
        while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
            $menu_item = array(
                "id" => $row['id'],
                "name" => $row['name'],
                "price" => $row['price'],
                "category" => $row['category'],
                "canteen_level" => $row['canteen_level'],
                "description" => $row['description'] ?? '',
                "is_available" => (bool)$row['is_available'],
                "created_at" => $row['created_at'],
                "updated_at" => $row['updated_at']
            );
            
            array_push($menu_items, $menu_item);
        }
        
        // Set response code - 200 OK
        http_response_code(200);
        
        // Return menu items
        echo json_encode($menu_items);
    } else {
        // Set response code - 404 Not found
        http_response_code(404);
        
        // No menu items found
        echo json_encode(array("message" => "No menu items found."));
    }
}

/**
 * Create a new menu item
 * 
 * @param PDO $db Database connection
 */
function createMenuItem($db) {
    // Get posted data
    $data = json_decode(file_get_contents("php://input"));
    
    // Check if data is complete
    if (
        !empty($data->name) &&
        !empty($data->price) &&
        !empty($data->category) &&
        !empty($data->canteen_level)
    ) {
        // Prepare query
        $query = "INSERT INTO menu_items
                  SET name = :name,
                      price = :price,
                      category = :category,
                      canteen_level = :canteen_level,
                      description = :description,
                      is_available = :is_available";
        
        // Prepare statement
        $stmt = $db->prepare($query);
        
        // Sanitize and bind data
        $name = htmlspecialchars(strip_tags($data->name));
        $price = htmlspecialchars(strip_tags($data->price));
        $category = htmlspecialchars(strip_tags($data->category));
        $canteen_level = htmlspecialchars(strip_tags($data->canteen_level));
        $description = isset($data->description) ? htmlspecialchars(strip_tags($data->description)) : '';
        $is_available = isset($data->is_available) ? (bool)$data->is_available : true;
        
        $stmt->bindParam(':name', $name);
        $stmt->bindParam(':price', $price);
        $stmt->bindParam(':category', $category);
        $stmt->bindParam(':canteen_level', $canteen_level);
        $stmt->bindParam(':description', $description);
        $stmt->bindParam(':is_available', $is_available, PDO::PARAM_BOOL);
        
        // Execute query
        if ($stmt->execute()) {
            // Set response code - 201 Created
            http_response_code(201);
            
            // Return success message
            echo json_encode(array("message" => "Menu item was created."));
        } else {
            // Set response code - 503 Service unavailable
            http_response_code(503);
            
            // Return error message
            echo json_encode(array("message" => "Unable to create menu item."));
        }
    } else {
        // Set response code - 400 Bad request
        http_response_code(400);
        
        // Return error message
        echo json_encode(array("message" => "Unable to create menu item. Data is incomplete."));
    }
}

/**
 * Update an existing menu item
 * 
 * @param PDO $db Database connection
 */
function updateMenuItem($db) {
    // Get posted data
    $data = json_decode(file_get_contents("php://input"));
    
    // Check if ID is provided
    if (!empty($data->id)) {
        // Prepare query
        $query = "UPDATE menu_items
                  SET name = :name,
                      price = :price,
                      category = :category,
                      canteen_level = :canteen_level,
                      description = :description,
                      is_available = :is_available
                  WHERE id = :id";
        
        // Prepare statement
        $stmt = $db->prepare($query);
        
        // Sanitize and bind data
        $id = htmlspecialchars(strip_tags($data->id));
        $name = htmlspecialchars(strip_tags($data->name));
        $price = htmlspecialchars(strip_tags($data->price));
        $category = htmlspecialchars(strip_tags($data->category));
        $canteen_level = htmlspecialchars(strip_tags($data->canteen_level));
        $description = isset($data->description) ? htmlspecialchars(strip_tags($data->description)) : '';
        $is_available = isset($data->is_available) ? (bool)$data->is_available : true;
        
        $stmt->bindParam(':id', $id);
        $stmt->bindParam(':name', $name);
        $stmt->bindParam(':price', $price);
        $stmt->bindParam(':category', $category);
        $stmt->bindParam(':canteen_level', $canteen_level);
        $stmt->bindParam(':description', $description);
        $stmt->bindParam(':is_available', $is_available, PDO::PARAM_BOOL);
        
        // Execute query
        if ($stmt->execute()) {
            // Set response code - 200 OK
            http_response_code(200);
            
            // Return success message
            echo json_encode(array("message" => "Menu item was updated."));
        } else {
            // Set response code - 503 Service unavailable
            http_response_code(503);
            
            // Return error message
            echo json_encode(array("message" => "Unable to update menu item."));
        }
    } else {
        // Set response code - 400 Bad request
        http_response_code(400);
        
        // Return error message
        echo json_encode(array("message" => "Unable to update menu item. No ID provided."));
    }
}

/**
 * Delete a menu item
 * 
 * @param PDO $db Database connection
 */
function deleteMenuItem($db) {
    // Get posted data
    $data = json_decode(file_get_contents("php://input"));
    
    // Check if ID is provided
    if (!empty($data->id)) {
        // Prepare query
        $query = "DELETE FROM menu_items WHERE id = :id";
        
        // Prepare statement
        $stmt = $db->prepare($query);
        
        // Sanitize and bind data
        $id = htmlspecialchars(strip_tags($data->id));
        $stmt->bindParam(':id', $id);
        
        // Execute query
        if ($stmt->execute()) {
            // Set response code - 200 OK
            http_response_code(200);
            
            // Return success message
            echo json_encode(array("message" => "Menu item was deleted."));
        } else {
            // Set response code - 503 Service unavailable
            http_response_code(503);
            
            // Return error message
            echo json_encode(array("message" => "Unable to delete menu item."));
        }
    } else {
        // Set response code - 400 Bad request
        http_response_code(400);
        
        // Return error message
        echo json_encode(array("message" => "Unable to delete menu item. No ID provided."));
    }
}
