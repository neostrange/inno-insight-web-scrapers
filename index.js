import express from 'express';
import Crawler from 'crawler';
import cors from 'cors';
import { create } from 'xmlbuilder2';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { randomUUID } from 'crypto';

// Define __dirname for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const datasetsFolder = path.join(__dirname, 'datasets');
// Ensure datasets folder exists
if (!fs.existsSync(datasetsFolder)) {
    fs.mkdirSync(datasetsFolder, { recursive: true });
}
const app = express();
app.use(express.json());
app.use(cors());

// Validate URL format
const validateUrl = (url) => {
    if (!url || (!url.startsWith('http://') && !url.startsWith('https://'))) {
        throw new Error('Invalid URL format.');
    }
};

// Extract content from the crawled page
const extractContent = ($) => {
    const allText = [];
    const title = $('h1.entry-title').text();
    const filename = `${title.replaceAll(":","").replaceAll(' ', '-')}.xml`;
    const nextLine = "\n\n";
    const contentDiv = $('div.entry-content-inner');
    console.log("filename:", filename)
    if (contentDiv.length) {
        contentDiv.find('p').each((i, elem) => {
            const text = $(elem).text().trim();
            if (text) allText.push(text);
        });
    }

    const combinedText = allText.join(nextLine);

    let authorName = null;
    let authorRole = null;
    const authorDiv = $('div.author');
    if (authorDiv.length) {
        authorName = authorDiv.find('a').text().trim() || null;
        authorRole = authorDiv.find('span').text().trim() || null;
    }

    let publicationDate = null;
    const parentDate = $('div.content-lf');
    const dateDiv = parentDate.find('div.post-date');
    if (dateDiv.length) {
        const timeElem = dateDiv.find('time.entry-date.published');
        publicationDate = timeElem.length ? timeElem.text().trim() : null;
    }

    const finalText = `${nextLine + authorName}${nextLine}${publicationDate}${nextLine}${combinedText}`;
    return { finalText, authorName, authorRole, publicationDate, filename, title };
};

// Generate XML from extracted content
const generateXml = (authorName, title, filename, uuid, url, finalText) => {
    return create({ version: '1.0', encoding: 'UTF-8' })
        .ele('NAF', { version: '1.0', 'xml:lang': 'en' })
        .ele('nafHeader')
        .ele('fileDesc', {
            author: authorName || 'Unknown Author',
            creationtime: new Date().toISOString(),
            filename,
            filetype: 'HTML',
            title
        }).up()
        .ele('public', { publicId: uuid, uri: url }).up().up()
        .ele('raw')
        .txt(finalText)
        .end({ prettyPrint: true });
};

// Save XML to a file
const saveFile = (xml, filename) => {
    const filePath = path.join(datasetsFolder, filename);
    fs.writeFileSync(filePath, xml, 'utf-8');
    return filePath;
};

// Set up Crawler and handle content saving
const setupCrawler = (url, res) => {
    const c = new Crawler({
        maxConnections: 10,
        callback: (error, response, done) => {
            if (error) {
                return res.status(500).json({ error: `Error occurred: ${error.message}` });
            } else {
                const $ = response.$;

                try {
                    // Extract content
                    const { finalText, authorName, authorRole, publicationDate, filename, title } = extractContent($);

                    // Generate XML
                    const uuid = randomUUID();
                    const xml = generateXml(authorName, title, filename, uuid, url, finalText);

                    // Save XML to file
                    const filePath = saveFile(xml, filename);

                    // Send response
                    return res.json({
                        content: finalText,
                        author: { name: authorName, role: authorRole },
                        publication_date: publicationDate,
                        filePath
                    });
                } catch (err) {
                    res.status(500).json({ error: `Error occurred while extracting content: ${err.message}` });
                }
            }
            done();
        }
    });

    // Start crawling
    c.queue(url);
};

app.post('/scrape', async (req, res) => {
    const { url } = req.body;

    try {
        // Validate URL
        validateUrl(url);

        // Set up and start the crawler
        setupCrawler(url, res);

    } catch (err) {
        res.status(500).json({ error: `Error occurred: ${err.message}` });
    }
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
