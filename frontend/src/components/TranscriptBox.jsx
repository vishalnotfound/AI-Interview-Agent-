export default function TranscriptBox({ transcript, isRecording }) {
  return (
    <div className={`transcript-box ${isRecording ? 'recording' : ''}`}>
      <div className="transcript-header">
        {isRecording && <span className="rec-dot" />}
        <span>{isRecording ? 'Listening...' : 'Transcript'}</span>
      </div>
      <p className="transcript-text">
        {transcript || (isRecording ? 'Start speaking...' : 'No transcript yet.')}
      </p>
    </div>
  );
}
