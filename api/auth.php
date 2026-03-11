<?php
/**
 * Authentication API
 * 
 * Implements login/logout logic using PHP Sessions
 */

// Start session
session_start();

// Set headers for API
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

// Include database connection
include_once '../includes/db.php';

// Create database connection
$database = new Database();
$db = $database->getConnection();

// Get request method
$method = $_SERVER['REQUEST_METHOD'];

// Handle different HTTP methods
if ($method === 'POST') {
    // Get posted data
    $data = json_decode(file_get_contents("php://input"));
    
    // Check if action is provided
    if (!empty($data->action)) {
        switch ($data->action) {
            case 'login':
                // Login user
                loginUser($db, $data);
                break;
            case 'logout':
                // Logout user
                logoutUser();
                break;
            case 'get_users':
                // Get all users (admin only)
                getUsers($db, $data);
                break;
            case 'create_user':
                // Create new user (admin only)
                createUser($db, $data);
                break;
            case 'update_user':
                // Update user (admin only)
                updateUser($db, $data);
                break;
            case 'delete_user':
                // Delete user (admin only)
                deleteUser($db, $data);
                break;
            default:
                // Invalid action
                http_response_code(400);
                echo json_encode(array("message" => "Invalid action."));
                break;
        }
    } else {
        // No action provided
        http_response_code(400);
        echo json_encode(array("message" => "No action provided."));
    }
} else {
    // Method not allowed
    http_response_code(405);
    echo json_encode(array("message" => "Method not allowed"));
}

/**
 * Login user
 * 
 * @param PDO $db Database connection
 * @param object $data Request data
 */
function loginUser($db, $data) {
    // Check if username and password are provided
    if (!empty($data->username) && !empty($data->password)) {
        // Prepare query
        $query = "SELECT id, username, password, role FROM users WHERE username = :username";
        
        // Prepare statement
        $stmt = $db->prepare($query);
        
        // Sanitize and bind data
        $username = htmlspecialchars(strip_tags($data->username));
        $stmt->bindParam(':username', $username);
        
        // Execute query
        $stmt->execute();
        
        // Check if user exists
        if ($stmt->rowCount() > 0) {
            // Get user data
            $row = $stmt->fetch(PDO::FETCH_ASSOC);
            $id = $row['id'];
            $username = $row['username'];
            $password_hash = $row['password'];
            $role = $row['role'];
            
            // Verify password
            if (password_verify($data->password, $password_hash)) {
                // Set session variables
                $_SESSION['user_id'] = $id;
                $_SESSION['username'] = $username;
                $_SESSION['role'] = $role;
                
                // Set response code - 200 OK
                http_response_code(200);
                
                // Return success message
                echo json_encode(array(
                    "message" => "Login successful.",
                    "user" => array(
                        "id" => $id,
                        "username" => $username,
                        "role" => $role
                    )
                ));
            } else {
                // Set response code - 401 Unauthorized
                http_response_code(401);
                
                // Return error message
                echo json_encode(array("message" => "Invalid credentials."));
            }
        } else {
            // Set response code - 401 Unauthorized
            http_response_code(401);
            
            // Return error message
            echo json_encode(array("message" => "Invalid credentials."));
        }
    } else {
        // Set response code - 400 Bad request
        http_response_code(400);
        
        // Return error message
        echo json_encode(array("message" => "Unable to login. Data is incomplete."));
    }
}

/**
 * Logout user
 */
function logoutUser() {
    // Unset all session variables
    $_SESSION = array();
    
    // Destroy the session
    session_destroy();
    
    // Set response code - 200 OK
    http_response_code(200);
    
    // Return success message
    echo json_encode(array("message" => "Logout successful."));
}

/**
 * Check if user is admin
 * 
 * @return bool True if user is admin, false otherwise
 */
function isAdmin() {
    return isset($_SESSION['role']) && $_SESSION['role'] === 'admin';
}

/**
 * Get all users (admin only)
 * 
 * @param PDO $db Database connection
 * @param object $data Request data
 */
function getUsers($db, $data) {
    // Check if user is admin
    if (!isAdmin()) {
        http_response_code(403);
        echo json_encode(array("message" => "Access denied. Admin only."));
        return;
    }
    
    // Prepare query
    $query = "SELECT id, username, email, role, last_login, created_at FROM users ORDER BY created_at DESC";
    
    // Prepare statement
    $stmt = $db->prepare($query);
    
    // Execute query
    $stmt->execute();
    
    // Get all users
    $users = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Set response code - 200 OK
    http_response_code(200);
    
    // Return users
    echo json_encode(array("users" => $users));
}

/**
 * Create new user (admin only)
 * 
 * @param PDO $db Database connection
 * @param object $data Request data
 */
