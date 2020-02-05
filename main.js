var lastFrame = 0;
var lastSave = 0;
var game = newGame();

function nextFrame(timeStamp) {
	let sinceLastFrame = timeStamp - lastFrame;
	let sinceLastSave = timeStamp - lastSave;
	if (sinceLastFrame >= game.updateSpeed) {
		lastFrame = timeStamp;
		if (game.progress < document.getElementById("progressBar").max) {
			game.progress += sinceLastFrame;
			game.lifetimeProgress += sinceLastFrame;
		} else {
			game.progress += Math.ceil(sinceLastFrame/10);
			game.lifetimeProgress += Math.ceil(sinceLastFrame/10);
		}
		document.getElementById("progressBar").value = game.progress;
		document.getElementById("progressBarLabel").innerHTML = (game.progress / game.progressPerPoint * 100).toFixed(4) + "%";
		document.getElementById("progressBar").max = game.progressPerPoint;
		document.getElementById("redeemButton").classList[game.lifetimeProgress >= game.progressPerPoint ? "remove" : "add"]("hidden");
		document.getElementById("redeemButton").classList[game.progress >= game.progressPerPoint ? "remove" : "add"]("disabled");
		document.getElementById("timewallPoint").classList[game.lifetimePoints >= 1 ? "remove" : "add"]("hidden");
		document.getElementById("timewallPoint").innerHTML = "You have "+game.timewallPoint+" timewall point"+pluralCheck(game.timewallPoint)+".";
	}
	if (sinceLastSave >= game.autoSaveInterval) {
		if (game.doAutoSave) {
			save();
		}
		lastSave = timeStamp;
	}
	window.requestAnimationFrame(nextFrame);
}

function save(auto = true) {
	localStorage.setItem('twsave', JSON.stringify(game));
	if (!auto) {
		document.getElementById("saveButton").style.backgroundColor = "green";
		setTimeout(function(){
			document.getElementById("saveButton").style.backgroundColor = "";
		}, 250);
	}
}

function load(auto = true) {
	if (localStorage.getItem('twsave')) {
		let pastGame = JSON.parse(localStorage.getItem('twsave'));
		merge(game, pastGame);
		if (!auto) {
			document.getElementById("loadButton").style.backgroundColor = "green";
			setTimeout(function(){
				document.getElementById("loadButton").style.backgroundColor = "";
			}, 250);
		}
	}
}

function exportSave() {
	document.getElementById("exportArea").classList.remove('hidden');
	document.getElementById("exportArea").innerHTML = btoa(JSON.stringify(game));
	document.getElementById("exportArea").select();
	document.execCommand("copy");
	document.getElementById("exportArea").classList.add('hidden');
	document.getElementById("exportButton").style.backgroundColor = "green";
	setTimeout(function(){
		document.getElementById("exportButton").style.backgroundColor = "";
	}, 250);
}

function importSave() {
	let save = prompt("Please enter export text.\nWarning: Your current save will be over-written.");
	if (save != null) {
		let err = false;
		try {
			localStorage.setItem('twsave', atob(save));
			load();
		} catch(yeet) {
			err = true;
			document.getElementById("importButton").style.backgroundColor = "red";
		}
		if (!err) document.getElementById("importButton").style.backgroundColor = "green";
		setTimeout(function(){
			document.getElementById("importButton").style.backgroundColor = "";
		}, 250);
	}
}

function wipe() {
	if (confirm("Are you sure you want to wipe your save?")) {
		game = newGame(); 
		save();
		document.getElementById("wipeButton").style.backgroundColor = "red";
		setTimeout(function(){
			document.getElementById("wipeButton").style.backgroundColor = "";
		}, 250);
	}
}

function toggleAutoSave() {
	game.doAutoSave = !game.doAutoSave;
	document.getElementById("autoSaveToggleButton").innerHTML = game.doAutoSave ? "Auto Save<br>ON" : "Auto Save<br>OFF";
	document.getElementById("autoSaveToggleButton").style.backgroundColor = game.doAutoSave ? "green" : "red";
	setTimeout(function(){
		document.getElementById("autoSaveToggleButton").style.backgroundColor = "";
	}, 250);
}

function changeAutoSaveInterval() {
	let newInterval = prompt("Please enter new auto-save speed in seconds.\n(Number from 0.2 to 300, inclusive)");
	if (newInterval != null) {
		newInterval = Number(newInterval);
		if (!isNaN(newInterval) && newInterval >= 0.2 && newInterval <= 300) {
			let newIntervalMs = newInterval * 1000
			game.autoSaveInterval = newIntervalMs;
			document.getElementById("autoSaveIntervalButton").innerHTML = "Auto Save<br>Interval<br>"+newInterval+"s";
			document.getElementById("autoSaveIntervalButton").style.backgroundColor = "green";
		} else {
			document.getElementById("autoSaveIntervalButton").style.backgroundColor = "red";
		}
	}
	setTimeout(function(){
		document.getElementById("autoSaveIntervalButton").style.backgroundColor = "";
	}, 250);
}

function toggleSaveMenu() {
	if (document.getElementById("saveMenu").style.width == "0px" || document.getElementById("saveMenu").style.width == "" ) {
		document.getElementById("saveMenu").style.width = "280px";
		document.getElementById("openSaveMenu").style.right = "280px";
	} else {
		document.getElementById("saveMenu").style.width = "0px";
		document.getElementById("openSaveMenu").style.right = "0px";
	}
}

function merge(base, source) {
	for (let i in base) {
		if (source[i] != undefined) {
			if (typeof(base[i]) == "object" && typeof(source[i]) == "object") {
				merge(base[i], source[i]);
			} else {
				base[i] = source[i];
			}
		}
	}
}

function pluralCheck(n) {
	return n == 1 ? "" : "s";
}

function newGame() {
	return {
		updateSpeed: 50,
		doAutoSave: true,
		autoSaveInterval: 1000,
		lifetimeProgress: 0,
		progress: 0,
		progressPerPoint: 3.6e6,
		lifetimePoints: 0,
		timewallPoint: 0
	};
}

function redeemPoints() {
	if (game.progress >= game.progressPerPoint) {
		let points = Math.floor(game.progress / game.progressPerPoint);
		game.timewallPoint += points;
		game.lifetimePoints += points;
		game.progress -= points * game.progressPerPoint;
	}
}

load();

window.requestAnimationFrame(nextFrame);
