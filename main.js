var lastFrame = 0;
var lastSave = 0;
var game = newGame();

const upgrade = {
	basePrice: [1, 1, 2, 3],
	priceGrowth: [6, 6, 11, 17.3],
	limit: [Infinity,Infinity,Infinity,10]
};

document.getElementById("upgMenu").style.width = document.getElementsByClassName("screen").length+"00%"

function nextFrame(timeStamp) {
	let sinceLastFrame = timeStamp - lastFrame;
	let sinceLastSave = timeStamp - lastSave;
	if (sinceLastFrame >= game.updateSpeed) {
		lastFrame = timeStamp;
		game.lifetimeProgress += Math.pow(sinceLastFrame * getBarSpeed(), 1 / (game.progress < getBarLength() ? 1 : 3 - 0.2 * game.upgradeAmount[3]));
		game.progress += Math.pow(sinceLastFrame * getBarSpeed(), 1 / (game.progress < getBarLength() ? 1 : 3 - 0.2 * game.upgradeAmount[3]));
		updateProgress();
	}
	if (sinceLastSave >= game.autoSaveInterval) {
		if (game.doAutoSave) save();
		lastSave = timeStamp;
	}
	window.requestAnimationFrame(nextFrame);
}

function save(auto = true) {
	localStorage.setItem('twsave', JSON.stringify(deinfinify(game)));
	if (!auto) {
		document.getElementById("saveButton").style.backgroundColor = "green";
		setTimeout(function(){document.getElementById("saveButton").style.backgroundColor = "";}, 250);
	}
}

function load(auto = true) {
	if (localStorage.getItem('twsave')) {
		let pastGame = infinify(JSON.parse(localStorage.getItem('twsave')));
		merge(game, pastGame);
		updateAll();
		if (!auto) {
			document.getElementById("loadButton").style.backgroundColor = "green";
			setTimeout(function(){document.getElementById("loadButton").style.backgroundColor = "";}, 250);
		}
	}
}

function exportSave() {
	document.getElementById("exportArea").classList.remove('hidden');
	document.getElementById("exportArea").innerHTML = btoa(JSON.stringify(deinfinify(game)));
	document.getElementById("exportArea").select();
	document.execCommand("copy");
	document.getElementById("exportArea").classList.add('hidden');
	document.getElementById("exportButton").style.backgroundColor = "green";
	setTimeout(function(){document.getElementById("exportButton").style.backgroundColor = "";}, 250);
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
		setTimeout(function(){document.getElementById("importButton").style.backgroundColor = "";}, 250);
	}
}

function wipe() {
	if (confirm("Are you sure you want to wipe your save?")) {
		game = newGame(); 
		save();
		updateAll();
		document.getElementById("saveMenu").style.width = "0px";
		document.getElementById("saveMenuOpen").style.right = "0px";
		document.getElementById("upgMenu").style.height = "0px";
		document.getElementById("upgMenuOpen").style.top = "0px";
		document.getElementById("wipeButton").style.backgroundColor = "red";
		setTimeout(function(){document.getElementById("wipeButton").style.backgroundColor = "";}, 250);
	}
}

function merge(base, source) {
	for (i in base) {
		if (source[i] != undefined) {
			if (typeof(base[i]) == "object" && typeof(source[i]) == "object") {
				merge(base[i], source[i]);
			} else {
				base[i] = source[i];
			}
		}
	}
}

function deinfinify(object) {
	let o = {...object};
	for (let i in o) {
		if (o[i] === Infinity) o[i] = "Infinity";
		if (typeof(o[i]) == "object") o[i] = deinfinify(o[i]);
	}
	return o;
}

function infinify(object) {
	let o = {...object};
	for (let i in o) {
		if (o[i] === "Infinity") o[i] = Infinity;
		if (typeof(o[i]) == "object") o[i] = infinify(o[i]);
	}
	return o;
}

function toggleAutoSave() {
	game.doAutoSave = !game.doAutoSave;
	document.getElementById("autoSaveToggleButton").innerHTML = game.doAutoSave ? "Auto Save<br>ON" : "Auto Save<br>OFF";
	document.getElementById("autoSaveToggleButton").style.backgroundColor = game.doAutoSave ? "green" : "red";
	setTimeout(function(){document.getElementById("autoSaveToggleButton").style.backgroundColor = "";}, 250);
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
	setTimeout(function(){document.getElementById("autoSaveIntervalButton").style.backgroundColor = "";}, 250);
}

