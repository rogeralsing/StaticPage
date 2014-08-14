﻿
var S = require('string');
var marked = require('./marked');
var highlight = require('highlight.js')
marked.setOptions({
    renderer: new marked.Renderer(),
    gfm: true,
    tables: true,
    breaks: false,
    pedantic: false,
    sanitize: false,
    smartLists: true,
    smartypants: false,
    highlight: function(code, lang) {
        try {
            var highlighted = highlight.highlight(code, lang).value;
            return highlighted;
        } catch(err) {
            try{
                var highlighted2 = highlight.highlightAuto(code).value;
                return highlighted2;
            }
            catch(err){
                return "Error Parsing " + err + code;
            }
        }
    },
    langPrefix: 'hljs lang-',
    tableCss: "table table-bordered",
    imgCss: "img-responsive",
    blockQuoteCallback: function(blockquote) {
        var warning = S(blockquote).toLowerCase().startsWith("<blockquote>\n<p><strong>warning");
        var note = S(blockquote).toLowerCase().startsWith("<blockquote>\n<p><strong>note");
        blockquote = blockquote.replace('&lt;br/&gt;', '<br/>').replace('</blockquote>', '</div>');
        if(warning) {
            blockquote = blockquote.replace('<blockquote>', '<div class="alert alert-warning">');
        }
        if(note) {
            blockquote = blockquote.replace('<blockquote>', '<div class="alert alert-success">');
        }
        return blockquote;
    },
    codespanCallback: function(codespan) {
        return codespan;
    }
});

function render(body, callback) {
    marked(body, callback);
}
module.exports = render;
