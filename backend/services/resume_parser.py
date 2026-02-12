import io
import pdfplumber
from docx import Document


def parse_resume(file_bytes: bytes, filename: str) -> str:
    """Extract text from a PDF or DOCX resume file."""
    extension = filename.lower().rsplit(".", 1)[-1] if "." in filename else ""

    if extension == "pdf":
        return _parse_pdf(file_bytes)
    elif extension in ("docx", "doc"):
        return _parse_docx(file_bytes)
    else:
        raise ValueError(f"Unsupported file type: .{extension}. Please upload a PDF or DOCX file.")


def _parse_pdf(file_bytes: bytes) -> str:
    text_parts = []
    with pdfplumber.open(io.BytesIO(file_bytes)) as pdf:
        for page in pdf.pages:
            page_text = page.extract_text()
            if page_text:
                text_parts.append(page_text)
    text = "\n".join(text_parts).strip()
    if not text:
        raise ValueError("Could not extract any text from the PDF. Please ensure it is not image-based.")
    return text


def _parse_docx(file_bytes: bytes) -> str:
    doc = Document(io.BytesIO(file_bytes))
    text_parts = [para.text for para in doc.paragraphs if para.text.strip()]
    text = "\n".join(text_parts).strip()
    if not text:
        raise ValueError("Could not extract any text from the DOCX file.")
    return text
