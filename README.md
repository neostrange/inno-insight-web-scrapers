# Inno Insight Web Scrapers (Node.js Version)

**Inno Insight Web Scrapers** is a Node.js-based server designed to scrape unstructured textual data from various web sources. The data collected will be used to analyze the innovation landscape in Australia, with a focus on insights like government funding for startups, inefficiencies in innovation practices, and trends in innovation.

## Features

- Scrapes news articles, blogs, reviews, and other content from various web pages.
- Extracts metadata such as author, publication date, title, and content.
- Generates XML files from the scraped content.
- Automatically saves the generated XML files in a `datasets` folder.
- Provides a RESTful API for triggering scraping operations via URL submission.
- Ensures the `datasets` folder exists before saving files.

## Requirements

- Node.js (version 14.x or later)
- npm or yarn (package manager)

## Installation

1. **Clone the Repository**:
   ```bash
   git clone https://github.com/<your-username>/inno-insight-web-scrapers-node.git
   cd inno-insight-web-scrapers-node
2. **Install Dependencies: Run the following command to install all necessary dependencies**:
   npm install
3. **Start the Server: To start the server, use**:
   npm start

## Usage
   **API Endpoint**:
   The server exposes a POST API endpoint for scraping content from a URL.

   - **Endpoint**: /scrape
   - **Method**: POST
   - **Request Body**:
      {
         "url": "https://example.com/article"
      }
