import { useState, useRef } from 'react';

export default function ResumeUploader({ onUploadSuccess }) {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [parsed, setParsed] = useState(false);
  const fileRef = useRef(null);

  const handleFileChange = (e) => {
    const selected = e.target.files[0];
    if (selected) {
      const ext = selected.name.split('.').pop().toLowerCase();
      if (!['pdf', 'docx', 'doc'].includes(ext)) {
        setError('Please upload a PDF or DOCX file.');
        setFile(null);
        return;
      }
      setFile(selected);
      setError('');
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setError('Please select a file first.');
      return;
    }
    setLoading(true);
    setError('');

    try {
      const { uploadResume } = await import('../api');
      const data = await uploadResume(file);
      setParsed(true);
      setLoading(false);
      // Store the data, user will click "Start Interview" to proceed
      fileRef.current = data;
    } catch (err) {
      setError(err.message || 'Upload failed. Please try again.');
      setLoading(false);
    }
  };

  const handleStart = () => {
    if (fileRef.current) {
      onUploadSuccess(fileRef.current);
    }
  };

  return (
    <div className="upload-container">
      <div className="upload-card">
        <div className="upload-icon">📄</div>
        <h1>AI Interview Prep</h1>
        <p className="subtitle">Upload your resume to start a personalized mock interview</p>

        <div className="file-input-wrapper">
          <input
            type="file"
            accept=".pdf,.docx,.doc"
            onChange={handleFileChange}
            id="resume-file"
            className="file-input"
          />
          <label htmlFor="resume-file" className="file-label">
            {file ? file.name : 'Choose PDF or DOCX'}
          </label>
        </div>

        {error && <p className="error-text">{error}</p>}

        {!parsed ? (
          <button
            className="btn btn-primary"
            onClick={handleUpload}
            disabled={!file || loading}
          >
            {loading ? (
              <span className="loading-dots">
                <span>Analyzing Resume</span>
                <span className="dots">...</span>
              </span>
            ) : 'Upload & Analyze'}
          </button>
        ) : (
          <button className="btn btn-success" onClick={handleStart}>
            🎤 Start Interview
          </button>
        )}

        {parsed && (
          <p className="success-text">✅ Resume analyzed successfully! Click above to begin.</p>
        )}
      </div>
    </div>
  );
}
