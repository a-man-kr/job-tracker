# Requirements Document

## Introduction

The LinkedIn Job Application Tracker is a browser-based application that streamlines the job search process by allowing users to paste raw LinkedIn job posting text and automatically extract structured job details using AI. The system provides comprehensive tracking of job applications, referral contacts, AI-generated referral messages, and supports data export functionality. All data persists using the window.storage API for seamless offline access.

## Glossary

- **Job_Tracker**: The main application system that manages job applications and related data
- **Job_Posting**: A structured record containing extracted job details from LinkedIn
- **Referral_Contact**: A person associated with a job application who may provide a referral
- **Application_Status**: The current state of a job application (Saved, Applied, Interview, Offer, Rejected)
- **Referral_Status**: The state of a referral request (Not Contacted, Contacted, Referral Received, No Response)
- **AI_Extractor**: The component that parses raw job posting text and extracts structured fields
- **Referral_Message**: An AI-generated professional message template for requesting referrals
- **Date_Added**: The timestamp when a Job_Posting was first created
- **Date_Applied**: The timestamp when the Application_Status changed to "Applied"

## Requirements

### Requirement 1

**User Story:** As a job seeker, I want to paste raw LinkedIn job posting text and have AI automatically extract job details, so that I can save jobs quickly without manual data entry.

#### Acceptance Criteria

1. WHEN a user pastes job posting text into the input field THEN the Job_Tracker SHALL extract the job title, company name, location, and job description into separate fields
2. WHEN the AI_Extractor processes job posting text THEN the Job_Tracker SHALL display the extracted fields in an editable form within 3 seconds
3. WHEN extracted fields are displayed THEN the Job_Tracker SHALL allow the user to edit any field before saving
4. WHEN the job posting text contains incomplete information THEN the Job_Tracker SHALL leave the corresponding fields empty and allow manual entry
5. WHEN the user provides a LinkedIn URL THEN the Job_Tracker SHALL store the URL with the Job_Posting record
6. WHEN the AI_Extractor cannot confidently extract a field THEN the Job_Tracker SHALL leave that field empty rather than guessing incorrectly
7. WHEN extraction fails entirely THEN the Job_Tracker SHALL display an error message and allow manual entry of all fields

### Requirement 2

**User Story:** As a job seeker, I want AI to generate a professional referral message based on job details, so that I can quickly reach out to contacts for referrals.

#### Acceptance Criteria

1. WHEN a Job_Posting is created THEN the Job_Tracker SHALL automatically generate a Referral_Message customized to the job title and company name
2. WHEN displaying the Referral_Message THEN the Job_Tracker SHALL allow the user to edit the message before copying
3. WHEN the user clicks a copy button THEN the Job_Tracker SHALL copy the Referral_Message to the system clipboard

### Requirement 3

**User Story:** As a job seeker, I want to save job applications with all extracted details, so that I can maintain an organized record of my job search.

#### Acceptance Criteria

1. WHEN the user clicks save THEN the Job_Tracker SHALL persist the Job_Posting to window.storage API immediately
2. WHEN saving a Job_Posting THEN the Job_Tracker SHALL store the job title, company name, location, job description, LinkedIn URL, Referral_Message, Application_Status, Date_Added, and Date_Applied
3. WHEN a Job_Posting is saved THEN the Job_Tracker SHALL assign a unique identifier to the record
4. WHEN the user adds personal notes to a Job_Posting THEN the Job_Tracker SHALL persist the notes with the record

### Requirement 4

**User Story:** As a job seeker, I want to update the application status of my saved jobs, so that I can track my progress through the hiring process.

#### Acceptance Criteria

1. WHEN viewing a Job_Posting THEN the Job_Tracker SHALL display the current Application_Status
2. WHEN the user selects a new Application_Status THEN the Job_Tracker SHALL update the status and persist the change immediately
3. WHEN the Application_Status changes THEN the Job_Tracker SHALL record the timestamp of the status change
4. WHEN the Application_Status changes to "Applied" THEN the Job_Tracker SHALL automatically set the Date_Applied field
5. WHEN viewing a Job_Posting THEN the Job_Tracker SHALL display both Date_Added and Date_Applied timestamps

### Requirement 5

**User Story:** As a job seeker, I want to track referral contacts for each job application, so that I can manage my networking efforts effectively.

#### Acceptance Criteria

1. WHEN viewing a Job_Posting THEN the Job_Tracker SHALL allow adding multiple Referral_Contact records
2. WHEN adding a Referral_Contact THEN the Job_Tracker SHALL store the contact name, contact method, and date contacted
3. WHEN a Referral_Contact is added THEN the Job_Tracker SHALL set the initial Referral_Status to "Not Contacted"
4. WHEN the user updates a Referral_Status THEN the Job_Tracker SHALL persist the change immediately
5. WHEN a referral is received THEN the Job_Tracker SHALL allow the user to mark the Referral_Status as "Referral Received"

