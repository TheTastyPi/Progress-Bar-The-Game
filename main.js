var lastFrame = 0;
var lastSave = 0;
var game = newGame();

const upgrade = {
	normal: {
		basePrice: [1, 1, 2, 3, 1, 2, 3, 10],
		priceGrowth: [6, 6, 11, 17.3, 6, 1, 1, 1],
		limit: [Infinity,Infinity,Infinity,10,8,1,1,1],
		type: [0,0,0,0,1,1,1,1]
	},
	skill: {
		basePrice: [1, 1, 2, 3, 1, 2, 3, 4],
		priceGrowth: [6, 6, 11, 17.3, 6, 6, 6, 7],
		limit: [Infinity,Infinity,Infinity,10,8,1,1,1],
		type: [1,1,1,1,1,1,1,1]
	},
	auto: {
		basePrice: [1, 1, 2, 3, 1, 2, 3, 4],
		priceGrowth: [6, 6, 11, 17.3, 6, 6, 6, 7],
		limit: [Infinity,Infinity,Infinity,10,8,1,1,1],
		type: [1,1,1,1,1,1,1,1]
	}
};

const skill = {
	baseCost: [2],
	sinDuration: 0,
};

{
	for (let i = 0; i < 2; i++) {
		let upgCleared = document.createElement("span");
		upgCleared.appendChild(document.createTextNode("Nothing here..."));
		document.getElementById("upgSect"+i).appendChild(upgCleared);
		upgCleared.classList.add("upgCleared");
		upgCleared.classList.add("hidden");
		upgCleared.id = "upgCleared"+i;
	}
}

document.getElementById("upgMenu").style.width = document.getElementsByClassName("screen").length+"00%"

function nextFrame(timeStamp) {
	let sinceLastFrame = (timeStamp - lastFrame) * game.speed;
	let sinceLastSave = (timeStamp - lastSave) * game.speed;
	if (sinceLastFrame >= game.updateSpeed) {
		lastFrame = timeStamp;
		game.lifetimeProgress[0] += Math.pow(sinceLastFrame * getBarSpeed(0), 1 / (game.progress[0] < getBarLength(0) ? 1 : 3 - 0.2 * game.upgrade.normal[3]));
		game.progress[0] += Math.pow(sinceLastFrame * getBarSpeed(0), 1 / (game.progress[0] < getBarLength(0) ? 1 : 3 - 0.2 * game.upgrade.normal[3]));
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
		if (pastGame.points == undefined) pastGame.points = [pastGame.timewallPoint];
		if (typeof(pastGame.lifetimePoints) == "number") pastGame.lifetimePoints = [pastGame.lifetimePoints];
		if (typeof(pastGame.progress) == "number") pastGame.progress = [pastGame.progress];
		if (typeof(pastGame.lifetimeProgress) == "number") pastGame.lifetimeProgress = [pastGame.lifetimeProgress];
		if (pastGame.upgrade == undefined) pastGame.upgrade = {normal:pastGame.upgradeAmount};
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
		for (let menu of document.getElementsByClassName("topMenu")) {
			document.getElementById(name+"Menu").style.height = "0px";
			document.getElementById(name+"MenuOpen").style.top = "0px";
		}
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
	document.getElementById("maxAllButton").style.transform = "translate("+game.currentScreen*100+"vw,0)";
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
		lifetimeProgress: [0,0],
		progress: [0,0],
		lifetimePoints: [0,0],
		points: [0,0],
		upgrade: {
			normal: [0,0,0,0,0,0,0,0],
			skill: [0,0,0,0,0,0,0,0],
			auto: [0,0,0,0,0,0,0,0],
		},
		skillPoints: 0
	};
}

function redeemPoints(n) {
	if (game.progress[n] >= getBarLength(n)) {
		game.points[n] += getPointGain(n);
		game.lifetimePoints[n] += getPointGain(n);
		if (n == 1 && !game.upgrade.normal[7]) {
			game.progress[0] = 0;
			game.points[0] = 0;
			for (let i = 0; i < 4; i++) {
				game.upgrade.normal[i] = 0;
			}
		} else {
			game.progress[n] = game.progress[n] % getBarLength(n);
		}
		updatePoints();
		updateUpg();
	}
}

