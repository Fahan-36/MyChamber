function AuthShell({ title, subtitle, children }) {
  return (
    <section className="relative grid min-h-[calc(100vh-8rem)] place-items-center overflow-hidden px-4 py-12">
      <div className="absolute -left-14 top-8 h-64 w-64 rounded-full bg-sky-300/20 blur-3xl" />
      <div className="absolute -right-10 bottom-0 h-72 w-72 rounded-full bg-teal-300/20 blur-3xl" />

      <div className="glass-card relative w-full max-w-md rounded-3xl p-6 md:p-8">
        <h1 className="font-display text-3xl font-bold text-slate-900 dark:text-white">{title}</h1>
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">{subtitle}</p>
        <div className="mt-6">{children}</div>
      </div>
    </section>
  );
}

export default AuthShell;
