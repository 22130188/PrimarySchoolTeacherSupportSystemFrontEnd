import { useCallback, useState } from 'react';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import DashboardSidebar from '../../components/DashboardSidebar';
import HeroSearch from './components/HeroSearch';
import RecentItems from './components/RecentItems';
import { useAuthStore } from '../../stores/authStore';

export default function DashboardPage() {
  const roleId = useAuthStore((s) => s.roleId);
  const isStudent = roleId === 1;
  const [filters, setFilters] = useState({
    query: '',
    type: 'all',
    subject: 'all',
    grade: 'all',
    owner: 'all',
    date: 'all',
  });
  const [filterOptions, setFilterOptions] = useState({ owners: [], subjects: [], grades: [] });
  const handleFilterOptionsChange = useCallback((options) => setFilterOptions(options), []);

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      <div className="flex" style={{ paddingTop: '64px' }}>
        <DashboardSidebar />

        <div className="flex-1 flex flex-col min-h-[calc(100vh-64px)]" style={{ marginLeft: '72px' }}>
          <main className="flex-1">
            <HeroSearch
              compact
              filters={filters}
              options={filterOptions}
              onChange={setFilters}
            />

            <RecentItems
              compact={isStudent}
              hideCreate={isStudent}
              defaultViewMode="grid"
              filters={filters}
              onFilterOptionsChange={handleFilterOptionsChange}
              onResetFilters={() => setFilters({ query: '', type: 'all', subject: 'all', grade: 'all', owner: 'all', date: 'all' })}
            />
          </main>

          <Footer />
        </div>
      </div>
    </div>
  );
}
