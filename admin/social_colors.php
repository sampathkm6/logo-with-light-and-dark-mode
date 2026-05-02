<?php
// admin/social_colors.php

require __DIR__ . '/../api/db.php';

$message = "";

// DELETE
if (isset($_GET['delete'])) {
    $id = (int)$_GET['delete'];
    $stmt = $pdo->prepare("DELETE FROM social_colors WHERE id = :id");
    $stmt->execute([':id' => $id]);
    $message = "Color deleted.";
    header("Location: social_colors.php?msg=" . urlencode($message));
    exit;
}

// ADD / UPDATE
// ADD / UPDATE
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $name  = trim($_POST['name'] ?? '');
    $slug  = trim($_POST['slug'] ?? '');
    $color = trim($_POST['color'] ?? '');
    $gradient = trim($_POST['gradient'] ?? ''); // New field
    $id    = isset($_POST['id']) ? (int)$_POST['id'] : 0;

    // default: keep existing icon if no new upload
    $iconPath = trim($_POST['existing_icon'] ?? '');

    // handle new file upload if provided
    if (!empty($_FILES['icon']['name']) && $_FILES['icon']['error'] === UPLOAD_ERR_OK) {
        $uploadDirFS = __DIR__ . '/../public/uploads/social-icons/'; // filesystem path
        $uploadDirWeb = 'uploads/social-icons/'; // web path from /public

        if (!is_dir($uploadDirFS)) {
            mkdir($uploadDirFS, 0777, true);
        }

        $tmpName = $_FILES['icon']['tmp_name'];
        $originalName = $_FILES['icon']['name'];
        $ext = strtolower(pathinfo($originalName, PATHINFO_EXTENSION));

        // simple extension check
        if (in_array($ext, ['png', 'jpg', 'jpeg', 'gif', 'svg'])) {
            $fileName = ($slug !== '' ? $slug : 'icon') . '-' . time() . '.' . $ext;
            $destFS = $uploadDirFS . $fileName;
            if (move_uploaded_file($tmpName, $destFS)) {
                $iconPath = $uploadDirWeb . $fileName;
            }
        }
    }

    if ($name === '' || $slug === '' || $color === '') {
        $message = "All fields (name, slug, color) are required.";
    } else {
        if ($id > 0) {
            // UPDATE
            $stmt = $pdo->prepare("
                UPDATE social_colors
                SET name = :name, slug = :slug, color = :color, gradient = :gradient, icon = :icon
                WHERE id = :id
            ");
            $stmt->execute([
                ':name'  => $name,
                ':slug'  => $slug,
                ':color' => $color,
                ':gradient' => $gradient,
                ':icon'  => $iconPath,
                ':id'    => $id,
            ]);
            $message = "Color updated.";
        } else {
            // INSERT
            $stmt = $pdo->prepare("
                INSERT INTO social_colors (name, slug, color, gradient, icon)
                VALUES (:name, :slug, :color, :gradient, :icon)
            ");
            $stmt->execute([
                ':name'  => $name,
                ':slug'  => $slug,
                ':color' => $color,
                ':gradient' => $gradient,
                ':icon'  => $iconPath,
            ]);
            $message = "Color added.";
        }

        header("Location: social_colors.php?msg=" . urlencode($message));
        exit;
    }
}


// EDIT: load color
$editColor = null;
if (isset($_GET['edit'])) {
    $id = (int)$_GET['edit'];
    $stmt = $pdo->prepare("SELECT * FROM social_colors WHERE id = :id");
    $stmt->execute([':id' => $id]);
    $editColor = $stmt->fetch();
}

$stmt = $pdo->query("SELECT * FROM social_colors ORDER BY name ASC");
$colors = $stmt->fetchAll();

if (isset($_GET['msg']) && !$message) {
    $message = $_GET['msg'];
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Admin - Social Colors</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        h1 { margin-bottom: 10px; }
        table { border-collapse: collapse; width: 100%; margin-top: 20px; }
        th, td { border: 1px solid #ddd; padding: 8px 10px; text-align: left; }
        tr:nth-child(even) { background-color: #f9f9f9; }
        .color-preview { display:inline-block; width:24px; height:24px; border:1px solid #ccc; margin-right:6px; }
        .message { color: green; margin-top: 10px; }
    </style>
</head>
<body>

<h1>Admin – Social Colors</h1>

<p><a href="../public/">← Back to Template Generator</a></p>

<?php if ($message): ?>
    <p class="message"><?= htmlspecialchars($message) ?></p>
<?php endif; ?>



<hr>

<h2><?= $editColor ? "Edit Color" : "Add New Color" ?></h2>

<form method="post" enctype="multipart/form-data">

    <?php if ($editColor): ?>
        <input type="hidden" name="id" value="<?= (int)$editColor['id'] ?>">
    <?php endif; ?>

    <label>
        Name:<br>
        <input type="text" name="name" value="<?= htmlspecialchars($editColor['name'] ?? '') ?>" required>
    </label><br><br>

    <label>
        Slug:<br>
        <input type="text" name="slug" value="<?= htmlspecialchars($editColor['slug'] ?? '') ?>" required>
    </label><br><br>

    <label>
        Hex Color (e.g. #1877F2):<br>
        <input type="text" name="color" value="<?= htmlspecialchars($editColor['color'] ?? '') ?>" required>
    </label><br><br>

    <label>
        Gradient (optional, comma-separated hex, e.g. #FF0000, #0000FF):<br>
        <input type="text" name="gradient" value="<?= htmlspecialchars($editColor['gradient'] ?? '') ?>" placeholder="#Color1, #Color2">
    </label><br><br>
    
    <label>
    Icon image (PNG/JPG):<br>
    <?php if (!empty($editColor['icon'])): ?>
        <img src="../public/<?= htmlspecialchars($editColor['icon']) ?>" alt="" style="height:40px; vertical-align:middle; margin-right:8px;">
    <?php endif; ?>
    <input type="file" name="icon" accept="image/*,.svg">
    <!-- preserve old icon if no new upload -->
    <input type="hidden" name="existing_icon" value="<?= htmlspecialchars($editColor['icon'] ?? '') ?>">
</label><br><br>




    <button type="submit"><?= $editColor ? "Update" : "Add" ?> Color</button>
    <?php if ($editColor): ?>
        <a href="social_colors.php">Cancel</a>
    <?php endif; ?>
</form>

<h2>All Colors (<?= count($colors) ?>)</h2>
<table>
    <thead>
    <tr>
        <th>ID</th>
        <th>Preview</th>
        <th>Name</th>
        <th>Slug</th>
        <th>Color</th>
        <th>Gradient</th>
        <th>Icon</th>
        <th>Actions</th>
    </tr>
    </thead>
    <tbody>
    <?php foreach ($colors as $c): ?>
        <tr>
            <td><?= (int)$c['id'] ?></td>
            <td><span class="color-preview" style="background: <?= htmlspecialchars($c['color']) ?>;"></span></td>
            <td><?= htmlspecialchars($c['name']) ?></td>
            <td><?= htmlspecialchars($c['slug']) ?></td>
            <td><?= htmlspecialchars($c['color']) ?></td>
            <td><?= htmlspecialchars($c['gradient'] ?? '') ?></td>
            <td>
                <?php if (!empty($c['icon'])): ?>
                    <img src="../public/<?= htmlspecialchars($c['icon']) ?>" alt="" style="height:30px;">
                <?php endif; ?>
            </td>
            <td>
                <a href="social_colors.php?edit=<?= (int)$c['id'] ?>">Edit</a> |
                <a href="social_colors.php?delete=<?= (int)$c['id'] ?>" onclick="return confirm('Delete this color?');">Delete</a>
            </td>
        </tr>
    <?php endforeach; ?>
    </tbody>
</table>

</body>
</html>
