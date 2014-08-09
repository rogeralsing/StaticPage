var fs = require('fs');
var path = require('path')

var marked = require('./marked');

var fm = require('front-matter');

var Liquid = require("liquid-node");
var liquidEngine = new Liquid.Engine();

var GitHubApi = require("github");

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
	if (warning){
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

function processDirectory(dir)
{
	fs.readdir(dir, function (err,filenames)
	{
		filenames.forEach(function (filename)
		{
			fs.readFile(dir + filename, 'utf8', processFile(dir, undefined, filename));
		});
	});	
}

function processFile(root, dir, filename)
{
	return function (err, data) {
		if (err) throw err;
		if (fm.test(data))
		{
			//get frontmatter
			var content = fm(data);  				
			//parse markdown
			marked(content.body, function (err, body) {
				if (err) throw err;
							
				body = '<link href="../css/highlight.css" rel="stylesheet" type="text/css" />' + body;

				//apply layout
				applyLayout(root, dir, filename, content.attributes.layout, body);
			});
		}
		else
		{
			console.log("Plain " + filename);
		}
	}
}

function applyLayout(root, dir, filename, layout, body)
{
	//no layout defined, just output the file to disk
	if (layout === undefined) {
		var outputfilename = path.basename(filename,".md");
		fs.writeFile("C:\\Output\\html\\" + outputfilename + ".html", body, function() {});  
		return;
	}
	else {
		fs.readFile("c:\\Output\\_layouts\\"+ layout +".html", 'utf8', function(err, data)
		{
			console.log(data);
			applyLayout(root, dir, filename, undefined, body);
		});		
	}
}

processDirectory('C:\\Projects\\Git\\Github.com\\akkadotnet.github.com\\wiki\\');
