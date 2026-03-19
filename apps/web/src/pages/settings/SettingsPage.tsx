import { AccountDeleteSection } from './AccountDeleteSection';
import { DonationSection } from './DonationSection';
import { MembersSection } from './MembersSection';
import { NameChangeForm } from './NameChangeForm';
import { PasswordChangeForm } from './PasswordChangeForm';
import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { MainLayout } from '~/components/layout';

export function SettingsPage() {
    const { hash } = useLocation();

    useEffect(() => {
        if (!hash) return;
        const el = document.querySelector(hash);
        if (el) el.scrollIntoView({ behavior: 'smooth' });
    }, [hash]);

    return (
        <MainLayout title="계정 설정">
            <div className="mx-auto max-w-2xl space-y-6">
                <NameChangeForm />
                <PasswordChangeForm />
                <MembersSection />
                <DonationSection />
                <AccountDeleteSection />
            </div>
        </MainLayout>
    );
}
