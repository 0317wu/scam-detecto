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

// 歷史紀錄頁面（開放給訪客與登入使用者）
Route::get('/history', function () {
    return Inertia::render('History');
})->name('history');

// 知識庫
Route::get('/knowledge', function () {
    return Inertia::render('Knowledge');
})->name('knowledge');

// 案例管理員介面（僅限登入的管理員）
Route::get('/cases-manager', function () {
    if (! auth()->user()?->is_admin) {
        abort(403, 'Unauthorized.');
    }
    return Inertia::render('CasesManager');
})->middleware(['auth'])->name('cases-manager');

// 掃描紀錄總管（僅限登入的管理員）
Route::get('/scans-manager', function () {
    if (! auth()->user()?->is_admin) {
        abort(403, 'Unauthorized.');
    }
    return Inertia::render('ScansManager');
})->middleware(['auth'])->name('scans-manager');

// 個人資料設定
Route::middleware('auth')->group(function () {
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');
});

require __DIR__.'/auth.php';
