<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\ScamAnalysisController;
use App\Http\Controllers\Api\ScamCaseController;
use App\Http\Controllers\Api\ScamDashboardController;
use App\Http\Controllers\Api\ScamHistoryController;
use App\Http\Controllers\Api\SystemConfigController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);

Route::get('/user', function (Request $request) {
    return response()->success($request->user(), 'user_retrieved');
})->middleware('auth:sanctum');

Route::post('/logout', [AuthController::class, 'logout'])
    ->middleware('auth:sanctum');

Route::prefix('scam')->group(function () {
    Route::get('/config', [SystemConfigController::class, 'index']);

    Route::middleware('throttle:60,1')->group(function () {
        Route::post('/analyze-text', [ScamAnalysisController::class, 'analyzeText']);
        Route::post('/analyze-url', [ScamAnalysisController::class, 'analyzeUrl']);
        Route::post('/analyze-image', [ScamAnalysisController::class, 'analyzeImage']);
    });

    Route::get('/cases', [ScamDashboardController::class, 'cases']);

    // 歷史與統計開放給訪客（於控制器內部判斷登入狀態或訪客 ID），加上 throttle 防止暴力請求
    Route::middleware('throttle:30,1')->group(function () {
        Route::get('/history', [ScamHistoryController::class, 'index']);
        Route::get('/history/{scan}', [ScamHistoryController::class, 'show']);
        Route::get('/stats', [ScamDashboardController::class, 'stats']);
    });

    // 管理員案例庫維護 API（需登入且具備管理員權限）
    Route::middleware(['auth:sanctum', 'admin'])->group(function () {
        Route::post('/cases', [ScamCaseController::class, 'store']);
        Route::put('/cases/{case}', [ScamCaseController::class, 'update']);
        Route::delete('/cases/{case}', [ScamCaseController::class, 'destroy']);
    });
});
