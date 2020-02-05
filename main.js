var lastFrame = 0;
var lastSave = 0;
var game = newGame();

function nextFrame(timeStamp) {
	let sinceLastFrame = timeStamp - lastFrame;
	let sinceLastSave = timeStamp - lastSave;
	if (sinceLastFrame >= game.updateSpeed) {
		lastFrame = timeStamp;
		game.progress += sinceLastFrame;
		if (game.progress >= document.getElementById("progressBar").max) {
			game.progress = 0;
			game.timewallPoint++;
		}
		document.getElementById("progressBar").value = game.progress;
		document.getElementById("progressBarLabel").innerHTML = (game.progress / document.getElementById("progressBar").max * 100).toFixed(4) + "%";
	}
	if (sinceLastSave >= game.autoSaveSpeed) {
		if (game.doAutoSave) {
			save();
		}
		lastSave = timeStamp;
	}
	window.requestAnimationFrame(nextFrame);
}

function save() {
	localStorage.setItem('twsave', JSON.stringify(game));
	document.getElementById("saveButton").style.backgroundColor = "green";
	setTimeout(function(){
		document.getElementById("saveButton").style.backgroundColor = "";
	}, 1000);
}

function load() {
	if (localStorage.getItem('twsave')) {
		let pastGame = JSON.parse(localStorage.getItem('twsave'));
		merge(game, pastGame);
		document.getElementById("loadButton").style.backgroundColor = "green";
		setTimeout(function(){
			document.getElementById("loadButton").style.backgroundColor = "";
		}, 1000);
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
	}, 1000);
}

function importSave() {
	let save = prompt("Please enter export text.\nWarning: Your current save will be over-written.");
	if (save != null) {
		let err = false;
		try {
			localStorage.setItem('twsave', atob(save));
			load();
		}
		catch(yeet) {
			err = true;
			document.getElementById("exportButton").style.backgroundColor = "red";
		}
		if (!err) {
			document.getElementById("exportButton").style.backgroundColor = "green";
		}
		setTimeout(function(){
			document.getElementById("exportButton").style.backgroundColor = "";
		}, 1000);
	}
}

function toggleAutoSave() {
	game.doAutoSave = !game.doAutoSave;
	document.getElementById("autoSaveToggleButton").innerHTML = game.doAutoSave ? "Auto Save<br>ON" : "Auto Save<br>OFF";
}

function changeAutoSaveInterval() {
	let newInterval = prompt("Please enter new auto-save speed in seconds.\n(Number from 0.2 to 300, inclusive)");
	if (newInterval != null) {
		newInterval = Number(newInterval);
		if (!isNaN(newInterval) && newInterval >= 0.2 && newInterval <= 300) {
			let newIntervalMs = newInterval * 1000
			game.autoSaveSpeed = newIntervalMs;
			document.getElementById("autoSaveIntervalButton").innerHTML = "Auto Save<br>Interval<br>"+newInterval+"s";
		}
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

function newGame() {
	return {
		updateSpeed: 50,
		doAutoSave: true,
		autoSaveInterval: 1000,
		progress: 0,
		timewallPoint: 0
	};
}

function toggleSaveMenu() {
	if (document.getElementById("saveMenu").style.width == "0px" || document.getElementById("saveMenu").style.width == "" ) {
		document.getElementById("saveMenu").style.width = "250px";
		document.getElementById("openSaveMenu").style.right = "250px";
	} else {
		document.getElementById("saveMenu").style.width = "0px";
		document.getElementById("openSaveMenu").style.right = "0px";
	}
}

load();

window.requestAnimationFrame(nextFrame);
