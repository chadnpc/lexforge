# legal document generator

This project consists of a FastAPI backend server and a React + TypeScript frontend application exported from Databutton.

## DESIGN

Foundation of neutral tones inspired by legal papers and documents. Strategic use of muted colors for categorization and information hierarchy. High-contrast accent elements for important actions and confirmations.
Subtle gradients only for depth in document preview areas. Color coding system for different document types and stages of completion. Color intensity that increases with user progression through document creation.

## Stack

- React+Typescript frontend with `yarn` as package manager.
- Python FastAPI server with `uv` as package manager.

## Quickstart

1. Install dependencies:

```bash
make
```

2. Start the backend and frontend servers in separate terminals:

```bash
make run-backend
make run-frontend
```
## DONE

1. Create a Swiss Neo-Brutalist landing page for LexForge
   Description: > Design and implement a professional landing page that showcases the value proposition of LexForge. Follow the Swiss Neo-Brutalist design principles with strong typographic hierarchy, document-inspired UI elements, and clear sections for features and benefits. Include a hero section, feature highlights, and call-to-action buttons.
   Activity: 
   Completed the Swiss Neo-Brutalist landing page for LexForge with the following key features:

        Swiss design elements:
            Strong typographic hierarchy using DM Serif Display, Inter, and JetBrains Mono
            Architectural grid layouts with geometric precision
            Purposeful use of negative space

        Brutalist elements:
            Bold borders and geometric shapes
            High contrast between elements
            Monospace accents for technical aspects
            Distinctive hover effects with physical "push" simulation

        Document-inspired UI:
            Paper-like elements in the document preview section
            Forward slashes (///) as visual motifs in headings
            Folded document shapes represented in the design

        Key sections implemented:
            Hero section with clear value proposition
            Features section highlighting AI capabilities
            3-step process breakdown
            Document types showcase
            CTA sections
            Professional footer

        Fixed implementation issues:
            Corrected import paths for components and utilities
            Added web typography via Google Fonts
            Ensured consistent design system between components

2. Install and configure Firebase extension for authentication
   Description: > Set up Firebase authentication by installing the Firebase extension. Configure the authentication to support email/password login and registration. Ensure the Firebase configuration is properly set up and that users can sign up, log in, and log out of the application.
   Activity: 
   Successfully implemented Firebase authentication:

        Installed Firebase extension and validated the connection
        Customized Login page with Swiss Neo-Brutalist design
        Updated Header component to show different options for authenticated vs. non-authenticated users
        Created a protected Dashboard page that only logged-in users can access
        Updated landing page to properly direct users to login when needed
        Configured email/password and Google sign-in methods

    The authentication system is now fully functional. Users can:

        Sign up with email/password or Google
        Log in to access protected features
        View a personalized dashboard when authenticated
        Log out of the application


## IN PROGRESS

3 . Implement document type selection interface
    > Create a user interface for selecting document types (NDAs, Terms of Service, Privacy Policies, etc.). Design a grid layout with document type cards that follow the Swiss Neo-Brutalist style. Each card should include a title, brief description, and visual representation of the document type.

## TODOS

4. Build document information collection form
   Description: > Create a multi-step form that collects necessary information for generating legal documents. Include fields for business details, industry, jurisdiction, and document-specific parameters. Implement form validation and a step indicator to guide users through the process. Done when users can complete the form and see a summary of their inputs.

5. Set up OpenAI integration for document generation
   Description: > Implement the backend API that connects to OpenAI's GPT-4 to generate legal documents. Create endpoints for sending user input to OpenAI and receiving generated document content. Include proper error handling and rate limiting. Done when the API successfully returns generated legal content based on user inputs.

6. Implement PDF generation with ReportLab
   Description: > Create a backend service that converts the generated legal text into professionally formatted PDF documents using ReportLab. Implement templates for different document types with appropriate formatting, headers, footers, and styling. Done when the service can generate downloadable PDFs from the AI-generated content.

7. Create document dashboard for authenticated users
   Description: > Build a dashboard page where authenticated users can view their previously generated documents, download them again, or create new documents. Implement a table or grid view that displays document names, creation dates, and download options. Done when users can access their document history after logging in.

## Gotchas

The backend server runs on port 8000 and the frontend development server runs on port 5173. The frontend Vite server proxies API requests to the backend on port 8000.

Visit <http://localhost:5173> to view the application.