function toggleSideMenu(name) {
	if (document.getElementById(name+"Menu").style.width == "0px" ||
	    document.getElementById(name+"Menu").style.width == "" ) {
		document.getElementById(name+"Menu").style.width = document.getElementById(name+"Menu").style.maxWidth;
		document.getElementById(name+"MenuOpen").style.right = document.getElementById(name+"Menu").style.maxWidth;
	} else {
		document.getElementById(name+"Menu").style.width = "0px";
		document.getElementById(name+"MenuOpen").style.right = "0px";
	}
}

function toggleTopMenu(name) {
	if (document.getElementById(name+"Menu").style.height == "0px" ||
	    document.getElementById(name+"Menu").style.height == "" ) {
		document.getElementById(name+"Menu").style.height = document.getElementById(name+"Menu").style.maxHeight;
		document.getElementById(name+"MenuOpen").style.top = document.getElementById(name+"Menu").style.maxHeight;
	} else {
		document.getElementById(name+"Menu").style.height = "0px";
		document.getElementById(name+"MenuOpen").style.top = "0px";
	}
}

function toTheme(newTheme) {
	document.querySelectorAll("*").forEach(function(node) {
		node.classList.remove(game.currentTheme);
		node.classList.add(newTheme);
	});
	game.currentTheme = newTheme;
}

function switchScreen(dir) {
	if (dir == "forward" && game.currentScreen != game.screenLimit) game.currentScreen++;
	if (dir == "backward" && game.currentScreen != 0) game.currentScreen--;
	for (let i = 0; i < document.getElementsByClassName("screen").length; i++) {
		document.getElementById("screen"+i).style.transform = "translate(-"+game.currentScreen*100+"vw,0)";
	}
	document.getElementById("upgMenu").style.transform = "translate(-"+game.currentScreen*100+"vw,0)";
	document.getElementById("switchScreenRight").classList[game.currentScreen == game.screenLimit ? "add" : "remove"]("disabled");
	document.getElementById("switchScreenLeft").classList[game.currentScreen == 0 ? "add" : "remove"]("disabled");
}

function pluralCheck(n) {
	return n == 1 ? "" : "s";
}

function newGame() {
	return {
		speed: 1,
		updateSpeed: 50,
		doAutoSave: true,
		autoSaveInterval: 1000,
		currentTheme: "light",
		currentScreen: 0,
		screenLimit: 1,
		lifetimeProgress: 0,
		progress: 0,
		lifetimePoints: 0,
		timewallPoint: 0,
		upgradeAmount: [0,0,0,0],
	};
}

function redeemPoints() {
	if (game.progress >= getBarLength()) {
		game.timewallPoint += getPointGain();
		game.lifetimePoints += getPointGain();
		game.progress = game.progress % getBarLength();
		updatePoints();
		updateUpg();
	}
}

function getUpgPrice(n) {
	return Math.floor(game.upgradeAmount[n] < upgrade.limit[n] ? upgrade.basePrice[n] * Math.pow(upgrade.priceGrowth[n], game.upgradeAmount[n]) : Infinity);
}

function buyUpgrade(n) {
	if (game.timewallPoint >= getUpgPrice(n) && game.upgradeAmount[n] < upgrade.limit[n] && getUpgPrice(n) != Infinity) {
		game.timewallPoint -= getUpgPrice(n);
		game.upgradeAmount[n]++;
		updateUpg();
		updatePoints();
	}
}

function getBarLength() {
	return 6e4 / Math.pow(2, game.upgradeAmount[0]);
}

function getBarSpeed() {
	return Math.pow(2, game.upgradeAmount[1]) * game.speed;
}

function getPointGain() {
	return Math.floor(game.progress / getBarLength() * Math.pow(2, game.upgradeAmount[2]));
}

