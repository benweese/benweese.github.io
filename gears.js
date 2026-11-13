(function () {
	"use strict";
	var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
	Array.prototype.forEach.call(document.querySelectorAll("[data-bwg]"), function (root) {
		var btn = root.querySelector(".bwg-pause");
		var label = root.querySelector(".bwg-label");
		var icon = root.querySelector(".bwg-icon");
		var paused = false;
		function setPaused(p) {
			paused = p;
			root.classList.toggle("is-paused", p);
			root.classList.toggle("is-playing", !p);
			label.textContent = p ? "Play animation" : "Pause animation";
			icon.textContent = p ? String.fromCharCode(9654) : String.fromCharCode(10074, 10074);
		}
		btn.addEventListener("click", function () { setPaused(!paused); });
		if (reduce) setPaused(true); // gears hold still until the visitor presses Play
		// Waits count only unpaused time, so pausing also freezes the moth and its caption.
		function wait(ms, fn) {
			var left = ms;
			(function step() {
				if (!paused) left -= 100;
				if (left <= 0) fn(); else setTimeout(step, 100);
			})();
		}
		var every = Number(root.getAttribute("data-bwg-every")) || 60;
		var first = location.hash === "#moth" ? 2 : Number(root.getAttribute("data-bwg-first")) || 35;
		function schedule(isFirst) {
			var s = isFirst ? first * (0.85 + Math.random() * 0.3) : every * (0.75 + Math.random() * 0.5);
			wait(s * 1000, bug);
		}
		function bug() {
			if (reduce || document.hidden) return schedule(false);
			root.classList.add("is-bug", "is-jam");
			wait(1100, function () { root.classList.remove("is-jam"); });
			wait(600, function () { root.classList.add("show-note"); });
			wait(4800, function () { root.classList.remove("show-note"); });
			wait(5200, function () { root.classList.remove("is-bug"); schedule(false); });
		}
		schedule(true);
	});
})();
