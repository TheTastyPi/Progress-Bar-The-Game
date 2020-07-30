var lastFrame = 0;
var game = newGame();

const screenAmount = document.getElementsByClassName("screen").length;

const upgrade = {
	normal: {
		basePrice: [1, 1, 2, 3, 1, 2, 3, 4.2e69],
		priceGrowth: [5, 5, 10, 12, 1, 1, 1, 1],
		limit: [Infinity,Infinity,Infinity,Infinity,4,1,1,1],
		type: [0,0,0,0,1,1,1,1]
	},
	skill: {
		basePrice: [1, 5, 1, 5, 1, 5, 1, 5],
		priceGrowth: [2, 1, 2, 1, 2, 1, 2, 1],
		limit: [Infinity,1,Infinity,1,Infinity,1,Infinity,1],
		type: [1,1,1,1,1,1,1,1]
	},
	auto: {
		basePrice: [1, 1, 1, 1, 1, 1, 1, 1],
		priceGrowth: [2, 2, 2, 2, 2, 2, 2, 2],
		limit: [10,10,11,12,8,16,1024,1],
		type: [1,1,1,1,1,1,1,1]
	}
};

const skill = {
	cooldown: [5*60*1000, 5*60*1000, 10*60*1000, 7.5*60*1000],
	duration: [60*1000, 60*1000, 60*1000, 30*1000]
};

const auto = {
	baseInterval: [5*60*1000, 5*60*1000, 10*60*1000, 20*60*1000, 1*60*1000, 4*60*60*1000]
};

function init() {
	for (let type of Object.keys(upgrade)) {
		for (let i = 0; i < screenAmount; i++) {
			let upgCleared = document.createElement("span");
			upgCleared.appendChild(document.createTextNode("Nothing here..."));
			id((type=="normal"?"u":type+"U")+"pgSect"+i).appendChild(upgCleared);
			upgCleared.classList.add("upgCleared");
			upgCleared.classList.add("hidden");
			upgCleared.id = (type=="normal"?"u":type+"U")+"pgCleared"+i;
		}
	}
	for (let topMenu of document.getElementsByClassName("topMenu")) {
		topMenu.style.width = screenAmount+"00%";
	}
	for (let leftMenu of document.getElementsByClassName("left")) {
		leftMenu.style.left = "-"+leftMenu.style.width;
	}
	
	load();
	
	window.requestAnimationFrame(nextFrame);
}

function simulateTime(sinceLastFrame, alteredFrame) {
	for (let i = 0; i < 1000; i++) {
		doFrame(sinceLastFrame/1000, alteredFrame);
	}
}

