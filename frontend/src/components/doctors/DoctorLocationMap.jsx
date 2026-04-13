import { ExternalLink, MapPin } from 'lucide-react';

const MIN_ADDRESS_LENGTH = 3;

const normalizeAddress = (address) => {
  if (typeof address !== 'string') return '';

  const trimmed = address.trim();
  if (!trimmed || trimmed.toLowerCase() === 'n/a' || trimmed.length < MIN_ADDRESS_LENGTH) {
    return '';
  }

  return trimmed;
};

const getMapsUrls = (address) => {
  const normalizedAddress = normalizeAddress(address);

  if (!normalizedAddress) {
    return {
      normalizedAddress: '',
      embedUrl: '',
      viewUrl: '',
    };
  }

  const encodedAddress = encodeURIComponent(normalizedAddress);

  return {
    normalizedAddress,
    embedUrl: `https://www.google.com/maps?q=${encodedAddress}&output=embed`,
    viewUrl: `https://www.google.com/maps/search/?api=1&query=${encodedAddress}`,
  };
};

function DoctorLocationMap({ address }) {
  const { normalizedAddress, embedUrl, viewUrl } = getMapsUrls(address);

  return (
    <section className="mt-5 rounded-2xl border border-slate-200/80 bg-slate-50/70 p-4 dark:border-slate-700 dark:bg-slate-900/40">
      <div className="flex items-center justify-between gap-3">
        <h4 className="font-display text-lg font-semibold text-slate-900 dark:text-white">Chamber Location</h4>
        {viewUrl && (
          <a
            href={viewUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:border-brand-300 hover:text-brand-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
            aria-label="Open chamber location in Google Maps"
          >
            View on Google Maps
            <ExternalLink size={14} aria-hidden="true" />
          </a>
        )}
      </div>

      {normalizedAddress ? (
        <>
          <p className="mt-3 flex items-start gap-2 text-sm text-slate-700 dark:text-slate-200">
            <MapPin size={16} className="mt-0.5 shrink-0 text-brand-600 dark:text-brand-300" aria-hidden="true" />
            <span>{normalizedAddress}</span>
          </p>

          <div className="mt-3 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900">
            <iframe
              src={embedUrl}
              title={`Google Map for ${normalizedAddress}`}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              className="h-[300px] w-full md:h-[320px]"
              allowFullScreen
            />
          </div>
        </>
      ) : (
        <div className="mt-3 rounded-2xl border border-dashed border-slate-300 bg-white/70 px-4 py-6 text-center text-sm text-slate-600 dark:border-slate-700 dark:bg-slate-900/40 dark:text-slate-300">
          Location is not available yet.
        </div>
      )}
    </section>
  );
}

export default DoctorLocationMap;