'use client';

import { Sidebar } from '@/components/Sidebar';
import { FAB } from '@/components/FAB';
import { useAppContext } from '@/context/AppContext';
import { SidebarProvider, useSidebar } from '@/context/SidebarContext';
import { usePathname } from 'next/navigation';

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <SidebarProvider>
            <DashboardShell>{children}</DashboardShell>
        </SidebarProvider>
    );
}

function DashboardShell({ children }: { children: React.ReactNode }) {
    const { isOpen, close } = useSidebar();
    const { profile } = useAppContext();
    const pathname = usePathname();
    const showFAB = pathname === '/dashboard';

    return (
        <div className="relative min-h-screen bg-bg-page text-text-primary max-w-md mx-auto w-full shadow-lg overflow-hidden">
            {children}
            <Sidebar open={isOpen} onClose={close} profile={{ ...profile, subtitle: `${profile.specialty} · ${profile.hospital}` }} />
            {showFAB && <FAB />}
        </div>
    );
}
