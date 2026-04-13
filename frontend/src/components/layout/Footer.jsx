function Footer() {
  return (
    <footer className="mt-16 border-t border-slate-200/70 bg-white/70 py-8 dark:border-slate-800 dark:bg-slate-950/60">
      <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 text-sm text-slate-500 md:flex-row md:items-center md:justify-between">
        <p>© {new Date().getFullYear()} MyChamber. Digital care done right.</p>
        <p>Built for better appointments, calmer workflows, and modern clinics.</p>
      </div>
    </footer>
  );
}

export default Footer;
