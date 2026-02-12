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
The question should test whether the candidate actually knows the skills listed on their resume.
Return ONLY the question text, nothing else.

Resume:
{resume_text}
"""
    return _ask(prompt)


def generate_next_question(
    resume_text: str,
    previous_questions: list,
    previous_answers: list,
    current_question: str,
    current_answer: str,
) -> str:
    """Generate the next adaptive interview question based on the conversation so far."""
    prev_qa = ""
    for i, (q, a) in enumerate(zip(previous_questions, previous_answers), 1):
        prev_qa += f"\nQ{i}: {q}\nA{i}: {a}\n"

    prompt = f"""You are a senior technical interviewer.

The candidate's resume lists these skills and experience:
{resume_text}

Previous Questions and Answers:
{prev_qa if prev_qa else "None"}

Latest Question: {current_question}
Latest Answer: {current_answer}

Generate the NEXT interview question that:
- Tests whether the candidate truly knows the skills on their resume
- Is adaptive based on their previous answers
- Is slightly harder than the previous question
- Explores a different area of their claimed expertise if they answered well, or digs deeper if they struggled

Return ONLY the question text, nothing else.
"""
    return _ask(prompt)


def generate_final_report(
    resume_text: str,
    questions: list,
    answers: list,
) -> dict:
    """Generate the final evaluation report based purely on interview answers."""
    qa_text = ""
    for i, (q, a) in enumerate(zip(questions, answers), 1):
        qa_text += f"\nQuestion {i}: {q}\nAnswer {i}: {a}\n"

    prompt = f"""You are a senior technical interviewer writing a final evaluation report.

The candidate claimed the following skills on their resume:
{resume_text}

Here is the full interview transcript:
{qa_text}

Evaluate the candidate SOLELY based on their interview answers (not the resume itself).
Judge how well they actually demonstrated knowledge of what they claimed on their resume.
The overall_score should be out of 100.

Score criteria:
- Technical depth and accuracy of answers (0-25 points)
- Clarity and communication (0-25 points)
- Practical understanding vs theoretical (0-25 points)
- Consistency across questions and honesty (0-25 points)

Return ONLY valid JSON in this exact format:
{{
  "overall_score": <number 0-100>,
  "summary": "<2-3 sentence overall assessment of the candidate based on their interview performance>",
  "strong_areas": "<skills/topics where the candidate demonstrated genuine knowledge>",
  "weak_areas": "<skills/topics where the candidate struggled or seemed unfamiliar despite listing on resume>",
  "hire_recommendation": "<Strongly Recommend / Recommend / Consider / Do Not Recommend>",
  "improvement_roadmap": "<specific actionable steps to improve their weak areas>"
}}
"""
    return _parse_json(_ask(prompt))
