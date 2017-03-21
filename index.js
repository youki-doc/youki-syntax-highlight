var hljs = require('highlight.js');
var path = require('path');

var detab = (function () {
	var r = /([^\t\r\n]{4})|([^\t\r\n]{3})\t|([^\t\r\n]{2})\t|([^\t\r\n])\t|\t/g;
	var m = ['    ', '   ', '  ', ' ', ''];
	var f = function (_, $1, $2, $3, $4) {
		return ($1 || $2 || $3 || $4 || '') + m[($1 || $2 || $3 || $4 || '').length]
	};
	return function (s) {
		return s.replace(r, f)
	}
}());
var regularizeSourceHTML = function (piece, linenoQ) {
	piece = (piece + "\n").replace(/\u001b/g, '\u001bE');
	var oPiece, k = 0;
	do {
		oPiece = piece;
		piece = oPiece.replace(/(<(\w+)[^<>]*>)([^<>]*)(<\/\2>)/g, function (p, left, tag, body, right) {
			body = left + body.replace(/\n[ \t]*/g, function (m) { return right + m + left }) + right;
			return body.replace(/</g, '\u001bL').replace(/>/g, '\u001bR');
		});
		k++;
	} while (k < 100 && oPiece != piece);
	var lineno = linenoQ - 1;
	piece = piece
		.replace(/^([ \t]*)([^ \t\r\n].*)\n/gm, function (m, $1, $2) {
			return (linenoQ ? '<u>' + (++lineno) + '</u>' : '') + '<b indent="' + (detab($1).length) + '">' + '<i>' + $1 + '</i>' + $2 + '<i>\n</i></b>'
		})
		.replace(/\u001bL/g, '<')
		.replace(/\u001bR/g, '>')
		.replace(/\u001bE/g, '\x1B')
		.replace(/\u001b/g, '');
	return piece;
}
var sourceAfter = function (language, linenoQ, piece) {
	if (arguments.length < 3) {
		piece = linenoQ;
		linenoQ = false;
	};
	return this['tag']('pre',
		'class="mghl highlight source ' + language + (linenoQ ? ' lineno' : '') + '"',
		regularizeSourceHTML.call(this, piece, linenoQ));
}
exports.apply = function (scope, runtime) {
	var removeLeftCommonIndent = require(path.join(scope.directories.loader, "html/tags.js")).removeLeftCommonIndent;
	scope.highlight = function (language, linenoQ, text) {
		if (arguments.length < 3) {
			text = linenoQ;
			linenoQ = false;
		};
		text = removeLeftCommonIndent(text.replace(/\r\n/g, '\n'));
		hljs.configure({
			classPrefix: ''
		});
		return sourceAfter.call(this, language, linenoQ, hljs.highlight(language, text.trimRight()).value);
	}
}