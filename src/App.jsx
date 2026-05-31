import { useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import useAppStore from './store/useAppStore';
import Layout from './components/Layout';
import DataInputScreen from './pages/DataInputScreen';
import DashboardScreen from './pages/DashboardScreen';
import ReportScreen from './pages/ReportScreen';
import MapScreen from './pages/MapScreen';
import StrategyDetailScreen from './pages/StrategyDetailScreen';
import LoginScreen from './pages/LoginScreen';
import PrivacyScreen from './pages/PrivacyScreen';

export default function App() {
  const { initDark, isLoggedIn, hydrateFromServer, clearAuth } = useAppStore();

  useEffect(() => {
    initDark();
  }, [initDark]);

  // 로그인 상태면 서버 동기화 + 로그아웃 이벤트 감지
  useEffect(() => {
    if (isLoggedIn()) {
      hydrateFromServer();
    }

    const onLogout = () => clearAuth();
    window.addEventListener('auth:logout', onLogout);
    return () => window.removeEventListener('auth:logout', onLogout);
  }, []);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginScreen />} />
        <Route path="/privacy" element={<PrivacyScreen />} />
        <Route element={<Layout />}>
          <Route path="/" element={<DataInputScreen />} />
          <Route path="/dashboard" element={<DashboardScreen />} />
          <Route path="/report" element={<ReportScreen />} />
          <Route path="/map" element={<MapScreen />} />
          <Route path="/strategy" element={<StrategyDetailScreen />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
