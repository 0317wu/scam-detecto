<?php

return [
    'tesseract_path' => env('TESSERACT_PATH', 'tesseract'),
    'language' => env('OCR_LANGUAGE', 'chi_tra+eng'),
    'timeout' => (int) env('OCR_TIMEOUT', 30),
];