### Requirement 6

**User Story:** As a job seeker, I want to view all my job applications in one organized list, so that I can easily find and manage my applications.

#### Acceptance Criteria

1. WHEN the user opens the Job_Tracker THEN the Job_Tracker SHALL display all saved Job_Postings in a list view
2. WHEN displaying the list THEN the Job_Tracker SHALL show the job title, company name, Application_Status, and Date_Added for each entry
3. WHEN the user clicks on a Job_Posting in the list THEN the Job_Tracker SHALL display the full details including all fields, Referral_Contacts, and notes
4. WHEN multiple Job_Postings exist THEN the Job_Tracker SHALL sort them by Date_Added with newest first

### Requirement 7

**User Story:** As a job seeker, I want to export all my job application data as a CSV file, so that I can use the data in Excel or Google Sheets.

#### Acceptance Criteria

1. WHEN the user clicks the export button THEN the Job_Tracker SHALL generate a CSV file containing all Job_Posting records
2. WHEN generating the CSV THEN the Job_Tracker SHALL include columns in this order: Job Title, Company, Location, Status, LinkedIn URL, Contact Person, Contact Info, AI Referral Message, Personal Notes, Date Added, Date Applied, Last Updated
3. WHEN the CSV is generated THEN the Job_Tracker SHALL trigger a browser download of the file
4. WHEN exporting Referral_Contact data THEN the Job_Tracker SHALL join multiple contacts with a semicolon and format each contact as "Name [Method]" (e.g., "John Doe [LinkedIn]; Jane Smith [Email]")
5. WHEN the CSV contains special characters (commas, quotes, newlines) THEN the Job_Tracker SHALL properly escape them per CSV RFC 4180
6. WHEN generating the filename THEN the Job_Tracker SHALL use format "job-applications-YYYY-MM-DD.csv"

### Requirement 8

**User Story:** As a job seeker, I want my data to persist automatically in my browser, so that I never lose my job application records.

#### Acceptance Criteria

1. WHEN any data change occurs THEN the Job_Tracker SHALL save to window.storage API within 1 second
2. WHEN the user reopens the browser THEN the Job_Tracker SHALL restore all previously saved Job_Postings from window.storage
3. WHEN window.storage operations fail THEN the Job_Tracker SHALL display a user-friendly error message and retain data in memory for the current session

### Requirement 9

**User Story:** As a job seeker, I want to delete job applications I no longer need, so that I can keep my tracker organized.

#### Acceptance Criteria

1. WHEN the user requests to delete a Job_Posting THEN the Job_Tracker SHALL prompt for confirmation before deletion
2. WHEN deletion is confirmed THEN the Job_Tracker SHALL remove the Job_Posting and all associated Referral_Contacts from window.storage
3. WHEN a Job_Posting is deleted THEN the Job_Tracker SHALL update the list view immediately

### Requirement 10

**User Story:** As a job seeker, I want to search and filter my job applications, so that I can quickly find specific jobs.

#### Acceptance Criteria

1. WHEN the user types in the search box THEN the Job_Tracker SHALL filter Job_Postings by job title or company name
2. WHEN the user selects a status filter THEN the Job_Tracker SHALL display only Job_Postings matching that Application_Status
3. WHEN filters are applied THEN the Job_Tracker SHALL update the list view in real-time
4. WHEN the user clears filters THEN the Job_Tracker SHALL display all Job_Postings

### Requirement 11

**User Story:** As a job seeker, I want keyboard shortcuts for common actions, so that I can add jobs faster.

#### Acceptance Criteria

1. WHEN the user presses Shift+N (when no input is focused) THEN the Job_Tracker SHALL open the "Add Job" form
2. WHEN the "Add Job" form is open and user presses Esc THEN the Job_Tracker SHALL close the form
3. WHEN the "Add Job" form is filled and user presses Cmd+Enter (Mac) or Ctrl+Enter (Windows) THEN the Job_Tracker SHALL save the job

### Requirement 12

**User Story:** As a job seeker, I want a clean and intuitive interface, so that I can focus on my job search without friction.

#### Acceptance Criteria

1. WHEN viewing the Job_Tracker THEN the interface SHALL use a modern, clean design with adequate spacing
2. WHEN displaying Application_Status THEN the Job_Tracker SHALL use color-coded badges for visual clarity
3. WHEN loading data or generating AI content THEN the Job_Tracker SHALL display loading indicators
4. WHEN an error occurs THEN the Job_Tracker SHALL display clear, actionable error messages
5. WHEN using on mobile devices THEN the Job_Tracker SHALL adapt the layout for smaller screens
