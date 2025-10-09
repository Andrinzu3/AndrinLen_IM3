<?php
/**
 * TRANSFORM (tolerant)
 * - Holt Rohdaten aus extract.php (wenn nicht übergeben)
 * - Rundet Koordinaten
 * - Nimmt pro Stadt alles, was vorhanden ist (AQI ODER Traffic reicht)
 * - Fehlt etwas, wird das Feld auf null gesetzt – kein kompletter Skip
 */
function transformToIm3Rows(?array $rawAll = null): array
{
    if ($rawAll === null) {
        $extractPath = __DIR__ . '/extract.php';
        if (!is_file($extractPath)) {
            throw new RuntimeException('extract.php nicht gefunden.');
        }
        $rawAll = require $extractPath;
    }

    if (!is_array($rawAll) || empty($rawAll)) {
        return [];
    }

    $rows = [];

    foreach ($rawAll as $bundle) {
        if (!is_array($bundle) || isset($bundle['error'])) {
            continue;
        }

        // Koordinaten (Pflicht)
        $lat = isset($bundle['latitude'])  ? round((float)$bundle['latitude'], 2)  : null;
        $lon = isset($bundle['longitude']) ? round((float)$bundle['longitude'], 2) : null;
        if ($lat === null || $lon === null) {
            continue; // ohne Koordinaten kein Insert
        }

        // Luftqualität (optional)
        $aq = $bundle['air_quality']['current'] ?? [];
        $usAqi = array_key_exists('us_aqi', $aq) ? (int)round((float)$aq['us_aqi']) : null;
        $co    = array_key_exists('carbon_monoxide', $aq) ? (int)round((float)$aq['carbon_monoxide']) : null;
        $o3    = array_key_exists('ozone', $aq) ? (int)round((float)$aq['ozone']) : null;
        $pm25  = array_key_exists('pm2_5', $aq) ? (int)round((float)$aq['pm2_5']) : null;

        // Traffic (optional)
        $fsd = $bundle['traffic']['flowSegmentData'] ?? [];
        $aktGeschw = array_key_exists('currentSpeed',  $fsd) ? (int)round((float)$fsd['currentSpeed'])  : null;
        $freGeschw = array_key_exists('freeFlowSpeed', $fsd) ? (int)round((float)$fsd['freeFlowSpeed']) : null;

        // Mindestens eine Quelle muss etwas liefern (damit nicht alles leer ist)
        if ($usAqi === null && $co === null && $o3 === null && $pm25 === null
            && $aktGeschw === null && $freGeschw === null) {
            // wirklich gar nichts – dann diese Stadt überspringen
            continue;
        }

        $rows[] = [
            'latitude'   => $lat,
            'longitude'  => $lon,
            'us-aqi'     => $usAqi,
            'co'         => $co,
            'o3'         => $o3,
            'pm25'       => $pm25,
            'akt_geschw' => $aktGeschw,
            'fre_geschw' => $freGeschw,
        ];
    }

    return $rows;
}


