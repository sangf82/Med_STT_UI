import { getRequestConfig } from 'next-intl/server';
import { cookies } from 'next/headers';

export default getRequestConfig(async () => {
    // Try to get locale from cookie, fallback to 'en'
    const cookieStore = await cookies();
    const localeCookie = cookieStore.get('NEXT_LOCALE');

    let locale = 'en';
    if (localeCookie?.value && ['en', 'vi'].includes(localeCookie.value)) {
        locale = localeCookie.value;
    }

    return {
        locale,
        messages: (await import(`./messages/${locale}.json`)).default
    };
});
