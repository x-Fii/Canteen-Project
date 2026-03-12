<?php
// Start session
session_start();

// Check if user is already logged in
if (isset($_SESSION['user_id'])) {
    // Redirect to dashboard
    header("Location: dashboard.php");
    exit;
}

// Check if form is submitted
$error_message = "";
if ($_SERVER["REQUEST_METHOD"] == "POST") {
    // Include database connection
    include_once '../includes/db.php';
    
    // Create database connection
    $database = new Database();
    $db = $database->getConnection();
    
    // Get form data
    $username = $_POST['username'];
    $password = $_POST['password'];
    
    // Validate input
    if (empty($username) || empty($password)) {
        $error_message = "Please enter both username and password";
    } else {
        // Prepare query
        $query = "SELECT id, username, password, role FROM users WHERE username = :username";
        
        // Prepare statement
        $stmt = $db->prepare($query);
        
        // Bind parameters
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
            if (password_verify($password, $password_hash)) {
                // Set session variables
                $_SESSION['user_id'] = $id;
                $_SESSION['username'] = $username;
                $_SESSION['role'] = $role;
                
                // Redirect to dashboard
                header("Location: dashboard.php");
                exit;
            } else {
                $error_message = "Invalid username or password";
            }
        } else {
            $error_message = "Invalid username or password";
        }
    }
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Admin Login - Canteen Menu System</title>
    <style>
    <?php include_once dirname(__DIR__) . '/assets/css/styles.css'; ?>
    /* Login page specific overrides */
    body {
        display: flex;
        align-items: center;
        justify-content: center;
        min-height: 100vh;
        margin: 0;
        background: #F8F7F7;
    }
    </style>
</head>
<body>
    <div class="login-container">
        <h1 class="login-title">Admin Login</h1>
        
        <?php if (!empty($error_message)): ?>
            <div class="error-message">
                <?php echo $error_message; ?>
            </div>
        <?php endif; ?>
        
        <form method="POST" action="<?php echo htmlspecialchars($_SERVER["PHP_SELF"]); ?>">
            <div class="form-group">
                <label for="username" class="form-label">Username</label>
                <input type="text" id="username" name="username" class="form-input" required>
            </div>
            
            <div class="form-group">
                <label for="password" class="form-label">Password</label>
                <input type="password" id="password" name="password" class="form-input" required>
            </div>
            
            <div class="form-group">
                <button type="submit" class="btn" style="width: 100%;">Login</button>
            </div>
        </form>
        
        <div class="text-center mt-4">
            <a href="../index.php">Back to Menu</a>
        </div>
    </div>
</body>
</html>
