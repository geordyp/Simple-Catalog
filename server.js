/**
 * server.js
 * This file defines the server for a
 * simple catalog web app.
 */
"use strict;"

/* global variables */
var multipart = require('./multipart');
var template = require('./template');
var http = require('http');
var url = require('url');
var fs = require('fs');
var port = 3000;

/* load cached files */
var config = JSON.parse(fs.readFileSync('config.json'));
var stylesheet = fs.readFileSync('public/catalog.css');

template.loadDir('templates');


/** @function serveCatalog
 * A function to serve a HTML page representing a
 * simple catalog of items.
 * @param {http.incomingRequest} req - the request object
 * @param {http.serverResponse} res - the response object
 */
function serveCatalog(req, res) {
  getCatalogData(function(err, jsonFiles) {
    if (err) {
      console.error(err);
      res.statusCode = 500;
      res.statusMessage = 'Server error';
      res.end();
      return;
    }
    res.setHeader('Content-Type', 'text/html');
    res.end(buildCatalog(jsonFiles));
  });
}


/** @function serveUploadForm
 * A function to serve a form for adding to the catalog.
 * @param {http.incomingRequest} req - the request object
 * @param {http.serverResponse} res - the response object
 */
function serveUploadForm(req, res) {
  res.setHeader('Content-Type', 'text/html');
  res.end(template.render('uploadForm.html'));
}


/** @function getCatalogData
 * Retrieves all the item metadata within the /catalog
 * directory and supplies them to the callback.
 * @param {function} callback - function that takes an
 * error and array of filenames as parameters
 */
function getCatalogData(callback) {
  fs.readdir('catalog/', function(err, jsonFiles) {
    if (err) callback(err, undefined);
    else callback(false, jsonFiles);
  });
}


/**
 * @function buildCatalog
 * A helper function to build an HTML string of a catalog webpage.
 * @param {string[]} jsonFiles - the catalog data
 */
function buildCatalog(jsonFiles) {
  var items = [];
  jsonFiles.forEach(function(jsonFile) {
    items.push(JSON.parse(fs.readFileSync('catalog/' + jsonFile)));
  });

  return template.render('catalog.html', {
    title: config.title,
    imageTags: imageNamesToTags(items).join('')
  });
}


/** @function imageNamesToTags
 * Helper function that takes an array of item data
 * and returns an array of HTML img
 * tags build using those names.
 * @param {string[]} jsonData - the catalog data
 * @return {string[]} an array of HTML img tags
 */
function imageNamesToTags(jsonData) {
  return jsonData.map(function(item) {
    return `<a href="${item.id}">
              <img class="item-image" src="${item.image}" alt="${item.image}">
            </a>`;
  });
}


/** @function serveDetailedPage
 * A function to serve a HTML page with detailed item info.
 * @param {http.incomingRequest} req - the request object
 * @param {http.serverResponse} res - the response object
 * @param {string} itemId - the item's id
 */
function serveDetailedPage(item, req, res) {
  var jsonItem = JSON.parse(fs.readFileSync('catalog/' + decodeURIComponent(item + '.json')));
  res.setHeader('Content-Type', 'text/html');
  res.end(buildDetailedPage(jsonItem));
}

/**
 * @function buildDetailedPage
 * A helper function to build an HTML string
 * of a detailed item webpage.
 * @param {json} jsonItem - the metadata for a particular item.
 */
function buildDetailedPage(jsonItem) {
  return template.render('detailedPage.html', {
    name: jsonItem.name,
    description: jsonItem.description,
    imageTag: `<img class="item-image-detailed" src="${jsonItem.image}" alt="${jsonItem.image}">`
  });
}


/** @function uploadItem
 * A function to process an http POST request
 * containing an image to add to the gallery.
 * @param {http.incomingRequest} req - the request object
 * @param {http.serverResponse} res - the response object
 */
function uploadItem(req, res) {
  multipart(req, res, function(req, res) {
    // make sure an image was uploaded
    if(!req.body.itemImage.filename) {
      console.error("No file in upload");
      res.statusCode = 400;
      res.statusMessage = "No file specified"
      res.end("No file specified");
      return;
    }

    fs.writeFile('images/' + req.body.itemImage.filename, req.body.itemImage.data, function(err){
      if(err) {
        console.error(err);
        res.statusCode = 500;
        res.statusMessage = "Server Error";
        res.end("Server Error");
        return;
      }
      config.itemCount = parseInt(config.itemCount) + 1;

      var newItem = {
        "id":config.itemCount,
        "name":req.body.itemName,
        "description":req.body.itemDescription,
        "image":req.body.itemImage.filename
      };
      fs.writeFile('config.json', JSON.stringify(config));
      fs.writeFile('catalog/' + config.itemCount + '.json', JSON.stringify(newItem));
      serveCatalog(req, res);
    });
  });
}


/** @function serveImage
 * A function to serve an image file.
 * @param {string} filename - the filename of the image
 * to serve.
 * @param {http.incomingRequest} - the request object
 * @param {http.serverResponse} - the response object
 */
function serveImage(fileName, req, res) {
  fs.readFile('images/' + decodeURIComponent(fileName), function(err, data){
    if(err) {
      console.error(err);
      res.statusCode = 404;
      res.statusMessage = "Resource not found";
      res.end();
      return;
    }
    res.setHeader('Content-Type', 'image/*');
    res.end(data);
  });
}


/** @function handleRequest
 * A function to determine what to do with
 * incoming http requests.
 * @param {http.incomingRequest} req - the incoming request object
 * @param {http.serverResponse} res - the response object
 */
function handleRequest(req, res) {
  var urlParts = url.parse(req.url);

  switch(urlParts.pathname) {
    case '/catalog':
      serveCatalog(req, res);
      break;
    case '/upload':
      if (req.method == 'GET') serveUploadForm(req, res);
      else if (req.method == 'POST') uploadItem(req, res);
      break;
    case '/catalog.css':
      res.setHeader('Content-Type', 'text/css');
      res.end(stylesheet);
      break;
    default:
      if (req.url.includes('.jpg') || req.url.includes('.JPG') ||
          req.url.includes('.jpeg') || req.url.includes('.JPEG') ||
          req.url.includes('.png') || req.url.includes('.PNG') ||
          req.url.includes('.svg') || req.url.includes('.SVG') ||
          req.url.includes('.bmp') || req.url.includes('.BMP') ||
          req.url.includes('.ico')) serveImage(req.url, req, res);
      else serveDetailedPage(req.url, req, res);
  }
}


/* Create and launch the webserver */
var server = http.createServer(handleRequest);
server.listen(port, function() {
  console.log("Server is listening on localhost:" + port + "/catalog");
});
