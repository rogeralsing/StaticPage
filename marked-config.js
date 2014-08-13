﻿var S = require('string');
var marked = require('./marked');

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
    blockQuoteCallback: function (blockquote) {
        
        var warning = S(blockquote).toLowerCase().startsWith(
      "<blockquote>\n<p><strong>warning");
        var note = S(blockquote).toLowerCase().startsWith(
      "<blockquote>\n<p><strong>note");
        
        blockquote = blockquote
      .replace('&lt;br/&gt;', '<br/>')
      .replace('</blockquote>', '</div>');
        if (warning) {
            blockquote = blockquote.replace('<blockquote>',
        '<div class="alert alert-warning">');
        }
        if (note) {
            blockquote = blockquote.replace('<blockquote>',
        '<div class="alert alert-success">');
        }
        
        return blockquote;
    },
    codespanCallback: function (codespan) {
        return codespan;
    }
});

function render(body, callback) {
    marked(body, callback);
}

module.exports = render;