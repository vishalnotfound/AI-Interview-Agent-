import uuid
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from models.schemas import (
    EvaluateRequest,
    EvaluateResponse,
    EvaluationScore,
    FinalReportResponse,
    FinalReport,
)
from services.resume_parser import parse_resume
from services.gemini_service import (
    generate_first_question,
    evaluate_and_next,
    generate_final_report,
)

app = FastAPI(title="AI Interview Prep API")

# CORS — allow the Vite dev server
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# In-memory session store
sessions: dict = {}

TOTAL_QUESTIONS = 5


@app.post("/upload-resume")
async def upload_resume(file: UploadFile = File(...)):
    """Parse resume, create session, and generate the first interview question."""
    if not file.filename:
        raise HTTPException(status_code=400, detail="No file provided.")

    try:
        file_bytes = await file.read()
        resume_text = parse_resume(file_bytes, file.filename)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception:
        raise HTTPException(status_code=500, detail="Failed to parse resume file.")

    try:
        first_question = generate_first_question(resume_text)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Gemini API error: {str(e)}")

    session_id = str(uuid.uuid4())
    sessions[session_id] = {
        "resume_text": resume_text,
        "questions": [first_question],
        "answers": [],
        "evaluations": [],
    }

    return {"session_id": session_id, "first_question": first_question}


@app.post("/evaluate-answer")
async def evaluate_answer(req: EvaluateRequest):
    """Evaluate the current answer. After 5 questions, returns the final report."""
    session = sessions.get(req.session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found.")

    # Store the answer
    session["answers"].append(req.current_answer)

    question_number = len(session["answers"])  # which question we just answered

    try:
        result = evaluate_and_next(
            resume_text=session["resume_text"],
            previous_questions=req.previous_questions,
            previous_answers=req.previous_answers,
            current_question=req.current_question,
            current_answer=req.current_answer,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Gemini API error: {str(e)}")

    evaluation = result["evaluation"]
    session["evaluations"].append(evaluation)

    # If all questions answered → generate final report
    if question_number >= TOTAL_QUESTIONS:
        try:
            report_data = generate_final_report(
                resume_text=session["resume_text"],
                questions=session["questions"],
                answers=session["answers"],
                evaluations=session["evaluations"],
            )
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Final report error: {str(e)}")

        return {
            "evaluation": evaluation,
            "question_count": question_number,
            "final_report": report_data,
        }

    # Otherwise store the next question and return
    next_q = result.get("next_question", "")
    session["questions"].append(next_q)

    return {
        "evaluation": evaluation,
        "next_question": next_q,
        "question_count": question_number,
    }
