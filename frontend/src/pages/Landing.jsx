import { Link } from 'react-router-dom'
import { FaRocket, FaUserShield, FaCheckCircle, FaCloud, FaSchool, FaChartLine } from 'react-icons/fa'

export default function Landing() {
  return (
    <div>
      <header className="hero">
        <div className="container">
          <div className="hero-inner">
            <div className="hero-copy">
              <h1 style={{display:'flex',alignItems:'center',gap:10}}><FaSchool color="#60a5fa"/> School Report Generator</h1>
              <p>Automate term reports: enter scores, compute grades & positions, and generate beautiful PDFs for parents — all in minutes.</p>
              <div className="hero-cta">
                <Link className="btn primary" to="/register-school"><FaRocket style={{marginRight:6,verticalAlign:'-2px'}}/>Create School Account</Link>
                <Link className="btn" to="/login" style={{marginLeft:12}}><FaUserShield style={{marginRight:6,verticalAlign:'-2px'}}/>Login</Link>
              </div>
              <ul className="hero-points">
                <li><FaCloud style={{marginRight:8, color:'#60a5fa'}}/> Multi‑tenant SaaS — each school has its own space</li>
                <li><FaCheckCircle style={{marginRight:8, color:'#86efac'}}/> Continuous assessment + exams with auto grading</li>
                <li><FaChartLine style={{marginRight:8, color:'#fcd34d'}}/> Attendance & behaviour tracking</li>
                <li><FaUserShield style={{marginRight:8, color:'#fb7185'}}/> Secure PDF report cards with optional QR verification</li>
              </ul>
            </div>
            <div className="hero-art">
              <div className="tile kpi blue"><div className="k">Top Students</div><div className="v">Live</div></div>
              <div className="tile kpi purple"><div className="k">Reports Generated</div><div className="v">Fast</div></div>
              <div className="tile kpi green"><div className="k">Schools</div><div className="v">Unlimited</div></div>
            </div>
          </div>
        </div>
      </header>
      <section className="container" style={{marginTop:32}}>
        <h2>How it works</h2>
        <div className="grid">
          <div className="tile"><div className="k">1. Create School</div><div className="v">Set up your school in one click</div></div>
          <div className="tile"><div className="k">2. Add Teachers</div><div className="v">Invite staff to enter scores</div></div>
          <div className="tile"><div className="k">3. Upload Students</div><div className="v">Single or bulk Excel upload</div></div>
          <div className="tile"><div className="k">4. Generate Reports</div><div className="v">Publish branded PDFs</div></div>
        </div>
      </section>
      <footer className="container" style={{margin: '48px auto', opacity:.75, fontSize:13}}>
        © {new Date().getFullYear()} School Report SaaS
      </footer>
    </div>
  )
}
