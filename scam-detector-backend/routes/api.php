<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\ScamAnalysisController;
use App\Http\Controllers\Api\ScamDashboardController;
use App\Http\Controllers\Api\ScamHistoryController;
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
    Route::post('/analyze-text', [ScamAnalysisController::class, 'analyzeText']);
    Route::post('/analyze-url', [ScamAnalysisController::class, 'analyzeUrl']);
    Route::post('/analyze-image', [ScamAnalysisController::class, 'analyzeImage']);
    Route::get('/cases', [ScamDashboardController::class, 'cases']);

    Route::middleware('auth:sanctum')->group(function () {
        Route::get('/history', [ScamHistoryController::class, 'index']);
        Route::get('/history/{scan}', [ScamHistoryController::class, 'show']);
        Route::get('/stats', [ScamDashboardController::class, 'stats']);
    });
});
