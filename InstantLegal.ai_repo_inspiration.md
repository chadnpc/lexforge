# `InstantLegal.ai`

## Directory `/`

```sh
|-- static/
|-- templates/
|-- Procfile    [text]
|-- README.md    [text]
|-- app.py    [text]
|-- requirements.txt    [text]
`-- runtime.txt    [text]
```

### Source file: `Procfile`

```
web: gunicorn app:app --timeout ${GUNICORN_TIMEOUT:-60} --workers ${WEB_CONCURRENCY:-2} --log-file - 
```

### Source file: `README.md`

```markdown
# InstantLegal AI - Legal Document Generator

A Flask web application that generates professional legal documents using OpenAI's GPT-4 API and ReportLab for PDF generation.

## Features

- AI-powered legal document generation
- Multiple document types (NDA, Terms of Service, Privacy Policy, etc.)
- Customization based on business type, industry, and state
- PDF generation and download
- Responsive web interface

## Tech Stack

- **Backend**: Python 3.10+, Flask
- **AI**: OpenAI GPT-4 API
- **PDF Generation**: ReportLab
- **Frontend**: HTML, CSS, JavaScript (Vanilla)
- **Security**: Flask-Limiter for rate limiting, CORS protection

## Installation

1. Clone the repository:
```
git clone <repository-url>
cd instantlegal-ai
```

2. Create a virtual environment and activate it:
```
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

3. Install dependencies:
```
pip install -r requirements.txt
```

4. Create a `.env` file in the root directory with the following variables:
```
FLASK_APP=app.py
FLASK_ENV=development
OPENAI_API_KEY=your_openai_api_key_here
SECRET_KEY=your_secret_key_here
```

5. Run the application:
```
flask run
```

6. Open your browser and navigate to `http://localhost:5000`

## Usage

1. Select a document type from the dropdown menu
2. Fill in your business details
3. Choose protection level and any special clauses
4. Click "Generate Document Now"
5. Download your generated PDF document

## Project Structure

```
instantlegal-ai/
├── app.py                  # Main Flask application
├── requirements.txt        # Python dependencies
├── .env                    # Environment variables (not in repo)
├── .gitignore              # Git ignore file
├── README.md               # Project documentation
├── static/                 # Static files
│   ├── css/                # CSS files
│   ├── js/                 # JavaScript files
│   └── documents/          # Generated documents
└── templates/              # HTML templates
    └── index.html          # Main application template
```

## License

MIT

## Disclaimer

This application is for demonstration purposes only. The generated legal documents should be reviewed by a qualified legal professional before use in a real-world context. 
```

### Source file: `app.py`

```py
import os
import json
import uuid
from datetime import datetime
from flask import Flask, render_template, request, jsonify, send_file, redirect, url_for, send_from_directory
from flask_cors import CORS
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
from dotenv import load_dotenv
from openai import OpenAI
from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_JUSTIFY, TA_CENTER, TA_LEFT, TA_RIGHT
from reportlab.lib import colors
import stripe
import time

# Load environment variables
load_dotenv()

# Initialize Flask app
app = Flask(__name__)
app.secret_key = os.getenv("SECRET_KEY", "default-secret-key")

# Configure CORS
CORS(app)

# Configure rate limiting
limiter = Limiter(
    get_remote_address,
    app=app,
    default_limits=["200 per day", "50 per hour"],
    storage_uri="memory://",
)

# Configure Stripe
stripe.api_key = os.getenv("STRIPE_SECRET_KEY")
STRIPE_PUBLISHABLE_KEY = os.getenv("STRIPE_PUBLISHABLE_KEY")

# Validate API keys
if not stripe.api_key:
    app.logger.warning("Stripe API key not set. Stripe functionality will not work.")
if not STRIPE_PUBLISHABLE_KEY:
    app.logger.warning("Stripe publishable key not set. Stripe checkout will not work.")

# Configure OpenAI API key
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
if not OPENAI_API_KEY:
    app.logger.warning("OpenAI API key not set. Document generation will not work.")

# Initialize OpenAI client with no proxy configuration
client = OpenAI(api_key=OPENAI_API_KEY)

# Ensure the uploads directory exists
UPLOAD_FOLDER = os.path.join(os.getcwd(), "static", "documents")
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

# Ensure the downloads directory exists
DOWNLOAD_FOLDER = os.path.join(os.getcwd(), "static", "downloads")
os.makedirs(DOWNLOAD_FOLDER, exist_ok=True)

# Document types and their descriptions
DOCUMENT_TYPES = {
    "nda": "Non-Disclosure Agreement (NDA)",
    "terms": "Website Terms of Service",
    "privacy": "Privacy Policy",
    "contract": "Freelance Contract",
    "employee": "Employment Agreement",
    "partnership": "Partnership Agreement"
}

@app.route('/')
def index():
    return render_template('index.html', document_types=DOCUMENT_TYPES, stripe_key=STRIPE_PUBLISHABLE_KEY)

@app.route('/create-checkout-session', methods=['POST'])
def create_checkout_session():
    try:
        # Store form data in session or temporary storage
        form_data = request.form
        
        # Create a checkout session with standard checkout
        checkout_session = stripe.checkout.Session.create(
            payment_method_types=['card'],
            line_items=[
                {
                    'price_data': {
                        'currency': 'usd',
                        'product_data': {
                            'name': f'Legal Document: {DOCUMENT_TYPES.get(form_data.get("document_type", ""), "Custom Document")}',
                            'description': 'AI-generated legal document tailored to your business needs',
                        },
                        'unit_amount': 9900,  # $99.00 in cents
                    },
                    'quantity': 1,
                },
            ],
            mode='payment',
            success_url=request.host_url + 'payment-return?session_id={CHECKOUT_SESSION_ID}',
            cancel_url=request.host_url,
            metadata={
                'form_data': json.dumps(dict(form_data))
            }
        )
        
        return jsonify({
            'sessionId': checkout_session.id
        })
    except Exception as e:
        app.logger.error(f"Stripe error: {str(e)}")
        return jsonify({'error': str(e)}), 400

@app.route('/payment-return', methods=['GET'])
def payment_return():
    session_id = request.args.get('session_id')
    return render_template('payment_return.html', session_id=session_id, stripe_key=STRIPE_PUBLISHABLE_KEY)

@app.route('/payment-success', methods=['GET'])
def payment_success():
    session_id = request.args.get('session_id')
    
    try:
        # Retrieve the session to get metadata
        session = stripe.checkout.Session.retrieve(session_id)
        
        # In a production environment, you should verify the payment status
        # For now, we'll proceed with document generation
        
        # Extract form data from metadata
        form_data = json.loads(session.metadata.get('form_data', '{}'))
        
        # Set a timeout for the entire request to prevent Heroku H12 errors
        # This will ensure we respond to the client before Heroku times out
        start_time = time.time()
        timeout_limit = 25  # seconds, less than Heroku's 30s limit
        
        # Generate the document with retry logic
        max_retries = 2
        retry_delay = 1  # seconds
        
        for attempt in range(max_retries):
            try:
                # Check if we're approaching the timeout limit
                if time.time() - start_time > timeout_limit:
                    # If we're close to timeout, return a "processing" response
                    # The client will retry the request
                    app.logger.warning(f"Approaching timeout limit, returning processing status")
                    return jsonify({
                        'status': 'processing',
                        'message': 'Your document is still being generated. Please wait a moment and try again.'
                    }), 202
                
                document_result = generate_document(form_data)
                
                if document_result.get('success'):
                    return jsonify(document_result)
                else:
                    error_msg = document_result.get('error', 'Unknown error')
                    app.logger.error(f"Document generation failed: {error_msg}")
                    
                    if attempt < max_retries - 1:
                        # Not the last attempt, wait and retry
                        time.sleep(retry_delay)
                        retry_delay *= 2  # Exponential backoff
                        app.logger.info(f"Retrying document generation (attempt {attempt+2}/{max_retries})")
                    else:
                        # Last attempt failed
                        return jsonify({'error': f'Failed to generate document after {max_retries} attempts: {error_msg}'}), 500
            
            except Exception as doc_error:
                app.logger.error(f"Document generation exception (attempt {attempt+1}/{max_retries}): {str(doc_error)}")
                
                if attempt < max_retries - 1:
                    # Not the last attempt, wait and retry
                    time.sleep(retry_delay)
                    retry_delay *= 2  # Exponential backoff
                    app.logger.info(f"Retrying document generation (attempt {attempt+2}/{max_retries})")
                else:
                    # Last attempt failed
                    return jsonify({'error': f"Document generation failed after {max_retries} attempts: {str(doc_error)}"}), 500
            
    except stripe.error.StripeError as e:
        # Handle Stripe-specific errors
        app.logger.error(f"Stripe error: {str(e)}")
        return jsonify({'error': f"Payment verification failed: {str(e)}"}), 400
    except Exception as e:
        # Handle any other exceptions
        app.logger.error(f"Payment success route error: {str(e)}")
        return jsonify({'error': f"An unexpected error occurred: {str(e)}"}), 500

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint to verify the server is running properly"""
    try:
        # Check if we can connect to Stripe
        stripe.Account.retrieve()
        
        # Check if OpenAI API is accessible
        openai_status = "ok"
        try:
            # Simple model check with a short timeout
            client.models.list(timeout=5)
        except Exception as e:
            openai_status = f"error: {str(e)}"
        
        return jsonify({
            'status': 'healthy',
            'timestamp': datetime.now().isoformat(),
            'stripe': 'ok',
            'openai': openai_status
        })
    except Exception as e:
        return jsonify({
            'status': 'unhealthy',
            'error': str(e),
            'timestamp': datetime.now().isoformat()
        }), 500

@app.route('/generate-document', methods=['POST'])
def handle_document_generation():
    try:
        # For direct document generation (bypassing payment in development)
        if os.getenv("BYPASS_PAYMENT", "false").lower() == "true":
            return generate_document(request.form)
        else:
            return jsonify({'error': 'Payment required'}), 402
    except Exception as e:
        app.logger.error(f"Error generating document: {str(e)}")
        return jsonify({'error': f'Failed to generate document: {str(e)}'}), 500

def generate_document(form_data):
    try:
        # Extract form data
        document_type = form_data.get('document_type')
        business_name = form_data.get('business_name')
        business_type = form_data.get('business_type')
        state = form_data.get('state')
        industry = form_data.get('industry')
        protection_level = form_data.get('protection_level', '2')
        
        # Special clauses
        clauses = []
        if form_data.get('clause_confidentiality'):
            clauses.append("Enhanced Confidentiality")
        if form_data.get('clause_arbitration'):
            clauses.append("Arbitration Provision")
        if form_data.get('clause_termination'):
            clauses.append("Advanced Termination Options")
        if form_data.get('clause_ip'):
            clauses.append("Intellectual Property Protection")
        
        additional_instructions = form_data.get('additional_instructions', '')
        
        # Create prompt for OpenAI
        prompt = f"""Generate a professional {DOCUMENT_TYPES.get(document_type, 'legal document')} for {business_name}, a {business_type} in the {industry} industry, operating in {state}.

