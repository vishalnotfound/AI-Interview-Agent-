import { useState, useEffect, useRef, useCallback } from 'react';
import { evaluateAnswer } from '../api';
import QuestionCard from './QuestionCard';
import TranscriptBox from './TranscriptBox';
import EvaluationCard from './EvaluationCard';

const TOTAL_QUESTIONS = 5;
const MAX_RECORD_SECONDS = 90;

export default function InterviewSession({ sessionId, firstQuestion, onComplete }) {
  const [currentQuestion, setCurrentQuestion] = useState(firstQuestion);
  const [questionNumber, setQuestionNumber] = useState(1);
  const [transcript, setTranscript] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [status, setStatus] = useState('idle'); // idle | recording | evaluating
  const [evaluation, setEvaluation] = useState(null);
  const [error, setError] = useState('');
  const [previousQuestions, setPreviousQuestions] = useState([]);
  const [previousAnswers, setPreviousAnswers] = useState([]);
  const [timer, setTimer] = useState(MAX_RECORD_SECONDS);
  const [speechSupported, setSpeechSupported] = useState(true);

  const recognitionRef = useRef(null);
  const timerRef = useRef(null);
  const transcriptRef = useRef('');

  // Check speech recognition support
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setSpeechSupported(false);
    }
  }, []);

  const stopRecording = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setIsRecording(false);
  }, []);

  const startRecording = useCallback(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setError('Speech recognition is not supported in your browser. Please use Chrome.');
      return;
    }

    setTranscript('');
    transcriptRef.current = '';
    setEvaluation(null);
    setError('');
    setTimer(MAX_RECORD_SECONDS);

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    let finalTranscript = '';

    recognition.onresult = (event) => {
      let interim = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          finalTranscript += result[0].transcript + ' ';
        } else {
          interim += result[0].transcript;
        }
      }
      const full = finalTranscript + interim;
      transcriptRef.current = full;
      setTranscript(full);
    };

    recognition.onerror = (event) => {
      if (event.error !== 'aborted') {
        setError(`Speech recognition error: ${event.error}`);
        stopRecording();
        setStatus('idle');
      }
    };

    recognition.onend = () => {
      // If still in recording state, the recognition ended unexpectedly — restart
      if (recognitionRef.current) {
        try {
          recognition.start();
        } catch (e) {
          // already started or stopped
        }
      }
    };

    recognitionRef.current = recognition;
    recognition.start();
    setIsRecording(true);
    setStatus('recording');

    // Auto-stop timer
    timerRef.current = setInterval(() => {
      setTimer((prev) => {
        if (prev <= 1) {
          stopRecording();
          setStatus('idle');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, [stopRecording]);

  const handleStop = useCallback(() => {
    stopRecording();
    setStatus('idle');
  }, [stopRecording]);

  const handleSubmit = useCallback(async () => {
    const answer = transcriptRef.current.trim();
    if (!answer) {
      setError('No transcript detected. Please try answering again.');
      return;
    }

    setStatus('evaluating');
    setError('');

    try {
      const data = await evaluateAnswer({
        session_id: sessionId,
        current_question: currentQuestion,
        current_answer: answer,
        previous_questions: previousQuestions,
        previous_answers: previousAnswers,
      });

      if (data.final_report) {
        // Last question — show evaluation then trigger report
        setEvaluation(data.evaluation);
        setTimeout(() => {
          onComplete(data.final_report);
        }, 3000);
        setStatus('idle');
        return;
      }

      setEvaluation(data.evaluation);
      setPreviousQuestions((prev) => [...prev, currentQuestion]);
      setPreviousAnswers((prev) => [...prev, answer]);
      setCurrentQuestion(data.next_question);
      setQuestionNumber(data.question_count + 1);
      setTranscript('');
      transcriptRef.current = '';
      setStatus('idle');
    } catch (err) {
      setError(err.message || 'Evaluation failed.');
      setStatus('idle');
    }
  }, [sessionId, currentQuestion, previousQuestions, previousAnswers, onComplete]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) recognitionRef.current.stop();
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  if (!speechSupported) {
    return (
      <div className="interview-container">
        <div className="error-banner">
          ⚠️ Your browser does not support the Web Speech API.
          <br />Please use Google Chrome for the best experience.
        </div>
      </div>
    );
  }

  return (
    <div className="interview-container">
      <QuestionCard
        question={currentQuestion}
        questionNumber={questionNumber}
        total={TOTAL_QUESTIONS}
      />

      <TranscriptBox transcript={transcript} isRecording={isRecording} />

      {isRecording && (
        <div className="timer-bar">
          <span>⏱️ {timer}s remaining</span>
        </div>
      )}

      <div className="controls">
        {status === 'idle' && !transcript && (
          <button className="btn btn-record" onClick={startRecording}>
            🎤 Start Answer
          </button>
        )}
        {status === 'recording' && (
          <button className="btn btn-stop" onClick={handleStop}>
            ⏹️ Stop Recording
          </button>
        )}
        {status === 'idle' && transcript && (
          <div className="submit-controls">
            <button className="btn btn-secondary" onClick={startRecording}>
              🔄 Re-record
            </button>
            <button className="btn btn-primary" onClick={handleSubmit}>
              ✅ Submit Answer
            </button>
          </div>
        )}
        {status === 'evaluating' && (
          <div className="evaluating-indicator">
            <div className="spinner" />
            <span>Evaluating your answer...</span>
          </div>
        )}
      </div>

      {error && <p className="error-text">{error}</p>}

      <EvaluationCard evaluation={evaluation} />
    </div>
  );
}
