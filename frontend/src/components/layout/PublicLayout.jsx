import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import Footer from './Footer';

function PublicLayout() {
  return (
    <div className="min-h-screen">
      <Navbar />
      <main>
        <Outlet />
      </main>
      <Footer />
      <div className="h-8 md:hidden" />
    </div>
  );
}

export default PublicLayout;
