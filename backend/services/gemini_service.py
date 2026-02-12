import json
import os
from groq import Groq
from dotenv import load_dotenv

load_dotenv()

client = Groq(api_key=os.getenv("GROQ_API_KEY"))
MODEL = "llama-3.3-70b-versatile"


def _ask(prompt: str) -> str:
    """Send a prompt to the Groq API and return the response text."""
    response = client.chat.completions.create(
        model=MODEL,
        messages=[{"role": "user", "content": prompt}],
        temperature=0.7,
        max_tokens=2048,
    )
    return response.choices[0].message.content.strip()


def _parse_json(text: str) -> dict:
    """Extract JSON from a response that may contain markdown fences."""
    if text.startswith("```"):
        text = text.split("\n", 1)[1] if "\n" in text else text[3:]
    if text.endswith("```"):
        text = text[:-3]
    text = text.strip()
    return json.loads(text)


def generate_first_question(resume_text: str) -> str:
    """Generate the first interview question based on resume content."""
    prompt = f"""You are a senior technical interviewer.
Based on the following resume, generate ONE thoughtful opening interview question.
The question should be relevant to the candidate's primary skills and experience.
Return ONLY the question text, nothing else.

Resume:
{resume_text}
"""
    return _ask(prompt)


def evaluate_and_next(
    resume_text: str,
    previous_questions: list,
    previous_answers: list,
    current_question: str,
    current_answer: str,
) -> dict:
    """Evaluate the current answer and generate the next question."""
    prev_qa = ""
    for i, (q, a) in enumerate(zip(previous_questions, previous_answers), 1):
        prev_qa += f"\nQ{i}: {q}\nA{i}: {a}\n"

    prompt = f"""You are a senior technical interviewer.

Resume:
{resume_text}

Previous Questions and Answers:
{prev_qa if prev_qa else "None"}

Current Question:
{current_question}

Current Answer:
{current_answer}

Tasks:
1. Score from 0-10 for each:
   - technical_score (Technical depth)
   - clarity_score (Clarity of explanation)
   - structure_score (Structure and organization)
   - relevance_score (Relevance to the question)
2. Identify strengths (1-2 sentences).
3. Identify weaknesses (1-2 sentences).
4. Suggest one clear improvement_tip (1 sentence).
5. Generate the next interview question that is:
   - Adaptive to identified weaknesses
   - Slightly harder than the previous question
   - Based on the candidate's resume skills

Return ONLY valid JSON in this exact format:
{{
  "evaluation": {{
    "technical_score": <number>,
    "clarity_score": <number>,
    "structure_score": <number>,
    "relevance_score": <number>,
    "strengths": "<string>",
    "weaknesses": "<string>",
    "improvement_tip": "<string>"
  }},
  "next_question": "<string>"
}}
"""
    return _parse_json(_ask(prompt))


def generate_final_report(
    resume_text: str,
    questions: list,
    answers: list,
    evaluations: list,
) -> dict:
    """Generate the final comprehensive evaluation report."""
    qa_text = ""
    eval_text = ""
    for i, (q, a) in enumerate(zip(questions, answers), 1):
        qa_text += f"\nQ{i}: {q}\nA{i}: {a}\n"
    for i, ev in enumerate(evaluations, 1):
        eval_text += (
            f"\nQ{i} Scores — Technical: {ev['technical_score']}, "
            f"Clarity: {ev['clarity_score']}, Structure: {ev['structure_score']}, "
            f"Relevance: {ev['relevance_score']}\n"
            f"Strengths: {ev['strengths']}\n"
            f"Weaknesses: {ev['weaknesses']}\n"
        )

    prompt = f"""You are a senior technical interviewer writing a final evaluation report.

Resume:
{resume_text}

Interview Questions and Answers:
{qa_text}

Per-Question Evaluations:
{eval_text}

Generate a comprehensive final report. The overall_score should be out of 100.

Return ONLY valid JSON in this exact format:
{{
  "overall_score": <number 0-100>,
  "summary": "<2-3 sentence overall assessment>",
  "strong_areas": "<key strengths demonstrated>",
  "weak_areas": "<areas needing improvement>",
  "hire_recommendation": "<Strongly Recommend / Recommend / Consider / Do Not Recommend>",
  "improvement_roadmap": "<specific actionable steps to improve>"
}}
"""
    return _parse_json(_ask(prompt))
