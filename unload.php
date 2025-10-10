

<?php

require_once "config.php";

header('Content-Type: application/json');

try {
    $pdo = new PDO($dsn, $username, $password, $options);

    $sql = "SELECT * FROM im3";
    $stmt = $pdo->prepare($sql);
    $stmt->execute();
    $results = $stmt->fetchAll();

    echo json_encode($results, JSON_PRETTY_PRINT);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(["error" => "Datenbankfehler: " . $e->getMessage()]);
    exit;
}