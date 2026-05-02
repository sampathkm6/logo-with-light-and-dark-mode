<?php
// api/update_schema.php
require __DIR__ . '/db.php';

echo "<h1>Database Update</h1>";

try {
    // Check if column exists first to avoid error
    $check = $pdo->query("SHOW COLUMNS FROM social_colors LIKE 'footer_text'");
    if ($check->rowCount() > 0) {
         echo "<p style='color:green'>Column 'footer_text' already exists. No changes needed.</p>";
    } else {
        $pdo->exec("ALTER TABLE social_colors ADD COLUMN footer_text VARCHAR(255) DEFAULT ''");
        echo "<p style='color:green'>Success! Column 'footer_text' has been added to the 'social_colors' table.</p>";
    }

    // Check for 'gradient' column
    $checkGradient = $pdo->query("SHOW COLUMNS FROM social_colors LIKE 'gradient'");
    if ($checkGradient->rowCount() > 0) {
         echo "<p style='color:green'>Column 'gradient' already exists. No changes needed.</p>";
    } else {
        $pdo->exec("ALTER TABLE social_colors ADD COLUMN gradient VARCHAR(255) DEFAULT ''");
        echo "<p style='color:green'>Success! Column 'gradient' has been added to the 'social_colors' table.</p>";
    }
    echo "<p><a href='../public/'>Go back to Home</a> | <a href='../admin/social_colors.php'>Go to Admin</a></p>";
} catch (PDOException $e) {
    echo "<p style='color:red'>Error updating schema: " . htmlspecialchars($e->getMessage()) . "</p>";
}

