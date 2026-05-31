import { Outlet } from 'react-router-dom';
import Header from './Header';
import ChatbotSidebar from './ChatbotSidebar';
import DisclaimerBanner from './DisclaimerBanner';

export default function Layout() {
    return (
        <div className="flex flex-col h-screen overflow-hidden">
            <Header />
            <DisclaimerBanner />
            <div className="flex flex-1 overflow-hidden min-h-0">
                <main id="main-content" className="flex-1 overflow-auto min-h-0" tabIndex={-1}>
                    <Outlet />
                </main>
                <ChatbotSidebar />
            </div>
        </div>
    );
}