function doFrame(sinceLastFrame, alteredFrame) {
	game.nextSave += sinceLastFrame;
	if (game.nextSave >= game.autoSaveInterval) {
		if (game.doAutoSave) save();
		game.nextSave = 0;
	}
	let progressIncrease = alteredFrame * getBarSpeed(0);
	if (game.progress[0] < getBarLength(0) &&
	   progressIncrease > getBarLength(0)) {
		progressIncrease = getBarLength(0);
	}
	game.lifetimeProgress[0] += progressIncrease;
	game.progress[0] += progressIncrease;
	for (let i = 0; i < 4; i++) {
		if (game.skill.timer[i] > 0 && game.skill.durationTimer[i] <= 0) {
			game.skill.timer[i] -= sinceLastFrame;
			if (game.skill.timer[i] < 0) game.skill.timer[i] = 0;
			updateSkills();
		}
	}
	for (let i = 0; i < 4; i++) {
		if (game.skill.durationTimer[i]>0) {
			game.skill.durationTimer[i] -= sinceLastFrame;
			if (game.skill.durationTimer[i] < 0) game.skill.durationTimer[i] = 0;
			switch (i) {
				case 0:
					id("sinGraph").classList.remove("hidden");
					if (game.skill.durationTimer[0] <= 0) id("sinGraph").classList.add("hidden");
					updateSineGraph();
					break;
				case 1:
					id("boostBar").classList.remove("hidden");
					id("boostBarStatus").classList.remove("hidden");
					id("boostLabel").classList.remove("hidden");
					game.skill.boostProgress -= sinceLastFrame;
					if (game.skill.boostProgress < 0) game.skill.boostProgress = 0;
					if (game.skill.boostProgress == 0) game.skill.boostOverflow = false;
					if (game.skill.durationTimer[1] <= 0) {
						id("boostBar").classList.add("hidden");
						id("boostBarStatus").classList.add("hidden");
						id("boostLabel").classList.add("hidden");
						game.skill.boostProgress = 0;
					}
					updateBoostBar();
					break;
				case 2:
					game.skill.couponNext -= sinceLastFrame;
					if (game.skill.couponNext<=0) {
						game.skill.couponNext = Math.random() * 2000 + 3000;
						game.skill.couponTimer = game.upgrade.skill[5] ? 2000 : 1000;
						let coupon = document.createElement("button");
						document.body.appendChild(coupon);
						coupon.id = "coupon";
						coupon.classList.add("coupon");
						coupon.style.transform = "translate(calc("+Math.random()+"*(100vw - 100%)),calc("+Math.random()+"*(100vh - 100%)))";
						coupon.onclick = couponClick;
					}
					if (game.skill.couponTimer > 0) {
						game.skill.couponTimer -= sinceLastFrame;
						id("coupon").style.opacity = Math.max(game.skill.couponTimer / (game.upgrade.skill[5] ? 2000 : 1000), 0) + "";
						if (game.skill.couponTimer <= 0) {
							game.skill.couponCount = 0;
							updaeUpg();
						}
					} else {
						game.skill.couponTimer = 0;
						if (document.body.contains(id("coupon"))) document.body.removeChild(id("coupon"));
					}
					if (game.skill.durationTimer[2] <= 0) {
						game.skill.couponTimer = 0;
						game.skill.couponCount = 0;
						game.skill.couponNext = Math.random() * 3000 + 2000;
						if (document.body.contains(id("coupon"))) document.body.removeChild(id("coupon"));
						updateUpg();
					}
					break;
				case 3:
					if (game.skill.waitTimer > 0) game.skill.durationTimer[3] += sinceLastFrame;
					game.skill.waitTimer -= sinceLastFrame;
					if (game.skill.waitTimer < 0) game.skill.waitTimer = 0;
			}
			updateSkills();
		}
	}
	for (let i = 0; i < 6; i++) {
		if (game.auto.nextRun[i] < auto.baseInterval[i] / Math.pow(2, game.upgrade.auto[i])) game.auto.nextRun[i] += alteredFrame;
		if (game.auto.nextRun[i] >= auto.baseInterval[i] / Math.pow(2, game.upgrade.auto[i]) && game.auto.isOn[i] && game.upgrade.auto[i] != 0) {
			switch (i) {
				case 0:
				case 1:
				case 2:
				case 3:
					if (game.points[0] >= getUpgPrice(i)) {
						bulkUpgrade(i, "normal", Math.pow(2,game.upgrade.auto[6]));
						game.auto.nextRun[i] = 0;
					}
					break;
				case 4:
				case 5:
					if (game.progress[i - 4] >= getBarLength(i - 4)) {
						redeemPoints(i - 4);
						game.auto.nextRun[i] = 0;
					}
			}
		}
	}
	updateAuto();
}

function nextFrame(timeStamp) {
	game.date = Date.now();
	let sinceLastFrame = timeStamp - lastFrame;
	let alteredFrame = sinceLastFrame * game.speed * (game.upgrade.auto[7] ? getTimeMachineMult() : 1);
	if (sinceLastFrame >= game.updateSpeed) {
		lastFrame = timeStamp;
		if (sinceLastFrame >= 1000 * game.speed) {
			simulateTime(sinceLastFrame, alteredFrame);
		} else {
			doFrame(sinceLastFrame, alteredFrame);
		}
		updateProgress();
	}
	window.requestAnimationFrame(nextFrame);
}

function save(auto = true) {
	localStorage.setItem('twsave', JSON.stringify(deinfinify(game)));
	if (!auto) {
		id("saveButton").style.backgroundColor = "green";
		setTimeout(function(){id("saveButton").style.backgroundColor = "";}, 250);
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
		if (pastGame.skill.durationTimer[2] > 0) {
			pastGame.skill.couponTimer = 0;
			pastGame.skill.couponCount = 0;
			pastGame.skill.couponNext = Math.random() * 3000 + 2000;
		}
		let offlineTime = Date.now() - pastGame.date;
		merge(game, pastGame);
		if (offlineTime > 1000) simulateTime(offlineTime);
		updateAll();
		if (!auto) {
			id("loadButton").style.backgroundColor = "green";
			setTimeout(function(){id("loadButton").style.backgroundColor = "";}, 250);
		}
	}
}

