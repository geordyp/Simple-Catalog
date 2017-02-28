# Simple-Catalog
CIS 526 project 1

## Rubric
#### Persistent Storage
Your server should have a catalog directory storing the item metadata as JSON files. (10 points)
There should be at least five items included in your catalog (more are fine).  (10 points)
Your items should have at least 1 picture, a name, and a description.  Additional metadata fields are fine. (10 points)

#### Serving Files
Your server should serve a dynamically created index page, which lists all items in the catalog directory with thumbnail images.  The thumbnails should be wrapped in anchor tags that link to the detail page for the catalog entry. (10 points)
Your server should also serve a dynamically-generated catalog entry detail page for any item in the catalog directory.  It should display all metadata for the item, and a larger version of the thumbnail (or a different picture). (10 points)
You will also need to serve all images used in the catalog entries.  (10 points)
You should also serve a stylesheet, containing at least ten rules for styling the index and catalog entry pages. (10 points)

#### Uploading Items
You should also have a form (either on the index page or its own page), allowing the upload of new catalog items.  It should have a field for every item of metadata and pictures needed. (10 points)
When POSTed, the form data should be parsed, and a new item JSON file and image files created and stored in the appropriate directories. (10 points)
Use at least 3 modules to break up your code base into manageable parts (10 points)

## Technologies Used
* Node.js

## Setup
Simply enter the command `node server.js` to run the project.

## Author
Geordy Williams
