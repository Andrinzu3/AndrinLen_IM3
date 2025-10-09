<?php
require_once __DIR__ . '/extract.php';

/**
 * Gibt eine Liste (Array) von Datensaetzen fuer die Tabelle im3 zurueck.
 * Hier: genau EIN Datensatz (spaeter leicht erweiterbar).
 */
function transformToIm3Rows(): array
{
    $raw = extractRawData(); // nutze Defaults oder rufe mit Koordinaten auf

    if (!isset($raw['current'], $raw['latitude'], $raw['longitude'])) {
        throw new RuntimeException('Rohdaten unvollstaendig.');
    }

    $cur = $raw['current'];

    $row = [
        'latitude'    => (float)$raw['latitude'],
        'longitude'   => (float)$raw['longitude'],
        'us-aqi'      => (int)round($cur['us_aqi'] ?? 0),
        'co'          => (int)round($cur['carbon_monoxide'] ?? 0),
        'o3'          => (int)round($cur['ozone'] ?? 0),
        'pm25'        => (int)round($cur['pm2_5'] ?? 0),
        'akt_geschw'  => 0, // Platzhalter
        'fre_geschw'  => 0, // Platzhalter
    ];

    return [$row];
}