function exportSave() {
	id("exportArea").classList.remove('hidden');
	id("exportArea").innerHTML = btoa(JSON.stringify(deinfinify(game)));
	id("exportArea").select();
	document.execCommand("copy");
	id("exportArea").classList.add('hidden');
	id("exportButton").style.backgroundColor = "green";
	setTimeout(function(){id("exportButton").style.backgroundColor = "";}, 250);
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
			id("importButton").style.backgroundColor = "red";
		}
		if (!err) id("importButton").style.backgroundColor = "green";
		setTimeout(function(){id("importButton").style.backgroundColor = "";}, 250);
	}
}

function wipe() {
	if (confirm("Are you sure you want to wipe your save?")) {
		game = newGame(); 
		save();
		updateAll();
		for (let menu of document.getElementsByClassName("topMenu")) {
			menu.style.top = "-"+menu.style.height;
			menu.classList.remove("isOpen");
		}
		for (let menuOpen of document.getElementsByClassName("topMenuOpen")) {
			menuOpen.style.top = "0";
		}
		for (let menu of document.getElementsByClassName("sideMenu")) {
			let isLeft = id(menu+"Open").classList.contains("left");
			menu.style.left = isLeft?"-"+menu.style.width:"100%";
			menu.classList.remove("isOpen");
		}
		for (let menuOpen of document.getElementsByClassName("sideMenuOpen")) {
			let isLeft = menuOpen.classList.contains("left");
			menuOpen.style[isLeft?"left":"right"] = "0";
		}
		id("wipeButton").style.backgroundColor = "red";
		setTimeout(function(){id("wipeButton").style.backgroundColor = "";}, 250);
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
	id("autoSaveToggleButton").innerHTML = game.doAutoSave ? "Auto Save<br>ON" : "Auto Save<br>OFF";
	id("autoSaveToggleButton").style.backgroundColor = game.doAutoSave ? "green" : "red";
	setTimeout(function(){id("autoSaveToggleButton").style.backgroundColor = "";}, 250);
}

function changeAutoSaveInterval() {
	let newInterval = prompt("Please enter new auto-save interval in seconds.\n(Number from 0.2 to 300, inclusive)");
	if (newInterval != null) {
		newInterval = Number(newInterval);
		if (!isNaN(newInterval) && newInterval >= 0.2 && newInterval <= 300) {
			let newIntervalMs = newInterval * 1000
			game.autoSaveInterval = newIntervalMs;
			id("autoSaveIntervalButton").innerHTML = "Auto Save<br>Interval<br>"+newInterval+"s";
			id("autoSaveIntervalButton").style.backgroundColor = "green";
		} else {
			id("autoSaveIntervalButton").style.backgroundColor = "red";
		}
	}
	setTimeout(function(){id("autoSaveIntervalButton").style.backgroundColor = "";}, 250);
}

function toggleSideMenu(name) {
	let isLeft = id(name+"MenuOpen").classList.contains("left");
	if (!id(name+"Menu").classList.contains("isOpen")) {
		id(name+"Menu").style.left = isLeft?"0":"calc(100% - "+id(name+"Menu").style.width+")";
		id(name+"MenuOpen").style[isLeft?"left":"right"] = id(name+"Menu").style.width;
		id(name+"Menu").classList.add("isOpen");
	} else {
		id(name+"Menu").style.left = isLeft?"-"+id(name+"Menu").style.width:"100%";
		id(name+"MenuOpen").style[isLeft?"left":"right"] = "0";
		id(name+"Menu").classList.remove("isOpen");
	}
}

var topMenuOpen = false;

function toggleTopMenu(name) {
	if (!topMenuOpen) {
		id(name+"Menu").style.top = "0";
		for (let menuOpen of document.getElementsByClassName("topMenuOpen")) {
			menuOpen.style.top = id(name+"Menu").style.height;
		}
		id(name+"Menu").classList.add("isOpen");
		topMenuOpen = true;
	} else if (!id(name+"Menu").classList.contains("isOpen")) {
		for (let menu of document.getElementsByClassName("topMenu")) {
			menu.style.top = "-"+menu.style.height;
			menu.classList.remove("isOpen");
		}
		for (let menuOpen of document.getElementsByClassName("topMenuOpen")) {
			menuOpen.style.top = "0";
			setTimeout(function(){
				menuOpen.style.top = id(name+"Menu").style.height;
			},500);
		}
		setTimeout(function(){
			id(name+"Menu").style.top = "0";
			id(name+"Menu").classList.add("isOpen");
			topMenuOpen = true;
		},500);
	} else {
		id(name+"Menu").style.top = "-"+id(name+"Menu").style.height;
		id(name+"MenuOpen").style.top = "0";
		id(name+"Menu").classList.remove("isOpen");
		for (let menuOpen of document.getElementsByClassName("topMenuOpen")) {
			menuOpen.style.top = "0";
		}
		topMenuOpen = false;
		
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
		id("screen"+i).style.transform = "translate(-"+game.currentScreen*100+"vw,0)";
	}
	for (let menu of document.getElementsByClassName("topMenu")) {
		menu.style.transform = "translate(-"+game.currentScreen*100+"vw,0)";
	}
	id("maxAllButton").style.transform = "translate("+game.currentScreen*100+"vw,0)";
	id("switchScreenRight").classList[game.currentScreen == game.screenLimit ? "add" : "remove"]("disabled");
	id("switchScreenLeft").classList[game.currentScreen == 0 ? "add" : "remove"]("disabled");
}

function pluralCheck(n) {
	return n == 1 ? "" : "s";
}

function newGame() {
	return {
		date: Date.now(),
		speed: 1,
		updateSpeed: 50,
		doAutoSave: true,
		autoSaveInterval: 1000,
		nextSave: 0,
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
			auto: [0,0,0,0,0,0,0,0]
		},
		skill: {
			timer: [0,0,0,0],
			isActive: [false, false, false, false],
			durationTimer: [0,0,0,0],
			boostProgress: 0,
			boostOverflow: false,
			couponTimer: 0,
			couponNext: 0,
			couponCount: 0,
			waitTimer: 0
		},
		auto: {
			isOn: [true,true,true,true,true,true],
			nextRun: [0,0,0,0,0,0]
		}
	};
}

