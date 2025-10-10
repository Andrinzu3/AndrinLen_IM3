
/* ============================================================================
   HANDLUNGSANWEISUNG (unload.php)
   1) Setze Header: Content-Type: application/json; charset=utf-8.
   2) Binde 001_config.php (PDO-Config) ein.
   3) Lies optionale Request-Parameter (z. B. location, limit, from/to) und validiere.
   4) Baue SELECT mit PREPARED STATEMENT (WHERE/ORDER BY/LIMIT je nach Parametern).
   5) Binde Parameter sicher (execute([...]) oder bindValue()).
   6) Hole Datensätze (fetchAll) – optional gruppieren/umformen fürs Frontend.
   7) Antworte IMMER als JSON (json_encode) – auch bei leeren Treffern ([]) .
   8) Setze sinnvolle HTTP-Statuscodes (400 für Bad Request, 404 bei 0 Treffern (Detail), 200 ok).
   9) Fehlerfall: 500 + { "error": "..." } (keine internen Details leaken).
  10) Keine HTML-Ausgabe; keine var_dump in Prod.
   ============================================================================ */

<?php
require_once __DIR__ . '/config.php';

$limit = isset($_GET['limit']) ? max(1, min(200, (int)$_GET['limit'])) : 50;

$pdo = new PDO($dsn, $username, $password, $options);
$sql = "
  SELECT
    id,
    `timestamp`,
    latitude + 0       AS latitude,
    longitude + 0      AS longitude,
    `us-aqi` + 0       AS `us-aqi`,
    co + 0             AS co,
    o3 + 0             AS o3,
    pm25 + 0           AS pm25,
    akt_geschw + 0     AS akt_geschw,
    fre_geschw + 0     AS fre_geschw
  FROM im3
  ORDER BY `timestamp` DESC, id DESC
  LIMIT :lim
";
$stmt = $pdo->prepare($sql);
$stmt->bindValue(':lim', $limit, PDO::PARAM_INT);
$stmt->execute();
$rows = $stmt->fetchAll();

header('Content-Type: application/json; charset=utf-8');
// header('Access-Control-Allow-Origin: https://deine-website.ch');
echo json_encode($rows, JSON_UNESCAPED_SLASHES | JSON_PRETTY_PRINT);
