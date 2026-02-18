import { AccountDeleteSection } from './AccountDeleteSection';
import { NameChangeForm } from './NameChangeForm';
import { PasswordChangeForm } from './PasswordChangeForm';
import { MainLayout } from '~/components/layout';

export function SettingsPage() {
    return (
        <MainLayout title="계정 설정">
            <div className="mx-auto max-w-2xl space-y-6">
                <NameChangeForm />
                <PasswordChangeForm />
                <AccountDeleteSection />
            </div>
        </MainLayout>
    );
}
