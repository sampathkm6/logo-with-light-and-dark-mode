<?php
// api/save-image-file.php
header('Content-Type: application/json');

// If you don't need DB here, you can skip db.php
// require __DIR__ . '/db.php';

try {
    $raw = file_get_contents("php://input");
    $data = json_decode($raw, true);

    if (!$data || empty($data['imageData'])) {
        throw new Exception("No imageData provided");
    }

    $imageData  = $data['imageData'];
    $text       = $data['text']       ?? '';
    $bgColor    = $data['bgColor']    ?? '';
    $socialSlug = $data['socialSlug'] ?? 'image';

    // remove "data:image/jpeg;base64," (or png, etc.)
    if (strpos($imageData, 'base64,') !== false) {
        $imageData = substr($imageData, strpos($imageData, 'base64,') + 7);
    }

    $binary = base64_decode($imageData);
    if ($binary === false) {
        throw new Exception("Invalid base64 image data");
    }

    // Filesystem directory (relative to this PHP file)
    $baseDir      = __DIR__ . '/../public/generated-images/';
    $baseUrl      = '/og-service/public/generated-images/';
    
    // Optional subfolder
    $folder = $data['folder'] ?? '';
    // Sanitize folder path (allow alphanumeric, dashes, underscores)
    $folder = preg_replace('/[^a-zA-Z0-9\-_]/', '', $folder);
    
    if (!empty($folder)) {
        $baseDir .= $folder . '/';
        $baseUrl .= $folder . '/';
    }

    $uploadDirFS  = $baseDir;
    $uploadDirURL = $baseUrl;

    if (!is_dir($uploadDirFS)) {
        mkdir($uploadDirFS, 0777, true);
    }

    // Use customFilename if valid, else fallback to socialSlug
    $baseName = !empty($data['customFilename']) ? $data['customFilename'] : ($socialSlug ?: 'image');
    
    // safe slug for filename
    $safeSlug = preg_replace('/[^a-z0-9\-]+/i', '-', $baseName);
    
    // NOTE: If you want to force exact name matching the input without timestamp, remove $timestamp.
    // However, timestamp prevents overwriting. User asked for "same in main text input". 
    // Usually unique is better. I'll keep timestamp but make it cleaner? 
    // Or if "must in url format" implies exact match? 
    // Let's stick to slug + timestamp for safety unless explicitly asked to overwrite.
    // Actually, "uploading image name should be same" might imply EXACT name.
    // Let's try to remove timestamp if it's a custom text upload, to match request "same in main text".
    // But duplicate names will overwrite. Let's assume overwrite is okay or desired for "same name".
    
    $timestamp = date('Ymd-His');
    // $fileName = $safeSlug . '-' . $timestamp . '.jpg';
    
    // User requested EXACT name match (no timestamp)
    $fileName = $safeSlug . '.jpg';

    $fullPath = $uploadDirFS . $fileName;

    if (file_put_contents($fullPath, $binary) === false) {
        throw new Exception("Failed to write image file");
    }

    $fileUrl = $uploadDirURL . $fileName;

    // If you want, you can also insert a DB record here

    echo json_encode([
        'success'  => true,
        'filename' => $fileName,
        'url'      => $fileUrl,
    ]);
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error'   => $e->getMessage(),
    ]);
}
