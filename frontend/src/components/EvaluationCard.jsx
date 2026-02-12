export default function EvaluationCard({ evaluation }) {
  if (!evaluation) return null;

  const scores = [
    { label: 'Technical', value: evaluation.technical_score, color: '#6C63FF' },
    { label: 'Clarity', value: evaluation.clarity_score, color: '#00C9A7' },
    { label: 'Structure', value: evaluation.structure_score, color: '#FF6B6B' },
    { label: 'Relevance', value: evaluation.relevance_score, color: '#FFC75F' },
  ];

  return (
    <div className="evaluation-card">
      <h3>📊 Evaluation</h3>
      <div className="scores-grid">
        {scores.map((s) => (
          <div key={s.label} className="score-item">
            <div className="score-ring" style={{ '--score-color': s.color }}>
              <svg viewBox="0 0 36 36">
                <path
                  className="score-bg"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
                <path
                  className="score-fill"
                  strokeDasharray={`${s.value * 10}, 100`}
                  style={{ stroke: s.color }}
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
              </svg>
              <span className="score-value">{s.value}</span>
            </div>
            <span className="score-label">{s.label}</span>
          </div>
        ))}
      </div>

      <div className="eval-feedback">
        <div className="feedback-item strength">
          <strong>💪 Strengths</strong>
          <p>{evaluation.strengths}</p>
        </div>
        <div className="feedback-item weakness">
          <strong>⚠️ Weaknesses</strong>
          <p>{evaluation.weaknesses}</p>
        </div>
        <div className="feedback-item tip">
          <strong>💡 Tip</strong>
          <p>{evaluation.improvement_tip}</p>
        </div>
      </div>
    </div>
  );
}
