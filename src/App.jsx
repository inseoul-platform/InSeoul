import { useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import useAppStore from './store/useAppStore';
import Layout from './components/Layout';
import DataInputScreen from './pages/DataInputScreen';
import DashboardScreen from './pages/DashboardScreen';
import ReportScreen from './pages/ReportScreen';
import MapScreen from './pages/MapScreen';
import StrategyDetailScreen from './pages/StrategyDetailScreen';

export default function App() {
  const { initDark } = useAppStore();

  // 다크모드 초기 적용 (localStorage 복원)
  useEffect(() => {
    initDark();
  }, [initDark]);

  return (
    <BrowserRouter>
      <Routes>
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
