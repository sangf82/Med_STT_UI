'use client';

import { useTranslations, useLocale } from 'next-intl';
import { ehrSummaryMockEN, ehrSummaryMockVI } from '@/lib/mockData';

/** Parse EHR data into section array for uniform rendering */
function getEhrSections(data: typeof ehrSummaryMockEN | typeof ehrSummaryMockVI, locale: string) {
    if (locale === 'vi') {
        const d = data as typeof ehrSummaryMockVI;
        return [
            { label: 'One-liner', content: d.oneLiner },
            { label: 'Triệu chứng dương tính', content: d.pertinentPositives },
            { label: 'Triệu chứng âm tính', content: d.pertinentNegatives },
            { label: 'Problem List', content: d.problemList.replace(/\\n/g, '\n') },
        ];
    }
    const d = data as typeof ehrSummaryMockEN;
    return [
        { label: 'Patient Info', content: `Name: ${d.patientInfo.name}\nMRN: ${d.patientInfo.mrn}\nVisit Date: ${d.patientInfo.visitDate}` },
        { label: 'Chief Complaint', content: d.chiefComplaint },
        { label: 'Vitals & Exam', content: `BP: ${d.vitals.bp}\nHR: ${d.vitals.hr}\nECG: ${d.vitals.ecg}` },
        { label: 'Assessment & Plan', content: `Dx: ${d.assessmentPlan.dx}\nRx: ${d.assessmentPlan.rx}\nOrders: ${d.assessmentPlan.orders}\nFollow-up: ${d.assessmentPlan.followUp}` },
    ];
}

export default function EhrSummaryPage() {
    const t = useTranslations('Review');
    const locale = useLocale();

    const data = locale === 'vi' ? ehrSummaryMockVI : ehrSummaryMockEN;
    const sections = getEhrSections(data, locale);

    return (
        <div className="flex flex-col p-6 fade-in gap-5">
            <div className="flex items-center justify-between pb-2">
                <h2 className="text-[18px] font-bold text-text-primary leading-none">{t('ehrSummary')}</h2>
            </div>

            <div className="flex flex-col gap-5 pb-8">
                {sections.map((section, idx) => (
                    <div key={idx} className="flex flex-col relative">
                        <div className="inline-flex items-center self-start bg-section-head-bg border-l-[3px] border-section-head-border px-2 py-1 mb-2 rounded-r-[4px]">
                            <span className="text-[12px] font-bold text-accent-blue tracking-[0.02em]">
                                {section.label}
                            </span>
                        </div>
                        <div className="text-[14px] text-text-secondary leading-[1.6] whitespace-pre-wrap px-1">
                            {section.content}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
