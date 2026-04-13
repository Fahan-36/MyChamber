import { useState, useEffect } from 'react';
import { FileText, Pill, Calendar, Upload, Camera, Save, Edit2, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import appointmentService from '../../services/appointmentService';

// Backend base URL for file access
const BACKEND_URL = 'http://localhost:5000';

function ClinicalDataEditor({ appointment, onUpdate }) {
  const [isEditingDiagnosis, setIsEditingDiagnosis] = useState(false);
  const [isEditingPrescription, setIsEditingPrescription] = useState(false);
  const [isEditingFollowup, setIsEditingFollowup] = useState(false);
  
  const [diagnosisNotes, setDiagnosisNotes] = useState(appointment.diagnosis_notes || '');
  const [prescriptionNotes, setPrescriptionNotes] = useState(appointment.prescription_notes || '');
  const [followupNotes, setFollowupNotes] = useState(appointment.followup_notes || '');
  const [followupDate, setFollowupDate] = useState(appointment.followup_date || '');
  
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [deletingReportId, setDeletingReportId] = useState(null);
  const [reports, setReports] = useState([]);
  const [prescriptionFiles, setPrescriptionFiles] = useState([]);
  const [loadingReports, setLoadingReports] = useState(true);

  // Fetch clinical data including reports on mount
  useEffect(() => {
    const fetchClinicalData = async () => {
      try {
        const result = await appointmentService.getClinicalData(appointment.appointment_id);
        if (result.success && result.data) {
          setDiagnosisNotes(result.data.diagnosis_notes || '');
          setPrescriptionNotes(result.data.prescription_notes || '');
          setFollowupNotes(result.data.followup_notes || '');
          setFollowupDate(result.data.followup_date || '');
          const nextFiles = result.data.reports || [];
          setReports(nextFiles.filter((file) => (file.file_category || 'report') !== 'prescription'));
          setPrescriptionFiles(nextFiles.filter((file) => (file.file_category || 'report') === 'prescription'));
        }
      } catch (error) {
        // Silently fail - appointment may not have clinical data yet
        console.error('Error loading clinical data:', error);
      } finally {
        setLoadingReports(false);
      }
    };
    
    fetchClinicalData();
  }, [appointment.appointment_id]);

  const handleSaveDiagnosis = async () => {
    setSaving(true);
    try {
      await appointmentService.saveDiagnosis(appointment.appointment_id, diagnosisNotes);
      toast.success('Diagnosis notes saved');
      setIsEditingDiagnosis(false);
      if (onUpdate) onUpdate();
    } catch (error) {
      toast.error('Failed to save diagnosis notes');
    } finally {
      setSaving(false);
    }
  };

  const handleSavePrescription = async () => {
    setSaving(true);
    try {
      await appointmentService.savePrescription(appointment.appointment_id, prescriptionNotes);
      toast.success('Prescription saved');
      setIsEditingPrescription(false);
      if (onUpdate) onUpdate();
    } catch (error) {
      toast.error('Failed to save prescription');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveFollowup = async () => {
    setSaving(true);
    try {
      await appointmentService.saveFollowup(appointment.appointment_id, followupNotes, followupDate);
      toast.success('Follow-up notes saved');
      setIsEditingFollowup(false);
      if (onUpdate) onUpdate();
    } catch (error) {
      toast.error('Failed to save follow-up notes');
    } finally {
      setSaving(false);
    }
  };

  const handleFileUpload = async (e, isCamera = false, context = 'report') => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('Only JPG, PNG, and PDF files are allowed');
      return;
    }

    // Validate file size (10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast.error('File size must be less than 10MB');
      return;
    }

    setUploading(true);
    try {
      const category = context === 'prescription' ? 'prescription' : 'report';
      const result = await appointmentService.uploadReport(appointment.appointment_id, file, category);
      toast.success(
        isCamera
          ? 'Photo captured successfully'
          : context === 'prescription'
            ? 'Prescription file uploaded successfully'
            : 'Report uploaded successfully'
      );
      if (category === 'prescription') {
        setPrescriptionFiles((prev) => [result.data, ...prev]);
      } else {
        setReports((prev) => [result.data, ...prev]);
      }
      if (onUpdate) onUpdate();
    } catch (error) {
      toast.error(context === 'prescription' ? 'Failed to upload prescription file' : 'Failed to upload file');
    } finally {
      setUploading(false);
    }
    e.target.value = ''; // Reset input
  };

  const handleDeleteFile = async (file, context = 'report') => {
    if (!file?.report_id) {
      toast.error('Invalid file reference');
      return;
    }

    try {
      setDeletingReportId(file.report_id);
      await appointmentService.deleteReport(file.report_id);

      if (context === 'prescription') {
        setPrescriptionFiles((prev) => prev.filter((item) => item.report_id !== file.report_id));
      } else {
        setReports((prev) => prev.filter((item) => item.report_id !== file.report_id));
      }

      toast.success('File deleted');
      if (onUpdate) onUpdate();
    } catch (error) {
      toast.error(error.message || 'Failed to delete file');
    } finally {
      setDeletingReportId(null);
    }
  };

  return (
    <div className="mt-3 space-y-2">
      {/* Diagnosis Notes */}
      <div className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950">
        <div className="mb-1 flex items-center justify-between">
          <p className="flex items-center gap-1 font-medium text-slate-700 dark:text-slate-200">
            <FileText size={14} /> Diagnosis / Notes
          </p>
          {!isEditingDiagnosis && (
            <button
              type="button"
              onClick={() => setIsEditingDiagnosis(true)}
              className="rounded-lg bg-brand-50 p-1 text-brand-600 hover:bg-brand-100 dark:bg-brand-950 dark:text-brand-400"
              title="Edit diagnosis notes"
            >
              <Edit2 size={14} />
            </button>
          )}
        </div>
        {isEditingDiagnosis ? (
          <div className="mt-2 space-y-2">
            <textarea
              value={diagnosisNotes}
              onChange={(e) => setDiagnosisNotes(e.target.value)}
              placeholder="Enter diagnosis and clinical notes..."
              className="w-full rounded-lg border border-slate-300 bg-white p-2 text-sm outline-none focus:border-brand-400 dark:border-slate-600 dark:bg-slate-900 dark:text-white"
              rows={3}
            />
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleSaveDiagnosis}
                disabled={saving}
                className="flex items-center gap-1 rounded-lg bg-brand-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-brand-600 disabled:opacity-50"
              >
                <Save size={12} /> {saving ? 'Saving...' : 'Save'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setDiagnosisNotes(appointment.diagnosis_notes || '');
                  setIsEditingDiagnosis(false);
                }}
                className="rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <p className="text-slate-600 dark:text-slate-300">
            {diagnosisNotes || <span className="italic text-slate-400">No diagnosis notes added. Click edit to add.</span>}
          </p>
        )}
      </div>

      {/* Prescription Notes */}
      <div className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950">
        <div className="mb-1 flex items-center justify-between">
          <p className="flex items-center gap-1 font-medium text-slate-700 dark:text-slate-200">
            <Pill size={14} /> Prescriptions
          </p>
          {!isEditingPrescription && (
            <button
              type="button"
              onClick={() => setIsEditingPrescription(true)}
              className="rounded-lg bg-brand-50 p-1 text-brand-600 hover:bg-brand-100 dark:bg-brand-950 dark:text-brand-400"
              title="Edit prescription"
            >
              <Edit2 size={14} />
            </button>
          )}
        </div>

        <div className="mb-2 rounded-lg border border-slate-200 bg-slate-50 p-2 dark:border-slate-700 dark:bg-slate-900/60">
          <p className="mb-2 text-xs font-medium text-slate-600 dark:text-slate-300">Attach prescription file</p>
          <div className="flex gap-2">
            <label className="flex-1 cursor-pointer">
              <input
                type="file"
                accept="image/*,.pdf"
                onChange={(e) => handleFileUpload(e, false, 'prescription')}
                disabled={uploading}
                className="hidden"
              />
              <div className="flex items-center justify-center gap-1 rounded-lg border border-dashed border-slate-300 bg-white px-2 py-1.5 text-xs text-slate-600 hover:border-brand-400 hover:bg-brand-50 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-300">
                <Upload size={12} /> {uploading ? 'Uploading...' : 'Upload File'}
              </div>
            </label>

            <label className="cursor-pointer">
              <input
                type="file"
                accept="image/*"
                capture="environment"
                onChange={(e) => handleFileUpload(e, true, 'prescription')}
                disabled={uploading}
                className="hidden"
              />
              <div className="flex items-center gap-1 rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-xs text-slate-600 hover:bg-slate-100 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-300">
                <Camera size={12} /> Camera
              </div>
            </label>
          </div>
          {loadingReports ? (
            <p className="mt-2 text-xs italic text-slate-400">Loading prescription files...</p>
          ) : prescriptionFiles.length > 0 ? (
            <div className="mt-2 space-y-1">
              {prescriptionFiles.map((file, idx) => (
                <div key={idx} className="flex items-center justify-between text-xs">
                  <a
                    href={`${BACKEND_URL}${file.file_path}`}
                    target="_blank"
                    rel="noreferrer"
                    className="truncate text-brand-600 hover:underline dark:text-brand-400"
                  >
                    {file.file_name}
                  </a>
                  <button
                    type="button"
                    onClick={() => handleDeleteFile(file, 'prescription')}
                    disabled={deletingReportId === file.report_id}
                    className="ml-2 inline-flex items-center gap-1 rounded-md border border-rose-200 px-2 py-1 text-[11px] font-medium text-rose-600 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-rose-800/60 dark:text-rose-300 dark:hover:bg-rose-950/40"
                  >
                    <Trash2 size={11} />
                    {deletingReportId === file.report_id ? 'Deleting...' : 'Delete'}
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p className="mt-2 text-xs italic text-slate-400">No prescription files uploaded yet.</p>
          )}
        </div>

        {isEditingPrescription ? (
          <div className="mt-2 space-y-2">
            <textarea
              value={prescriptionNotes}
              onChange={(e) => setPrescriptionNotes(e.target.value)}
              placeholder="Enter prescription details..."
              className="w-full rounded-lg border border-slate-300 bg-white p-2 text-sm outline-none focus:border-brand-400 dark:border-slate-600 dark:bg-slate-900 dark:text-white"
              rows={3}
            />

            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleSavePrescription}
                disabled={saving}
                className="flex items-center gap-1 rounded-lg bg-brand-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-brand-600 disabled:opacity-50"
              >
                <Save size={12} /> {saving ? 'Saving...' : 'Save'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setPrescriptionNotes(appointment.prescription_notes || '');
                  setIsEditingPrescription(false);
                }}
                className="rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <p className="text-slate-600 dark:text-slate-300">
            {prescriptionNotes || <span className="italic text-slate-400">No prescription added. Click edit to add.</span>}
          </p>
        )}
      </div>

      <div className="grid gap-2 md:grid-cols-2">
        {/* Uploaded Reports */}
        <div className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950">
          <p className="mb-2 font-medium text-slate-700 dark:text-slate-200">Uploaded Reports</p>
          
          <div className="space-y-2">
            {/* Upload Options */}
            <div className="flex gap-2">
              <label className="flex-1 cursor-pointer">
                <input
                  type="file"
                  accept="image/*,.pdf"
                  onChange={(e) => handleFileUpload(e, false)}
                  disabled={uploading}
                  className="hidden"
                />
                <div className="flex items-center justify-center gap-1 rounded-lg border border-dashed border-slate-300 bg-slate-50 px-2 py-1.5 text-xs text-slate-600 hover:border-brand-400 hover:bg-brand-50 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-300">
                  <Upload size={12} /> {uploading ? 'Uploading...' : 'Upload'}
                </div>
              </label>
              
              <label className="cursor-pointer">
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={(e) => handleFileUpload(e, true)}
                  disabled={uploading}
                  className="hidden"
                />
                <div className="flex items-center gap-1 rounded-lg border border-slate-300 bg-slate-50 px-2 py-1.5 text-xs text-slate-600 hover:bg-slate-100 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-300">
                  <Camera size={12} /> Camera
                </div>
              </label>
            </div>

            {/* Reports List */}
            {loadingReports ? (
              <p className="text-xs italic text-slate-400">Loading reports...</p>
            ) : reports.length > 0 ? (
              <div className="space-y-1">
                {reports.map((report, idx) => (
                  <div key={idx} className="flex items-center justify-between text-xs">
                    <a
                      href={`${BACKEND_URL}${report.file_path}`}
                      target="_blank"
                      rel="noreferrer"
                      className="truncate text-brand-600 hover:underline dark:text-brand-400"
                    >
                      {report.file_name}
                    </a>
                    <button
                      type="button"
                      onClick={() => handleDeleteFile(report, 'report')}
                      disabled={deletingReportId === report.report_id}
                      className="ml-2 inline-flex items-center gap-1 rounded-md border border-rose-200 px-2 py-1 text-[11px] font-medium text-rose-600 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-rose-800/60 dark:text-rose-300 dark:hover:bg-rose-950/40"
                    >
                      <Trash2 size={11} />
                      {deletingReportId === report.report_id ? 'Deleting...' : 'Delete'}
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs italic text-slate-400">No reports uploaded yet.</p>
            )}
          </div>
        </div>

        {/* Follow-up Notes */}
        <div className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950">
          <div className="mb-1 flex items-center justify-between">
            <p className="flex items-center gap-1 font-medium text-slate-700 dark:text-slate-200">
              <Calendar size={14} /> Follow-up
            </p>
            {!isEditingFollowup && (
              <button
                type="button"
                onClick={() => setIsEditingFollowup(true)}
                className="rounded-lg bg-brand-50 p-1 text-brand-600 hover:bg-brand-100 dark:bg-brand-950 dark:text-brand-400"
                title="Edit follow-up"
              >
                <Edit2 size={14} />
              </button>
            )}
          </div>
          {isEditingFollowup ? (
            <div className="mt-2 space-y-2">
              <input
                type="date"
                value={followupDate}
                onChange={(e) => setFollowupDate(e.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white p-2 text-xs outline-none focus:border-brand-400 dark:border-slate-600 dark:bg-slate-900 dark:text-white"
              />
              <textarea
                value={followupNotes}
                onChange={(e) => setFollowupNotes(e.target.value)}
                placeholder="Follow-up notes..."
                className="w-full rounded-lg border border-slate-300 bg-white p-2 text-xs outline-none focus:border-brand-400 dark:border-slate-600 dark:bg-slate-900 dark:text-white"
                rows={2}
              />
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleSaveFollowup}
                  disabled={saving}
                  className="flex items-center gap-1 rounded-lg bg-brand-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-brand-600 disabled:opacity-50"
                >
                  <Save size={12} /> {saving ? 'Saving...' : 'Save'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setFollowupNotes(appointment.followup_notes || '');
                    setFollowupDate(appointment.followup_date || '');
                    setIsEditingFollowup(false);
                  }}
                  className="rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-1 text-xs text-slate-600 dark:text-slate-300">
              {followupDate && <p>📅 {new Date(followupDate).toLocaleDateString()}</p>}
              {followupNotes && <p>{followupNotes}</p>}
              {!followupDate && !followupNotes && (
                <p className="italic text-slate-400">No follow-up scheduled. Click edit to add.</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default ClinicalDataEditor;
