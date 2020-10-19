var game = newGame();

function newGame() {
	return {
		date: Date.now(),
		timePlayed: 0,
		speed: 1,
		updateSpeed: 50,
		doAutoSave: true,
		autoSaveInterval: 1000,
		nextSave: 0,
		currentTheme: "light",
		lifetimeProgress: [0,0],
		progress: [0,0],
		lifetimePoints: [0,0],
		points: [0,0],
		upgrade: {
			selected: 0,
			normal: [0,0,0,0,0,0,0,0],
			skill: [0,0,0,0,0,0,0,0],
			auto: [0,0,0,0,0,0,0,0]
		},
		skill: {
			uses: [0,0,0,0],
			timer: [0,0,0,0],
			isActive: [false, false, false, false],
			durationTimer: [0,0,0,0],
			boostProgress: 0,
			boostOverflow: false,
			boostOverflowAmt: 0,
			couponTimer: 0,
			couponNext: 0,
			couponCount: 0,
			couponTotal: 0,
			waitTimer: 0,
			waitFailed: 0,
		},
		auto: {
			isOn: [true,true,true,true,true,true],
			nextRun: [0,0,0,0,0,0]
		},
		sinceLastLP: 0,
		fastestLP: Infinity,
		lowestPP: 0,
		achievements: [],
		afkLog: true,
		battle: {
			currentArea: 0,
			fragments: 0,
			xp: 0,
			currentEnemy: 0,
			nextSpawn: 10000,
			player: {
				hp: 100,
				sp: 50,
				cooldown: [0,0,0,0],
				effLevel: [0,0,0,0,0,0],
				effDuration: [0,0,0,0,0,0]
			},
			enemy: {
				hp: 100,
				cooldown: 0,
				effLevel: [0,0,0,0,0,0],
				effDuration: [0,0,0,0,0,0]
			},
			inventory: [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
			equip: [0,0,0,0,0],
			ability: [0,0,0,0,0,0,0,0,0,0,0,0],
		},
	};
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
		let pastGame = JSON.parse(localStorage.getItem('twsave'));
		pastGame = infinify(pastGame);
		if (pastGame.points == undefined) pastGame.points = [pastGame.timewallPoint];
		if (typeof(pastGame.lifetimePoints) == "number") pastGame.lifetimePoints = [pastGame.lifetimePoints];
		if (typeof(pastGame.progress) == "number") pastGame.progress = [pastGame.progress];
		if (typeof(pastGame.lifetimeProgress) == "number") pastGame.lifetimeProgress = [pastGame.lifetimeProgress];
		if (pastGame.upgrade == undefined) pastGame.upgrade = {normal:pastGame.upgradeAmount};
		if (pastGame.skill != undefined) {
			if (pastGame.skill.durationTimer[2] > 0) {
				pastGame.skill.couponTimer = 0;
				pastGame.skill.couponCount = 0;
				pastGame.skill.couponNext = Math.random() * 3000 + 2000;
			}
		}
		let offlineTime = 0;
		if (pastGame.date != undefined) offlineTime = Date.now() - pastGame.date;
		merge(game, pastGame);
		if (offlineTime > 1000) simulateTime(offlineTime);
		if (document.body.contains(id("coupon"))) document.body.removeChild(id("coupon"));
		if (!auto) {
			id("loadButton").style.backgroundColor = "green";
			setTimeout(function(){id("loadButton").style.backgroundColor = "";}, 250);
		}
	}
	updateAll();
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
		for (let i = 0; i < currentScreen; i++) {
			switchScreen("backward");
		}
		for (let menu of document.getElementsByClassName("topMenu")) {
			menu.style.top = "-"+menu.style.height;
			menu.classList.remove("topOpen");
		}
		for (let menuOpen of document.getElementsByClassName("topMenuOpen")) {
			menuOpen.style.top = "0";
		}
		for (let menu of document.getElementsByClassName("sideMenu")) {
			let isLeft = menu.classList.contains("left");
			menu.style.left = isLeft?"-"+menu.style.width:"100%";
			menu.classList.remove("sideOpen");
		}
		for (let menuOpen of document.getElementsByClassName("sideMenuOpen")) {
			let isLeft = menuOpen.classList.contains("left");
			menuOpen.style[isLeft?"left":"right"] = "0";
		}
		if (id("statsMenu").classList.contains("statsOpen")) toggleStatsMenu();
		if (document.body.contains(id("coupon"))) document.body.removeChild(id("coupon"));
		game = newGame(); 
		save();
		updateAll();
		id("wipeButton").style.backgroundColor = "red";
		setTimeout(function(){id("wipeButton").style.backgroundColor = "";}, 250);
	}
}

function merge(base, source) {
	for (let i in base) {
		if (source[i] != undefined) {
			if (typeof(base[i]) == "object" && typeof(source[i]) == "object" && base[i] != game.achievements) {
				merge(base[i], source[i]);
			} else {
				base[i] = source[i];
			}
		}
	}
}

function deinfinify(object) {
	let o = deepCopy(object);
	for (let i in o) {
		if (o[i] === Infinity) o[i] = "Infinity";
		if (o[i] === -Infinity) o[i] = "-Infinity";
		if (typeof(o[i]) == "object" && o[i] != game.achievements) o[i] = deinfinify(o[i]);
	}
	return o;
}

function infinify(object) {
	let o = deepCopy(object);
	for (let i in o) {
		if (o[i] === "Infinity") o[i] = Infinity;
		if (o[i] === "-Infinity") o[i] = -Infinity;
		if (typeof(o[i]) == "object" && o[i] != game.achievements) o[i] = infinify(o[i]);
	}
	return o;
}

function deepCopy(inObject) { //definitely not copied from somewhere else
	let outObject, value, key
	if (typeof inObject !== "object" || inObject === null) {
		return inObject
	}
	outObject = Array.isArray(inObject) ? [] : {}
	for (key in inObject) {
		value = inObject[key]
		outObject[key] = deepCopy(value)
	}
	return outObject
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