Protection Level: {protection_level} out of 3

Special Clauses to Include: {', '.join(clauses) if clauses else 'None'}

Additional Instructions: {additional_instructions}

**Formatting Guidelines:**
- Use clear section headings in bold and all caps (e.g., **TERMS AND CONDITIONS**).
- Use proper indentation and line spacing for readability.
- Ensure signature fields are properly spaced and formatted as follows:

  **Signature:** ______________________  **Date:** _______________

- Use bullet points for lists where appropriate.
- Avoid overly dense paragraphs; break them up into short, digestible sections.
- Use legal language but ensure clarity for business professionals.

Format the document professionally with appropriate sections, headings, and legal language. Include all necessary legal provisions for this type of document in {state}.
"""

        # Call OpenAI API with retry logic
        max_retries = 3
        retry_delay = 2  # seconds
        
        for attempt in range(max_retries):
            try:
                response = client.chat.completions.create(
                    model="gpt-4-turbo",  # Use a more reliable model
                    messages=[
                        {"role": "system", "content": "You are a legal document generator that creates professional, legally-sound documents tailored to specific business needs and jurisdictions."},
                        {"role": "user", "content": prompt}
                    ],
                    timeout=30,  # Shorter timeout to avoid worker timeouts
                    max_tokens=4000  # Limit token count to speed up generation
                )
                
                # Extract generated text
                document_text = response.choices[0].message.content
                break  # Success, exit the retry loop
                
            except Exception as e:
                app.logger.error(f"OpenAI API error (attempt {attempt+1}/{max_retries}): {str(e)}")
                
                if attempt < max_retries - 1:
                    # Not the last attempt, wait and retry
                    time.sleep(retry_delay)
                    retry_delay *= 2  # Exponential backoff
                else:
                    # Last attempt failed, raise the exception
                    app.logger.error(f"All {max_retries} attempts to call OpenAI API failed")
                    raise Exception(f"Failed to generate document after {max_retries} attempts: {str(e)}")
        
        # Generate a unique filename
        unique_id = uuid.uuid4().hex[:8]
        filename = f"{document_type}_{unique_id}.pdf"
        filepath = os.path.join(DOWNLOAD_FOLDER, filename)
        
        # Ensure directory exists
        os.makedirs(os.path.dirname(filepath), exist_ok=True)
        
        # Create PDF
        create_pdf(document_text, filepath, business_name, DOCUMENT_TYPES.get(document_type, "Legal Document"))
        
        # Return success response
        return {
            'success': True,
            'download_url': f'/download/{filename}'
        }
    
    except Exception as e:
        app.logger.error(f"OpenAI API error: {str(e)}")
        raise Exception(f"Failed to generate document: {str(e)}")

def create_pdf(text, filepath, business_name, document_type):
    # Create PDF document
    doc = SimpleDocTemplate(filepath, pagesize=letter,
                          rightMargin=72, leftMargin=72,
                          topMargin=72, bottomMargin=72)
    styles = getSampleStyleSheet()
    
    # Custom styles
    title_style = ParagraphStyle(
        'Title',
        parent=styles['Heading1'],
        fontSize=16,
        alignment=TA_CENTER,
        spaceAfter=20,
        textColor=colors.navy,
        fontName='Helvetica-Bold'
    )
    
    normal_style = ParagraphStyle(
        'Normal',
        parent=styles['Normal'],
        fontSize=11,
        alignment=TA_JUSTIFY,
        firstLineIndent=20,
        leading=14,
        spaceBefore=6,
        spaceAfter=6
    )
    
    header_style = ParagraphStyle(
        'Header',
        parent=styles['Heading2'],
        fontSize=13,
        spaceAfter=10,
        spaceBefore=15,
        textColor=colors.navy,
        fontName='Helvetica-Bold',
        borderWidth=1,
        borderColor=colors.lightgrey,
        borderPadding=5,
        borderRadius=2
    )
    
    # Build document content
    content = []
    
    # Add title
    content.append(Paragraph(f"{document_type.upper()}", title_style))
    content.append(Paragraph(f"For: {business_name}", title_style))
    content.append(Spacer(1, 20))
    
    # Add date with better formatting
    date_style = ParagraphStyle(
        'Date',
        parent=styles['Normal'],
        fontSize=11,
        alignment=TA_RIGHT,
        textColor=colors.darkgrey
    )
    content.append(Paragraph(f"Date: {datetime.now().strftime('%B %d, %Y')}", date_style))
    content.append(Spacer(1, 20))
    
    # Process the text into paragraphs
    paragraphs = text.split('\n')
    for para in paragraphs:
        if para.strip():
            # Handle markdown-style headers (# Header)
            if para.strip().startswith('#'):
                header_text = para.replace('#', '').strip()
                content.append(Paragraph(header_text, header_style))
            # Handle all-caps headers (HEADER)
            elif para.strip().isupper() and len(para.strip()) > 3:
                content.append(Paragraph(para.strip(), header_style))
            # Handle bullet points
            elif para.strip().startswith('•') or para.strip().startswith('-') or para.strip().startswith('*'):
                bullet_style = ParagraphStyle(
                    'Bullet',
                    parent=normal_style,
                    leftIndent=30,
                    firstLineIndent=0,
                    spaceBefore=3,
                    spaceAfter=3
                )
                content.append(Paragraph(para.strip(), bullet_style))
            # Handle signature lines
            elif "signature" in para.lower() or "sign" in para.lower() or "date:" in para.lower():
                sig_style = ParagraphStyle(
                    'Signature',
                    parent=normal_style,
                    spaceBefore=15,
                    spaceAfter=15
                )
                content.append(Paragraph(para, sig_style))
            # Regular paragraph
            else:
                content.append(Paragraph(para, normal_style))
            
            # Add appropriate spacing
            if para.strip().startswith('#') or para.strip().isupper():
                content.append(Spacer(1, 10))
            else:
                content.append(Spacer(1, 6))
    
    # Build the PDF
    doc.build(content)

@app.route('/download/<filename>')
def download_file(filename):
    return send_from_directory(DOWNLOAD_FOLDER, filename, as_attachment=True)

# Route to serve favicon
@app.route('/favicon.ico')
def favicon():
    return send_from_directory(os.path.join(app.root_path, 'static'),
                               'favicon.ico', mimetype='image/vnd.microsoft.icon')

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port)
    
# Add Gunicorn configuration for Heroku
# This is used when the app is deployed to Heroku
# The timeout is increased to 120 seconds to allow for longer document generation times
# The worker class is set to 'sync' to ensure proper handling of long-running requests
# The number of workers is set to 3 to handle multiple concurrent requests
# The max requests is set to 1000 to prevent memory leaks
# The preload app option is set to True to load the app before forking workers
# The worker timeout is set to 120 seconds to prevent worker timeouts during document generation
# Note: These settings are only used when running with Gunicorn on Heroku
# For local development, the app.run() method is used
# These settings can be overridden by setting environment variables
# For example: GUNICORN_TIMEOUT=180 gunicorn app:app
# See: https://docs.gunicorn.org/en/stable/settings.html
#
# worker_class = 'sync'
# workers = 3
# max_requests = 1000
# preload_app = True
# timeout = 120 
```

### Source file: `requirements.txt`

```txt
Flask==2.3.3
openai==1.65.2
python-dotenv==1.0.0
reportlab==4.0.4
gunicorn==21.2.0
Werkzeug==2.3.7
firebase-admin==6.2.0
flask-cors==4.0.0
flask-limiter==3.5.0
stripe==7.13.0 
```

### Source file: `runtime.txt`

```txt
python-3.11.7 
```

### Directory `static/`

```sh
`-- favicon.ico    [binary]
```

### Directory `templates/`

```sh
|-- index.html    [text]
`-- payment_return.html    [text]
```

### Source file: `templates/index.html`

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>InstantLegal AI | Professional Legal Documents in Minutes</title>
    <link rel="shortcut icon" href="{{ url_for('static', filename='favicon.ico') }}">
    <script src="https://js.stripe.com/v3/"></script>
    <style>
        :root {
            --primary: #2563eb;
            --primary-dark: #1d4ed8;
            --secondary: #0ea5e9;
            --dark: #0f172a;
            --light: #f8fafc;
            --success: #10b981;
            --warning: #f59e0b;
            --danger: #ef4444;
            --gray: #64748b;
            --gray-light: #e2e8f0;
        }
        
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, sans-serif;
        }
        
        body {
            background-color: var(--light);
            color: var(--dark);
            line-height: 1.6;
        }
        
        .container {
            max-width: 1200px;
            margin: 0 auto;
            padding: 0 20px;
        }
        
        header {
            background-color: white;
            box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
            position: sticky;
            top: 0;
            z-index: 100;
        }
        
        .header-content {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 10px 0;
        }
        
        .logo {
            font-size: 22px;
            font-weight: 700;
            color: var(--dark);
            text-decoration: none;
            display: flex;
            align-items: center;
        }
        
        .logo span {
            color: var(--primary);
        }
        
        .guarantee-badge {
            display: flex;
            align-items: center;
            background: rgba(16, 185, 129, 0.1);
            border: 1px solid var(--success);
            padding: 8px 15px;
            border-radius: 30px;
            font-weight: 600;
            color: var(--success);
            font-size: 14px;
            gap: 8px;
        }
        
        .hero {
            background: linear-gradient(to right, var(--primary), var(--secondary));
            color: white;
            padding: 40px 0 80px;
            position: relative;
            overflow: hidden;
        }
        
        .hero::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            opacity: 0.05;
            z-index: 0;
        }
        
        .hero-content {
            position: relative;
            z-index: 1;
            display: flex;
            align-items: center;
            gap: 40px;
        }
        
        .hero-text {
            flex: 1;
        }
        
        .hero-form {
            flex: 1;
            background: white;
            padding: 30px;
            border-radius: 10px;
            box-shadow: 0 15px 30px rgba(0, 0, 0, 0.1);
            color: var(--dark);
        }
        
        h1 {
            font-size: 40px;
            margin-bottom: 20px;
            line-height: 1.2;
        }
        
        .subtitle {
            font-size: 18px;
            margin-bottom: 30px;
            opacity: 0.9;
        }
        
        .features {
            margin-top: 30px;
        }
        
        .feature {
            display: flex;
            align-items: center;
            margin-bottom: 15px;
        }
        
        .feature-icon {
            background: rgba(255, 255, 255, 0.2);
            width: 36px;
            height: 36px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            margin-right: 15px;
            flex-shrink: 0;
        }
        
        .form-title {
            font-size: 20px;
            margin-bottom: 20px;
            text-align: center;
            color: var(--dark);
        }
        
        .form-group {
            margin-bottom: 20px;
        }
        
        label {
            display: block;
            margin-bottom: 8px;
            font-weight: 500;
            color: var(--dark);
        }
        
        input, select, textarea {
            width: 100%;
            padding: 12px 15px;
            border: 1px solid var(--gray-light);
            border-radius: 6px;
            font-size: 16px;
            transition: all 0.3s ease;
        }
        
        input:focus, select:focus, textarea:focus {
            outline: none;
            border-color: var(--primary);
            box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.15);
        }
        
        select {
            appearance: none;
            background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' fill='%2364748b' viewBox='0 0 16 16'%3E%3Cpath d='M7.247 11.14 2.451 5.658C1.885 5.013 2.345 4 3.204 4h9.592a1 1 0 0 1 .753 1.659l-4.796 5.48a1 1 0 0 1-1.506 0z'/%3E%3C/svg%3E");
            background-repeat: no-repeat;
            background-position: calc(100% - 15px) center;
            padding-right: 40px;
        }
        
        .form-row {
            display: flex;
            gap: 15px;
        }
        
        .form-row .form-group {
            flex: 1;
        }
        
        .checkbox-group {
            margin-top: 10px;
        }
        
        .checkbox-item {
            display: flex;
            align-items: center;
            margin-bottom: 8px;
        }
        
        .checkbox-item input[type="checkbox"] {
            width: auto;
            margin-right: 10px;
        }
        
        .range-slider {
            width: 100%;
            margin-top: 10px;
        }
        
        .slider-labels {
            display: flex;
            justify-content: space-between;
            margin-top: 5px;
            font-size: 12px;
            color: var(--gray);
        }
        
        .submit-btn {
            background: var(--primary);
            color: white;
            border: none;
            border-radius: 6px;
            padding: 15px;
            font-size: 18px;
            font-weight: 600;
            cursor: pointer;
            width: 100%;
            transition: all 0.3s ease;
            display: flex;
            justify-content: center;
            align-items: center;
            gap: 10px;
        }
        
        .submit-btn:hover {
            background: var(--primary-dark);
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(37, 99, 235, 0.2);
        }
        
        .submit-btn:active {
            transform: translateY(0);
        }
        
        .urgency {
            font-size: 14px;
            text-align: center;
            margin-top: 15px;
            color: var(--warning);
            font-weight: 500;
        }
        
        /* Special Offer Timer Styles */
        .special-offer-timer {
            background-color: #fff9f0;
            border-radius: 8px;
            padding: 15px;
            margin-bottom: 20px;
            text-align: center;
            border: 1px solid #ffe0b2;
        }
        
        .special-offer-timer .timer-label {
            font-weight: 600;
            color: #f59e0b;
            margin-bottom: 10px;
            font-size: 16px;
        }
        
        .timer-display {
            display: flex;
            justify-content: center;
            gap: 15px;
        }
        
        .timer-unit {
            display: flex;
            flex-direction: column;
            align-items: center;
        }
        
        .timer-value {
            background-color: #f59e0b;
            color: white;
            font-weight: 700;
            font-size: 24px;
            width: 50px;
            height: 50px;
            border-radius: 6px;
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }
        
        .timer-unit .timer-label {
            font-size: 12px;
            margin-top: 5px;
            color: #64748b;
            font-weight: 600;
        }
        
        /* Pricing Section Styles */
        .pricing-section {
            background-color: #f8fafc;
            border-radius: 8px;
            padding: 20px;
            margin-bottom: 20px;
            text-align: center;
            border: 1px solid #e2e8f0;
        }
        
        .price-display {
            display: flex;
            align-items: baseline;
            justify-content: center;
            margin-bottom: 5px;
        }
        
        .price-amount {
            font-size: 36px;
            font-weight: 700;
            color: var(--dark);
        }
        
        .price-period {
            font-size: 16px;
            color: var(--gray);
            margin-left: 5px;
        }
        
        .price-original {
            font-size: 14px;
            color: var(--gray);
            margin-bottom: 15px;
        }
        
        .price-features {
            display: flex;
            flex-direction: column;
            gap: 10px;
            margin-bottom: 15px;
        }
        
        .price-feature {
            display: flex;
            align-items: center;
            gap: 8px;
            font-size: 14px;
            color: var(--dark);
        }
        
        .limited-offer {
            font-size: 14px;
            color: var(--warning);
            font-weight: 500;
        }
        
        footer {
            background: var(--dark);
            color: white;
            padding: 50px 0;
            margin-top: 50px;
        }
        
        .footer-content {
            display: grid;
            grid-template-columns: 2fr 1fr 1fr 1fr;
            gap: 40px;
        }
        
        .footer-logo {
            font-size: 22px;
            font-weight: 700;
            color: white;
            margin-bottom: 20px;
            display: block;
        }
        
        .footer-logo span {
            color: var(--primary);
        }
        
        .footer-description {
            opacity: 0.7;
            margin-bottom: 20px;
        }
        
        .footer-title {
            font-size: 18px;
            margin-bottom: 20px;
            font-weight: 600;
        }
        
        .footer-links {
            list-style: none;
        }
        
        .footer-links li {
            margin-bottom: 10px;
        }
        
        .footer-links a {
            color: rgba(255, 255, 255, 0.7);
            text-decoration: none;
            transition: all 0.3s ease;
        }
        
        .footer-links a:hover {
            color: white;
        }
        
        .trust-badges {
            display: flex;
            justify-content: center;
            gap: 20px;
            margin-top: 20px;
        }
        
        .badge {
            background: rgba(255, 255, 255, 0.1);
            padding: 10px 15px;
            border-radius: 5px;
            font-size: 14px;
            display: flex;
            align-items: center;
            gap: 8px;
        }
        
        .loading-overlay {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(15, 23, 42, 0.85);
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            z-index: 1000;
            display: none;
            color: white;
            text-align: center;
        }
        
        .loading-content {
            background: rgba(37, 99, 235, 0.1);
            border-radius: 16px;
            padding: 40px;
            max-width: 500px;
            box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
            backdrop-filter: blur(8px);
            border: 1px solid rgba(255, 255, 255, 0.1);
        }
        
        .loading-icon {
            font-size: 60px;
            margin-bottom: 20px;
            display: inline-block;
            animation: bounce 2s ease infinite;
        }
        
        @keyframes bounce {
            0%, 20%, 50%, 80%, 100% {transform: translateY(0);}
            40% {transform: translateY(-20px);}
            60% {transform: translateY(-10px);}
        }
        
        .loading-title {
            font-size: 24px;
            font-weight: 700;
            margin-bottom: 10px;
            color: white;
        }
        
        .loading-subtitle {
            font-size: 16px;
            margin-bottom: 25px;
            opacity: 0.8;
        }
        
        .loading-catchphrase {
            font-size: 18px;
            font-style: italic;
            margin: 20px 0;
            min-height: 54px;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        
        .loading-progress {
            width: 100%;
            height: 6px;
            background: rgba(255, 255, 255, 0.2);
            border-radius: 3px;
            margin: 20px 0;
            overflow: hidden;
            position: relative;
        }
        
        .loading-progress-bar {
            position: absolute;
            top: 0;
            left: 0;
            height: 100%;
            width: 0%;
            background: linear-gradient(to right, var(--primary), var(--secondary));
            border-radius: 3px;
            transition: width 0.5s ease;
        }
        
        .loading-time {
            font-size: 14px;
            opacity: 0.7;
        }
        
        .loading-spinner {
            width: 50px;
            height: 50px;
            border: 5px solid rgba(255, 255, 255, 0.3);
            border-radius: 50%;
            border-top-color: var(--primary);
            animation: spin 1s ease-in-out infinite;
            display: none;
        }
        
        @keyframes spin {
            to { transform: rotate(360deg); }
        }
        
        .success-message {
            background: rgba(16, 185, 129, 0.1);
            border: 1px solid var(--success);
            color: var(--success);
            padding: 15px;
            border-radius: 6px;
            margin-bottom: 20px;
            display: none;
        }
        
        .error-message {
            background: rgba(239, 68, 68, 0.1);
            border: 1px solid var(--danger);
            color: var(--danger);
            padding: 15px;
            border-radius: 6px;
            margin-bottom: 20px;
            display: none;
        }
        
        @media (max-width: 992px) {
            .hero-content {
                flex-direction: column;
            }
            
            .footer-content {
                grid-template-columns: 1fr 1fr;
            }
        }
        
        @media (max-width: 768px) {
            h1 {
                font-size: 32px;
            }
        }
        
        @media (max-width: 576px) {
            .form-row {
                flex-direction: column;
                gap: 0;
            }
            
            .footer-content {
                grid-template-columns: 1fr;
            }
        }
        
        /* Document Preview Styles */
        .document-preview {
            background-color: white;
            padding: 2rem;
            border-radius: 8px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
            position: relative;
            overflow: hidden;
            font-size: 0.9rem;
            line-height: 1.6;
            color: var(--dark);
        }
        
        /* Watermark style */
        .watermark {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%) rotate(-45deg);
            font-size: 8rem;
            font-weight: bold;
            color: rgba(200, 200, 200, 0.2);
            pointer-events: none;
            z-index: 1;
            user-select: none;
        }
        
        .document-preview h3 {
            font-size: 1.5rem;
            margin-bottom: 1.5rem;
            color: var(--dark);
        }
        
        .document-preview h4 {
            font-size: 1.1rem;
            margin: 1.5rem 0 0.5rem;
        }
        
        .document-preview p {
            margin-bottom: 1rem;
        }
        
        .copyright {
            text-align: center;
            padding-top: 50px;
            opacity: 0.7;
            font-size: 14px;
        }
        
        .trust-features {
            display: flex;
            justify-content: center;
            gap: 30px;
            margin: 40px 0 20px;
        }
        
        .feature-box {
            display: flex;
            align-items: center;
            gap: 10px;
            background: rgba(255, 255, 255, 0.1);
            padding: 15px 25px;
            border-radius: 8px;
            transition: all 0.3s ease;
        }
        
        .feature-box:hover {
            transform: translateY(-5px);
            background: rgba(255, 255, 255, 0.15);
        }
        
        .feature-icon {
            font-size: 20px;
            color: var(--primary);
            background: rgba(255, 255, 255, 0.9);
            width: 36px;
            height: 36px;
            display: flex;
            align-items: center;
            justify-content: center;
            border-radius: 50%;
        }
        
        .feature-text {
            font-weight: 600;
            color: white;
        }
    </style>
</head>
<body>
    <div class="loading-overlay" id="loading-overlay">
        <div class="loading-content">
            <div class="loading-icon">⚖️</div>
            <h3 class="loading-title">Generating Your Legal Document</h3>
            <p class="loading-subtitle">Our AI is crafting a custom document tailored to your needs.</p>
            
            <div class="loading-progress">
                <div class="loading-progress-bar"></div>
            </div>
            
            <div class="loading-catchphrase">
                "Turning legal jargon into plain English..."
            </div>
            
            <p class="loading-time">This may take up to 2 minutes. Thank you for your patience!</p>
        </div>
    </div>
    
    <header>
        <div class="container">
            <div class="header-content">
                <a href="#" class="logo">Instant<span>Legal</span>AI</a>
                <a href="mailto:support@instantlegal.ai?subject=Refund%20Request&body=Please%20provide%20your%20order%20details%20and%20reason%20for%20refund%3A%0A%0AOrder%20ID%3A%0ADocument%20Type%3A%0AReason%3A" style="text-decoration: none;">
                    <div class="guarantee-badge">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M9 12L11 14L15 10M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                        </svg>
                        100% Money-Back Guarantee
                    </div>
                </a>
            </div>
        </div>
    </header>
    
    <section class="hero">
        <div class="container">
            <div class="hero-content">
                <div class="hero-text">
                    <h1>AI-Generated Legal Documents<br>Tailored to Your Business</h1>
                    <p class="subtitle">Our AI technology creates custom legal documents instantly. No lawyers, no waiting, no excessive fees. Get exactly what you need in minutes, not days.</p>
                    
                    <div class="features">
                        <div class="feature">
                            <div class="feature-icon">
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M5 13L9 17L19 7" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                                </svg>
                            </div>
                            <div>AI-Powered Customization for Your Specific Business</div>
                        </div>
                        <div class="feature">
                            <div class="feature-icon">
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M5 13L9 17L19 7" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                                </svg>
                            </div>
                            <div>Instant Download - Ready in 2 Minutes</div>
                        </div>
                        <div class="feature">
                            <div class="feature-icon">
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M5 13L9 17L19 7" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                                </svg>
                            </div>
                            <div>Save $500+ Compared to Traditional Legal Services</div>
                        </div>
                        <div class="feature">
                            <div class="feature-icon">
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M5 13L9 17L19 7" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                                </svg>
                            </div>
                            <div>State-Specific Legal Compliance Built In</div>
                        </div>
                    </div>
                </div>
                
                <div class="hero-form">
                    <h2 class="form-title">Generate Your Custom Legal Document</h2>
                    
                    <div class="special-offer-timer">
                        <div class="timer-label">24-HOUR SPECIAL PRICE ENDS IN:</div>
                        <div class="timer-display">
                            <div class="timer-unit">
                                <div class="timer-value" id="hours">07</div>
                                <div class="timer-label">HOURS</div>
                            </div>
                            <div class="timer-unit">
                                <div class="timer-value" id="minutes">23</div>
                                <div class="timer-label">MINS</div>
                            </div>
                            <div class="timer-unit">
                                <div class="timer-value" id="seconds">45</div>
                                <div class="timer-label">SECS</div>
                            </div>
                        </div>
                    </div>
                    
                    <form id="document-form">
                    <div class="form-group">
                        <label for="document-type">Document Type</label>
                        <select id="document-type" name="document_type" required>
                            <option value="">Select document type...</option>
                            {% for key, value in document_types.items() %}
                            <option value="{{ key }}">{{ value }}</option>
                            {% endfor %}
                        </select>
                    </div>
                    
                    <div class="form-row">
                        <div class="form-group">
                            <label for="business-name">Business Name</label>
                            <input type="text" id="business-name" name="business_name" placeholder="Enter your business name" required>
                        </div>
                        
                        <div class="form-group">
                            <label for="business-type">Business Type</label>
                            <select id="business-type" name="business_type" required>
                                <option value="">Select business type...</option>
                                <option value="Sole Proprietorship">Sole Proprietorship</option>
                                <option value="LLC">LLC</option>
                                <option value="Corporation">Corporation</option>
                                <option value="Partnership">Partnership</option>
                                <option value="Non-Profit">Non-Profit</option>
                            </select>
                        </div>
                    </div>
                    
                    <div class="form-group">
                        <label for="state">State/Jurisdiction</label>
                        <select id="state" name="state" required>
                            <option value="">Select state...</option>
                            <option value="Alabama">Alabama</option>
                            <option value="Alaska">Alaska</option>
                            <option value="Arizona">Arizona</option>
                            <option value="Arkansas">Arkansas</option>
                            <option value="California">California</option>
                            <option value="Colorado">Colorado</option>
                            <option value="Connecticut">Connecticut</option>
                            <option value="Delaware">Delaware</option>
                            <option value="Florida">Florida</option>
                            <option value="Georgia">Georgia</option>
                            <option value="Hawaii">Hawaii</option>
                            <option value="Idaho">Idaho</option>
                            <option value="Illinois">Illinois</option>
                            <option value="Indiana">Indiana</option>
                            <option value="Iowa">Iowa</option>
                            <option value="Kansas">Kansas</option>
                            <option value="Kentucky">Kentucky</option>
                            <option value="Louisiana">Louisiana</option>
                            <option value="Maine">Maine</option>
                            <option value="Maryland">Maryland</option>
                            <option value="Massachusetts">Massachusetts</option>
                            <option value="Michigan">Michigan</option>
                            <option value="Minnesota">Minnesota</option>
                            <option value="Mississippi">Mississippi</option>
                            <option value="Missouri">Missouri</option>
                            <option value="Montana">Montana</option>
                            <option value="Nebraska">Nebraska</option>
                            <option value="Nevada">Nevada</option>
                            <option value="New Hampshire">New Hampshire</option>
                            <option value="New Jersey">New Jersey</option>
                            <option value="New Mexico">New Mexico</option>
                            <option value="New York">New York</option>
                            <option value="North Carolina">North Carolina</option>
                            <option value="North Dakota">North Dakota</option>
                            <option value="Ohio">Ohio</option>
                            <option value="Oklahoma">Oklahoma</option>
                            <option value="Oregon">Oregon</option>
                            <option value="Pennsylvania">Pennsylvania</option>
                            <option value="Rhode Island">Rhode Island</option>
                            <option value="South Carolina">South Carolina</option>
                            <option value="South Dakota">South Dakota</option>
                            <option value="Tennessee">Tennessee</option>
                            <option value="Texas">Texas</option>
                            <option value="Utah">Utah</option>
                            <option value="Vermont">Vermont</option>
                            <option value="Virginia">Virginia</option>
                            <option value="Washington">Washington</option>
                            <option value="West Virginia">West Virginia</option>
                            <option value="Wisconsin">Wisconsin</option>
                            <option value="Wyoming">Wyoming</option>
                            <option value="District of Columbia">District of Columbia</option>
                        </select>
                    </div>
                    
                    <div class="form-group">
                        <label for="industry">Industry</label>
                        <select id="industry" name="industry" required>
                            <option value="">Select industry...</option>
                            <option value="Technology/Software">Technology/Software</option>
                            <option value="E-commerce/Retail">E-commerce/Retail</option>
                            <option value="Healthcare">Healthcare</option>
                            <option value="Financial Services">Financial Services</option>
                            <option value="Education">Education</option>
                            <option value="Consulting">Consulting</option>
                            <option value="Marketing/Advertising">Marketing/Advertising</option>
                            <option value="Manufacturing">Manufacturing</option>
                            <option value="Construction">Construction</option>
                            <option value="Food Service">Food Service</option>
                            <option value="Entertainment">Entertainment</option>
                            <option value="Other">Other</option>
                        </select>
                    </div>
                    
                    <div class="form-group">
                        <label>Document Protection Level</label>
                        <input type="range" min="1" max="3" value="2" class="range-slider" id="protection-level" name="protection_level">
                        <div class="slider-labels">
                            <span>Standard</span>
                            <span>Comprehensive</span>
                            <span>Maximum</span>
                        </div>
                    </div>
                    
                    <div class="form-group">
                        <label>Special Clauses (Optional)</label>
                        <div class="checkbox-group">
                            <div class="checkbox-item">
                                <input type="checkbox" id="clause-confidentiality" name="clause_confidentiality">
                                <label for="clause-confidentiality">Enhanced Confidentiality</label>
                            </div>
                            <div class="checkbox-item">
                                <input type="checkbox" id="clause-arbitration" name="clause_arbitration">
                                <label for="clause-arbitration">Arbitration Provision</label>
                            </div>
                            <div class="checkbox-item">
                                <input type="checkbox" id="clause-termination" name="clause_termination">
                                <label for="clause-termination">Advanced Termination Options</label>
                            </div>
                            <div class="checkbox-item">
                                <input type="checkbox" id="clause-ip" name="clause_ip">
                                <label for="clause-ip">Intellectual Property Protection</label>
                            </div>
                        </div>
                    </div>
                    
                    <div class="form-group">
                        <label for="additional-instructions">Additional Instructions (Optional)</label>
                        <textarea id="additional-instructions" name="additional_instructions" rows="4" placeholder="Enter any specific requirements, details, or custom clauses you'd like to include in your document..."></textarea>
                    </div>
                    
                    <div class="pricing-section">
                        <div class="price-display">
                            <span class="price-amount">$99</span>
                            <span class="price-period">per document</span>
                        </div>
                        <div class="price-original">Regular price: $199 - Save 50% today!</div>
                        <div class="price-features">
                            <div class="price-feature">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M5 13L9 17L19 7" stroke="#10b981" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                                </svg>
                                Enhanced document customization
                            </div>
                            <div class="price-feature">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M5 13L9 17L19 7" stroke="#10b981" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                                </svg>
                                PDF + Word formats
                            </div>
                            <div class="price-feature">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M5 13L9 17L19 7" stroke="#10b981" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                                </svg>
                                1 free revision
                            </div>
                            <div class="price-feature">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M5 13L9 17L19 7" stroke="#10b981" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                                </svg>
                                Special clauses included
                            </div>
                        </div>
                        <div class="limited-offer">Only 14 documents remaining at this price today!</div>
                    </div>
                    
                    <div class="success-message" style="display: none;">Your document has been generated successfully!</div>
                    <div class="error-message" style="display: none;">There was an error processing your request.</div>
                    
                    <button type="submit" class="submit-btn">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M12 8V16M12 16L8 12M12 16L16 12" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                            <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                        </svg>
                        Generate Document Now
                    </button>
                    </form>
                </div>
            </div>
        </div>
    </section>
    
    <!-- How It Works Section -->
    <section class="how-it-works">
        <div class="container">
            <h2 class="section-title">How It Works</h2>
            <p class="section-subtitle">Our AI-powered system creates professional legal documents in just minutes</p>
            
            <div class="steps-container">
                <div class="step">
                    <div class="step-number">1</div>
                    <h3>Select Document Type</h3>
                    <p>Choose from our library of professional legal documents</p>
                </div>
                
                <div class="step">
                    <div class="step-number">2</div>
                    <h3>Enter Your Details</h3>
                    <p>Provide your business information and requirements</p>
                </div>
                
                <div class="step">
                    <div class="step-number">3</div>
                    <h3>AI Customization</h3>
                    <p>Our AI tailors the document to your specific needs</p>
                </div>
                
                <div class="step">
                    <div class="step-number">4</div>
                    <h3>Download & Use</h3>
                    <p>Get your document instantly and ready to use</p>
                </div>
            </div>
        </div>
    </section>
    
    <!-- The InstantLegal AI Advantage Section -->
    <section class="advantages">
        <div class="container">
            <h2 class="section-title">The InstantLegal AI Advantage</h2>
            
            <div class="advantages-grid">
                <div class="advantage-card">
                    <div class="advantage-icon">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M12 4V20M20 12H4" stroke="#4F46E5" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                        </svg>
                    </div>
                    <h3>Save Thousands in Legal Fees</h3>
                    <p>Our AI-generated documents cost a fraction of what lawyers charge. Get the same quality without the hefty price tag.</p>
                </div>
                
                <div class="advantage-card">
                    <div class="advantage-icon">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" stroke="#4F46E5" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                        </svg>
                    </div>
                    <h3>Ready in 2 Minutes</h3>
                    <p>No waiting days or weeks for a lawyer to draft your document. Our AI generates it instantly, ready for immediate use.</p>
                </div>
                
                <div class="advantage-card">
                    <div class="advantage-icon">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" stroke="#4F46E5" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                        </svg>
                    </div>
                    <h3>State-Specific Legal Compliance</h3>
                    <p>All documents are created following current legal standards for your specific state, providing you with the protection you need.</p>
                </div>
                
                <div class="advantage-card">
                    <div class="advantage-icon">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" stroke="#4F46E5" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                        </svg>
                    </div>
                    <h3>Industry-Specific Customization</h3>
                    <p>Not a generic template. Each document is tailored to your specific industry, business type, and requirements.</p>
                </div>
                
                <div class="advantage-card">
                    <div class="advantage-icon">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" stroke="#4F46E5" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                        </svg>
                    </div>
                    <h3>Plain Language</h3>
                    <p>No complex legal jargon. Our documents are written in clear, straightforward language that both parties can understand.</p>
                </div>
                
                <div class="advantage-card">
                    <div class="advantage-icon">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" stroke="#4F46E5" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                        </svg>
                    </div>
                    <h3>Secure & Confidential</h3>
                    <p>Your business information is encrypted and secure. We never share your data with third parties.</p>
                </div>
            </div>
        </div>
    </section>
    
    <!-- Sample Document Previews Section -->
    <section class="document-previews">
        <div class="container">
            <h2 class="section-title">Sample Document Previews</h2>
            <p class="section-subtitle">See the quality of our AI-generated legal documents</p>
            
            <div class="tabs">
                <button class="tab-button active" data-tab="nda">Non-Disclosure Agreement</button>
                <button class="tab-button" data-tab="terms">Terms of Service</button>
                <button class="tab-button" data-tab="privacy">Privacy Policy</button>
                <button class="tab-button" data-tab="freelance">Freelance Contract</button>
            </div>
            
            <div class="tab-content active" id="nda-content">
                <div class="document-preview">
                    <div class="watermark">SAMPLE</div>
                    <h3>NON-DISCLOSURE AGREEMENT</h3>
                    <p>This Non-Disclosure Agreement (the "Agreement") is entered into by and between [Company Name], a [State] [Business Type] ("Disclosing Party") and the recipient identified below ("Receiving Party"), collectively referred to as the "Parties."</p>
                    
                    <h4>1. PURPOSE</h4>
                    <p>The Parties wish to explore a potential business relationship in connection with [specific business purpose]. During this exploration, Disclosing Party may share certain proprietary and confidential information with Receiving Party. This Agreement is intended to prevent the unauthorized disclosure of Confidential Information.</p>
                    
                    <h4>2. DEFINITION OF CONFIDENTIAL INFORMATION</h4>
                    <p>For purposes of this Agreement, "Confidential Information" includes all information or material that has or could have commercial value or other utility in the business in which Disclosing Party is engaged. If Confidential Information is in written form, the Disclosing Party shall label or stamp the materials with the word "Confidential" or some similar warning. If Confidential Information is transmitted orally, the Disclosing Party shall promptly provide a writing indicating that such oral communication constituted Confidential Information.</p>
                    
                    <h4>3. EXCLUSIONS FROM CONFIDENTIAL INFORMATION</h4>
                    <p>Receiving Party's obligations under this Agreement do not extend to information that is: (a) publicly known at the time of disclosure or subsequently becomes publicly known through no fault of the Receiving Party; (b) discovered or created by the Receiving Party before disclosure by Disclosing Party; (c) learned by the Receiving Party through legitimate means other than from the Disclosing Party or Disclosing Party's representatives; or (d) is disclosed by Receiving Party with Disclosing Party's prior written approval.</p>
                </div>
            </div>
            
            <div class="tab-content" id="terms-content">
                <div class="document-preview">
                    <div class="watermark">SAMPLE</div>
                    <h3>TERMS OF SERVICE</h3>
                    <p>These Terms of Service ("Terms") govern your access to and use of [Company Name]'s website, products, and services ("Services"). Please read these Terms carefully, and contact us if you have any questions.</p>
                    
                    <h4>1. ACCEPTANCE OF TERMS</h4>
                    <p>By accessing or using our Services, you agree to be bound by these Terms and our Privacy Policy. If you do not agree to these Terms, you may not access or use the Services.</p>
                    
                    <h4>2. CHANGES TO TERMS OR SERVICES</h4>
                    <p>We reserve the right to modify these Terms at any time. We will provide notice of any material changes by posting the new Terms on our site and updating the "Last Updated" date. Your continued use of the Services after such changes constitutes your acceptance of the new Terms.</p>
                    
                    <h4>3. USER ACCOUNTS</h4>
                    <p>When you create an account with us, you must provide accurate, complete, and current information. You are responsible for safeguarding your account credentials and for all activities that occur under your account. You must notify us immediately of any unauthorized use of your account.</p>
                    
                    <h4>4. INTELLECTUAL PROPERTY RIGHTS</h4>
                    <p>The Services and their contents, features, and functionality are owned by [Company Name] and are protected by copyright, trademark, and other intellectual property laws. You may not use our intellectual property without our prior written consent.</p>
                </div>
            </div>
            
            <div class="tab-content" id="privacy-content">
                <div class="document-preview">
                    <div class="watermark">SAMPLE</div>
                    <h3>PRIVACY POLICY</h3>
                    <p>This Privacy Policy describes how [Company Name] ("we", "us", or "our") collects, uses, and shares information about you when you use our website, products, and services (collectively, the "Services").</p>
                    
                    <h4>1. INFORMATION WE COLLECT</h4>
                    <p>We collect information you provide directly to us, such as when you create an account, fill out a form, or communicate with us. This may include your name, email address, postal address, phone number, and payment information.</p>
                    
                    <h4>2. HOW WE USE YOUR INFORMATION</h4>
                    <p>We use the information we collect to provide, maintain, and improve our Services, to process transactions, to send you technical notices and support messages, to communicate with you about products, services, offers, and events, and for other purposes with your consent.</p>
                    
                    <h4>3. SHARING OF INFORMATION</h4>
                    <p>We may share your information with third-party vendors, service providers, and other business partners who need access to such information to carry out work on our behalf. We may also share information in response to a legal request if we believe disclosure is required by law.</p>
                    
                    <h4>4. DATA SECURITY</h4>
                    <p>We take reasonable measures to help protect information about you from loss, theft, misuse, unauthorized access, disclosure, alteration, and destruction. However, no security system is impenetrable, and we cannot guarantee the security of our systems.</p>
                </div>
            </div>
            
            <div class="tab-content" id="freelance-content">
                <div class="document-preview">
                    <div class="watermark">SAMPLE</div>
                    <h3>FREELANCE CONTRACT</h3>
                    <p>This Freelance Contract ("Contract") is entered into by and between [Client Name], with a principal place of business at [Client Address] ("Client") and [Freelancer Name], with a principal place of business at [Freelancer Address] ("Freelancer").</p>
                    
                    <h4>1. SERVICES</h4>
                    <p>Freelancer agrees to perform the following services for Client: [detailed description of services]. Freelancer shall complete the services according to the timeline and milestones set forth in Exhibit A, attached hereto and incorporated by reference.</p>
                    
                    <h4>2. COMPENSATION</h4>
                    <p>Client agrees to pay Freelancer [rate/fee structure] for the services. Payment shall be made as follows: [payment schedule]. Client shall reimburse Freelancer for the following expenses: [list of reimbursable expenses, if any].</p>
                    
                    <h4>3. INTELLECTUAL PROPERTY RIGHTS</h4>
                    <p>Upon receipt of full payment, Freelancer assigns to Client all right, title, and interest in the deliverables, including all intellectual property rights. Freelancer shall retain ownership of any pre-existing materials used in the deliverables.</p>
                    
                    <h4>4. INDEPENDENT CONTRACTOR STATUS</h4>
                    <p>Freelancer is an independent contractor, not an employee of Client. Freelancer is responsible for all taxes, insurance, and benefits. Nothing in this Contract shall be construed as creating an employer-employee relationship.</p>
                </div>
            </div>
        </div>
    </section>
    
    <!-- Customer Testimonials Section -->
    <section class="testimonials">
        <div class="container">
            <h2 class="section-title">What Our Customers Say</h2>
            <p class="section-subtitle">Join thousands of satisfied business owners who trust InstantLegal AI</p>
            
            <div class="testimonials-grid">
                <div class="testimonial-card">
                    <div class="stars">★★★★★</div>
                    <p class="quote">"I needed an NDA urgently for a client meeting the next day. InstantLegal AI delivered a perfectly customized document in minutes. Saved me at least $400 in legal fees and the document was actually better than what my previous lawyer provided!"</p>
                    <div class="testimonial-author">
                        <div class="author-avatar" style="background-image: url('https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-1.2.1&auto=format&fit=crop&w=100&q=80');"></div>
                        <div class="author-info">
                            <h4>Michael Thompson</h4>
                            <p>Marketing Agency Owner</p>
                        </div>
                    </div>
                </div>
                
                <div class="testimonial-card">
                    <div class="stars">★★★★★</div>
                    <p class="quote">"As a startup founder, legal costs were eating into our budget. This service has been a game-changer - professional documents at a fraction of the cost and available instantly. The state-specific compliance was exactly what we needed."</p>
                    <div class="testimonial-author">
                        <div class="author-avatar" style="background-image: url('https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?ixlib=rb-1.2.1&auto=format&fit=crop&w=100&q=80');"></div>
                        <div class="author-info">
                            <h4>Sarah Johnson</h4>
                            <p>Tech Startup CEO</p>
                        </div>
                    </div>
                </div>
                
                <div class="testimonial-card">
                    <div class="stars">★★★★★</div>
                    <p class="quote">"I was skeptical about AI-generated legal documents, but the quality exceeded my expectations. Clean, professional, and tailored specifically to my e-commerce business in California. I've now used it for 3 different documents - all perfect."</p>
                    <div class="testimonial-author">
                        <div class="author-avatar" style="background-image: url('https://images.unsplash.com/photo-1500648767791-00dcc994a43e?ixlib=rb-1.2.1&auto=format&fit=crop&w=100&q=80');"></div>
                        <div class="author-info">
                            <h4>David Chen</h4>
                            <p>E-commerce Entrepreneur</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </section>
    
    <!-- Frequently Asked Questions Section -->
    <section class="faq">
        <div class="container">
            <h2 class="section-title">Frequently Asked Questions</h2>
            <p class="section-subtitle">Everything you need to know about our AI-generated legal documents</p>
            
            <div class="faq-grid">
                <div class="faq-item">
                    <div class="faq-question">
                        <h3>Are these documents legally binding?</h3>
                        <div class="faq-toggle">+</div>
                    </div>
                    <div class="faq-answer">
                        <p>Yes, our AI-generated documents are legally binding when properly executed by all parties. They are created using the same legal principles and requirements that attorneys use when drafting documents.</p>
                    </div>
                </div>
                
                <div class="faq-item">
                    <div class="faq-question">
                        <h3>Is my information secure?</h3>
                        <div class="faq-toggle">+</div>
                    </div>
                    <div class="faq-answer">
                        <p>Absolutely. We use bank-level encryption to protect your data. We never share your information with third parties, and your documents are only accessible to you.</p>
                    </div>
                </div>
                
                <div class="faq-item">
                    <div class="faq-question">
                        <h3>How quickly will I receive my document?</h3>
                        <div class="faq-toggle">+</div>
                    </div>
                    <div class="faq-answer">
                        <p>Most documents are generated within 2 minutes. Once generated, you can download them immediately.</p>
                    </div>
                </div>
                
                <div class="faq-item">
                    <div class="faq-question">
                        <h3>What if I need a document type not listed?</h3>
                        <div class="faq-toggle">+</div>
                    </div>
                    <div class="faq-answer">
                        <p>Contact our support team, and we'll work to add your requested document type to our system. We're constantly expanding our document library based on customer needs.</p>
                    </div>
                </div>
                
                <div class="faq-item">
                    <div class="faq-question">
                        <h3>Can I edit the document after receiving it?</h3>
                        <div class="faq-toggle">+</div>
                    </div>
                    <div class="faq-answer">
                        <p>Yes, all documents are delivered in editable PDF format. You can make any necessary adjustments before finalizing.</p>
                    </div>
                </div>
                
                <div class="faq-item">
                    <div class="faq-question">
                        <h3>Do I need a lawyer to review these documents?</h3>
                        <div class="faq-toggle">+</div>
                    </div>
                    <div class="faq-answer">
                        <p>While our documents are legally sound, for complex situations or high-stakes agreements, we recommend having an attorney review the final document. Our service provides a professional starting point that can save significant legal costs.</p>
                    </div>
                </div>
                
                <div class="faq-item">
                    <div class="faq-question">
                        <h3>What makes your AI-generated documents better than templates?</h3>
                        <div class="faq-toggle">+</div>
                    </div>
                    <div class="faq-answer">
                        <p>Unlike generic templates, our AI customizes each document to your specific business needs, industry requirements, and state laws. The documents are more comprehensive, relevant, and legally sound than one-size-fits-all templates.</p>
                    </div>
                </div>
                
                <div class="faq-item">
                    <div class="faq-question">
                        <h3>What's included in the Money-Back Guarantee?</h3>
                        <div class="faq-toggle">+</div>
                    </div>
                    <div class="faq-answer">
                        <p>If you're not satisfied with your document for any reason, contact us within 30 days of purchase for a full refund. No questions asked.</p>
                    </div>
                </div>
            </div>
        </div>
    </section>
    
    <style>
        /* How It Works Section Styles */
        .section-title {
            font-size: 2.5rem;
            font-weight: 700;
            text-align: center;
            margin-bottom: 1rem;
            color: var(--dark);
        }
        
        .section-subtitle {
            font-size: 1.2rem;
            text-align: center;
            color: var(--gray);
            margin-bottom: 3rem;
            max-width: 800px;
            margin-left: auto;
            margin-right: auto;
        }
        
        .how-it-works {
            padding: 5rem 0;
            background-color: white;
        }
        
        .steps-container {
            display: flex;
            justify-content: space-between;
            gap: 2rem;
            flex-wrap: wrap;
            position: relative;
        }
        
        /* Add connecting line between steps */
        .steps-container::before {
            content: "";
            position: absolute;
            top: 30px;
            left: 15%;
            right: 15%;
            height: 3px;
            background-color: var(--primary-light);
            z-index: 0;
        }
        
        .step {
            flex: 1;
            min-width: 200px;
            text-align: center;
            padding: 2rem;
            position: relative;
        }
        
        .step-number {
            width: 60px;
            height: 60px;
            background-color: var(--primary);
            color: white;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 1.5rem;
            font-weight: 700;
            margin: 0 auto 1.5rem;
        }
        
        .step h3 {
            font-size: 1.3rem;
            margin-bottom: 1rem;
            color: var(--dark);
        }
        
        .step p {
            color: var(--gray);
            font-size: 1rem;
        }
        
        /* Advantages Section Styles */
        .advantages {
            padding: 5rem 0;
            background-color: var(--light);
        }
        
        .advantages-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
            gap: 2rem;
        }
        
        .advantage-card {
            background-color: white;
            border-radius: 8px;
            padding: 2rem;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
            transition: transform 0.3s ease, box-shadow 0.3s ease;
        }
        
        .advantage-card:hover {
            transform: translateY(-5px);
            box-shadow: 0 10px 15px rgba(0, 0, 0, 0.1);
        }
        
        .advantage-icon {
            width: 50px;
            height: 50px;
            background-color: #EEF2FF;
            border-radius: 8px;
            display: flex;
            align-items: center;
            justify-content: center;
            margin-bottom: 1.5rem;
        }
        
        .advantage-card h3 {
            font-size: 1.2rem;
            margin-bottom: 1rem;
            color: var(--dark);
        }
        
        .advantage-card p {
            color: var(--gray);
            font-size: 1rem;
            line-height: 1.6;
        }
        
        /* Document Previews Section Styles */
        .document-previews {
            padding: 5rem 0;
            background-color: white;
        }
        
        .tabs {
            display: flex;
            border-bottom: 1px solid var(--gray-light);
            margin-bottom: 2rem;
            overflow-x: auto;
            -webkit-overflow-scrolling: touch;
        }
        
        .tab-button {
            padding: 1rem 1.5rem;
            background: none;
            border: none;
            border-bottom: 3px solid transparent;
            font-size: 1rem;
            font-weight: 600;
            color: var(--gray);
            cursor: pointer;
            transition: all 0.3s ease;
            white-space: nowrap;
        }
        
        .tab-button.active {
            color: var(--primary);
            border-bottom-color: var(--primary);
        }
        
        .tab-content {
            display: none;
            padding: 2rem;
            background-color: white;
            border-radius: 8px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
        }
        
        .tab-content.active {
            display: block;
        }
        
        .document-preview {
            background-color: white;
            padding: 2rem;
            border-radius: 8px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
            position: relative;
            overflow: hidden;
            font-size: 0.9rem;
            line-height: 1.6;
            color: var(--dark);
        }
        
        /* Watermark style */
        .watermark {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%) rotate(-45deg);
            font-size: 8rem;
            font-weight: bold;
            color: rgba(200, 200, 200, 0.2);
            pointer-events: none;
            z-index: 1;
            user-select: none;
        }
        
        .document-preview h3 {
            font-size: 1.5rem;
            margin-bottom: 1.5rem;
            color: var(--dark);
        }
        
        .document-preview h4 {
            font-size: 1.1rem;
            margin: 1.5rem 0 0.5rem;
        }
        
        .document-preview p {
            margin-bottom: 1rem;
        }
        
        /* Testimonials Section Styles */
        .testimonials {
            padding: 5rem 0;
            background-color: var(--light);
        }
        
        .testimonials-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
            gap: 2rem;
        }
        
        .testimonial-card {
            background-color: white;
            border-radius: 8px;
            padding: 2rem;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
        }
        
        .stars {
            color: #F59E0B;
            font-size: 1.5rem;
            margin-bottom: 1rem;
        }
        
        .quote {
            font-style: italic;
            color: var(--dark);
            margin-bottom: 1.5rem;
            line-height: 1.6;
        }
        
        .testimonial-author {
            display: flex;
            align-items: center;
        }
        
        .author-avatar {
            width: 50px;
            height: 50px;
            border-radius: 50%;
            background-color: #E5E7EB;
            margin-right: 1rem;
            background-size: cover;
            background-position: center;
        }
        
        .author-info h4 {
            font-size: 1.1rem;
            margin-bottom: 0.25rem;
        }
        
        .author-info p {
            color: var(--gray);
            font-size: 0.9rem;
        }
        
        /* FAQ Section Styles */
        .faq {
            padding: 5rem 0;
            background-color: white;
        }
        
        .faq-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(500px, 1fr));
            gap: 1.5rem;
        }
        
        .faq-item {
            border: 1px solid var(--gray-light);
            border-radius: 8px;
            overflow: hidden;
        }
        
        .faq-question {
            padding: 1.5rem;
            background-color: white;
            display: flex;
            justify-content: space-between;
            align-items: center;
            cursor: pointer;
        }
        
        .faq-question h3 {
            font-size: 1.1rem;
            margin: 0;
            color: var(--dark);
        }
        
        .faq-toggle {
            font-size: 1.5rem;
            color: var(--primary);
        }
        
        .faq-answer {
            padding: 0 1.5rem 1.5rem;
            display: none;
        }
        
        .faq-answer p {
            margin: 0;
            color: var(--gray);
            line-height: 1.6;
        }
        
        .faq-item.active .faq-answer {
            display: block;
        }
        
        .faq-item.active .faq-toggle {
            transform: rotate(45deg);
        }
        
        /* Responsive Adjustments */
        @media (max-width: 768px) {
            .steps-container {
                flex-direction: column;
            }
            
            .step {
                width: 100%;
            }
            
            .faq-grid {
                grid-template-columns: 1fr;
            }
            
            .section-title {
                font-size: 2rem;
            }
        }
    </style>
    
    <script>
        // Initialize Stripe
        const stripe = Stripe('{{ stripe_key }}');
        
        // Handle form submission
        document.getElementById('document-form').addEventListener('submit', async function(event) {
            event.preventDefault();
            
            // Show loading state
            const submitButton = document.querySelector('.submit-btn');
            const originalButtonText = submitButton.innerHTML;
            submitButton.innerHTML = 'Processing...';
            submitButton.disabled = true;
            
            // Get form data
            const formData = new FormData(this);
            
            try {
                // Send form data to server to create checkout session
                const response = await fetch('/create-checkout-session', {
                    method: 'POST',
                    body: formData
                });
                
                const data = await response.json();
                
                if (data.error) {
                    throw new Error(data.error);
                }
                
                // Redirect to Stripe checkout
                stripe.redirectToCheckout({
                    sessionId: data.sessionId
                }).then(function (result) {
                    if (result.error) {
                        // Show error in the UI
                        document.querySelector('.error-message').textContent = result.error.message;
                        document.querySelector('.error-message').style.display = 'block';
                    }
                });
            } catch (error) {
                console.error('Error:', error);
                document.querySelector('.error-message').textContent = error.message || 'An error occurred. Please try again.';
                document.querySelector('.error-message').style.display = 'block';
                
                // Reset button
                submitButton.innerHTML = originalButtonText;
                submitButton.disabled = false;
            }
        });

        // Tab functionality for document previews
        document.addEventListener('DOMContentLoaded', function() {
            const tabButtons = document.querySelectorAll('.tab-button');
            const tabContents = document.querySelectorAll('.tab-content');
            
            tabButtons.forEach(button => {
                button.addEventListener('click', () => {
                    // Remove active class from all buttons and contents
                    tabButtons.forEach(btn => btn.classList.remove('active'));
                    tabContents.forEach(content => content.classList.remove('active'));
                    
                    // Add active class to clicked button and corresponding content
                    button.classList.add('active');
                    const tabId = button.getAttribute('data-tab');
                    document.getElementById(`${tabId}-content`).classList.add('active');
                });
            });
            
            // FAQ toggle functionality
            const faqQuestions = document.querySelectorAll('.faq-question');
            
            faqQuestions.forEach(question => {
                question.addEventListener('click', () => {
                    const faqItem = question.parentElement;
                    faqItem.classList.toggle('active');
                    
                    // Update the toggle symbol
                    const toggle = question.querySelector('.faq-toggle');
                    if (faqItem.classList.contains('active')) {
                        toggle.textContent = '−';
                    } else {
                        toggle.textContent = '+';
                    }
                });
            });
        });
    </script>
    
    <footer>
        <div class="container">
            <div class="footer-content">
                <div>
                    <a href="#" class="footer-logo">Instant<span>Legal</span>AI</a>
                    <p class="footer-description">AI-powered legal documents for modern businesses. Save time, reduce costs, and get the legal protection you need.</p>
                </div>
                
                <div>
                    <h3 class="footer-title">Documents</h3>
                    <ul class="footer-links">
                        <li><a href="#">Non-Disclosure Agreement</a></li>
                        <li><a href="#">Terms of Service</a></li>
                        <li><a href="#">Privacy Policy</a></li>
                        <li><a href="#">Freelance Contract</a></li>
                        <li><a href="#">Employment Agreement</a></li>
                    </ul>
                </div>
                
                <div>
                    <h3 class="footer-title">Company</h3>
                    <ul class="footer-links">
                        <li><a href="#">About Us</a></li>
                        <li><a href="#">How It Works</a></li>
                        <li><a href="#">Testimonials</a></li>
                        <li><a href="#">Contact</a></li>
                    </ul>
                </div>
                
                <div>
                    <h3 class="footer-title">Legal</h3>
                    <ul class="footer-links">
                        <li><a href="#">Terms of Service</a></li>
                        <li><a href="#">Privacy Policy</a></li>
                        <li><a href="#">Cookie Policy</a></li>
                        <li><a href="#">Disclaimer</a></li>
                    </ul>
                </div>
            </div>
            
            <div class="trust-features">
                <div class="feature-box">
                    <div class="feature-icon">✓</div>
                    <div class="feature-text">Secure Payment</div>
                </div>
                
                <div class="feature-box">
                    <div class="feature-icon">🔒</div>
                    <div class="feature-text">Privacy Protected</div>
                </div>
                
                <div class="feature-box">
                    <div class="feature-icon">⏰</div>
                    <div class="feature-text">24/7 Support</div>
                </div>
            </div>
            
            <div class="copyright">
                © 2023 InstantLegal AI. All rights reserved.
            </div>
        </div>
    </footer>
</body>
</html>

```

### Source file: `templates/payment_return.html`

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Processing Payment - InstantLegal AI</title>
    <link rel="shortcut icon" href="{{ url_for('static', filename='favicon.ico') }}">
    <script src="https://js.stripe.com/v3/"></script>
    <style>
        :root {
            --primary: #2563eb;
            --primary-dark: #1d4ed8;
            --secondary: #0ea5e9;
            --dark: #0f172a;
            --light: #f8fafc;
            --success: #10b981;
            --warning: #f59e0b;
            --danger: #ef4444;
            --gray: #64748b;
            --gray-light: #e2e8f0;
        }
        
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, sans-serif;
        }
        
        body {
            background-color: var(--light);
            color: var(--dark);
            line-height: 1.6;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
            padding: 20px;
        }
        
        .container {
            max-width: 600px;
            width: 100%;
            background: white;
            border-radius: 10px;
            box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
            padding: 30px;
            text-align: center;
        }
        
        .logo {
            font-size: 22px;
            font-weight: 700;
            color: var(--dark);
            text-decoration: none;
            display: inline-flex;
            align-items: center;
            margin-bottom: 20px;
        }
        
        .logo span {
            color: var(--primary);
        }
        
        h1 {
            font-size: 24px;
            margin-bottom: 20px;
            color: var(--dark);
        }
        
        .loading-icon {
            font-size: 60px;
            margin-bottom: 20px;
            display: inline-block;
            animation: bounce 2s ease infinite;
        }
        
        @keyframes bounce {
            0%, 20%, 50%, 80%, 100% {transform: translateY(0);}
            40% {transform: translateY(-20px);}
            60% {transform: translateY(-10px);}
        }
        
        .loading-progress {
            width: 100%;
            height: 6px;
            background: rgba(0, 0, 0, 0.1);
            border-radius: 3px;
            margin: 20px 0;
            overflow: hidden;
            position: relative;
        }
        
        .loading-progress-bar {
            position: absolute;
            top: 0;
            left: 0;
            height: 100%;
            width: 0%;
            background: linear-gradient(to right, var(--primary), var(--secondary));
            border-radius: 3px;
            transition: width 0.5s ease;
        }
        
        .loading-catchphrase {
            font-size: 18px;
            font-style: italic;
            margin: 20px 0;
            min-height: 54px;
        }
        
        .loading-time {
            font-size: 14px;
            opacity: 0.7;
            margin-bottom: 20px;
        }
        
        .success-message {
            background: rgba(16, 185, 129, 0.1);
            border: 1px solid var(--success);
            color: var(--success);
            padding: 15px;
            border-radius: 6px;
            margin-bottom: 20px;
            display: none;
        }
        
        .error-message {
            background: rgba(239, 68, 68, 0.1);
            border: 1px solid var(--danger);
            color: var(--danger);
            padding: 15px;
            border-radius: 6px;
            margin-bottom: 20px;
            display: none;
        }
        
        .btn {
            background: var(--primary);
            color: white;
            border: none;
            border-radius: 6px;
            padding: 12px 20px;
            font-size: 16px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s ease;
            text-decoration: none;
            display: inline-block;
            margin-top: 20px;
        }
        
        .btn:hover {
            background: var(--primary-dark);
            transform: translateY(-2px);
        }
    </style>
</head>
<body>
    <div class="container">
        <a href="/" class="logo">Instant<span>Legal</span>AI</a>
        
        <div class="loading-icon">⚖️</div>
        <h1>Processing Your Payment</h1>
        
        <div class="loading-progress">
            <div class="loading-progress-bar" id="progress-bar"></div>
        </div>
        
        <div class="loading-catchphrase" id="catchphrase">
            "Verifying payment and preparing your document..."
        </div>
        
        <p class="loading-time">This may take up to 2 minutes. Thank you for your patience!</p>
        
        <div class="success-message" id="success-message">
            Your document has been generated successfully! <a href="#" id="download-link">Click here to download</a>
        </div>
        
        <div class="error-message" id="error-message">
            There was an error generating your document. Please try again.
        </div>
        
        <a href="/" class="btn" id="return-home" style="display: none;">Return to Home</a>
    </div>
    
    <script>
        document.addEventListener('DOMContentLoaded', function() {
            const progressBar = document.getElementById('progress-bar');
            const catchphraseElement = document.getElementById('catchphrase');
            const successMessage = document.getElementById('success-message');
            const errorMessage = document.getElementById('error-message');
            const downloadLink = document.getElementById('download-link');
            const returnHomeButton = document.getElementById('return-home');
            
            // Initialize Stripe
            const stripe = Stripe('{{ stripe_key }}');
            
            // Get session ID from URL
            const sessionId = '{{ session_id }}';
            
            // Array of funny legal catchphrases
            const catchphrases = [
                "Turning legal jargon into plain English...",
                "Objection overruled! Your document is being prepared...",
                "Briefing the AI judge on your requirements...",
                "Citing precedents and adding legal pizzazz...",
                "Examining the fine print so you don't have to...",
                "Translating legalese into something actually readable...",
                "Preparing to make opposing counsel jealous...",
                "Dotting the i's, crossing the t's, and adding some legal flair...",
                "Summoning the ghost of legal documents past...",
                "Arguing with the AI about comma placement...",
                "Deliberating on the perfect legal tone...",
                "Calling expert witnesses to verify your document...",
                "Striking hearsay from the record...",
                "Preparing closing arguments for your document...",
                "Instructing the jury of AI models on your case..."
            ];
            
            // Array of legal-themed emojis
            const legalEmojis = [
                "⚖️", // scales of justice
                "📜", // scroll
                "📝", // memo
                "🧑‍⚖️", // judge
                "👨‍💼", // person in suit
                "🔍", // magnifying glass
                "📋", // clipboard
                "🗂️", // card index dividers
                "📊", // bar chart
                "🏛️", // classical building
                "🤝", // handshake
                "📁", // file folder
                "🗄️", // file cabinet
                "📔", // notebook with decorative cover
                "🖋️"  // fountain pen
            ];
            
            const iconElement = document.querySelector('.loading-icon');
            
            // Function to update the loading animation
            function updateLoadingAnimation(startTime) {
                const currentTime = new Date().getTime();
                const elapsedTime = (currentTime - startTime) / 1000; // in seconds
                const totalTime = 120; // 2 minutes in seconds
                
                // Update progress bar (capped at 95% until complete)
                const progress = Math.min(95, (elapsedTime / totalTime) * 100);
                progressBar.style.width = `${progress}%`;
                
                // Update catchphrase every 5 seconds
                if (Math.floor(elapsedTime) % 5 === 0) {
                    const randomCatchphraseIndex = Math.floor(Math.random() * catchphrases.length);
                    catchphraseElement.innerHTML = `"${catchphrases[randomCatchphraseIndex]}"`;
                    
                    const randomEmojiIndex = Math.floor(Math.random() * legalEmojis.length);
                    iconElement.textContent = legalEmojis[randomEmojiIndex];
                }
                
                return setTimeout(() => updateLoadingAnimation(startTime), 1000);
            }
            
            // Start the loading animation
            const startTime = new Date().getTime();
            const animationTimer = updateLoadingAnimation(startTime);
            
            // Function to check payment status with retry logic
            function checkPaymentStatus(sessionId, retryCount = 0, maxRetries = 3) {
                fetch(`/payment-success?session_id=${sessionId}`)
                    .then(response => {
                        if (!response.ok) {
                            // Handle 503 Service Unavailable specifically
                            if (response.status === 503 && retryCount < maxRetries) {
                                console.log(`Server unavailable (503), retry ${retryCount + 1}/${maxRetries} in ${(retryCount + 1) * 2} seconds`);
                                
                                // Update the catchphrase to indicate retrying
                                catchphraseElement.innerHTML = `"Server is busy, retrying in ${(retryCount + 1) * 2} seconds..."`;
                                
                                // Retry after exponential backoff
                                setTimeout(() => {
                                    checkPaymentStatus(sessionId, retryCount + 1, maxRetries);
                                }, (retryCount + 1) * 2000);
                                return;
                            }
                            
                            // Check content type to handle HTML responses
                            const contentType = response.headers.get('content-type');
                            if (contentType && contentType.includes('text/html')) {
                                throw new Error(`Server returned HTML instead of JSON (status: ${response.status}). The server might be overloaded.`);
                            }
                            
                            return response.json().then(errorData => {
                                throw new Error(errorData.error || `Server error: ${response.status}`);
                            }).catch(err => {
                                if (err.message && err.message !== "Unexpected end of JSON input" && !err.message.includes("Unexpected token")) {
                                    throw err;
                                }
                                throw new Error(`Server error: ${response.status}. The server might be overloaded.`);
                            });
                        }
                        
                        // Check content type to handle HTML responses
                        const contentType = response.headers.get('content-type');
                        if (contentType && contentType.includes('text/html')) {
                            throw new Error(`Server returned HTML instead of JSON. The server might be overloaded.`);
                        }
                        
                        return response.json().catch(err => {
                            console.error("JSON parsing error:", err);
                            throw new Error("Failed to parse server response. The server might be overloaded.");
                        });
                    })
                    .then(data => {
                        clearTimeout(animationTimer);
                        progressBar.style.width = '100%';
                        
                        setTimeout(() => {
                            if (data.success) {
                                successMessage.style.display = 'block';
                                
                                downloadLink.href = data.download_url;
                                
                                const autoDownloadLink = document.createElement('a');
                                autoDownloadLink.href = data.download_url;
                                autoDownloadLink.download = data.download_url.split('/').pop();
                                document.body.appendChild(autoDownloadLink);
                                autoDownloadLink.click();
                                document.body.removeChild(autoDownloadLink);
                                
                                returnHomeButton.style.display = 'inline-block';
                            } else if (data.status === 'processing') {
                                // Handle processing status - retry after a delay
                                console.log("Document still processing, will retry in 5 seconds");
                                catchphraseElement.innerHTML = `"${data.message || 'Your document is still being generated. Please wait a moment...'}"`;
                                
                                // Reset progress bar to show continued processing
                                progressBar.style.width = '75%';
                                
                                // Retry after 5 seconds
                                setTimeout(() => {
                                    checkPaymentStatus(sessionId);
                                }, 5000);
                            } else {
                                errorMessage.textContent = data.error || 'There was an error generating your document. Please try again.';
                                errorMessage.style.display = 'block';
                                returnHomeButton.style.display = 'inline-block';
                            }
                        }, 500);
                    })
                    .catch(function(error) {
                        // If we've reached max retries and still getting errors
                        if (error.message && error.message.includes('503') && retryCount < maxRetries) {
                            console.log(`503 error in response, retry ${retryCount + 1}/${maxRetries} in ${(retryCount + 1) * 2} seconds`);
                            
                            // Update the catchphrase to indicate retrying
                            catchphraseElement.innerHTML = `"Server is busy, retrying in ${(retryCount + 1) * 2} seconds..."`;
                            
                            // Retry after exponential backoff
                            setTimeout(() => {
                                checkPaymentStatus(sessionId, retryCount + 1, maxRetries);
                            }, (retryCount + 1) * 2000);
                            return;
                        }
                        
                        // Handle errors
                        clearTimeout(animationTimer);
                        progressBar.style.width = '100%';
                        
                        console.error('Payment processing error:', error);
                        errorMessage.textContent = 'There was an error processing your payment: ' + error.message;
                        errorMessage.style.display = 'block';
                        returnHomeButton.style.display = 'inline-block';
                    });
            }
            
            // Start checking payment status
            checkPaymentStatus(sessionId);
        });
    </script>
</body>
</html> 
```
