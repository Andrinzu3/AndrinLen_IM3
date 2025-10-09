<?php
declare(strict_types=1);

ini_set('display_errors', '1');
error_reporting(E_ALL);

// Nur CLI oder ?run=1
if (php_sapi_name() !== 'cli' && (($_GET['run'] ?? '') !== '1')) {
    http_response_code(403);
    exit('Forbidden');
}

require_once __DIR__ . '/config.php';
require_once __DIR__ . '/transform.php';

try {
    $pdo = new PDO($dsn, $username, $password, $options);

    $rows = transformToIm3Rows();
    if (!$rows) {
        echo "Keine Daten zu inserieren.\n";
        exit;
    }

    // Falls Spalten NOT NULL sind, hier Defaults setzen (sonst NULL durchlassen)
    foreach ($rows as &$r) {
        $r['latitude']    = isset($r['latitude'])    ? (float)$r['latitude']    : null;
        $r['longitude']   = isset($r['longitude'])   ? (float)$r['longitude']   : null;
        $r['us-aqi']      = array_key_exists('us-aqi', $r) ? (int)$r['us-aqi']   : null;
        $r['co']          = array_key_exists('co', $r)      ? (int)$r['co']      : null;
        $r['o3']          = array_key_exists('o3', $r)      ? (int)$r['o3']      : null;
        $r['pm25']        = array_key_exists('pm25', $r)    ? (int)$r['pm25']    : null;
        $r['akt_geschw']  = array_key_exists('akt_geschw', $r) ? (int)$r['akt_geschw'] : null;
        $r['fre_geschw']  = array_key_exists('fre_geschw', $r) ? (int)$r['fre_geschw'] : null;
    }
    unset($r);

    $sql = "INSERT INTO `im3`
      (`latitude`,`longitude`,`us-aqi`,`co`,`o3`,`pm25`,`akt_geschw`,`fre_geschw`)
      VALUES (?,?,?,?,?,?,?,?)";
    $stmt = $pdo->prepare($sql);

    $pdo->beginTransaction();

    $count = 0;
    foreach ($rows as $row) {
        $stmt->execute([
            $row['latitude'],
            $row['longitude'],
            $row['us-aqi'],
            $row['co'],
            $row['o3'],
            $row['pm25'],
            $row['akt_geschw'],
            $row['fre_geschw'],
        ]);
        $count++;
    }

    $pdo->commit();

    echo "Insert erfolgreich: {$count} Datensatz/saetze eingefügt.\n";

} catch (Throwable $e) {
    if (isset($pdo) && $pdo->inTransaction()) {
        $pdo->rollBack();
    }
    http_response_code(500);
    echo "Fehler beim Insert: " . $e->getMessage() . "\n";
}