function createUser($db, $data) {
    // Check if user is admin
    if (!isAdmin()) {
        http_response_code(403);
        echo json_encode(array("message" => "Access denied. Admin only."));
        return;
    }
    
    // Check if required fields are provided
    if (!empty($data->username) && !empty($data->password) && !empty($data->role)) {
        // Validate role
        $valid_roles = ['admin', 'content_manager'];
        if (!in_array($data->role, $valid_roles)) {
            http_response_code(400);
            echo json_encode(array("message" => "Invalid role. Must be 'admin' or 'content_manager'."));
            return;
        }
        
        // Sanitize input
        $username = htmlspecialchars(strip_tags($data->username));
        $email = !empty($data->email) ? htmlspecialchars(strip_tags($data->email)) : '';
        $role = htmlspecialchars(strip_tags($data->role));
        $password_hash = password_hash($data->password, PASSWORD_DEFAULT);
        
        // Check if username already exists
        $query = "SELECT id FROM users WHERE username = :username";
        $stmt = $db->prepare($query);
        $stmt->bindParam(':username', $username);
        $stmt->execute();
        
        if ($stmt->rowCount() > 0) {
            http_response_code(400);
            echo json_encode(array("message" => "Username already exists."));
            return;
        }
        
        // Insert new user
        $query = "INSERT INTO users (username, email, password, role) VALUES (:username, :email, :password, :role)";
        $stmt = $db->prepare($query);
        $stmt->bindParam(':username', $username);
        $stmt->bindParam(':email', $email);
        $stmt->bindParam(':password', $password_hash);
        $stmt->bindParam(':role', $role);
        
        if ($stmt->execute()) {
            http_response_code(201);
            echo json_encode(array("message" => "User created successfully.", "user_id" => $db->lastInsertId()));
        } else {
            http_response_code(500);
            echo json_encode(array("message" => "Failed to create user."));
        }
    } else {
        http_response_code(400);
        echo json_encode(array("message" => "Unable to create user. Data is incomplete."));
    }
}

/**
 * Update user (admin only)
 * 
 * @param PDO $db Database connection
 * @param object $data Request data
 */
function updateUser($db, $data) {
    // Check if user is admin
    if (!isAdmin()) {
        http_response_code(403);
        echo json_encode(array("message" => "Access denied. Admin only."));
        return;
    }
    
    // Check if required fields are provided
    if (!empty($data->id) && !empty($data->username)) {
        // Validate role if provided
        if (!empty($data->role)) {
            $valid_roles = ['admin', 'content_manager'];
            if (!in_array($data->role, $valid_roles)) {
                http_response_code(400);
                echo json_encode(array("message" => "Invalid role. Must be 'admin' or 'content_manager'."));
                return;
            }
        }
        
        // Sanitize input
        $id = htmlspecialchars(strip_tags($data->id));
        $username = htmlspecialchars(strip_tags($data->username));
        $email = !empty($data->email) ? htmlspecialchars(strip_tags($data->email)) : '';
        $role = !empty($data->role) ? htmlspecialchars(strip_tags($data->role)) : '';
        
        // Check if username already exists for another user
        $query = "SELECT id FROM users WHERE username = :username AND id != :id";
        $stmt = $db->prepare($query);
        $stmt->bindParam(':username', $username);
        $stmt->bindParam(':id', $id);
        $stmt->execute();
        
        if ($stmt->rowCount() > 0) {
            http_response_code(400);
            echo json_encode(array("message" => "Username already exists."));
            return;
        }
        
        // Build update query
        $query = "UPDATE users SET username = :username, email = :email";
        if (!empty($role)) {
            $query .= ", role = :role";
        }
        if (!empty($data->password)) {
            $password_hash = password_hash($data->password, PASSWORD_DEFAULT);
            $query .= ", password = :password";
        }
        $query .= " WHERE id = :id";
        
        $stmt = $db->prepare($query);
        $stmt->bindParam(':id', $id);
        $stmt->bindParam(':username', $username);
        $stmt->bindParam(':email', $email);
        if (!empty($role)) {
            $stmt->bindParam(':role', $role);
        }
        if (!empty($data->password)) {
            $stmt->bindParam(':password', $password_hash);
        }
        
        if ($stmt->execute()) {
            http_response_code(200);
            echo json_encode(array("message" => "User updated successfully."));
        } else {
            http_response_code(500);
            echo json_encode(array("message" => "Failed to update user."));
        }
    } else {
        http_response_code(400);
        echo json_encode(array("message" => "Unable to update user. Data is incomplete."));
    }
}

/**
 * Delete user (admin only)
 * 
 * @param PDO $db Database connection
 * @param object $data Request data
 */
function deleteUser($db, $data) {
    // Check if user is admin
    if (!isAdmin()) {
        http_response_code(403);
        echo json_encode(array("message" => "Access denied. Admin only."));
        return;
    }
    
    // Check if id is provided
    if (!empty($data->id)) {
        // Prevent deleting own account
        if ($data->id == $_SESSION['user_id']) {
            http_response_code(400);
            echo json_encode(array("message" => "Cannot delete your own account."));
            return;
        }
        
        // Sanitize input
        $id = htmlspecialchars(strip_tags($data->id));
        
        // Delete user
        $query = "DELETE FROM users WHERE id = :id";
        $stmt = $db->prepare($query);
        $stmt->bindParam(':id', $id);
        
        if ($stmt->execute()) {
            http_response_code(200);
            echo json_encode(array("message" => "User deleted successfully."));
        } else {
            http_response_code(500);
            echo json_encode(array("message" => "Failed to delete user."));
        }
    } else {
        http_response_code(400);
        echo json_encode(array("message" => "Unable to delete user. Data is incomplete."));
    }
}
