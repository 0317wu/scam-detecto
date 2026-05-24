<?php

namespace App\Services;

use RuntimeException;
use Symfony\Component\Process\Exception\ProcessTimedOutException;
use Symfony\Component\Process\Process;

class OcrService
{
    public function extractText(string $imagePath): string
    {
        if (! is_file($imagePath)) {
            throw new RuntimeException('ocr_image_not_found');
        }

        $process = new Process([
            config('ocr.tesseract_path'),
            $imagePath,
            'stdout',
            '-l',
            config('ocr.language'),
        ]);
        $process->setTimeout(config('ocr.timeout'));

        try {
            $process->run();
        } catch (ProcessTimedOutException) {
            throw new RuntimeException('ocr_timeout');
        }

        if (! $process->isSuccessful()) {
            throw new RuntimeException('ocr_failed: '.$process->getErrorOutput());
        }

        return trim($process->getOutput());
    }
}
