const API_BASE = 'http://localhost:8000';

export async function uploadResume(file) {
    const formData = new FormData();
    formData.append('file', file);

    const res = await fetch(`${API_BASE}/upload-resume`, {
        method: 'POST',
        body: formData,
    });

    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || 'Failed to upload resume');
    }

    return res.json();
}

export async function evaluateAnswer(payload) {
    const res = await fetch(`${API_BASE}/evaluate-answer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
    });

    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || 'Failed to evaluate answer');
    }

    return res.json();
}
