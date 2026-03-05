import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const SUPPORTED_LOCALES = ['en', 'vi'];
const DEFAULT_LOCALE = 'en';

export function middleware(request: NextRequest) {
    const response = NextResponse.next();

    // Set NEXT_LOCALE cookie from Accept-Language on first visit
    if (!request.cookies.get('NEXT_LOCALE')) {
        const acceptLang = request.headers.get('accept-language') ?? '';
        const preferred = acceptLang.split(',').map(l => l.split(';')[0].trim().substring(0, 2));
        const matched = preferred.find(l => SUPPORTED_LOCALES.includes(l)) ?? DEFAULT_LOCALE;
        response.cookies.set('NEXT_LOCALE', matched, { path: '/', maxAge: 31536000 });
    }

    return response;
}

export const config = {
    matcher: ['/((?!_next|api|favicon.ico).*)'],
};
