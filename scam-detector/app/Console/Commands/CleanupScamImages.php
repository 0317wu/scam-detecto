<?php

namespace App\Console\Commands;

use App\Models\ScamScan;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Storage;

class CleanupScamImages extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'scam:cleanup-images';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Clean up scan images that are no longer referenced by any ScamScan record';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info('Starting cleanup of unreferenced scam images...');

        // 取得所有位於 scam-images 目錄下的檔案
        $files = Storage::disk('public')->files('scam-images');
        $deletedCount = 0;

        foreach ($files as $file) {
            // 確認該圖片是否被任何一筆 ScamScan 記錄引用
            $isReferenced = ScamScan::where('image_path', $file)->exists();

            if (! $isReferenced) {
                Storage::disk('public')->delete($file);
                $this->line("Deleted unreferenced image: {$file}");
                $deletedCount++;
            }
        }

        $this->info("Cleanup completed. Deleted {$deletedCount} unreferenced images.");
    }
}
