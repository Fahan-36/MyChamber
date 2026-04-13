import { Link } from 'react-router-dom';

function NotFoundPage() {
  return (
    <div className="grid min-h-[70vh] place-items-center px-4">
      <div className="text-center">
        <h1 className="font-display text-6xl font-black text-brand-600">404</h1>
        <p className="mt-3 text-slate-600 dark:text-slate-300">Page not found</p>
        <Link to="/" className="primary-button mt-6">
          Return Home
        </Link>
      </div>
    </div>
  );
}

export default NotFoundPage;
