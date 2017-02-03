// Has to be loaded after rslidy.js

// ---
// Description: HTML Code snipplets are rendered since we are in HTML - replace all tags with &lt; and &gt;
// ---
function correctCodeSnipplets(){
	var preItems = document.getElementsByTagName('pre');
	for (var p=0; p<preItems.length; p++) {
		var codeItems = preItems[p].getElementsByTagName('code');
		for (var c=0; c<codeItems.length; c++) {
		    var item = codeItems[c];
		    if (item.classList.contains("html") || item.classList.contains("xhtml") || item.classList.contains("xml")) {
		    	var code = item.innerHTML;
		    	code = code.split("<").join("&lt;");
		    	code = code.split(">").join("&gt;");
		    	item.innerHTML = code;
		    }
		}
	}

}

function highlightStart() {
	var start = performance.now();
	// Append the loading animation placeholder at almost JS start
	preload();
	var rslidy = new Rslidy();
	// timeout allows the repaint to catch a break between preload and init
	setTimeout(function(){
		correctCodeSnipplets();
		rslidy.init();
		// load the set markup languages of highlight.js
		hljs.configure({	tabReplace: '   '});// 2 spaces instead of tabs
		hljs.initHighlighting();
	}, 1);
}
window.onload = highlightStart;