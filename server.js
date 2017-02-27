/**
 * server.js
 * This file defines the server for a
 * simple photo gallery web app.
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
var stylesheet = fs.readFileSync('public/gallery.css');

template.loadDir('templates');


/** @function serveGallery
 * A function to serve a HTML page representing a
 * gallery of images.
 * @param {http.incomingRequest} req - the request object
 * @param {http.serverResponse} res - the response object
 */
function serveGallery(req, res) {
  getCatalogData(function(err, jsonFiles) {
    if (err) {
      console.error(err);
      res.statusCode = 500;
      res.statusMessage = 'Server error';
      res.end();
      return;
    }
    res.setHeader('Content-Type', 'text/html');
    res.end(buildGallery(jsonFiles));
  });
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
 * @function buildGallery
 * A helper function to build an HTML string
 * of a gallery webpage.
 * @param {string[]} imageTags - the HTML for the individual
 * gallery images.
 */
function buildGallery(jsonFiles) {
  var items = [];
  jsonFiles.forEach(function(jsonFile) {
    items.push(JSON.parse(fs.readFileSync('catalog/' + jsonFile)));
  });

  return template.render('gallery.html', {
    title: config.title,
    imageTags: imageNamesToTags(items).join('')
  });
}


/** @function imageNamesToTags
 * Helper function that takes an array of image
 * filenames, and returns an array of HTML img
 * tags build using those names.
 * @param {string[]} filenames - the image filenames
 * @return {string[]} an array of HTML img tags
 */
function imageNamesToTags(jsonData) {
  return jsonData.map(function(item) {
    return `<a href="${item.id}.json">
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
  var jsonItem = JSON.parse(fs.readFileSync('catalog/' + decodeURIComponent(item)));
  res.setHeader('Content-Type', 'text/html');
  res.end(buildDetailedPage(jsonItem));
}

/**
 * @function buildDetailedPage
 * A helper function to build an HTML string
 * of a gallery webpage.
 * @param {json} jsonItem - the metadata for a particular item.
 */
function buildDetailedPage(jsonItem) {
  return template.render('detailedPage.html', {
    name: jsonItem.name,
    description: jsonItem.description,
    imageTag: `<img class="item-image" src="${jsonItem.image}" alt="${jsonItem.image}">`
  });
}


/** @function uploadImage
 * A function to process an http POST request
 * containing an image to add to the gallery.
 * @param {http.incomingRequest} req - the request object
 * @param {http.serverResponse} res - the response object
 */
function uploadImage(req, res) {
  multipart(req, res, function(req, res) {
    // make sure an image was uploaded
    if(!req.body.image.filename) {
      console.error("No file in upload");
      res.statusCode = 400;
      res.statusMessage = "No file specified"
      res.end("No file specified");
      return;
    }
    fs.writeFile('images/' + req.body.image.filename, req.body.image.data, function(err){
      if(err) {
        console.error(err);
        res.statusCode = 500;
        res.statusMessage = "Server Error";
        res.end("Server Error");
        return;
      }
      serveGallery(req, res);
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
  // at most, the url should have two parts -
  // a resource and a querystring separated by a ?
  var urlParts = url.parse(req.url);

  if(urlParts.query){
    var matches = /title=(.+)($|&)/.exec(urlParts.query);
    if(matches && matches[1]){
      config.title = decodeURIComponent(matches[1]);
      fs.writeFile('config.json', JSON.stringify(config));
    }
  }

  switch(urlParts.pathname) {
    case '/':
    case '/gallery':
      if (req.method == 'GET') serveGallery(req, res);
      else if (req.method == 'POST') uploadImage(req, res);
      break;
    case '/gallery.css':
      res.setHeader('Content-Type', 'text/css');
      res.end(stylesheet);
      break;
    default:
      if (req.url.includes('.json')) serveDetailedPage(req.url, req, res);
      else if (req.url.includes('.jpg')) serveImage(req.url, req, res);
  }
}


/* Create and launch the webserver */
var server = http.createServer(handleRequest);
server.listen(port, function() {
  console.log("Server is listening on port ", port);
});