function getUpgPrice(n, type = "normal") {
	let upgPrice = upgrade[type].basePrice[n] * Math.pow(upgrade[type].priceGrowth[n], game.upgrade[type][n]);
	if (upgrade[type].type[n] == 0) upgPrice /= Math.pow((game.upgrade.skill[4] * 0.5 + 0.5) * game.skill.couponCount + 1, game.skill.waitTimer == 0 && game.skill.durationTimer[3] > 0 ? (game.upgrade.skill[7] ? 3 : 2) : 1);
	return Math.floor(game.upgrade[type][n] < upgrade[type].limit[n] ? upgPrice : Infinity);
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
		case 0: {
			let upg1Boost = Math.pow(2, game.upgrade.normal[1]);
			let overflow = game.progress[0] > getBarLength(0) ? Math.pow(game.progress[0] / getBarLength(0), 5 / (game.upgrade.normal[3] / 2 + 1)) : 1;
			return upg1Boost / overflow * getBoostBarMult();
			break;
		}
		case 1:
			return (Math.pow(2, game.upgrade.normal[1])==Infinity?1.79e308:Math.pow(2, game.upgrade.normal[1])) / (game.progress[1] * Math.log(10));
	}
}

function getPointGain(n) {
	switch (n) {
		case 0: {
			let point = game.progress[0] / getBarLength(0);
			point *= Math.pow(2, game.upgrade.normal[2]);
			point *= getSineMult();
			return Math.floor(point);
			break;
		}
		case 1:
			return Math.floor(game.progress[1] / getBarLength(1));
	}
}

function getSineMult() {
	let mult = Math.sin(game.skill.durationTimer[0] / 250);
	mult *= Math.pow(9, game.upgrade.skill[0] * 0.5 + 1);
	mult = Math.pow(mult, game.skill.waitTimer == 0 && game.skill.durationTimer[3] > 0 ? (game.upgrade.skill[7] ? 3 : 2) : 1) + 1;
	if (game.upgrade.skill[1]) mult = Math.abs(mult);
	return mult;
}

function getBoostBarMult() {
	let multLimit = Math.pow(36, 0.5 * game.upgrade.skill[2] + 1 * (game.skill.waitTimer == 0 && game.skill.durationTimer[3] > 0 ? (game.upgrade.skill[7] ? 3 : 2) : 1));
	let base = Math.pow(multLimit,1/10000);
	let mult = Math.pow(base,game.skill.boostProgress * (game.upgrade.skill[3] ? 1.1 : 1));
	return Math.min(mult,multLimit);
}

