
/* ============================================================================
   HANDLUNGSANWEISUNG (load.php)
   1) Binde 001_config.php (PDO-Config) ein.
   2) Binde transform.php ein → erhalte TRANSFORM-JSON.
   3) json_decode(..., true) → Array mit Datensätzen.
   4) Stelle PDO-Verbindung her (ERRMODE_EXCEPTION, FETCH_ASSOC).
   5) Bereite INSERT/UPSERT-Statement mit Platzhaltern vor.
   6) Iteriere über Datensätze und führe execute(...) je Zeile aus.
   7) Optional: Transaktion verwenden (beginTransaction/commit) für Performance.
   8) Bei Erfolg: knappe Bestätigung ausgeben (oder still bleiben, je nach Kontext).
   9) Bei Fehlern: Exception fangen → generische Fehlermeldung/Code (kein Stacktrace).
  10) Keine Debug-Ausgaben in Produktion; sensible Daten nicht loggen.
   ============================================================================ */


// Transformations-Skript  als 'transform.php' einbinden

// Dekodiere die JSON-Daten zu einem Array

// Binde die Datenbankkonfiguration ein
<?php
// load.php
require_once 'config.php';     // $dsn, $user, $pass
require_once 'transform.php';  // transformWeatherData() + fetchWeatherData() via extract.php

try {
    $pdo = new PDO($dsn, $user, $pass, [
        PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES   => false,
    ]);

    // 1) Rohdaten holen
    $weatherRaw = fetchWeatherData();

    // 2) Transformieren in DB-Format
    $row = transformWeatherData($weatherRaw);

    // 3) Insert
    $sql = "INSERT INTO `im3`
            (`timestamp`,`latitude`,`longitude`,`us-aqi`,`co`,`o3`,`pm25`,`akt_geschw`,`fre_geschw`)
            VALUES (?,?,?,?,?,?,?,?,?)";
    $stmt = $pdo->prepare($sql);
    $stmt->execute([
        $row['timestamp'],
        $row['latitude'],
        $row['longitude'],
        $row['us-aqi'],
        $row['co'],
        $row['o3'],
        $row['pm25'],
        $row['akt_geschw'],
        $row['fre_geschw'],
    ]);

    echo "Daten erfolgreich eingefuegt.";
} catch (PDOException $e) {
    die("DB-Verbindungsfehler: " . $e->getMessage());
} catch (Throwable $e) {
    die("Fehler: " . $e->getMessage());
}
