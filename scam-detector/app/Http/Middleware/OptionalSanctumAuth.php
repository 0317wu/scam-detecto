<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Symfony\Component\HttpFoundation\Response;

class OptionalSanctumAuth
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = Auth::guard('sanctum')->user() ?: Auth::guard('web')->user();

        if ($user) {
            $request->setUserResolver(fn () => $user);
        }

        return $next($request);
    }
}