function getTimeMachineMult() {
	return 1 + game.upgrade.auto.reduce((a,b) => a + b, 0) * 0.05 + game.points[1] * 0.01;
}

function updateAll() {
	id("autoSaveToggleButton").innerHTML = game.doAutoSave ? "Auto Save<br>ON" : "Auto Save<br>OFF";
	document.querySelectorAll("*").forEach(function(node) {node.classList.add(game.currentTheme);});
	id("switchScreenRight").classList[game.currentScreen == game.screenLimit[1] ? "add" : "remove"]("disabled");
	id("switchScreenLeft").classList[game.currentScreen == 0 ? "add" : "remove"]("disabled");
	updateProgress();
	updatePoints();
	updateUpg();
	updateSkills()
}

function updateProgress() {
	for (let i = 0; i < 2; i++) {
		if (isNaN(game.progress[i])) game.progress[i] = Infinity;
		if (isNaN(game.lifetimeProgress[i])) game.lifetimeProgress[i] = Infinity;
		id("progressBar"+i).value = game.progress[i] != Infinity ? game.progress[i] : 1.79e308;
		id("progressBarLabel"+i).innerHTML = format((game.progress[i] / getBarLength(i) * 100), 4) + "%";
		id("redeemButton"+i).classList[game.lifetimeProgress[i] >= getBarLength(i) ? "remove" : "add"]("hidden");
		id("redeemButton"+i).classList[game.progress[i] >= getBarLength(i) ? "remove" : "add"]("disabled");
		id("redeemButton"+i).innerHTML = "Redeem<br>"+format(getPointGain(i))+"<br>point"+pluralCheck(getPointGain(i));
	}
	id("switchScreenLeft").classList[game.lifetimeProgress[1] >= getBarLength(1)/33 ? "remove" : "add"]("hidden");
	id("switchScreenRight").classList[game.lifetimeProgress[1] >= getBarLength(1)/33 ? "remove" : "add"]("hidden");
	game.progress[1] = Math.log10(game.progress[0] == Infinity ? 1.79e308 : game.progress[0]/getBarLength(0) + 1);
	if (game.progress[1] > game.lifetimeProgress[1]) game.lifetimeProgress[1] = game.progress[1];
}

function updatePoints() {
	for (let i = 0; i < 2; i++) {
		if (isNaN(game.points[i])) game.points[i] = 0;
		id("pointDisplay"+i).innerHTML = "You have "+format(game.points[i])+" "+(i==0?"pr":"l")+"ogress point"+pluralCheck(game.points[i])+".";
		id("pointDisplay"+i).classList[game.lifetimePoints[i] >= 1 ? "remove" : "add"]("hidden");
	}
	id("upgMenuOpen").classList[game.lifetimePoints[0] >= 1 ? "remove" : "add"]("hidden");
	id("timeMachineMult").innerHTML = format(getTimeMachineMult(),2) + "x";
}

