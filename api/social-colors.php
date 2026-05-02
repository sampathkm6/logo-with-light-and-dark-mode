<?php
// api/social-colors.php
header('Content-Type: application/json');
require __DIR__ . '/db.php';

$search = '';
if (isset($_GET['search'])) {
    $search = trim($_GET['search']);
}

try {
    if ($search === '') {
    $stmt = $pdo->prepare("
        SELECT id, name, slug, color, gradient, icon 
        FROM social_colors 
        ORDER BY name 
        LIMIT 50
    ");
    $stmt->execute();
} else {
    $stmt = $pdo->prepare("
        SELECT id, name, slug, color, gradient, icon 
        FROM social_colors 
        WHERE name LIKE :search 
        ORDER BY name 
        LIMIT 20
    ");
    $param = '%' . $search . '%';
    $stmt->bindParam(':search', $param, PDO::PARAM_STR);
    $stmt->execute();
}

$rows = $stmt->fetchAll();

$items = [];
foreach ($rows as $row) {
    $items[] = [
        'id'    => (int)$row['id'],
        'name'  => $row['name'],
        'slug'  => $row['slug'],
        'color' => $row['color'],
        'gradient' => $row['gradient'] ?? '',
        'icon'  => $row['icon'] ?? '',
    ];
}
echo json_encode(['success' => true, 'items' => $items]);

} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}
