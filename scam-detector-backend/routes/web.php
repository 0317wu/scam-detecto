<?php

use App\Http\Controllers\ProfileController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

// 首頁
Route::get('/', function () {
    return Inertia::render('Dashboard');
})->name('home');

// 儀表板
Route::get('/dashboard', function () {
    return Inertia::render('Dashboard');
})->middleware(['auth', 'verified'])->name('dashboard');

// 歷史紀錄
Route::get('/history', function () {
    return Inertia::render('History');
})->middleware(['auth'])->name('history');

// 知識庫
Route::get('/knowledge', function () {
    return Inertia::render('Knowledge');
})->name('knowledge');

// 個人資料設定
Route::middleware('auth')->group(function () {
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');
});

require __DIR__.'/auth.php';
