<?php
require 'config.php';

$files = scandir($log_dir);

// parse the contents of a logfile
function log_parser($logfile) {
  if (strrpos($logfile, '.log') === strlen($logfile)-4) {
    $file = file($logfile);
  } elseif (strrpos($logfile, '.gz') === strlen($logfile)-3) {
    $file = gzfile($logfile);
  } else {
    return false;
  }
  $parsed_file = array();
  foreach ($file as &$value) {
    $parsed = array();
    // match IP and convert it into a country name
    if ($country) {
      $pattern = '/\d{1,3}\.\d{1,3}.\d{1,3}\.\d{1,3}/';
      preg_match($pattern, $value, $match);
      $parsed['country'] = geoip_country_name_by_name($match[0]);
    }
    // match date
    if ($date) {
      $pattern = '/\[(.*?)\]/';
      preg_match($pattern, $value, $match);
      $pattern_day = '/^\d{1,2}/';
      $pattern_month = '/\/(.*)\//';
      $pattern_year = '/\/(\d*):/';
      $pattern_time = '/:(\d*:\d*:\d*)\s/';
      preg_match($pattern_day, $match[1], $day);
      preg_match($pattern_month, $match[1], $month);
      preg_match($pattern_year, $match[1], $year);
      preg_match($pattern_time, $match[1], $time);
      $parsed['date'] = $month[1] . " " . $day[0] . " " . $year[1] . " " . $time[1] . " GMT";
    }
    // match the whole request line
    if ($request_line) {
      $pattern = '/\"(GET.*?)\"/';
      preg_match($pattern, $value, $match);
      $parsed['request'] = $match[1];
    }
    // match the machine ID
    if ($machine_ID) {
      $pattern = '/meta-release\/(.*)\sH|-lts\/(.*)\sH/';
      preg_match_all($pattern, $value, $match);
      if ($match[1][0] != "") {
        $parsed['machineID'] = $match[1][0];
      } elseif ($match[2][0] != "") {
        $parsed['machineID'] = $match[2][0];
      } else {
        continue;
      }
    }
    // match the status code
    if ($status_code) {
      $pattern = '/"\s(\d{3})\s/';
      preg_match($pattern, $value, $match);
      $parsed['statusCode'] = $match[1];
      $parsed_file[] = $parsed;
    }
    // match the size of object returned
    if ($return_size) {
      $pattern = '/\d{3}\s(\d*)\s/';
      preg_match($pattern, $value, $match);
      $parsed['returnSize'] = $match[1];
    }
    // match the user agent
    if ($user_agent) {
      $pattern = '/"\s"(.*)(?="\n)/';
      preg_match($pattern, $value, $match);
      $parsed['userAgent'] = $match[1];
    }
  }
  return $parsed_file;
}

$log_array = array();
foreach ($files as &$value) {
  if (strpos($value, 'releases.neon.kde.org') === 0){
    $parsed = log_parser($log_dir . $value);
    if ($parsed != false) {
      $log_array = array_merge($log_array, $parsed);
    }
  }
}

//print_r(json_encode($log_array));
file_put_contents($output_file, json_encode($log_array));
?>
