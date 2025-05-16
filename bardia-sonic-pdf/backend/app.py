import os
from flask import Flask, jsonify, send_from_directory, request, Response
from flask_cors import CORS
import json
from werkzeug.utils import secure_filename
import logging

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize Flask app
app = Flask(__name__, static_folder=None)
CORS(app, supports_credentials=True)

# Define the directory where PDFs will be stored
UPLOAD_FOLDER = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'uploads')
# Create the upload folder if it doesn't exist
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

# Path to the frontend static files
FRONTEND_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'frontend', 'dist')

# Ensure the media directories exist
MUSIC_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'static', 'music')
EFFECTS_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'static', 'effects')
os.makedirs(MUSIC_DIR, exist_ok=True)
os.makedirs(EFFECTS_DIR, exist_ok=True)

# Sample data for PDFs
sample_pdfs = [
    {
        "id": "sample-1",
        "title": "Sample PDF 1",
        "author": "John Doe",
        "num_pages": 5,
        "created_at": "2023-05-01T10:00:00Z"
    },
    {
        "id": "sample-2",
        "title": "Sample PDF 2",
        "author": "Jane Smith",
        "num_pages": 12,
        "created_at": "2023-05-10T14:30:00Z"
    }
]

# API Routes
@app.route('/api/pdf/list', methods=['GET'])
def get_pdfs():
    """Return list of PDFs"""
    logger.info("Getting PDF list")
    return jsonify(sample_pdfs)

@app.route('/api/pdf/<pdf_id>', methods=['GET'])
def get_pdf(pdf_id):
    """Return details for a specific PDF"""
    logger.info(f"Getting PDF details for ID: {pdf_id}")
    for pdf in sample_pdfs:
        if pdf["id"] == pdf_id:
            # Add a file_url to point to the PDF file
            pdf_with_url = pdf.copy()
            pdf_with_url["file_url"] = f"/api/pdf/{pdf_id}/file"
            return jsonify(pdf_with_url)
    return jsonify({"error": "PDF not found"}), 404

@app.route('/api/pdf/<pdf_id>/file', methods=['GET'])
def get_pdf_file(pdf_id):
    """Return the PDF file"""
    logger.info(f"Accessing PDF file for ID: {pdf_id}")
    # This is a dummy implementation - in a real app, you'd retrieve the actual file
    sample_path = os.path.join(UPLOAD_FOLDER, f"{pdf_id}.pdf")
    if os.path.exists(sample_path):
        return send_from_directory(UPLOAD_FOLDER, f"{pdf_id}.pdf")
    
    # If no actual file exists, return a 404
    return jsonify({"error": "PDF file not found"}), 404

@app.route('/api/pdf/upload', methods=['POST'])
def upload_pdf():
    """Upload a new PDF file"""
    logger.info("PDF upload requested")
    if 'file' not in request.files:
        return jsonify({"error": "No file part"}), 400
    
    file = request.files['file']
    if file.filename == '':
        return jsonify({"error": "No selected file"}), 400
    
    title = request.form.get('title', 'Untitled PDF')
    
    # Create a new PDF ID
    pdf_id = f"pdf-{len(sample_pdfs) + 1}"
    
    # Save the file
    filename = secure_filename(file.filename)
    file_path = os.path.join(UPLOAD_FOLDER, f"{pdf_id}.pdf")
    file.save(file_path)
    
    # Create PDF metadata
    new_pdf = {
        "id": pdf_id,
        "title": title,
        "author": "User",
        "num_pages": 1,  # We'd normally extract this from the PDF
        "created_at": "2023-05-15T12:00:00Z",
        "file_path": file_path
    }
    
    # Add to our sample data
    sample_pdfs.append(new_pdf)
    
    return jsonify(new_pdf)

# Serve static media files
@app.route('/music/<path:filename>')
def serve_music(filename):
    """Serve music files"""
    return send_from_directory(MUSIC_DIR, filename)

@app.route('/effects/<path:filename>')
def serve_effects(filename):
    """Serve effect sound files"""
    return send_from_directory(EFFECTS_DIR, filename)

# Serve the frontend (for production deployment)
@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def serve_frontend(path):
    """Serve the frontend application"""
    # If we're requesting an API route, let the other routes handle it
    if path.startswith('api/'):
        return jsonify({"error": "Not found"}), 404
    
    # Check if the path exists in the frontend build directory
    file_path = os.path.join(FRONTEND_PATH, path)
    if os.path.exists(file_path) and not os.path.isdir(file_path):
        return send_from_directory(FRONTEND_PATH, path)
    
    # Default to serving index.html for client-side routing
    return send_from_directory(FRONTEND_PATH, 'index.html')

if __name__ == '__main__':
    logger.info("Starting Bardia Sonic PDF Server")
    app.run(host='0.0.0.0', port=5000, debug=True) 