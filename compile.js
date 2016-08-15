const documentName = "Fancy Documentation";
const princePath = String.raw`X:\Program Files (x86)\Prince\engine\bin\prince.exe`;

const fs = require("fs");
const hljs = require("highlight.js");
const md = require("markdown-it")({
	html: true,
	linkify: true,
	typographer: true,
	highlight: function (str, lang) {
		if (lang && hljs.getLanguage(lang)) {
			try {
				return `<pre class="hljs"><code>${hljs.highlight(lang, str, true).value}</code></pre>`;
			} catch (e) {}
		}
		return `<pre class="hljs"><code>${md.utils.escapeHtml(str)}</code></pre>`;
	}
}).use(require("markdown-it-container"), "content");
const child = require("child_process");
const path = require("path");

// This function, named "compile", is for compiling
function compile() {
	console.log("Compiling...");

	// Concatenate files and render
	let layout = fs.readFileSync("layout.html", "utf8");

	let docs = [];
	fs.readdirSync(`${__dirname}/doc`)
	.filter(file => {
		return path.extname(file) === ".md";
	})
	.sort()
	.forEach(file => {
		docs.push(fs.readFileSync(`${__dirname}/doc/${file}`, "utf8"));
	});
	let doc = docs.join("\n\n");

	let html = md.render(doc).trim();

	// Load rendered markdown into layout
	let final = layout.replace(/\$content\$/i, html);

	// Save to HTML
	fs.writeFileSync(`${documentName}.html`, final);

	// Save to PDF
	child.execFile(princePath, [
			`${documentName}.html`,
			"--page-margin=0",
			`--output=${documentName}.pdf`
		], (err, stdout, stderr) => {
			if (err) console.log(err);
			if (stdout) console.log("out:", stdout);
			if (stderr) console.log("err:", stderr);
			console.log("Completed PDF.");
		});
}

// Watch for changes?
if (process.argv[2]) {
	console.log("Watching...");
	let blockedExtensions = [".pdf", ".html"];
	let watchTimeout;

	// If a change is found, recompile automatically
	function change(event, filename) {
		if (!filename) return;
		if (/^_/.test(filename)) return;

		let ext = filename.match(/\..+/);
		if (!ext) return;
		if (blockedExtensions.indexOf(ext[0]) > -1) return;

		clearTimeout(watchTimeout);
		watchTimeout = setTimeout(compile, 50);
	}

	// Watch for approved changes
	fs.watch(`${__dirname}`, change);
	fs.watch(`${__dirname}/doc`, change);

	compile();
} else {
	compile();
}