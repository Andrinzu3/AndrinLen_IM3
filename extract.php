<?php
/**
 * Holt Luftqualitaetsdaten. Wenn API nicht erreichbar ist, nutzt Fallback-JSON.
 * Aufruf: extractRawData($lat, $lon) oder ohne Parameter (Delhi-Default).
 */
function extractRawData(float $lat = 28.599998, float $lon = 77.20001): array
{
    // 1) Erst API versuchen
    $base  = 'https://air-quality-api.open-meteo.com/v1/air-quality';
    $query = [
        'latitude'  => $lat,
        'longitude' => $lon,
        'current'   => 'us_aqi,ozone,carbon_monoxide,pm2_5',
        'timezone'  => 'UTC',
    ];
    $url = $base . '?' . http_build_query($query);

    $ch = curl_init($url);
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_CONNECTTIMEOUT => 5,
        CURLOPT_TIMEOUT        => 10,
        CURLOPT_FOLLOWLOCATION => true,
        CURLOPT_MAXREDIRS      => 3,
        CURLOPT_HTTPHEADER     => ['Accept: application/json'],
        CURLOPT_USERAGENT      => 'im3-etl/1.0',
    ]);
    $resp = curl_exec($ch);
    $http = $resp === false ? 0 : (int)curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    if ($resp !== false && $http >= 200 && $http < 300) {
        $data = json_decode($resp, true);
        if (json_last_error() === JSON_ERROR_NONE
            && isset($data['current'], $data['latitude'], $data['longitude'])) {
            return $data;
        }
    }

    // 2) Fallback-JSON (deine gelieferten Rohdaten)
    $json = '{"latitude":28.599998,"longitude":77.20001,"generationtime_ms":0.23996829986572266,"utc_offset_seconds":0,"timezone":"GMT","timezone_abbreviation":"GMT","elevation":217.0,"current_units":{"time":"iso8601","interval":"seconds","us_aqi":"USAQI","ozone":"μg/m³","carbon_monoxide":"μg/m³","pm2_5":"μg/m³"},"current":{"time":"2025-10-06T12:00","interval":900,"us_aqi":160,"ozone":134.0,"carbon_monoxide":570.0,"pm2_5":46.6}}';
    $fallback = json_decode($json, true);
    if (json_last_error() !== JSON_ERROR_NONE) {
        throw new RuntimeException('Fallback-JSON ungueltig: ' . json_last_error_msg());
    }
    return $fallback;
}

