import { useState, useEffect } from 'react';
import api from '../utils/api';
import { useAuth } from '../state/AuthContext';
import ReportPreviewModal from '../components/ReportPreviewModal';

export default function SchoolSettings() {
  const { token } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [previewData, setPreviewData] = useState(null);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });
  const [settings, setSettings] = useState({
    name: '',
    address: '',
    location: '',
    phone_number: '',
    email: '',
    website: '',
    motto: '',
    score_entry_mode: 'CLASS_TEACHER',
    grade_scale_a_min: 80,
    grade_scale_b_min: 70,
    grade_scale_c_min: 60,
    grade_scale_d_min: 50,
    grade_scale_f_min: 0,
    show_position_in_class: true,
    show_student_photos: true,
    class_teacher_signature_required: true,
    show_headteacher_signature: true,
    report_template: 'STANDARD',
    current_academic_year: ''
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await api.get('/schools/settings/', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSettings(response.data);
    } catch (error) {
      console.error('Error fetching settings:', error);
      setMessage({
        text: 'Failed to load school settings',
        type: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    let processedValue = value;
    
    // Handle URL field - convert empty string to null for backend
    if (name === 'website' && value.trim() === '') {
      processedValue = '';
    }
    
    setSettings(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : processedValue
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage({ text: '', type: '' });

    try {
      // Clean up data before sending
      const cleanedSettings = { ...settings };
      
      // Convert empty website to null
      if (!cleanedSettings.website || cleanedSettings.website.trim() === '') {
        cleanedSettings.website = null;
      }

      // Only send fields the API accepts (avoid unknown-field errors)
      const allowedKeys = [
        'id','name','address','location','phone_number','email','logo','motto','website','current_academic_year',
        'score_entry_mode','is_active',
        'report_template','report_header_text','report_footer_text',
        'show_class_average','show_position_in_class','show_attendance','show_behavior_comments',
        'principal_signature','class_teacher_signature_required','show_student_photos','show_headteacher_signature',
        'grade_scale_a_min','grade_scale_b_min','grade_scale_c_min','grade_scale_d_min','grade_scale_f_min'
      ];
      const payload = Object.fromEntries(
        Object.entries(cleanedSettings).filter(([k]) => allowedKeys.includes(k))
      );

      await api.patch('/schools/settings/', payload, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMessage({
        text: 'School settings updated successfully!',
        type: 'success'
      });
    } catch (error) {
      console.error('Error updating settings:', error);
      const data = error?.response?.data;
      let friendly = 'Failed to update settings';
      if (data) {
        if (typeof data === 'string') friendly = data;
        else if (data.detail) friendly = data.detail;
        else {
          const key = Object.keys(data)[0];
          if (key) {
            const val = Array.isArray(data[key]) ? data[key][0] : data[key];
            friendly = `${key}: ${val}`;
          }
        }
      }
      setMessage({ text: friendly, type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const handlePreviewTemplate = async () => {
    setLoadingPreview(true);
    try {
      const response = await api.get('/reports/preview_data/', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setPreviewData(response.data);
      setShowPreview(true);
    } catch (error) {
      console.error('Error loading preview:', error);
      setMessage({
        text: 'Failed to load template preview',
        type: 'error'
      });
    } finally {
      setLoadingPreview(false);
    }
  };

  if (loading) {
    return (
      <div className="container mt-4">
        <div className="text-center">
          <div className="spinner-border" role="status">
            <span className="sr-only">Loading...</span>
          </div>
          <p>Loading school settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mt-4">
      <div className="row justify-content-center">
        <div className="col-md-8">
          <div className="card">
            <div className="card-header">
              <h4 className="mb-0">School Settings</h4>
            </div>
            <div className="card-body">
              {message.text && (
                <div className={`alert ${message.type === 'success' ? 'alert-success' : 'alert-danger'} alert-dismissible`}>
                  {message.text}
                  <button
                    type="button"
                    className="btn-close"
                    onClick={() => setMessage({ text: '', type: '' })}
                  ></button>
                </div>
              )}

              <form onSubmit={handleSubmit}>
                {/* Basic Information */}
                <div className="mb-4">
                  <h5>Basic Information</h5>
                  <div className="row">
                    <div className="col-md-6 mb-3">
                      <label htmlFor="name" className="form-label">School Name *</label>
                      <input
                        type="text"
                        className="form-control"
                        id="name"
                        name="name"
                        value={settings.name}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                    <div className="col-md-6 mb-3">
                      <label htmlFor="current_academic_year" className="form-label">Academic Year *</label>
                      <input
                        type="text"
                        className="form-control"
                        id="current_academic_year"
                        name="current_academic_year"
                        value={settings.current_academic_year}
                        onChange={handleInputChange}
                        placeholder="e.g., 2023-2024"
                        required
                      />
                    </div>
                  </div>

                  <div className="mb-3">
                    <label htmlFor="address" className="form-label">Address</label>
                    <textarea
                      className="form-control"
                      id="address"
                      name="address"
                      rows="2"
                      value={settings.address}
                      onChange={handleInputChange}
                    ></textarea>
                  </div>

                  <div className="mb-3">
                    <label htmlFor="location" className="form-label">Location/City</label>
                    <input
                      type="text"
                      className="form-control"
                      id="location"
                      name="location"
                      value={settings.location}
                      onChange={handleInputChange}
                    />
                  </div>

                  <div className="row">
                    <div className="col-md-4 mb-3">
                      <label htmlFor="phone_number" className="form-label">Phone</label>
                      <input
                        type="text"
                        className="form-control"
                        id="phone_number"
                        name="phone_number"
                        value={settings.phone_number}
                        onChange={handleInputChange}
                      />
                    </div>
                    <div className="col-md-4 mb-3">
                      <label htmlFor="email" className="form-label">Email</label>
                      <input
                        type="email"
                        className="form-control"
                        id="email"
                        name="email"
                        value={settings.email}
                        onChange={handleInputChange}
                      />
                    </div>
                    <div className="col-md-4 mb-3">
                      <label htmlFor="website" className="form-label">Website</label>
                      <input
                        type="url"
                        className="form-control"
                        id="website"
                        name="website"
                        value={settings.website || ''}
                        onChange={handleInputChange}
                        placeholder="https://example.com (optional)"
                      />
                    </div>
                  </div>

                  <div className="mb-3">
                    <label htmlFor="motto" className="form-label">School Motto</label>
                    <input
                      type="text"
                      className="form-control"
                      id="motto"
                      name="motto"
                      value={settings.motto}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>

                {/* Score Entry Mode */}
                <div className="mb-4">
                  <h5>Teacher Permissions</h5>
                  <div className="mb-3">
                    <label htmlFor="score_entry_mode" className="form-label">Score Entry Mode</label>
                    <select
                      className="form-select"
                      id="score_entry_mode"
                      name="score_entry_mode"
                      value={settings.score_entry_mode}
                      onChange={handleInputChange}
                    >
                      <option value="CLASS_TEACHER">Class Teacher Only (Class teachers can enter all subject scores for their class)</option>
                      <option value="SUBJECT_TEACHER">Subject Teacher (Each teacher enters scores for their assigned subjects)</option>
                    </select>
                    <div className="form-text">
                      Choose how teachers can enter student scores.
                    </div>
                  </div>
                </div>

                {/* Grading System */}
                <div className="mb-4">
                  <h5>Grading System</h5>
                  <div className="row">
                    <div className="col-md-6 mb-3">
                      <label htmlFor="passing_grade" className="form-label">Passing Grade</label>
                      <input
                        type="number"
                        className="form-control"
                        id="passing_grade"
                        name="passing_grade"
                        value={settings.passing_grade}
                        onChange={handleInputChange}
                        min="0"
                        max="100"
                      />
                    </div>
                  </div>

                  <h6>Grade Scale</h6>
                  <div className="row">
                    <div className="col-md-2 mb-3">
                      <label htmlFor="grade_scale_a_min" className="form-label">Grade A (min)</label>
                      <input
                        type="number"
                        className="form-control"
                        id="grade_scale_a_min"
                        name="grade_scale_a_min"
                        value={settings.grade_scale_a_min}
                        onChange={handleInputChange}
                        min="0"
                        max="100"
                      />
                    </div>
                    <div className="col-md-2 mb-3">
                      <label htmlFor="grade_scale_b_min" className="form-label">Grade B (min)</label>
                      <input
                        type="number"
                        className="form-control"
                        id="grade_scale_b_min"
                        name="grade_scale_b_min"
                        value={settings.grade_scale_b_min}
                        onChange={handleInputChange}
                        min="0"
                        max="100"
                      />
                    </div>
                    <div className="col-md-2 mb-3">
                      <label htmlFor="grade_scale_c_min" className="form-label">Grade C (min)</label>
                      <input
                        type="number"
                        className="form-control"
                        id="grade_scale_c_min"
                        name="grade_scale_c_min"
                        value={settings.grade_scale_c_min}
                        onChange={handleInputChange}
                        min="0"
                        max="100"
                      />
                    </div>
                    <div className="col-md-2 mb-3">
                      <label htmlFor="grade_scale_d_min" className="form-label">Grade D (min)</label>
                      <input
                        type="number"
                        className="form-control"
                        id="grade_scale_d_min"
                        name="grade_scale_d_min"
                        value={settings.grade_scale_d_min}
                        onChange={handleInputChange}
                        min="0"
                        max="100"
                      />
                    </div>
                    <div className="col-md-2 mb-3">
                      <label htmlFor="grade_scale_f_min" className="form-label">Grade F (min)</label>
                      <input
                        type="number"
                        className="form-control"
                        id="grade_scale_f_min"
                        name="grade_scale_f_min"
                        value={settings.grade_scale_f_min}
                        onChange={handleInputChange}
                        min="0"
                        max="100"
                      />
                    </div>
                  </div>
                </div>

                {/* Report Settings */}
                <div className="mb-4">
                  <h5>Report Settings</h5>
                  <div className="mb-3">
                    <label htmlFor="report_template" className="form-label">Report Template</label>
                    <select
                      className="form-select"
                      id="report_template"
                      name="report_template"
                      value={settings.report_template}
                      onChange={handleInputChange}
                    >
                      <option value="STANDARD">Standard Template</option>
                      <option value="GHANA_EDUCATION_SERVICE">Ghana Education Service Template</option>
                    </select>
                  </div>

                  <div className="mb-3">
                    <button
                      type="button"
                      className="btn btn-outline-info"
                      onClick={handlePreviewTemplate}
                      disabled={loadingPreview}
                    >
                      {loadingPreview ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                          Loading Preview...
                        </>
                      ) : (
                        <>
                          <i className="fas fa-eye me-2"></i>
                          Preview Report Template
                        </>
                      )}
                    </button>
                    <div className="form-text">
                      Click to see how your reports will look with current settings
                    </div>
                  </div>

                  <div className="row">
                    <div className="col-md-3 mb-3">
                      <div className="form-check">
                        <input
                          className="form-check-input"
                          type="checkbox"
                          id="show_position_in_class"
                          name="show_position_in_class"
                          checked={settings.show_position_in_class}
                          onChange={handleInputChange}
                        />
                        <label className="form-check-label" htmlFor="show_position_in_class">
                          Show Positions
                        </label>
                      </div>
                    </div>
                    <div className="col-md-3 mb-3">
                      <div className="form-check">
                        <input
                          className="form-check-input"
                          type="checkbox"
                          id="show_student_photos"
                          name="show_student_photos"
                          checked={settings.show_student_photos}
                          onChange={handleInputChange}
                        />
                        <label className="form-check-label" htmlFor="show_student_photos">
                          Show Student Photos
                        </label>
                      </div>
                    </div>
                    <div className="col-md-3 mb-3">
                      <div className="form-check">
                        <input
                          className="form-check-input"
                          type="checkbox"
                          id="class_teacher_signature_required"
                          name="class_teacher_signature_required"
                          checked={settings.class_teacher_signature_required}
                          onChange={handleInputChange}
                        />
                        <label className="form-check-label" htmlFor="class_teacher_signature_required">
                          Class Teacher Signature
                        </label>
                      </div>
                    </div>
                    <div className="col-md-3 mb-3">
                      <div className="form-check">
                        <input
                          className="form-check-input"
                          type="checkbox"
                          id="show_headteacher_signature"
                          name="show_headteacher_signature"
                          checked={settings.show_headteacher_signature}
                          onChange={handleInputChange}
                        />
                        <label className="form-check-label" htmlFor="show_headteacher_signature">
                          Head Teacher Signature
                        </label>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Save Button */}
                <div className="d-grid">
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={saving}
                  >
                    {saving ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                        Saving...
                      </>
                    ) : (
                      'Save Settings'
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
      
      {/* Report Preview Modal */}
      <ReportPreviewModal
        isOpen={showPreview}
        onClose={() => setShowPreview(false)}
        previewData={previewData}
      />
    </div>
  );
}