function updateUpg() {
	for (let type of Object.keys(upgrade)) {
		for (let i = 0; i < 8; i++) {
			let newDesc = (getUpgPrice(i, type) != Infinity ? "Cost: "+format(getUpgPrice(i, type))+" "+(upgrade[type].type[i]==0?"Pr":"L")+"ogress Point"+pluralCheck(getUpgPrice(i, type)) : "Maxed Out")+"<br>Currently: ";
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
							newDesc += format(1 + game.upgrade.normal[i] / 2, 1) + "&radic;";
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
					switch(i) {
						case 0:
						case 2:
							newDesc += "^" + format(0.5 * game.upgrade.skill[i] + 1, 1);
							break;
						case 4:
							newDesc += "x" + format(game.upgrade.skill[i] + 1, 0);
							break
						case 6:
							newDesc += formatTime(120*1000 - 10*1000*game.upgrade.skill[6],false);
							break;
						case 1:
						case 3:
						case 5:
						case 7:
							newDesc += (game.upgrade.skill[i]?"Unlocked":"Locked");
					}
					break;
				case "auto":
					switch(i) {
						case 0:
						case 1:
						case 2:
						case 3:
						case 4:
						case 5:
							if (game.upgrade.auto[i] == 0) {
								newDesc += "Locked";
							} else {
								newDesc += formatTime(auto.baseInterval[i]/Math.pow(2,game.upgrade.auto[i]),false)+"/run";
							}
							break;
						case 6:
							newDesc += Math.pow(2,game.upgrade.auto[i]) + "/buy";
							break;
						case 7:
							newDesc += (game.upgrade.auto[i]?"Unlocked":"Locked");
					}
			}
			id((type=="normal"?"u":type+"U")+"pgDesc"+i).innerHTML = newDesc;
			if (game.upgrade[type][i] == upgrade[type].limit[i]) {
				setTimeout(function(){
					id((type=="normal"?"u":type+"U")+"pg"+i).classList.add("maxedUpg");
					setTimeout(function(){id((type=="normal"?"u":type+"U")+"pg"+i).classList.add("hidden");},500);
				},1000);
			} else {
				id((type=="normal"?"u":type+"U")+"pg"+i).classList.remove("maxedUpg");
				id((type=="normal"?"u":type+"U")+"pg"+i).classList.remove("hidden");
			}
			id((type == "normal"?"u":type+"U")+"pgButton"+i).classList[game.points[upgrade[type].type[i]] >= getUpgPrice(i, type) ? "remove" : "add"]("disabledUpg");
		}
		for (let i = 0; i < screenAmount; i++) {
			if (getUpgPrice(i*4, type) == Infinity &&
			   getUpgPrice(i*4+1, type) == Infinity &&
			   getUpgPrice(i*4+2, type) == Infinity &&
			   getUpgPrice(i*4+3, type) == Infinity) {
				setTimeout(function(){
					id((type=="normal"?"u":type+"U")+"pgCleared"+i).classList.remove("hidden");
					id((type=="normal"?"u":type+"U")+"pgCleared"+i).style.flex = "1";
				},1500);
			} else {
				id((type=="normal"?"u":type+"U")+"pgCleared"+i).classList.add("hidden");
				id((type=="normal"?"u":type+"U")+"pgCleared"+i).style.flex = "0";
			}
		}
	}
	id("progressBar0").max = getBarLength(0) != Infinity ? getBarLength(0) : 1.79e308;
	id("skillUpgMenuOpen").classList[game.upgrade.normal[5] ? "remove" : "add"]("hidden");
	id("autoUpgMenuOpen").classList[game.upgrade.normal[6] ? "remove" : "add"]("hidden");
	id("timeMachineMult").innerHTML = format(getTimeMachineMult(),2) + "x";
	id("autoMenuOpen").classList[game.upgrade.auto.reduce((a,b) => a + b, 0) > 0 ? "remove" : "add"]("hidden");
	for (let i = 0; i < 6; i++) {
		id("auto"+i).classList[game.upgrade.auto[i] == 0 ? "add" : "remove"]("hidden");
	}
	updateSkills();
}

function updateSkills() {
	for (let i = 0; i < 4; i++) {
		id("skill"+i).classList[game.skill.timer[i]<=0 && game.upgrade.normal[4] > i?"remove":"add"]("disabledUpg");
		if (game.skill.durationTimer[i]>0) {
			id("skillTimer"+i).innerHTML = formatTime(game.skill.durationTimer[i], false);
			id("skillTimer"+i).style.color = "green";
			if (i == 3 && game.skill.waitTimer > 0) {
				id("skillTimer"+i).innerHTML = formatTime(game.skill.waitTimer, false);
				id("skillTimer"+i).style.color = "blue";
			}
		} else if (game.skill.timer[i]>0) {
			id("skillTimer"+i).innerHTML = formatTime(game.skill.timer[i], false);
			id("skillTimer"+i).style.color = "red";
		} else {
			id("skillTimer"+i).innerHTML = ""
		}
	}
	id("skillDesc0").innerHTML = `x${Math.pow(9, (game.upgrade.skill[0] * 0.5 + 1) * (game.skill.waitTimer == 0 && game.skill.durationTimer[3] > 0 ? (game.upgrade.skill[7] ? 3 : 2) : 1)) + 1} and x${game.upgrade.skill[1] ? "" : "-"}${Math.pow(9, (game.upgrade.skill[0] * 0.5 + 1) * (game.skill.waitTimer == 0 && game.skill.durationTimer[3] > 0 ? (game.upgrade.skill[7] ? 3 : 2) : 1)) - 1}`;
	id("skillDesc1").innerHTML = Math.pow(36, (0.5 * game.upgrade.skill[2] + 1) * (game.skill.waitTimer == 0 && game.skill.durationTimer[3] > 0 ? (game.upgrade.skill[7] ? 3 : 2) : 1));
	id("skillDesc3").innerHTML = 120 - 10*game.upgrade.skill[6] + " second" + pluralCheck(120 - 10*game.upgrade.skill[6]);
}

