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

    // Optional: Upsert statt plain Insert (UNIQUE-Index nötig, z. B. latitude,longitude,DATE(timestamp))
    $sql = "
        INSERT INTO im3
            (`latitude`,`longitude`,`us-aqi`,`co`,`o3`,`pm25`,`akt_geschw`,`fre_geschw`)
        VALUES
            (:latitude,:longitude,:us_aqi,:co,:o3,:pm25,:akt_geschw,:fre_geschw)
        -- ON DUPLICATE KEY UPDATE
        --   `us-aqi`=VALUES(`us-aqi`), `co`=VALUES(`co`), `o3`=VALUES(`o3`),
        --   `pm25`=VALUES(`pm25`), `akt_geschw`=VALUES(`akt_geschw`), `fre_geschw`=VALUES(`fre_geschw`)
    ";

    $pdo->beginTransaction();
    $stmt = $pdo->prepare($sql);

    $count = 0;
    foreach ($rows as $r) {
        $stmt->execute([
            ':latitude'    => $r['latitude'],
            ':longitude'   => $r['longitude'],
            ':us_aqi'      => $r['us-aqi'],
            ':co'          => $r['co'],
            ':o3'          => $r['o3'],
            ':pm25'        => $r['pm25'],
            ':akt_geschw'  => $r['akt_geschw'],
            ':fre_geschw'  => $r['fre_geschw'],
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

