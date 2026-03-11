<?php
// Password to verify
$password = "admin123";

// Hash from schema.sql
$hash = '$2y$10$8MJKwDXzUUGNVhJmxwQeG.Zvs0ixm5hGFV0y9oKMYV.A.YlPCaEKK';

// Verify password
if (password_verify($password, $hash)) {
    echo "Password is valid!";
} else {
    echo "Password is invalid!";
    
    // Generate a new hash for admin123
    $new_hash = password_hash($password, PASSWORD_DEFAULT);
    echo "\n\nNew hash for 'admin123': " . $new_hash;
}
?>
