

/* ============================================================================
   HANDLUNGSANWEISUNG (transform.php)
   0) Schau dir die Rohdaten genau an und plane exakt, wie du die Daten umwandeln möchtest (auf Papier)
   1) Binde extract.php ein und erhalte das Rohdaten-Array.
   2) Definiere Mapping Koordinaten → Anzeigename (z. B. Bern/Chur/Zürich).
   3) Konvertiere Einheiten (z. B. °F → °C) und runde sinnvoll (Celsius = (Fahrenheit - 32) * 5 / 9).
   4) Leite eine einfache "condition" ab (z. B. sonnig/teilweise bewölkt/bewölkt/regnerisch).
   5) Baue ein kompaktes, flaches Array je Standort mit den Ziel-Feldern.
   6) Optional: Sortiere die Werte (z. B. nach Zeit), entferne irrelevante Felder.
   7) Validiere Pflichtfelder (location, temperature_celsius, …).
   8) Kodieren: json_encode(..., JSON_PRETTY_PRINT) → JSON-String.
   9) GIB den JSON-String ZURÜCK (return), nicht ausgeben – für den Load-Schritt.
  10) Fehlerfälle als Exception nach oben weiterreichen (kein HTML/echo).
   ============================================================================ */

<?php
require_once 'extract.php';

function transformWeatherData(array $rawData, float $lat = 28.6214, float $lon = 77.2148): array
{
    if (!isset($rawData['current'])) {
        throw new RuntimeException('Fehler: Keine "current" Daten in der Open-Meteo-Antwort.');
    }

    $current = $rawData['current'];

    if (empty($current['time'])) {
        throw new RuntimeException('Fehler: Kein Zeitstempel gefunden.');
    }

    $timestamp = strtotime($current['time'] . ' UTC');
    if ($timestamp === false) {
        throw new RuntimeException('Fehler beim Konvertieren des Zeitstempels.');
    }

    $us_aqi = isset($current['us_aqi']) ? (int)round($current['us_aqi']) : null;
    $co     = isset($current['carbon_monoxide']) ? (int)round($current['carbon_monoxide']) : null;
    $o3     = isset($current['ozone']) ? (int)round($current['ozone']) : null;
    $pm25   = isset($current['pm2_5']) ? (int)round($current['pm2_5']) : null;

    return [
        'timestamp'   => $timestamp,
        'latitude'    => $lat,
        'longitude'   => $lon,
        'us-aqi'      => $us_aqi,
        'co'          => $co,
        'o3'          => $o3,
        'pm25'        => $pm25,
        'akt_geschw'  => null,
        'fre_geschw'  => null,
    ];
}

