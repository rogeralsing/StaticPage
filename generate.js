var S = require('string');
var fs = require('fs');
var path = require('path');
var yaml = require('yaml-js');
var marked = require('./marked-config');
var fm = require('front-matter');
var Liquid = require("liquid-node");
var liquidEngine = new Liquid.Engine();
var mkdirp = require('mkdirp');
var outputRoot = "../tmp/output";
var wikiRoot = "../tmp/wiki";
var siteRoot = '../tmp/site';

function copyWikiFiles() {
    var wikiFiles = fs.readdirSync(wikiRoot);
    wikiFiles.forEach(function(filename) {
        var stat = fs.statSync(path.join(wikiRoot, filename));
        if(stat && stat.isDirectory()) {} else {
            var newName = S(filename).replaceAll('-', ' ').s;
            var body = fs.readFileSync(path.join(wikiRoot, filename), 'UTF8');
            console.log(newName);
            //console.log(body);
            var title = removeFileExtension(newName);
            body = '---\nlayout: wiki\ntitle: ' + title + '\n---\n' + body;
            fs.writeFileSync(path.join(siteRoot, "wiki", newName), body);
        }
    });
}

function start(root) {
    copyWikiFiles();
    var site = {
        time: new Date(),
        html_pages: [],
        markdown_files: [],
        static_files: [],
        pages: [],
        posts: [],
        directories: [],
        root_path: root,
        title: "Akka.NET"
    };
    site.config = yaml.load(fs.readFileSync(path.join(root, '_config.yml'), 'UTF8'));
    processDirectory(root, '', site);
    processMarkdownFiles(site);
    processHtmlFiles(site);
    processStaticFiles(site);
}

function processMarkdownFiles(site) {
    site.markdown_files.forEach(function(page) {
        //parse markdown
        marked(page.content, function(err, body) {
            if(err) throw err;
            //apply layout
            var dir = path.relative(site.root_path, path.dirname(page.path));
            var filename = removeFileExtension(page.path) + ".html";
            console.log(page.url)
            applyLayout(site, site.root_path, dir, filename, page.layout, body, page);
        });
    });
}

function processHtmlFiles(site) {
    site.html_pages.forEach(function(page) {
        //parse markdown
        var body = page.content;
        //apply layout
        var dir = path.relative(site.root_path, path.dirname(page.path));
        var filename = removeFileExtension(page.path) + ".html";
        console.log(page.url)
        applyLayout(site, site.root_path, dir, filename, page.layout, body, page);
    });
}

function processStaticFiles(site) {
    site.static_files.forEach(function(file) {
        var body = fs.readFileSync(file);
        var dir = path.relative(site.root_path, path.dirname(file));
        var filename = path.basename(file);
        saveFile(dir, filename, body);
    });
}

function removeFileExtension(filename) {
    var extension = path.extname(filename);
    var filenameWoExtension = path.basename(filename, extension);
    return filenameWoExtension;
}

function getPage (site, fullFilePath) {
    var f = fs.readFileSync(fullFilePath, 'utf8');
    var front = fm(f);
    var page = front.attributes;
    page.content = front.body;
    page.path = fullFilePath;
    page.url = '/' + S(path.join(path.relative(site.root_path, path.dirname(fullFilePath)), removeFileExtension(fullFilePath))).replaceAll('\\', '/').s;
    console.log(page.url);
    page.title = page.title || '';
    page.date = page.date || '';
    site.pages.push(page);
    return page;
}

function processDirectory(root, dir, site) {
    site.directories.push(dir);
    var fullpath = path.join(root, dir);
    var filenames = fs.readdirSync(fullpath);
    filenames.forEach(function(filename) {
        var fullFilePath = path.join(root, dir, filename);
        var stat = fs.statSync(fullFilePath);
        if(stat && stat.isDirectory()) {
            //a directory
            if(!(S(filename).startsWith('_') || S(filename).startsWith('.'))) {
                var childDir = path.join(dir, filename);
                processDirectory(root, childDir, site)
            } else {
                //ignore this directory...
            }
        } else {
            
            var extension = path.extname(filename);
            switch(extension) {
                case ".md":
                case ".markdown":
                    var page = getPage(site, fullFilePath);
                    site.markdown_files.push(page);
                    break;
                case ".html":
                case ".htm":
                    var page = getPage(site, fullFilePath);
                    site.html_pages.push(page);
                    break;
                default:
                    site.static_files.push(fullFilePath);
                    break;
            }
        }
    });
}

function applyLayout(site, root, dir, filename, layout, body, page) {
    //no layout defined, just output the file to disk
    if(layout === undefined) {
        //create the page props for this recursion
        var props = {
            page: page,
            content: body,
            site: site
        };
        liquidEngine.parseAndRender(body, props, true).then(function(output) {
            saveFile(dir, filename, output);
        });
    } else {
        var fullLayoutPath = path.join(root, "_layouts", layout + ".html");
        fs.readFile(fullLayoutPath, 'utf8', function(err, data) {
            //we need layout frontmatter
            var template = fm(data);
            //create the page props for this recursion
            var props = {
                page: page,
                content: body,
                site: site
            };
            liquidEngine.parseAndRender(template.body, props, true).then(function(output) {
                applyLayout(site, root, dir, filename, template.attributes.layout, output, page);
            });
        });
    }
}

function saveFile(dir, filename, body) {
    var fullDirPath = path.join(outputRoot, dir);
    mkdirp(fullDirPath, function(err) {
        if(err) console.error(err)
        var fullFilePath = path.join(fullDirPath, filename);
        fs.writeFileSync(fullFilePath, body);
        console.log("wrote file " + fullFilePath);
    });
}
start(siteRoot);
console.log("done..");