<?php
// api/settings.php
header('Content-Type: application/json');

$file = __DIR__ . '/settings.json';

// Ensure file exists
if (!file_exists($file)) {
    file_put_contents($file, json_encode(['footer_text' => '']));
}

// Handle GET (Read)
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    readfile($file);
    exit;
}

// Handle POST (Write)
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);
    
    // Support form-data as well for Admin panel usage which might not send JSON raw
    if (!$input && !empty($_POST)) {
        $input = $_POST;
    }

    $current = json_decode(file_get_contents($file), true) ?? [];
    
    if (isset($input['footer_text'])) {
        $current['footer_text'] = trim($input['footer_text']);
    }
    if (isset($input['footer_col1'])) {
        $current['footer_col1'] = trim($input['footer_col1']);
    }
    if (isset($input['footer_col2'])) {
        $current['footer_col2'] = trim($input['footer_col2']);
    }
    if (isset($input['footer_col3'])) {
        $current['footer_col3'] = trim($input['footer_col3']);
    }

    file_put_contents($file, json_encode($current, JSON_PRETTY_PRINT));
    echo json_encode(['success' => true, 'settings' => $current]);
    exit;
}
