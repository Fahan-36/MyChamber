import { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import DoctorCard from '../components/doctors/DoctorCard';
import EmptyState from '../components/common/EmptyState';
import LoadingSkeleton from '../components/common/LoadingSkeleton';
import SectionHeader from '../components/common/SectionHeader';
import FilterDropdown from '../components/ui/FilterDropdown';
import SearchBar from '../components/ui/SearchBar';
import doctorService from '../services/doctorService';

function DoctorsPage() {
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState({
    area: '',
    specialization: '',
    maxFee: '',
  });

  useEffect(() => {
    const loadDoctors = async () => {
      setLoading(true);
      try {
        const res = await doctorService.getAll();
        setDoctors(res.data || []);
      } catch (error) {
        toast.error(error.message);
      } finally {
        setLoading(false);
      }
    };

    loadDoctors();
  }, []);

  const specializations = useMemo(() => {
    return [...new Set(doctors.map((doctor) => doctor.specialization).filter(Boolean))];
  }, [doctors]);

  const filteredDoctors = useMemo(() => {
    return doctors.filter((doctor) => {
      // Search filter - matches name and specialization
      const matchSearch = 
        search === '' ||
        `${doctor.name} ${doctor.specialization}`.toLowerCase().includes(search.toLowerCase());

      // Area filter - matches chamber_address
      const matchArea =
        filters.area === '' ||
        (doctor.chamber_address || '').toLowerCase().includes(filters.area.toLowerCase());

      // Specialization filter
      const matchSpecialization =
        filters.specialization === '' ||
        doctor.specialization === filters.specialization;

      // Max fee filter
      const matchMaxFee =
        filters.maxFee === '' ||
        (doctor.consultation_fee && parseFloat(doctor.consultation_fee) <= parseFloat(filters.maxFee));

      return matchSearch && matchArea && matchSpecialization && matchMaxFee;
    });
  }, [doctors, search, filters]);

  return (
    <section className="mx-auto max-w-6xl px-4 py-10">
      <SectionHeader
        title="Find Your Doctor"
        subtitle="Search by name or specialization and book an appointment in moments."
      />

      <div className="mb-6 flex flex-col gap-3 sm:flex-row">
        <div className="flex-1">
          <SearchBar value={search} onChange={setSearch} placeholder="Search doctor by name or field" />
        </div>
        <div className="w-full sm:w-auto sm:min-w-[140px]">
          <FilterDropdown filters={filters} onFiltersChange={setFilters} specializations={specializations} />
        </div>
      </div>

      {loading ? (
        <LoadingSkeleton count={6} />
      ) : filteredDoctors.length ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filteredDoctors.map((doctor, index) => (
            <DoctorCard key={doctor.doctor_id} doctor={doctor} index={index} />
          ))}
        </div>
      ) : (
        <EmptyState title="No doctors found" description="Try adjusting your search or filters." />
      )}
    </section>
  );
}

export default DoctorsPage;
