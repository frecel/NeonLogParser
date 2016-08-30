<?php

// the logfile directory
$log_dir = '/home/artur/public_html/neon-log-parser/logs/';
// path to the output file
$output_file = '/home/artur/public_html/neon-log-parser/data.json'
// pick what info is going to be included in the final output of the parser
// setting every value to true is probably not the best idea if the output file
// is going to be publicli accesible since when I tried it the output file
// was over 2MB in size
$country = TRUE;
$date = TRUE;
$request_line = FALSE;
$machine_ID = TRUE;
$status_code = FALSE;
$return_size = FALSE;
$user_agent = FALSE;
?>