function updateAll() {
	document.getElementById("autoSaveToggleButton").innerHTML = game.doAutoSave ? "Auto Save<br>ON" : "Auto Save<br>OFF";
	document.querySelectorAll("*").forEach(function(node) {node.classList.add(game.currentTheme);});
	document.getElementById("switchScreenRight").classList[game.currentScreen == game.screenLimit[1] ? "add" : "remove"]("disabled");
	document.getElementById("switchScreenLeft").classList[game.currentScreen == 0 ? "add" : "remove"]("disabled");
	updateProgress();
	updatePoints();
	updateUpg();
}

function updateProgress() {
	if (isNaN(game.progress)) game.progress = Infinity;
	document.getElementById("progressBar").value = game.progress != Infinity ? game.progress : 1.79e308;
	document.getElementById("progressBarLabel").innerHTML = format((game.progress / getBarLength() * 100), 4) + "%";
	document.getElementById("redeemButton").classList[game.lifetimeProgress >= getBarLength() ? "remove" : "add"]("hidden");
	document.getElementById("redeemButton").classList[game.progress >= getBarLength() ? "remove" : "add"]("disabled");
	document.getElementById("redeemButton").innerHTML = "Redeem<br>"+format(getPointGain())+"<br>point"+pluralCheck(getPointGain());
}

function updatePoints() {
	if (isNaN(game.timewallPoint)) game.timewallPoint = 0;
	document.getElementById("timewallPoint").innerHTML = "You have "+format(game.timewallPoint)+" timewall point"+pluralCheck(game.timewallPoint)+".";
	document.getElementById("timewallPoint").classList[game.lifetimePoints >= 1 ? "remove" : "add"]("hidden");
	document.getElementById("upgMenuOpen").classList[game.lifetimePoints >= 1 ? "remove" : "add"]("hidden");
}

function updateUpg() {
	for (let i = 0; i < 4; i++) {
		let newDesc = (getUpgPrice(i) != Infinity ? "Cost: "+format(getUpgPrice(i))+" Timewall Point"+pluralCheck(getUpgPrice(i)) : "Maxed Out")+"<br>Currently: ";
		if (getUpgPrice(i) == Infinity) {
			setTimeout(function(){
				document.getElementById("upg"+i).classList.add("maxedUpg");
				setTimeout(function(){document.getElementById("upg"+i).classList.add("hidden");},500);
			},1000);
		} else {
			document.getElementById("upg"+i).classList.remove("maxedUpg");
			document.getElementById("upg"+i).classList.remove("hidden");
		}
		switch(i) {
			case 0:
				newDesc += "/" + format(Math.pow(2, game.upgradeAmount[0]));
				break;
			case 1:
			case 2:
				newDesc += format(Math.pow(2, game.upgradeAmount[i])) + "x";
				break;
			case 3:
				newDesc += format(3 - 0.2 * game.upgradeAmount[3], 1) + "&#8730;";
		}
		document.getElementById("upgDesc"+i).innerHTML = newDesc;
		document.getElementById("upgButton"+i).classList[game.timewallPoint >= getUpgPrice(i) ? "remove" : "add"]("disabledUpg");
	}
	document.getElementById("progressBar").max = getBarLength() != Infinity ? getBarLength() : 1.79e308;
}

function maxAll(p) {
	for (let i = 0; i < 4; i++) {
		let totalAmount = Math.min(Math.floor(Math.log(game.timewallPoint*(upgrade.priceGrowth[i]-1)/getUpgPrice(i)+1)/Math.log(upgrade.priceGrowth[i])),upgrade.limit[i]);
		let totalPrice = getUpgPrice(i)*(1-Math.pow(upgrade.priceGrowth[i],totalAmount))/(1-upgrade.priceGrowth[i]);
		if (totalAmount >= 1) {
			game.timewallPoint -= totalPrice;
			game.upgradeAmount[i] += totalAmount;
			updateUpg();
			updatePoints();
		}
	}
}

function isEven(n) {
	return Math.floor(n/2) == n/2;
}

function format(n, toFixed = 0) {
	if (n == "Infinity") return Infinity;
	else if (n < 1e3) return n.toFixed(toFixed);
	return n.toPrecision(5).replace("+","");
}

load();

window.requestAnimationFrame(nextFrame);

// hi
