<?php
// db.php

try {
    // Create (connect to) SQLite database in file
    $pdo = new PDO('sqlite:menu_database.sqlite');
    // Set errormode to exception
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    $pdo->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);

    // Create table if not exists
    $commands = [
        "CREATE TABLE IF NOT EXISTS menu_items (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            price REAL NOT NULL,
            category TEXT NOT NULL,
            canteen_level TEXT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )"
    ];

    foreach ($commands as $command) {
        $pdo->exec($command);
    }

} catch (PDOException $e) {
    die("Connection failed: " . $e->getMessage());
}
?>
