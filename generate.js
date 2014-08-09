var fs = require('fs');
var path = require('path')

var marked = require('marked');

var fm = require('front-matter');

var Liquid = require("liquid-node");
var liquidEngine = new Liquid.Engine();

//var html = converter.makeHtml("*hello*");


marked.setOptions({
  renderer: new marked.Renderer(),
  gfm: true,
  tables: true,
  breaks: false,
  pedantic: false,
  sanitize: true,
  smartLists: true,
  smartypants: false,
  highlight: function (code) {
    var highlighted = require('highlight.js').highlightAuto(code).value;
    console.log(highlighted);
    return highlighted;
  },
  langPrefix: 'hljs lang-'
});

if (typeof String.prototype.startsWith != 'function') {
  // see below for better implementation!
  String.prototype.startsWith = function (str){
    return this.indexOf(str) == 0;
  };
}

var dir = "C:\\Projects\\Git\\Github.com\\akkadotnet.github.com\\wiki\\";
fs.readdir(dir, function (err,filenames)
{
	filenames.forEach(function processFile(filename)
	{
		fs.readFile(dir + filename, 'utf8', function(err, data) {
			if (err) throw err;
			if (fm.test(data))
			{
				var content = fm(data);  				
				console.log("Front Matter " +  content.attributes.layout);
				if (content.attributes.layout === undefined)
				{
					console.log("Error " + filename);
				}
				else
				{

					marked(content.body, function (err, body) {
						if (err) throw err;
					
						var outputfilename = path.basename(filename,".md");
						body = '<link href="../css/highlight.css" rel="stylesheet" type="text/css" />' + body;
						fs.writeFile("C:\\Output\\html\\" + outputfilename + ".html", body, function() {});  
					});
					
				}
			}
			else
			{
				console.log("Plain " + filename);
			}
		});
	});
});