function updateSineGraph() {
	let line = id("sinGraphLine");
	let sineMult = Math.sin(game.skill.durationTimer[0] / 250);
	if (game.upgrade.skill[1]) sineMult = Math.abs(sineMult);
	let percent = (1 - sineMult) / 2;
	line.style.top = percent * 100 + "%";
	line.style.backgroundColor = "rgb(" + (255*percent) + "," + (255*(1-percent)) + ",0)";
	id("skillMenuOpen").classList[game.upgrade.normal[4] > 0 ? "remove" : "add"]("hidden");
}

function updateBoostBar() {
	let boostColor = "hsl(" + (240 - game.skill.boostProgress/125*3) + ",100%,50%)";
	id("boostLabel").innerHTML = "x" + format(getBoostBarMult(),2);
	id("boostBarValue").style.width = Math.min(game.skill.boostProgress / 100,100) + "%";
	id("boostBarValue").style.backgroundColor = boostColor;
	let boostStatus;
	let x = game.skill.boostProgress;
	switch (true) {
		case (x < 2000):
			boostStatus = "Cold";
			break;
		case (x < 4000):
			boostStatus = "Eh";
			break;
		case (x < 6000):
			boostStatus = "Warm";
			break;
		case (x < 8000):
			boostStatus = "Hot";
			break;
		case (x < 9000):
			boostStatus = "Burning";
			break;
		case (x < 10000):
			boostStatus = "Melting";
	}
	if (game.skill.boostOverflow) boostStatus = "OVERHEAT";
	id("boostBarStatusText").innerText = boostStatus;
	id("boostBarStatus").style.backgroundColor = boostColor;
}

function updateAuto() {
	for (let i = 0; i < 6; i++) {
		let percent = game.auto.nextRun[i] / auto.baseInterval[i] * Math.pow(2,game.upgrade.auto[i]) * 100;
		id("autoBarValue"+i).style.width = percent + "%";
		id("autoBarLabel"+i).innerHTML = format(Math.min(percent,100),2) + "%";
	}
}

function redeemPoints(n) {
	if (game.progress[n] >= getBarLength(n)) {
		game.points[n] += getPointGain(n);
		game.lifetimePoints[n] += getPointGain(n);
		if (n == 1) {
			game.progress[0] = 0;
			game.points[0] = 0;
			for (let i = 0; i < 4; i++) {
				game.upgrade.normal[i] = 0;
			}
		} else {
			game.progress[n] = game.progress[n] % getBarLength(n);
		}
		if (game.skill.durationTimer[1] > 0 && !game.skill.boostOverflow) game.skill.boostProgress += 500;
		if (game.skill.boostProgress > 10000) game.skill.boostOverflow = true;
		if (game.skill.waitTimer > 0) {
			game.skill.waitTimer = 0;
			game.skill.durationTimer[3] = 0;
		}
		updatePoints();
		updateUpg();
	}
}

function buyUpgrade(n, type = "normal") {
	if (game.points[upgrade[type].type[n]] >= getUpgPrice(n, type) && game.upgrade[type][n] < upgrade[type].limit[n] && getUpgPrice(n, type) != Infinity) {
		game.points[upgrade[type].type[n]] -= getUpgPrice(n, type);
		game.upgrade[type][n]++;
		updateUpg();
		updatePoints();
		updateSkills();
	}
}

function bulkUpgrade(n, type = "normal", amount = 1) {
	let totalAmount = Math.min(Math.floor(Math.log(game.points[0]*(upgrade[type].priceGrowth[n]-1)/getUpgPrice(n, type)+1)/Math.log(upgrade[type].priceGrowth[n])),upgrade[type].limit[n],amount);
	let totalPrice = getUpgPrice(n, type)*(1-Math.pow(upgrade[type].priceGrowth[n],totalAmount))/(1-upgrade[type].priceGrowth[n]);
	if (totalAmount >= 1) {
		game.points[0] -= totalPrice;
		game.upgrade[type][n] += totalAmount;
		updateUpg();
		updatePoints();
		updateSkills();
	}
}

