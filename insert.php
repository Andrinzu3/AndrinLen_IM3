<?php
ini_set('display_errors', '1');
error_reporting(E_ALL);

if (php_sapi_name() !== 'cli' && (($_GET['run'] ?? '') !== '1')) {
    http_response_code(403);
    exit('Forbidden');
}

require_once __DIR__ . '/config.php';
require_once __DIR__ . '/transform.php';

try {
    $pdo = new PDO($dsn, $username, $password, $options);
    $pdo->beginTransaction();

    $rows = transformToIm3Rows();

    $sql = "
        INSERT INTO im3
            (`latitude`, `longitude`, `us-aqi`, `co`, `o3`, `pm25`, `akt_geschw`, `fre_geschw`)
        VALUES
            (:latitude, :longitude, :us_aqi, :co, :o3, :pm25, :akt_geschw, :fre_geschw)
    ";
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
    echo "Insert erfolgreich: {$count} Datensatz/saetze eingefuegt.";

} catch (Throwable $e) {
    if (isset($pdo) && $pdo->inTransaction()) {
        $pdo->rollBack();
    }
    http_response_code(500);
    echo "Fehler beim Insert: " . $e->getMessage();
}
