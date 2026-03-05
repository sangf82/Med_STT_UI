import { Lock } from 'lucide-react';
import { useTranslations } from 'next-intl';

export function ComplianceFooter() {
    const t = useTranslations('Auth');

    return (
        <div className="flex items-center justify-center gap-[6px] text-text-hint mt-2">
            <Lock className="w-[14px] h-[14px]" />
            <span className="text-[11px] font-medium">{t('hipaa')}</span>
        </div>
    );
}