function getUpgPrice(n, type = "normal") {
	return Math.floor(game.upgrade[type][n] < upgrade[type].limit[n] ? upgrade[type].basePrice[n] * Math.pow(upgrade[type].priceGrowth[n], game.upgrade[type][n]) : Infinity);
}

function buyUpgrade(n, type = "normal") {
	if (game.points[upgrade[type].type[n]] >= getUpgPrice(n) && game.upgrade[type][n] < upgrade[type].limit[n] && getUpgPrice(n) != Infinity) {
		game.points[upgrade[type].type[n]] -= getUpgPrice(n);
		game.upgrade[type][n]++;
		updateUpg();
		updatePoints();
	}
}

function getBarLength(n) {
	switch (n) {
		case 0:
			return 6e4 / Math.pow(2, game.upgrade.normal[0]);
			break;
		case 1:
			return Math.log10(1.79e308);
	}
}

function getBarSpeed(n) {
	switch (n) {
		case 0:
			return Math.pow(2, game.upgrade.normal[1]) * (Math.sin(skill.sinDuration)*9+1);
			break;
		case 1:
			return (Math.pow(2, game.upgrade.normal[1])==Infinity?1.79e308:Math.pow(2, game.upgrade.normal[1])) / (game.progress[1] * Math.log(10));
	}
}

