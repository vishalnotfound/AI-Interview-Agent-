export default function FinalReport({ report }) {
  if (!report) return null;

  const scoreColor =
    report.overall_score >= 75 ? '#00C9A7' :
    report.overall_score >= 50 ? '#FFC75F' : '#FF6B6B';

  const recColor = {
    'Strongly Recommend': '#00C9A7',
    'Recommend': '#6C63FF',
    'Consider': '#FFC75F',
    'Do Not Recommend': '#FF6B6B',
  };

  return (
    <div className="report-container">
      <h1 className="report-title">🎯 Interview Report</h1>

      <div className="score-hero">
        <svg viewBox="0 0 36 36" className="big-ring">
          <path
            className="score-bg"
            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
          />
          <path
            className="score-fill"
            strokeDasharray={`${report.overall_score}, 100`}
            style={{ stroke: scoreColor }}
            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
          />
        </svg>
        <div className="score-center">
          <span className="big-score" style={{ color: scoreColor }}>{report.overall_score}</span>
          <span className="score-out-of">/100</span>
        </div>
      </div>

      <div
        className="recommendation-badge"
        style={{ backgroundColor: recColor[report.hire_recommendation] || '#6C63FF' }}
      >
        {report.hire_recommendation}
      </div>

      <div className="report-section">
        <h3>📝 Summary</h3>
        <p>{report.summary}</p>
      </div>

      <div className="report-grid">
        <div className="report-card strength-card">
          <h3>💪 Strong Areas</h3>
          <p>{report.strong_areas}</p>
        </div>
        <div className="report-card weakness-card">
          <h3>⚠️ Areas to Improve</h3>
          <p>{report.weak_areas}</p>
        </div>
      </div>

      <div className="report-section roadmap-section">
        <h3>🗺️ Improvement Roadmap</h3>
        <p>{report.improvement_roadmap}</p>
      </div>

      <button className="btn btn-primary" onClick={() => window.location.reload()}>
        🔄 Start New Interview
      </button>
    </div>
  );
}
