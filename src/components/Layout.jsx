import { Outlet } from 'react-router-dom';
import Header from './Header';
import ChatbotSidebar from './ChatbotSidebar';

export default function Layout() {
    return (
        <div className="flex flex-col min-h-screen">
            <Header />
            <div className="flex flex-1 overflow-hidden">
                <main className="flex-1 overflow-auto">
                    <Outlet />
                </main>
                <ChatbotSidebar />
            </div>
        </div>
    );
}
