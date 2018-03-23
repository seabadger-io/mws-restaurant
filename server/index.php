<?php
$dataFile = realpath(dirname(__FILE__)) . '/data.json';
$fp = fopen($dataFile, 'r') or die('No data file available');
$json = fread($fp, filesize($dataFile));
fclose($fp);
header('Content-Type: application/json; charset=utf-8');
if (array_key_exists('id', $_GET)) {
    $content = json_decode($json);
    foreach ($content as $item) {
        if ($item->id == $_GET['id']) {
            echo json_encode($item, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_PRETTY_PRINT);
        }
    }
} else {
    echo $json;
}
