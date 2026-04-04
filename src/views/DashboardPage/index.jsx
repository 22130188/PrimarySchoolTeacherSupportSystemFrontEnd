import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import DashboardSidebar from '../../components/DashboardSidebar';
import HeroSearch from './components/HeroSearch';
import CategoryIcons from './components/CategoryIcons';
import RecentItems from './components/RecentItems';

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      <div className="flex" style={{ paddingTop: '64px' }}>
        <DashboardSidebar />

        <div className="flex-1 flex flex-col min-h-[calc(100vh-64px)]" style={{ marginLeft: '72px' }}>
          <main className="flex-1">
            <HeroSearch />
            <CategoryIcons />
            <div className="border-t border-gray-100" />
            <RecentItems />
          </main>

          <Footer />
        </div>
      </div>
    </div>
  );
}
