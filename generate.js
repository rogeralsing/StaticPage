require('coffee-script')

var fs = require('fs');
var path = require('path')

var marked = require('./marked');

var fm = require('front-matter');

var Liquid = require("liquid-node");
var liquidEngine = new Liquid.Engine();

var GitHubApi = require("github");

var mkdirp = require('mkdirp');

/*
var git = require('nodegit');

git.Repo.clone("https://github.com/akkadotnet/akkadotnet.github.com.git", "c:\\tempgit", null, function(error, repo) {
	if (error) throw error;    
});
*/
  


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

function processDirectory(root, dir)
{
	var fullpath = path.join(root,dir);	

	fs.readdir(fullpath, function (err,filenames) {
		filenames.forEach(function (filename) {	
			var fullFilePath = path.join(root,dir,filename);
			fs.stat(fullFilePath, function(err, stat) {
				if (stat && stat.isDirectory() && !filename.startsWith('_')) {
					//a directory
					var childDir = path.join(dir, filename);
					processDirectory(root, childDir)
				}
				else
				{
					//a file
					if (path.extname(filename) === ".md") {	
						console.log("processing " + fullFilePath);
						fs.readFile(fullFilePath, 'utf8', processFile(root, dir, filename));
					}
					else{
						//console.log("ignore " + fullFilePath);
					}
				}
			});
		});
	});	
}

function processFile(root, dir, filename)
{
	return function (err, data) {
		if (err) throw err;
		if (fm.test(data)) {
			//get frontmatter
			var content = fm(data);  				
			//parse markdown
			marked(content.body, function (err, body) {
				if (err) throw err;						
				//apply layout
				applyLayout(root, dir, filename, content.attributes.layout, body);
			});
		}
		else {
			marked(data, function (err, body) {
				if (err) throw err;						
				//apply layout
				applyLayout(root, dir, filename, undefined, body);
			});
		}
	}
}

function applyLayout(root, dir, filename, layout, body)
{
	var filenameWoExtension = path.basename(filename,".md");
	//no layout defined, just output the file to disk
	if (layout === undefined) {
		
		var fullDirPath = path.join("C:\\Output\\html\\",dir);
		mkdirp(fullDirPath, function (err) {
		    if (err) console.error(err)
		    var fullFilePath = path.join(fullDirPath,filenameWoExtension + ".html");
			fs.writeFile(fullFilePath, body, function(err) {
				if (err) {
					console.log('failed writing ' + fullFilePath)
				}
			});  
		});
	}
	else {
		var fullLayoutPath = path.join(root,"_layouts", layout + ".html");
		//console.log("layout " + fullLayoutPath);
		fs.readFile(fullLayoutPath, 'utf8', function(err, data) {
			var template = fm(data);
			 //console.log(template.attributes);
			body = template.body.replace ("{{ content }}",body);
			var page = new Liquid.Variable('page');

			var props = {
				content: body,
				page: template.attributes
			};
			props.page.url = dir + "/" + filenameWoExtension;
			if (props.page.title === undefined){
				props.page.title = "";
			}

			liquidEngine.parseAndRender(body,props,true).then(function(output) {
				applyLayout(root, dir, filename, template.attributes.layout, output);
			});
			
		});		
	}
}

processDirectory('C:\\Projects\\Git\\Github.com\\akkadotnet.github.com','');
