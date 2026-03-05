export default function RecordingLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="relative min-h-screen bg-bg-page text-text-primary max-w-md mx-auto w-full shadow-lg">
            {children}
        </div>
    );
}
