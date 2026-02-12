import { useState } from 'react';
import ResumeUploader from './components/ResumeUploader';
import InterviewSession from './components/InterviewSession';
import FinalReport from './components/FinalReport';
import './App.css';

export default function App() {
  const [phase, setPhase] = useState('upload'); // upload | interview | report
  const [sessionId, setSessionId] = useState('');
  const [firstQuestion, setFirstQuestion] = useState('');
  const [finalReport, setFinalReport] = useState(null);

  const handleUploadSuccess = (data) => {
    setSessionId(data.session_id);
    setFirstQuestion(data.first_question);
    setPhase('interview');
  };

  const handleInterviewComplete = (report) => {
    setFinalReport(report);
    setPhase('report');
  };

  return (
    <div className="app">
      <header className="app-header">
        <span className="logo">🤖 AI Interview Prep</span>
      </header>

      <main className="app-main">
        {phase === 'upload' && (
          <ResumeUploader onUploadSuccess={handleUploadSuccess} />
        )}
        {phase === 'interview' && (
          <InterviewSession
            sessionId={sessionId}
            firstQuestion={firstQuestion}
            onComplete={handleInterviewComplete}
          />
        )}
        {phase === 'report' && (
          <FinalReport report={finalReport} />
        )}
      </main>
    </div>
  );
}
