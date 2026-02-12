export default function QuestionCard({ question, questionNumber, total }) {
  return (
    <div className="question-card">
      <div className="question-header">
        <span className="question-badge">Question {questionNumber}/{total}</span>
        <div className="progress-bar-track">
          <div
            className="progress-bar-fill"
            style={{ width: `${(questionNumber / total) * 100}%` }}
          />
        </div>
      </div>
      <p className="question-text">{question}</p>
    </div>
  );
}
