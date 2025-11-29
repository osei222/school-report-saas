import { useState, useEffect } from 'react';
import api from '../utils/api';
import { useAuth } from '../state/AuthContext';
import ReportPreviewModal from '../components/ReportPreviewModal';
import ImageCaptureInput from '../components/ImageCaptureInput';
import { FaSchool, FaCog, FaPalette, FaClipboardList, FaSave, FaEye } from 'react-icons/fa';

export default function SchoolSettings() {
  const { token } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [previewData, setPreviewData] = useState(null);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });
  const [logoFile, setLogoFile] = useState(null);
  
  // Responsive design constants
  const isMobile = window.innerWidth <= 768;
  const isTablet = window.innerWidth <= 1024;
  const [settings, setSettings] = useState({
    name: '',
    address: '',
    location: '',
    phone_number: '',
    email: '',
    website: '',
    motto: '',
    logo: null,
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

  const handleLogoChange = (logoData) => {
    setLogoFile(logoData);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage({ text: '', type: '' });

    try {
      // Prepare FormData if logo file is being uploaded
      let payload;
      let headers = { Authorization: `Bearer ${token}` };
      
      if (logoFile && logoFile.blob) {
        // Use FormData for file upload
        payload = new FormData();
        
        // Add logo file
        payload.append('logo', logoFile.blob, logoFile.fileName || 'school_logo.jpg');
        
        // Add other settings
        Object.entries(settings).forEach(([key, value]) => {
          if (key !== 'logo' && value !== null && value !== undefined) {
            payload.append(key, value);
          }
        });
        
        // Don't set Content-Type header - let browser set it for FormData
      } else {
        // Regular JSON payload
        const cleanedSettings = { ...settings };
        
        // Convert empty website to null
        if (!cleanedSettings.website || cleanedSettings.website.trim() === '') {
          cleanedSettings.website = null;
        }

        // Only send fields the API accepts
        const allowedKeys = [
          'id','name','address','location','phone_number','email','logo','motto','website','current_academic_year',
          'score_entry_mode','is_active',
          'report_template','report_header_text','report_footer_text',
          'show_class_average','show_position_in_class','show_attendance','show_behavior_comments',
          'principal_signature','class_teacher_signature_required','show_student_photos','show_headteacher_signature',
          'grade_scale_a_min','grade_scale_b_min','grade_scale_c_min','grade_scale_d_min','grade_scale_f_min'
        ];
        payload = Object.fromEntries(
          Object.entries(cleanedSettings).filter(([k]) => allowedKeys.includes(k))
        );
        headers['Content-Type'] = 'application/json';
      }

      const response = await api.patch('/schools/settings/', payload, { headers });
      
      // Update settings with response data
      setSettings(response.data);
      setLogoFile(null); // Clear logo file after successful upload
      
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
      <div style={{
        maxWidth: 1400,
        margin: '0 auto',
        padding: isMobile ? '20px 12px' : '24px 20px',
        paddingTop: isMobile ? '100px' : '24px',
        background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
        minHeight: '100vh',
        color: 'white',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div style={{
          textAlign: 'center',
          background: 'rgba(15, 23, 42, 0.8)',
          backdropFilter: 'blur(16px)',
          borderRadius: 20,
          padding: '40px 30px',
          border: '1px solid rgba(148, 163, 184, 0.2)',
          boxShadow: '0 10px 30px rgba(0, 0, 0, 0.3)'
        }}>
          <div style={{
            width: '50px',
            height: '50px',
            border: '4px solid rgba(59, 130, 246, 0.3)',
            borderTop: '4px solid #3b82f6',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 20px'
          }}></div>
          <p style={{ margin: 0, fontSize: '16px', color: '#94a3b8' }}>Loading school settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      maxWidth: 1400,
      margin: '0 auto',
      padding: isMobile ? '20px 12px' : isTablet ? '24px 16px' : '32px 20px',
      paddingTop: isMobile ? '100px' : '24px',
      background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
      minHeight: '100vh',
      color: 'white'
    }}>
      {/* Header */}
      <div style={{
        background: 'rgba(15, 23, 42, 0.8)',
        backdropFilter: 'blur(16px)',
        borderRadius: isMobile ? 16 : 20,
        padding: isMobile ? '20px 16px' : '24px 20px',
        marginBottom: isMobile ? 20 : 24,
        border: '1px solid rgba(148, 163, 184, 0.2)',
        boxShadow: '0 10px 30px rgba(0, 0, 0, 0.3)',
        display: 'flex',
        alignItems: 'center',
        gap: isMobile ? 12 : 16
      }}>
        <div style={{
          background: 'linear-gradient(135deg, #6366f1, #4f46e5)',
          borderRadius: 12,
          padding: isMobile ? '12px' : '16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 8px 20px rgba(99, 102, 241, 0.4)'
        }}>
          <FaSchool size={isMobile ? 20 : 24} color="white" />
        </div>
        <div>
          <h1 style={{
            margin: 0,
            fontSize: isMobile ? 22 : isTablet ? 26 : 32,
            fontWeight: 700,
            background: 'linear-gradient(135deg, #a78bfa, #6366f1)',
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}>School Settings</h1>
          <p style={{
            margin: '4px 0 0 0',
            fontSize: isMobile ? 13 : 14,
            color: '#94a3b8',
            fontWeight: 500
          }}>
            Manage your school information and preferences
          </p>
        </div>
      </div>
      {/* Main Content */}
      <div style={{
        background: 'rgba(15, 23, 42, 0.8)',
        backdropFilter: 'blur(16px)',
        borderRadius: isMobile ? 16 : 20,
        padding: isMobile ? '20px 16px' : '24px 20px',
        border: '1px solid rgba(148, 163, 184, 0.2)',
        boxShadow: '0 10px 30px rgba(0, 0, 0, 0.3)'
      }}>
        {message.text && (
          <div style={{
            padding: isMobile ? '16px' : '16px 20px',
            marginBottom: '24px',
            background: message.type === 'success' 
              ? 'linear-gradient(135deg, rgba(34, 197, 94, 0.15), rgba(22, 163, 74, 0.1))' 
              : 'linear-gradient(135deg, rgba(239, 68, 68, 0.15), rgba(220, 38, 38, 0.1))',
            border: message.type === 'success'
              ? '2px solid rgba(34, 197, 94, 0.3)'
              : '2px solid rgba(239, 68, 68, 0.3)',
            borderRadius: 12,
            color: message.type === 'success' ? '#86efac' : '#fca5a5',
            fontSize: isMobile ? 14 : 15,
            fontWeight: 500,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <span>{message.text}</span>
            <button
              onClick={() => setMessage({ text: '', type: '' })}
              style={{
                background: 'none',
                border: 'none',
                color: 'inherit',
                fontSize: '18px',
                cursor: 'pointer',
                padding: '4px',
                borderRadius: '4px',
                opacity: 0.7
              }}
            >
              ×
            </button>
          </div>
        )}

        
        <form onSubmit={handleSubmit}>
          {/* School Information Section */}
          <div style={{
            background: 'rgba(59, 130, 246, 0.1)',
            borderRadius: 12,
            padding: isMobile ? '16px' : '20px',
            marginBottom: '24px',
            border: '1px solid rgba(59, 130, 246, 0.2)'
          }}>
            <h3 style={{
              margin: '0 0 20px 0',
              fontSize: isMobile ? 18 : 20,
              fontWeight: 600,
              color: '#60a5fa',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <FaSchool size={16} />
              School Information
            </h3>
            
            {/* Logo Upload Section */}
            <div style={{
              marginBottom: '24px',
              padding: isMobile ? '16px' : '20px',
              background: 'rgba(30, 41, 59, 0.5)',
              borderRadius: 10,
              border: '1px solid rgba(71, 85, 105, 0.3)'
            }}>
              <h4 style={{
                margin: '0 0 16px 0',
                fontSize: isMobile ? 16 : 18,
                fontWeight: 600,
                color: '#e2e8f0'
              }}>School Logo</h4>
              
              {settings.logo && (
                <div style={{
                  marginBottom: '16px',
                  display: 'flex',
                  flexDirection: isMobile ? 'column' : 'row',
                  alignItems: isMobile ? 'flex-start' : 'center',
                  gap: '16px'
                }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px'
                  }}>
                    <img 
                      src={settings.logo} 
                      alt="Current school logo" 
                      style={{
                        width: '50px',
                        height: '50px',
                        objectFit: 'cover',
                        borderRadius: '8px',
                        border: '2px solid rgba(59, 130, 246, 0.3)'
                      }}
                    />
                    <div>
                      <p style={{
                        margin: 0,
                        fontSize: '14px',
                        color: '#94a3b8',
                        fontWeight: 500
                      }}>Current Logo</p>
                      <p style={{
                        margin: 0,
                        fontSize: '12px',
                        color: '#64748b'
                      }}>Upload a new logo to replace</p>
                    </div>
                  </div>
                </div>
              )}
              
              <ImageCaptureInput
                label={settings.logo ? "Upload New Logo" : "Upload School Logo"}
                onChange={handleLogoChange}
                maxWidth={400}
                quality={0.9}
                showBothOptions={true}
              />
              <p style={{
                margin: '8px 0 0 0',
                fontSize: '12px',
                color: '#64748b',
                lineHeight: 1.4
              }}>
                Recommended: Square image (400x400px or larger) in PNG or JPG format
              </p>
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
              gap: '16px',
              marginBottom: '16px'
            }}>
              <div>
                <label style={{
                  display: 'block',
                  marginBottom: '8px',
                  fontSize: '14px',
                  fontWeight: 600,
                  color: '#e2e8f0'
                }}>School Name *</label>
                <input
                  type="text"
                  name="name"
                  value={settings.name}
                  onChange={handleInputChange}
                  required
                  style={{
                    width: '100%',
                    padding: isMobile ? '14px 16px' : '12px 16px',
                    fontSize: isMobile ? 16 : 15,
                    border: '2px solid rgba(71, 85, 105, 0.4)',
                    borderRadius: 8,
                    background: 'rgba(30, 41, 59, 0.8)',
                    color: 'white',
                    outline: 'none',
                    transition: 'all 0.3s ease',
                    boxSizing: 'border-box'
                  }}
                />
              </div>
              <div>
                <label style={{
                  display: 'block',
                  marginBottom: '8px',
                  fontSize: '14px',
                  fontWeight: 600,
                  color: '#e2e8f0'
                }}>Academic Year *</label>
                <input
                  type="text"
                  name="current_academic_year"
                  value={settings.current_academic_year}
                  onChange={handleInputChange}
                  placeholder="e.g., 2024-2025"
                  required
                  style={{
                    width: '100%',
                    padding: isMobile ? '14px 16px' : '12px 16px',
                    fontSize: isMobile ? 16 : 15,
                    border: '2px solid rgba(71, 85, 105, 0.4)',
                    borderRadius: 8,
                    background: 'rgba(30, 41, 59, 0.8)',
                    color: 'white',
                    outline: 'none',
                    transition: 'all 0.3s ease',
                    boxSizing: 'border-box'
                  }}
                />
              </div>
            </div>
            
            <div>
              <label style={{
                display: 'block',
                marginBottom: '8px',
                fontSize: '14px',
                fontWeight: 600,
                color: '#e2e8f0'
              }}>Address</label>
              <textarea
                name="address"
                value={settings.address}
                onChange={handleInputChange}
                rows="3"
                style={{
                  width: '100%',
                  padding: isMobile ? '14px 16px' : '12px 16px',
                  fontSize: isMobile ? 16 : 15,
                  border: '2px solid rgba(71, 85, 105, 0.4)',
                  borderRadius: 8,
                  background: 'rgba(30, 41, 59, 0.8)',
                  color: 'white',
                  outline: 'none',
                  transition: 'all 0.3s ease',
                  boxSizing: 'border-box',
                  resize: 'vertical',
                  minHeight: '80px'
                }}
              />
            </div>
            
            <div>
              <label style={{
                display: 'block',
                marginBottom: '8px',
                fontSize: '14px',
                fontWeight: 600,
                color: '#e2e8f0'
              }}>Location/City</label>
              <input
                type="text"
                name="location"
                value={settings.location}
                onChange={handleInputChange}
                style={{
                  width: '100%',
                  padding: isMobile ? '14px 16px' : '12px 16px',
                  fontSize: isMobile ? 16 : 15,
                  border: '2px solid rgba(71, 85, 105, 0.4)',
                  borderRadius: 8,
                  background: 'rgba(30, 41, 59, 0.8)',
                  color: 'white',
                  outline: 'none',
                  transition: 'all 0.3s ease',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr 1fr',
              gap: '16px',
              marginBottom: '16px'
            }}>
              <div>
                <label style={{
                  display: 'block',
                  marginBottom: '8px',
                  fontSize: '14px',
                  fontWeight: 600,
                  color: '#e2e8f0'
                }}>Phone</label>
                <input
                  type="text"
                  name="phone_number"
                  value={settings.phone_number}
                  onChange={handleInputChange}
                  style={{
                    width: '100%',
                    padding: isMobile ? '14px 16px' : '12px 16px',
                    fontSize: isMobile ? 16 : 15,
                    border: '2px solid rgba(71, 85, 105, 0.4)',
                    borderRadius: 8,
                    background: 'rgba(30, 41, 59, 0.8)',
                    color: 'white',
                    outline: 'none',
                    transition: 'all 0.3s ease',
                    boxSizing: 'border-box'
                  }}
                />
              </div>
              <div>
                <label style={{
                  display: 'block',
                  marginBottom: '8px',
                  fontSize: '14px',
                  fontWeight: 600,
                  color: '#e2e8f0'
                }}>Email</label>
                <input
                  type="email"
                  name="email"
                  value={settings.email}
                  onChange={handleInputChange}
                  style={{
                    width: '100%',
                    padding: isMobile ? '14px 16px' : '12px 16px',
                    fontSize: isMobile ? 16 : 15,
                    border: '2px solid rgba(71, 85, 105, 0.4)',
                    borderRadius: 8,
                    background: 'rgba(30, 41, 59, 0.8)',
                    color: 'white',
                    outline: 'none',
                    transition: 'all 0.3s ease',
                    boxSizing: 'border-box'
                  }}
                />
              </div>
              <div>
                <label style={{
                  display: 'block',
                  marginBottom: '8px',
                  fontSize: '14px',
                  fontWeight: 600,
                  color: '#e2e8f0'
                }}>Website</label>
                <input
                  type="url"
                  name="website"
                  value={settings.website || ''}
                  onChange={handleInputChange}
                  placeholder="https://example.com (optional)"
                  style={{
                    width: '100%',
                    padding: isMobile ? '14px 16px' : '12px 16px',
                    fontSize: isMobile ? 16 : 15,
                    border: '2px solid rgba(71, 85, 105, 0.4)',
                    borderRadius: 8,
                    background: 'rgba(30, 41, 59, 0.8)',
                    color: 'white',
                    outline: 'none',
                    transition: 'all 0.3s ease',
                    boxSizing: 'border-box'
                  }}
                />
              </div>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{
                display: 'block',
                marginBottom: '8px',
                fontSize: '14px',
                fontWeight: 600,
                color: '#e2e8f0'
              }}>School Motto</label>
              <input
                type="text"
                name="motto"
                value={settings.motto}
                onChange={handleInputChange}
                style={{
                  width: '100%',
                  padding: isMobile ? '14px 16px' : '12px 16px',
                  fontSize: isMobile ? 16 : 15,
                  border: '2px solid rgba(71, 85, 105, 0.4)',
                  borderRadius: 8,
                  background: 'rgba(30, 41, 59, 0.8)',
                  color: 'white',
                  outline: 'none',
                  transition: 'all 0.3s ease',
                  boxSizing: 'border-box'
                }}
              />
            </div>
          </div>

          {/* Teacher Permissions Section */}
          <div style={{
            background: 'rgba(34, 197, 94, 0.1)',
            borderRadius: 12,
            padding: isMobile ? '16px' : '20px',
            marginBottom: '24px',
            border: '1px solid rgba(34, 197, 94, 0.2)'
          }}>
            <h3 style={{
              margin: '0 0 20px 0',
              fontSize: isMobile ? 18 : 20,
              fontWeight: 600,
              color: '#4ade80',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <FaCog size={16} />
              Teacher Permissions
            </h3>
            
            <div>
              <label style={{
                display: 'block',
                marginBottom: '8px',
                fontSize: '14px',
                fontWeight: 600,
                color: '#e2e8f0'
              }}>Score Entry Mode</label>
              <select
                name="score_entry_mode"
                value={settings.score_entry_mode}
                onChange={handleInputChange}
                style={{
                  width: '100%',
                  padding: isMobile ? '14px 16px' : '12px 16px',
                  fontSize: isMobile ? 16 : 15,
                  border: '2px solid rgba(71, 85, 105, 0.4)',
                  borderRadius: 8,
                  background: 'rgba(30, 41, 59, 0.8)',
                  color: 'white',
                  outline: 'none',
                  transition: 'all 0.3s ease',
                  boxSizing: 'border-box'
                }}
              >
                <option value="CLASS_TEACHER">Class Teacher Only (Class teachers can enter all subject scores for their class)</option>
                <option value="SUBJECT_TEACHER">Subject Teacher (Each teacher enters scores for their assigned subjects)</option>
              </select>
              <p style={{
                margin: '8px 0 0 0',
                fontSize: '12px',
                color: '#64748b',
                lineHeight: 1.4
              }}>
                Choose how teachers can enter student scores.
              </p>
            </div>
          </div>

          {/* Grading System Section */}
          <div style={{
            background: 'rgba(139, 92, 246, 0.1)',
            borderRadius: 12,
            padding: isMobile ? '16px' : '20px',
            marginBottom: '24px',
            border: '1px solid rgba(139, 92, 246, 0.2)'
          }}>
            <h3 style={{
              margin: '0 0 20px 0',
              fontSize: isMobile ? 18 : 20,
              fontWeight: 600,
              color: '#a78bfa',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <FaClipboardList size={16} />
              Grading System
            </h3>
            
            <h4 style={{
              margin: '0 0 16px 0',
              fontSize: isMobile ? 16 : 18,
              fontWeight: 600,
              color: '#e2e8f0'
            }}>Grade Scale</h4>
            
            <div style={{
              display: 'grid',
              gridTemplateColumns: isMobile ? '1fr 1fr' : isTablet ? 'repeat(3, 1fr)' : 'repeat(5, 1fr)',
              gap: '12px'
            }}>
              <div>
                <label style={{
                  display: 'block',
                  marginBottom: '8px',
                  fontSize: '14px',
                  fontWeight: 600,
                  color: '#e2e8f0'
                }}>Grade A (min)</label>
                <input
                  type="number"
                  name="grade_scale_a_min"
                  value={settings.grade_scale_a_min}
                  onChange={handleInputChange}
                  min="0"
                  max="100"
                  style={{
                    width: '100%',
                    padding: isMobile ? '14px 16px' : '12px 16px',
                    fontSize: isMobile ? 16 : 15,
                    border: '2px solid rgba(71, 85, 105, 0.4)',
                    borderRadius: 8,
                    background: 'rgba(30, 41, 59, 0.8)',
                    color: 'white',
                    outline: 'none',
                    transition: 'all 0.3s ease',
                    boxSizing: 'border-box'
                  }}
                />
              </div>
              <div>
                <label style={{
                  display: 'block',
                  marginBottom: '8px',
                  fontSize: '14px',
                  fontWeight: 600,
                  color: '#e2e8f0'
                }}>Grade B (min)</label>
                <input
                  type="number"
                  name="grade_scale_b_min"
                  value={settings.grade_scale_b_min}
                  onChange={handleInputChange}
                  min="0"
                  max="100"
                  style={{
                    width: '100%',
                    padding: isMobile ? '14px 16px' : '12px 16px',
                    fontSize: isMobile ? 16 : 15,
                    border: '2px solid rgba(71, 85, 105, 0.4)',
                    borderRadius: 8,
                    background: 'rgba(30, 41, 59, 0.8)',
                    color: 'white',
                    outline: 'none',
                    transition: 'all 0.3s ease',
                    boxSizing: 'border-box'
                  }}
                />
              </div>
              <div>
                <label style={{
                  display: 'block',
                  marginBottom: '8px',
                  fontSize: '14px',
                  fontWeight: 600,
                  color: '#e2e8f0'
                }}>Grade C (min)</label>
                <input
                  type="number"
                  name="grade_scale_c_min"
                  value={settings.grade_scale_c_min}
                  onChange={handleInputChange}
                  min="0"
                  max="100"
                  style={{
                    width: '100%',
                    padding: isMobile ? '14px 16px' : '12px 16px',
                    fontSize: isMobile ? 16 : 15,
                    border: '2px solid rgba(71, 85, 105, 0.4)',
                    borderRadius: 8,
                    background: 'rgba(30, 41, 59, 0.8)',
                    color: 'white',
                    outline: 'none',
                    transition: 'all 0.3s ease',
                    boxSizing: 'border-box'
                  }}
                />
              </div>
              <div>
                <label style={{
                  display: 'block',
                  marginBottom: '8px',
                  fontSize: '14px',
                  fontWeight: 600,
                  color: '#e2e8f0'
                }}>Grade D (min)</label>
                <input
                  type="number"
                  name="grade_scale_d_min"
                  value={settings.grade_scale_d_min}
                  onChange={handleInputChange}
                  min="0"
                  max="100"
                  style={{
                    width: '100%',
                    padding: isMobile ? '14px 16px' : '12px 16px',
                    fontSize: isMobile ? 16 : 15,
                    border: '2px solid rgba(71, 85, 105, 0.4)',
                    borderRadius: 8,
                    background: 'rgba(30, 41, 59, 0.8)',
                    color: 'white',
                    outline: 'none',
                    transition: 'all 0.3s ease',
                    boxSizing: 'border-box'
                  }}
                />
              </div>
              <div>
                <label style={{
                  display: 'block',
                  marginBottom: '8px',
                  fontSize: '14px',
                  fontWeight: 600,
                  color: '#e2e8f0'
                }}>Grade F (min)</label>
                <input
                  type="number"
                  name="grade_scale_f_min"
                  value={settings.grade_scale_f_min}
                  onChange={handleInputChange}
                  min="0"
                  max="100"
                  style={{
                    width: '100%',
                    padding: isMobile ? '14px 16px' : '12px 16px',
                    fontSize: isMobile ? 16 : 15,
                    border: '2px solid rgba(71, 85, 105, 0.4)',
                    borderRadius: 8,
                    background: 'rgba(30, 41, 59, 0.8)',
                    color: 'white',
                    outline: 'none',
                    transition: 'all 0.3s ease',
                    boxSizing: 'border-box'
                  }}
                />
              </div>
            </div>
          </div>

          {/* Report Settings Section */}
          <div style={{
            background: 'rgba(236, 72, 153, 0.1)',
            borderRadius: 12,
            padding: isMobile ? '16px' : '20px',
            marginBottom: '24px',
            border: '1px solid rgba(236, 72, 153, 0.2)'
          }}>
            <h3 style={{
              margin: '0 0 20px 0',
              fontSize: isMobile ? 18 : 20,
              fontWeight: 600,
              color: '#f472b6',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <FaPalette size={16} />
              Report Settings
            </h3>
            
            <div style={{ marginBottom: '20px' }}>
              <label style={{
                display: 'block',
                marginBottom: '8px',
                fontSize: '14px',
                fontWeight: 600,
                color: '#e2e8f0'
              }}>Report Template</label>
              <select
                name="report_template"
                value={settings.report_template}
                onChange={handleInputChange}
                style={{
                  width: '100%',
                  padding: isMobile ? '14px 16px' : '12px 16px',
                  fontSize: isMobile ? 16 : 15,
                  border: '2px solid rgba(71, 85, 105, 0.4)',
                  borderRadius: 8,
                  background: 'rgba(30, 41, 59, 0.8)',
                  color: 'white',
                  outline: 'none',
                  transition: 'all 0.3s ease',
                  boxSizing: 'border-box'
                }}
              >
                <option value="STANDARD">Standard Template</option>
                <option value="GHANA_EDUCATION_SERVICE">Ghana Education Service Template</option>
              </select>
            </div>

            <div style={{ marginBottom: '24px' }}>
              <button
                type="button"
                onClick={handlePreviewTemplate}
                disabled={loadingPreview}
                style={{
                  padding: isMobile ? '12px 20px' : '10px 18px',
                  fontSize: isMobile ? 15 : 14,
                  fontWeight: 600,
                  border: '2px solid rgba(59, 130, 246, 0.4)',
                  borderRadius: 8,
                  background: 'rgba(59, 130, 246, 0.1)',
                  color: '#60a5fa',
                  cursor: loadingPreview ? 'not-allowed' : 'pointer',
                  transition: 'all 0.3s ease',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  opacity: loadingPreview ? 0.6 : 1
                }}
              >
                {loadingPreview ? (
                  <>
                    <div style={{
                      width: '16px',
                      height: '16px',
                      border: '2px solid rgba(59, 130, 246, 0.3)',
                      borderTop: '2px solid #3b82f6',
                      borderRadius: '50%',
                      animation: 'spin 1s linear infinite'
                    }}></div>
                    Loading Preview...
                  </>
                ) : (
                  <>
                    <FaEye size={16} />
                    Preview Report Template
                  </>
                )}
              </button>
              <p style={{
                margin: '8px 0 0 0',
                fontSize: '12px',
                color: '#64748b',
                lineHeight: 1.4
              }}>
                Click to see how your reports will look with current settings
              </p>
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: isMobile ? '1fr' : isTablet ? '1fr 1fr' : 'repeat(4, 1fr)',
              gap: '16px'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <input
                  type="checkbox"
                  id="show_position_in_class"
                  name="show_position_in_class"
                  checked={settings.show_position_in_class}
                  onChange={handleInputChange}
                  style={{
                    width: '18px',
                    height: '18px',
                    accentColor: '#6366f1',
                    cursor: 'pointer'
                  }}
                />
                <label 
                  htmlFor="show_position_in_class"
                  style={{
                    fontSize: '14px',
                    fontWeight: 500,
                    color: '#e2e8f0',
                    cursor: 'pointer'
                  }}
                >
                  Show Positions
                </label>
              </div>
              
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <input
                  type="checkbox"
                  id="show_student_photos"
                  name="show_student_photos"
                  checked={settings.show_student_photos}
                  onChange={handleInputChange}
                  style={{
                    width: '18px',
                    height: '18px',
                    accentColor: '#6366f1',
                    cursor: 'pointer'
                  }}
                />
                <label 
                  htmlFor="show_student_photos"
                  style={{
                    fontSize: '14px',
                    fontWeight: 500,
                    color: '#e2e8f0',
                    cursor: 'pointer'
                  }}
                >
                  Show Student Photos
                </label>
              </div>
              
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <input
                  type="checkbox"
                  id="class_teacher_signature_required"
                  name="class_teacher_signature_required"
                  checked={settings.class_teacher_signature_required}
                  onChange={handleInputChange}
                  style={{
                    width: '18px',
                    height: '18px',
                    accentColor: '#6366f1',
                    cursor: 'pointer'
                  }}
                />
                <label 
                  htmlFor="class_teacher_signature_required"
                  style={{
                    fontSize: '14px',
                    fontWeight: 500,
                    color: '#e2e8f0',
                    cursor: 'pointer'
                  }}
                >
                  Class Teacher Signature
                </label>
              </div>
              
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <input
                  type="checkbox"
                  id="show_headteacher_signature"
                  name="show_headteacher_signature"
                  checked={settings.show_headteacher_signature}
                  onChange={handleInputChange}
                  style={{
                    width: '18px',
                    height: '18px',
                    accentColor: '#6366f1',
                    cursor: 'pointer'
                  }}
                />
                <label 
                  htmlFor="show_headteacher_signature"
                  style={{
                    fontSize: '14px',
                    fontWeight: 500,
                    color: '#e2e8f0',
                    cursor: 'pointer'
                  }}
                >
                  Head Teacher Signature
                </label>
              </div>
            </div>
          </div>

          {/* Save Button */}
          <div style={{
            padding: isMobile ? '20px 0' : '24px 0',
            borderTop: '1px solid rgba(71, 85, 105, 0.3)',
            marginTop: '24px'
          }}>
            <button
              type="submit"
              disabled={saving}
              style={{
                width: '100%',
                padding: isMobile ? '16px 24px' : '14px 24px',
                fontSize: isMobile ? 16 : 15,
                fontWeight: 700,
                border: 'none',
                borderRadius: 12,
                background: saving 
                  ? 'linear-gradient(135deg, rgba(99, 102, 241, 0.5), rgba(79, 70, 229, 0.5))'
                  : 'linear-gradient(135deg, #6366f1, #4f46e5)',
                color: 'white',
                cursor: saving ? 'not-allowed' : 'pointer',
                transition: 'all 0.3s ease',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                boxShadow: saving ? 'none' : '0 8px 20px rgba(99, 102, 241, 0.4)',
                opacity: saving ? 0.7 : 1
              }}
            >
              {saving ? (
                <>
                  <div style={{
                    width: '20px',
                    height: '20px',
                    border: '2px solid rgba(255, 255, 255, 0.3)',
                    borderTop: '2px solid white',
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite'
                  }}></div>
                  Saving...
                </>
              ) : (
                <>
                  <FaSave size={16} />
                  Save Settings
                </>
              )}
            </button>
          </div>
        </form>
      </div>
      
      {/* Report Preview Modal */}
      <ReportPreviewModal
        isOpen={showPreview}
        onClose={() => setShowPreview(false)}
        previewData={previewData}
      />

      {/* CSS Animations */}
      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}