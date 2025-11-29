import { Link } from 'react-router-dom'
import { FaRocket, FaUserShield, FaCheckCircle, FaCloud, FaSchool, FaChartLine } from 'react-icons/fa'

export default function Landing() {
  // Enhanced responsive breakpoints
  const screenWidth = window.innerWidth
  const isMobile = screenWidth <= 480
  const isTablet = screenWidth > 480 && screenWidth <= 768
  const isSmallMobile = screenWidth <= 375
  const isLargeMobile = screenWidth > 375 && screenWidth <= 480

  return (
    <div>
      <header style={{
        padding: isSmallMobile ? '32px 0' : isMobile ? '40px 0' : isTablet ? '48px 0' : '56px 0',
        borderBottom: '1px solid #1f2937',
        background: 'linear-gradient(180deg, rgba(37,99,235,.08), rgba(17,24,39,0) 40%)'
      }}>
        <div style={{
          maxWidth: '1100px',
          margin: '0 auto',
          padding: isSmallMobile ? '0 12px' : isMobile ? '0 16px' : isTablet ? '0 20px' : '0 24px'
        }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? '1fr' : isTablet ? '1fr' : '1.2fr 1fr',
            gap: isSmallMobile ? '20px' : isMobile ? '24px' : isTablet ? '28px' : '32px',
            alignItems: 'center'
          }}>
            <div style={{
              textAlign: isMobile ? 'center' : 'left'
            }}>
              <h1 style={{
                display: 'flex',
                alignItems: 'center',
                gap: isSmallMobile ? '8px' : '10px',
                margin: '0 0 10px',
                fontSize: isSmallMobile ? '24px' : isMobile ? '28px' : isTablet ? '32px' : '40px',
                lineHeight: 1.1,
                justifyContent: isMobile ? 'center' : 'flex-start',
                flexWrap: isSmallMobile ? 'wrap' : 'nowrap'
              }}>
                <FaSchool 
                  color="#60a5fa" 
                  size={isSmallMobile ? 20 : isMobile ? 24 : isTablet ? 28 : 32}
                /> 
                School Report Generator
              </h1>
              <p style={{
                color: '#9ca3af',
                margin: '0 0 14px',
                fontSize: isSmallMobile ? '14px' : isMobile ? '15px' : isTablet ? '16px' : '17px',
                lineHeight: 1.5,
                maxWidth: isMobile ? 'none' : '90%'
              }}>
                Automate term reports: enter scores, compute grades & positions, and generate beautiful PDFs for parents — all in minutes.
              </p>
              <div style={{
                marginTop: '12px',
                display: 'flex',
                flexDirection: isSmallMobile ? 'column' : isMobile ? 'column' : 'row',
                gap: isSmallMobile ? '12px' : isMobile ? '12px' : '16px',
                alignItems: isMobile ? 'stretch' : 'center',
                justifyContent: isMobile ? 'center' : 'flex-start'
              }}>
                <Link 
                  className="btn primary" 
                  to="/register-school"
                  style={{
                    padding: isSmallMobile ? '12px 20px' : isMobile ? '14px 24px' : '16px 28px',
                    fontSize: isSmallMobile ? '14px' : isMobile ? '15px' : '16px',
                    borderRadius: isSmallMobile ? '8px' : '10px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    textDecoration: 'none',
                    minHeight: isSmallMobile ? '44px' : '48px'
                  }}
                >
                  <FaRocket style={{ verticalAlign: '-2px' }} />
                  Create School Account
                </Link>
                <Link 
                  className="btn" 
                  to="/login" 
                  style={{
                    marginLeft: isSmallMobile || isMobile ? '0' : '12px',
                    padding: isSmallMobile ? '12px 20px' : isMobile ? '14px 24px' : '16px 28px',
                    fontSize: isSmallMobile ? '14px' : isMobile ? '15px' : '16px',
                    borderRadius: isSmallMobile ? '8px' : '10px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    textDecoration: 'none',
                    minHeight: isSmallMobile ? '44px' : '48px'
                  }}
                >
                  <FaUserShield style={{ verticalAlign: '-2px' }} />
                  Login
                </Link>
              </div>
              <ul style={{
                margin: '18px 0 0',
                paddingLeft: isMobile ? '0' : '18px',
                color: '#9ca3af',
                listStyle: isMobile ? 'none' : 'disc',
                display: 'flex',
                flexDirection: 'column',
                gap: isSmallMobile ? '8px' : '6px'
              }}>
                <li style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  fontSize: isSmallMobile ? '13px' : isMobile ? '14px' : '15px',
                  lineHeight: 1.4
                }}>
                  <FaCloud style={{ color: '#60a5fa', flexShrink: 0, fontSize: isSmallMobile ? '14px' : '16px' }} />
                  Multi‑tenant SaaS — each school has its own space
                </li>
                <li style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  fontSize: isSmallMobile ? '13px' : isMobile ? '14px' : '15px',
                  lineHeight: 1.4
                }}>
                  <FaCheckCircle style={{ color: '#86efac', flexShrink: 0, fontSize: isSmallMobile ? '14px' : '16px' }} />
                  Continuous assessment + exams with auto grading
                </li>
                <li style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  fontSize: isSmallMobile ? '13px' : isMobile ? '14px' : '15px',
                  lineHeight: 1.4
                }}>
                  <FaChartLine style={{ color: '#fcd34d', flexShrink: 0, fontSize: isSmallMobile ? '14px' : '16px' }} />
                  Attendance & behaviour tracking
                </li>
                <li style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  fontSize: isSmallMobile ? '13px' : isMobile ? '14px' : '15px',
                  lineHeight: 1.4
                }}>
                  <FaUserShield style={{ color: '#fb7185', flexShrink: 0, fontSize: isSmallMobile ? '14px' : '16px' }} />
                  Secure PDF report cards with optional QR verification
                </li>
              </ul>
            </div>
            <div style={{
              display: isMobile ? 'none' : 'grid',
              gap: isTablet ? '8px' : '12px',
              gridTemplateColumns: isTablet ? '1fr' : '1fr 1fr',
              marginTop: isMobile ? '24px' : '0'
            }}>
              <div className="tile kpi blue" style={{
                padding: isTablet ? '16px' : '20px',
                borderRadius: isTablet ? '8px' : '12px',
                fontSize: isTablet ? '14px' : '16px'
              }}>
                <div className="k">Top Students</div>
                <div className="v">Live</div>
              </div>
              <div className="tile kpi purple" style={{
                padding: isTablet ? '16px' : '20px',
                borderRadius: isTablet ? '8px' : '12px',
                fontSize: isTablet ? '14px' : '16px'
              }}>
                <div className="k">Reports Generated</div>
                <div className="v">Fast</div>
              </div>
              <div className="tile kpi green" style={{
                padding: isTablet ? '16px' : '20px',
                borderRadius: isTablet ? '8px' : '12px',
                fontSize: isTablet ? '14px' : '16px',
                gridColumn: isTablet ? '1' : '1 / -1'
              }}>
                <div className="k">Schools</div>
                <div className="v">Unlimited</div>
              </div>
            </div>
          </div>
        </div>
      </header>
      <section style={{
        maxWidth: '1100px',
        margin: `${isSmallMobile ? '24px' : isMobile ? '28px' : isTablet ? '32px' : '32px'} auto 0`,
        padding: isSmallMobile ? '0 12px' : isMobile ? '0 16px' : isTablet ? '0 20px' : '0 24px'
      }}>
        <h2 style={{
          fontSize: isSmallMobile ? '20px' : isMobile ? '22px' : isTablet ? '24px' : '28px',
          textAlign: isMobile ? 'center' : 'left',
          marginBottom: isSmallMobile ? '16px' : isMobile ? '18px' : isTablet ? '20px' : '24px',
          color: '#e5e7eb'
        }}>How it works</h2>
        <div style={{
          display: 'grid',
          gridTemplateColumns: isSmallMobile ? '1fr' : isMobile ? '1fr' : isTablet ? '1fr 1fr' : 'repeat(4, 1fr)',
          gap: isSmallMobile ? '12px' : isMobile ? '16px' : isTablet ? '18px' : '20px'
        }}>
          <div className="tile" style={{
            padding: isSmallMobile ? '16px' : isMobile ? '18px' : isTablet ? '20px' : '24px',
            borderRadius: isSmallMobile ? '8px' : '12px',
            background: '#111827',
            border: '1px solid #1f2937'
          }}>
            <div className="k" style={{
              fontSize: isSmallMobile ? '14px' : isMobile ? '15px' : '16px',
              fontWeight: '600',
              marginBottom: '8px',
              color: '#60a5fa'
            }}>1. Create School</div>
            <div className="v" style={{
              fontSize: isSmallMobile ? '13px' : isMobile ? '14px' : '15px',
              color: '#9ca3af',
              lineHeight: 1.4
            }}>Set up your school in one click</div>
          </div>
          <div className="tile" style={{
            padding: isSmallMobile ? '16px' : isMobile ? '18px' : isTablet ? '20px' : '24px',
            borderRadius: isSmallMobile ? '8px' : '12px',
            background: '#111827',
            border: '1px solid #1f2937'
          }}>
            <div className="k" style={{
              fontSize: isSmallMobile ? '14px' : isMobile ? '15px' : '16px',
              fontWeight: '600',
              marginBottom: '8px',
              color: '#c4b5fd'
            }}>2. Add Teachers</div>
            <div className="v" style={{
              fontSize: isSmallMobile ? '13px' : isMobile ? '14px' : '15px',
              color: '#9ca3af',
              lineHeight: 1.4
            }}>Invite staff to enter scores</div>
          </div>
          <div className="tile" style={{
            padding: isSmallMobile ? '16px' : isMobile ? '18px' : isTablet ? '20px' : '24px',
            borderRadius: isSmallMobile ? '8px' : '12px',
            background: '#111827',
            border: '1px solid #1f2937'
          }}>
            <div className="k" style={{
              fontSize: isSmallMobile ? '14px' : isMobile ? '15px' : '16px',
              fontWeight: '600',
              marginBottom: '8px',
              color: '#86efac'
            }}>3. Upload Students</div>
            <div className="v" style={{
              fontSize: isSmallMobile ? '13px' : isMobile ? '14px' : '15px',
              color: '#9ca3af',
              lineHeight: 1.4
            }}>Single or bulk Excel upload</div>
          </div>
          <div className="tile" style={{
            padding: isSmallMobile ? '16px' : isMobile ? '18px' : isTablet ? '20px' : '24px',
            borderRadius: isSmallMobile ? '8px' : '12px',
            background: '#111827',
            border: '1px solid #1f2937'
          }}>
            <div className="k" style={{
              fontSize: isSmallMobile ? '14px' : isMobile ? '15px' : '16px',
              fontWeight: '600',
              marginBottom: '8px',
              color: '#fcd34d'
            }}>4. Generate Reports</div>
            <div className="v" style={{
              fontSize: isSmallMobile ? '13px' : isMobile ? '14px' : '15px',
              color: '#9ca3af',
              lineHeight: 1.4
            }}>Publish branded PDFs</div>
          </div>
        </div>
      </section>
      <footer style={{
        maxWidth: '1100px',
        margin: `${isSmallMobile ? '32px' : isMobile ? '36px' : isTablet ? '42px' : '48px'} auto`,
        padding: isSmallMobile ? '0 12px' : isMobile ? '0 16px' : isTablet ? '0 20px' : '0 24px',
        opacity: 0.75,
        fontSize: isSmallMobile ? '12px' : '13px',
        textAlign: 'center',
        color: '#9ca3af'
      }}>
        © {new Date().getFullYear()} School Report SaaS
      </footer>
    </div>
  )
}
