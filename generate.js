var fs = require('fs');
var path = require('path')

var marked = require('./marked');

var fm = require('front-matter');

var Liquid = require("liquid-node");
var liquidEngine = new Liquid.Engine();

var GitHubApi = require("github");

var mkdirp = require('mkdirp');


marked.setOptions({
  renderer: new marked.Renderer(),
  gfm: true,
  tables: true,
  breaks: false,
  pedantic: false,
  sanitize: false,
  smartLists: true,
  smartypants: false,
  highlight: function (code) {
    var highlighted = require('highlight.js').highlightAuto(code).value;
    return highlighted;
  },

  langPrefix: 'hljs lang-',
  tableCss: "table table-bordered",
  imgCss: "img-responsive",
  blockQuoteCallback: function(blockquote) {

  	var warning = blockquote.toLowerCase().startsWith("<blockquote>\n<p><strong>warning");
  	var note = blockquote.toLowerCase().startsWith("<blockquote>\n<p><strong>note");

	blockquote = blockquote
	.replace('&lt;br/&gt;','<br/>')
	.replace('</blockquote>','</div>');
	if (warning) {
		blockquote = blockquote.replace('<blockquote>','<div class="alert alert-warning">');
	}
	if (note){
		blockquote = blockquote.replace('<blockquote>','<div class="alert alert-success">');
	}

  	return blockquote;
  },
  codespanCallback: function(codespan) {
  	return codespan;
  }
});

if (typeof String.prototype.startsWith != 'function') {
  // see below for better implementation!
  String.prototype.startsWith = function (str){
    return this.indexOf(str) == 0;
  };
}

function start(root)
{
  var site = {
    time: new Date(),
    html_pages: [],
    markdown_files: [],
    static_files: [],
    pages: [],
    posts: [],
    directories: [],
    root_path:root,
  };

  processDirectory(root,'', site);
  //console.log(site);
  processMarkdown(site);
}

function processMarkdown(site){
  site.markdown_files.forEach(function(fullFilePath){
    var filename = path.basename(fullFilePath);
    var dir = path.relative(site.root_path, path.dirname(fullFilePath));
    fs.readFile(fullFilePath, 'utf8', processFile(site.root_path, dir, filename));
  });
}

function processDirectory(root, dir, site)
{
  site.directories.push(dir);
  var fullpath = path.join(root,dir);
  var filenames = fs.readdirSync(fullpath);
  filenames.forEach(function (filename) {
  	var fullFilePath = path.join(root,dir,filename);
  	var stat = fs.statSync(fullFilePath);
		if (stat && stat.isDirectory() && !(filename.startsWith('_') || filename.startsWith('.'))) {
			//a directory
			var childDir = path.join(dir, filename);
			processDirectory(root, childDir, site)
		}
		else
		{
      var extension = path.extname(filename);
      switch(extension)
      {
        case ".md":
        case ".markdown":
            site.markdown_files.push(fullFilePath);
            break;
        case ".html":
        case ".htm":
            site.html_pages.push(fullFilePath);
            break;
        default:
            site.static_files.push(fullFilePath);
          break;
      }
		/*	//a file
			if (path.extname(filename) === ".md") {
        site.markdown_pages.push(fullFilePath);
				//console.log("processing " + fullFilePath);
				//fs.readFile(fullFilePath, 'utf8', processFile(root, dir, filename));
			}
			else{
				//console.log("ignore " + fullFilePath);
			}*/
		}
  });
}

function processFile(root, dir, filename)
{
	var initPage = function(page)
	{
		page.url = "/" +path.join(dir,filenameWoExtension).replace('\\','/');
		page.title = page.title || "";
	}
	var filenameWoExtension = path.basename(filename,".md");

	return function (err, data) {
		if (err) throw err;

		//get frontmatter
		var template = fm(data);
		var page = template.attributes || {};

		//parse markdown
		marked(template.body, function (err, body) {
			if (err) throw err;
			//apply layout
			initPage(page);
			applyLayout(root, dir, filename, page.layout, body, page);
		});
	}
}

function applyLayout(root, dir, filename, layout, body, page)
{
	//no layout defined, just output the file to disk
	if (layout === undefined) {
		saveFile(dir, filename, body);
	}
	else {
		var fullLayoutPath = path.join(root,"_layouts", layout + ".html");
		fs.readFile(fullLayoutPath, 'utf8', function(err, data) {
			//we need layout frontmatter
			var template = fm(data);

			//create the page props for this recursion
			var props = {
				page: page,
				content: body
			};

			liquidEngine.parseAndRender(template.body,props,true).then(function(output) {
				applyLayout(root, dir, filename, template.attributes.layout, output, page);
			});

		});
	}
}

function saveFile(dir, filename, body){
	var fullDirPath = path.join("C:\\Output\\html\\",dir);
	mkdirp(fullDirPath, function (err) {
	    if (err) console.error(err)
	    var filenameWoExtension = path.basename(filename,".md");
	    var fullFilePath = path.join(fullDirPath,filenameWoExtension + ".html");
		fs.writeFile(fullFilePath, body, function(err) {
			if (err) {
				console.log('failed writing ' + fullFilePath)
			}
		});
	});
}

start('C:\\Projects\\Git\\Github.com\\akkadotnet.github.com');
