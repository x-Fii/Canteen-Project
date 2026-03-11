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