function maxAll(type = "normal") {
	for (let i = game.currentScreen*4; i < (game.currentScreen+1)*4; i++) {
		let totalAmount = Math.min(Math.floor(Math.log(game.points[0]*(upgrade[type].priceGrowth[i]-1)/getUpgPrice(i, type)+1)/Math.log(upgrade[type].priceGrowth[i])),upgrade[type].limit[i]);
		let totalPrice = getUpgPrice(i, type)*(1-Math.pow(upgrade[type].priceGrowth[i],totalAmount))/(1-upgrade[type].priceGrowth[i]);
		if (totalAmount >= 1) {
			game.points[0] -= totalPrice;
			game.upgrade[type][i] += totalAmount;
			updateUpg();
			updatePoints();
			updateSkills();
		}
	}
}

function useSkill(n) {
	if (game.skill.timer[n] <= 0 && game.upgrade.normal[4] > n) {
		game.skill.timer[n] = skill.cooldown[n];
		game.skill.durationTimer[n] = skill.duration[n];
		if (n == 3) game.skill.waitTimer = 120*1000 - 10*1000*game.upgrade.skill[6];
	}
}

function couponClick() {
	game.skill.couponCount++;
	game.skill.couponTimer = 0;
	id("couponCountText").innerHTML = game.skill.couponCount;
	id("couponCount").style.transition = "opacity 0.5s";
	id("couponCount").classList.remove("hidden");
	setTimeout(function(){
		id("couponCount").style.opacity = 0;
	},1)
	setTimeout(function(){
		id("couponCount").classList.add("hidden");
		id("couponCount").style.transition = "opacity 0s";
		id("couponCount").style.opacity = 1;
	},500);
	updateUpg();
}

function toggleAuto(n) {
	game.auto.isOn[n] = !game.auto.isOn[n];
	for (let i = 0; i < 6; i++) {
		id("autoToggle"+i).innerHTML = game.auto.isOn[n] ? "ON" : "OFF";
	}
}

document.addEventListener("keydown", function(input){
	let key = input.key;
	switch(key) {
		case "p":
			redeemPoints(0);
			break;
		case "l":
			redeemPoints(1);
			break;
		case "ArrowLeft":
			switchScreen("backward");
			break;
		case "ArrowRight":
			switchScreen("forward");
			break;
		case "1":
		case "2":
		case "3":
		case "4":
			useSkill(Number(key)-1);
	}
})

function isEven(n) {
	return Math.floor(n/2) == n/2;
}

function format(n, toFixed = 0) {
	if (n == "Infinity") return Infinity;
	else if (n < 1e3) return n.toFixed(toFixed);
	return n.toExponential(2).replace("+","");
}

function formatTime(ms, word=true) {
	let s = ms/1000;
	let ds = s % 60;
	let m = Math.floor(s/60);
	let dm = m % 60;
	let h = Math.floor(m/60);
	let dh = h % 24;
	let d = Math.floor(h/24);
	let dd = d % 30.43685;
	let mo = Math.floor(d/30.43685);
	let dmo = mo % 12;
	let dy = Math.floor(mo/365.2422);
	let time = "";
	if (word) {
		if (s < 60) {
			time = ds.toFixed(2) + " second" + pluralCheck(ds);
		} else {
			time = "and " + ds.toFixed(0) + " second" + pluralCheck(ds);
		}
		if (dm >= 1) time = dm + " minute" + pluralCheck(dm) + ", " + time;
		if (dh >= 1) time = dh + " hour" + pluralCheck(dh) + ", " + time;
		if (dd >= 1) time = dh + " day" + pluralCheck(dd) + ", " + time;
		if (dmo >= 1) time = dh + " month" + pluralCheck(dmo) + ", " + time;
		if (dy >= 1) time = dh + " year" + pluralCheck(dy) + ", " + time;
		if (m < 60) time = time.replace(",", "");
		return time;
	} else {
		time = s < 60 ? ds.toFixed(2) + "s" : (ds<10?"0":"")+ds.toFixed(0);
		if (dm >= 1) time = (dm<10?"0":"")+dm + ":" + time;
		if (dh >= 1) time = (dh<10?"0":"")+dh + ":" + time;
		if (dd >= 1) time = dh + ":" + time;
		if (dmo >= 1) time = dh + ":" + time;
		if (dy >= 1) time = dh + ":" + time;
		return time;
	}
}

function id(id) {
	return document.getElementById(id);
}

init();
