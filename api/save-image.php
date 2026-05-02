<?php
// api/save-image.php
header('Content-Type: application/json');
require __DIR__ . '/db.php';

try {
    $raw = file_get_contents("php://input");
    $data = json_decode($raw, true);

    if (!$data || !isset($data['imageData'])) {
        throw new Exception('No imageData provided');
    }

    $text       = $data['text']       ?? '';
    $bgColor    = $data['bgColor']    ?? '';
    $socialSlug = $data['socialSlug'] ?? null;
    $imageData  = $data['imageData'];

    // strip "data:image/png;base64,..."
    if (strpos($imageData, 'base64,') !== false) {
        $imageData = substr($imageData, strpos($imageData, 'base64,') + 7);
    }

    $binary = base64_decode($imageData);
    if ($binary === false) {
        throw new Exception('Invalid base64 image');
    }

    $stmt = $pdo->prepare("
        INSERT INTO template_images (text_value, bg_color, social_slug, image_data)
        VALUES (:text_value, :bg_color, :social_slug, :image_data)
    ");

    $stmt->bindParam(':text_value', $text);
    $stmt->bindParam(':bg_color', $bgColor);
    $stmt->bindParam(':social_slug', $socialSlug);
    $stmt->bindParam(':image_data', $binary, PDO::PARAM_LOB);

    $stmt->execute();
    $id = $pdo->lastInsertId();

    echo json_encode(['success' => true, 'id' => (int)$id]);
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}