function getPointGain(n) {
	switch (n) {
		case 0:
			return Math.floor(game.progress[0] / getBarLength(0) * Math.pow(2, game.upgrade.normal[2]);
			break;
		case 1:
			return Math.floor(game.progress[1] / getBarLength(1));
	}
}

function updateAll() {
	document.getElementById("autoSaveToggleButton").innerHTML = game.doAutoSave ? "Auto Save<br>ON" : "Auto Save<br>OFF";
	document.querySelectorAll("*").forEach(function(node) {node.classList.add(game.currentTheme);});
	document.getElementById("switchScreenRight").classList[game.currentScreen == game.screenLimit[1] ? "add" : "remove"]("disabled");
	document.getElementById("switchScreenLeft").classList[game.currentScreen == 0 ? "add" : "remove"]("disabled");
	updateProgress();
	updatePoints();
	updateUpg();
	updateSkills()
}

function updateProgress() {
	for (let i = 0; i < 2; i++) {
		if (isNaN(game.progress[i])) game.progress[i] = Infinity;
		document.getElementById("progressBar"+i).value = game.progress[i] != Infinity ? game.progress[i] : 1.79e308;
		document.getElementById("progressBarLabel"+i).innerHTML = format((game.progress[i] / getBarLength(i) * 100), 4) + "%";
		document.getElementById("redeemButton"+i).classList[game.lifetimeProgress[i] >= getBarLength(i) ? "remove" : "add"]("hidden");
		document.getElementById("redeemButton"+i).classList[game.progress[i] >= getBarLength(i) ? "remove" : "add"]("disabled");
		document.getElementById("redeemButton"+i).innerHTML = "Redeem<br>"+format(getPointGain(i))+"<br>point"+pluralCheck(getPointGain(i));
	}
	document.getElementById("switchScreenLeft").classList[game.lifetimeProgress[1] >= getBarLength(1)/100 ? "remove" : "add"]("hidden");
	document.getElementById("switchScreenRight").classList[game.lifetimeProgress[1] >= getBarLength(1)/100 ? "remove" : "add"]("hidden");
	if (game.upgrade.normal[7] == 0) {
		game.progress[1] = Math.log10(game.progress[0] == Infinity ? 1.79e308 : game.progress[0]);
		if (game.progress[1] > game.lifetimeProgress[1]) game.lifetimeProgress[1] = game.progress;
	}
}

function updatePoints() {
	for (let i = 0; i < 2; i++) {
		if (isNaN(game.points[i])) game.points[i] = 0;
		document.getElementById("timewallPoint"+i).innerHTML = "You have "+format(game.points[i])+" "+(i==0?"time":"log")+"wall point"+pluralCheck(game.points[i])+".";
		document.getElementById("timewallPoint"+i).classList[game.lifetimePoints[i] >= 1 ? "remove" : "add"]("hidden");
	}
	document.getElementById("upgMenuOpen").classList[game.lifetimePoints[0] >= 1 ? "remove" : "add"]("hidden");
	document.getElementById("skillUpgMenuOpen").classList[game.upgrade.normal[5] ? "remove" : "add"]("hidden");
	document.getElementById("autoUpgMenuOpen").classList[game.upgrade.normal[6] ? "remove" : "add"]("hidden");
}

function updateUpg() {
	for (let type of Object.keys(upgrade)) {
		for (let i = 0; i < 8; i++) {
			let newDesc = (getUpgPrice(i, type) != Infinity ? "Cost: "+format(getUpgPrice(i, type))+" "+(Math.floor(i/4)==0?"Time":"Log")+"wall Point"+pluralCheck(getUpgPrice(i, type)) : "Maxed Out")+"<br>Currently: ";
			switch(type) {
				case "normal":
					switch(i) {
						case 0:
							newDesc += "/" + format(Math.pow(2, game.upgrade.normal[i]));
							break;
						case 1:
						case 2:
							newDesc += format(Math.pow(2, game.upgrade.normal[i])) + "x";
							break;
						case 3:
							newDesc += format(3 - 0.2 * game.upgrade.normal[i], 1) + "&#8730;";
							break;
						case 4:
							newDesc += format(game.upgrade.normal[i]) + " Skill" + pluralCheck(game.upgrade.normal[i]);
							break;
						case 5:
						case 6:
						case 7:
							newDesc += (game.upgrade.normal[i]?"Unlocked":"Locked");
					}
					break;
				case "skill":
					break;
				case "auto":
			}
			document.getElementById((type=="normal"?"u":type+"U")+"pgDesc"+i).innerHTML = newDesc;
			if (getUpgPrice(i) == Infinity) {
				setTimeout(function(){
					document.getElementById("upg"+i).classList.add("maxedUpg");
					setTimeout(function(){document.getElementById("upg"+i).classList.add("hidden");},500);
				},1000);
			} else {
				document.getElementById("upg"+i).classList.remove("maxedUpg");
				document.getElementById("upg"+i).classList.remove("hidden");
			}
			document.getElementById("upgButton"+i).classList[game.points[0] >= getUpgPrice(i, type) ? "remove" : "add"]("disabledUpg");
		}
	}
	for (let i = 0; i < 2; i++) {
		document.getElementById("progressBar"+i).max = getBarLength(i) != Infinity ? getBarLength(i) : 1.79e308;
		if (getUpgPrice(i*4) == Infinity &&
		   getUpgPrice(i*4+1) == Infinity &&
		   getUpgPrice(i*4+2) == Infinity &&
		   getUpgPrice(i*4+3) == Infinity) {
			document.getElementById("upgCleared"+i).classList.remove("hidden");
			document.getElementById("upgCleared"+i).style.flex = "1";
		} else {
			document.getElementById("upgCleared"+i).classList.add("hidden");
			document.getElementById("upgCleared"+i).style.flex = "0";
		}
	}
	document.getElementById("skillMenuOpen").classList[game.upgrade.normal[5] ? "remove" : "add"]("hidden");
	document.getElementById("autoMenuOpen").classList[game.upgrade.normal[6] ? "remove" : "add"]("hidden");
}

function updateSkills() {
	skill.sinDuration = (skill.sinDuration > 0 ? skill.sinDuration-1 : 0);
}

function maxAll(type = "normal") {
	for (let i = game.currentScreen*4; i < (game.currentScreen+1)*4; i++) {
		let totalAmount = Math.min(Math.floor(Math.log(game.points[0]*(upgrade[type].priceGrowth[i]-1)/getUpgPrice(i)+1)/Math.log(upgrade[type].priceGrowth[i])),upgrade[type].limit[i]);
		let totalPrice = getUpgPrice(i)*(1-Math.pow(upgrade[type].priceGrowth[i],totalAmount))/(1-upgrade[type].priceGrowth[i]);
		if (totalAmount >= 1) {
			game.points[0] -= totalPrice;
			game.upgrade[type][i] += totalAmount;
			updateUpg();
			updatePoints();
		}
	}
}

function useSkill(n) {
	if (game.skillPoints >= getSkillCost(n)) {
		game.skillPoints -= getSkillCost(n);
		switch(n) {
			case 0:
				
		}
	}
}

function getSkillCost(n) {
	return skill.baseCost;
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
