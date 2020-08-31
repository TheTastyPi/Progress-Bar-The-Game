var lastFrame = 0;
var game = newGame();

const screenAmount = document.getElementsByClassName("screen").length;
var currentScreen = 0;

const upgrade = {
	list: ["normal","skill","auto"],
	normal: {
		basePrice: [1, 1, 2, 3, 1, 2, 3, 250, 1, 1, 1, 1],
		priceGrowth: [6, 6, 11, 14, 1, 1, 1, 1, 1, 1, 1, 1],
		limit: [Infinity,Infinity,Infinity,Infinity,4,1,1,1,1,1,1,1],
		type: [0,0,0,0,1,1,1,1,1,1,1,1]
	},
	skill: {
		basePrice: [1, 5, 1, 5, 1, 5, 1, 5, 1, 1, 1, 1],
		priceGrowth: [2, 1, 2, 1, 2, 1, 2, 1, 1, 1, 1, 1],
		limit: [Infinity,1,Infinity,1,Infinity,1,Infinity,1, 1, 1, 1, 1],
		type: [1,1,1,1,1,1,1,1,1,1,1,1]
	},
	auto: {
		basePrice: [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
		priceGrowth: [2, 2, 2, 2, 2, 2, 2, 2, 1, 1, 1, 1],
		limit: [9,9,9,9,7,16,1024,1,1,1,1,1],
		type: [1,1,1,1,1,1,1,1,1,1,1,1]
	}
};

const skill = {
	cooldown: [7.5*60*1000, 7.5*60*1000, 5*60*1000, 7.5*60*1000],
	duration: [60*1000, 60*1000, 60*1000, 30*1000]
};

const auto = {
	baseInterval: [60*1000, 60*1000, 60*1000, 60*1000, 15*1000, 4*60*60*1000]
};

function init() {
	for (let type of upgrade.list) {
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
	
	allAchievements();
	
	for (let tooltip of document.getElementsByClassName("tooltip")) {
		tooltip.addEventListener("mouseenter", function(mouse){
			let tooltipText = document.createElement("div");
			document.body.appendChild(tooltipText);
			tooltipText.classList.add("tooltipText");
			tooltipText.id = tooltip.id + "Tooltip";
			tooltipText.innerHTML = document.querySelector("#"+tooltip.id+">.tooltipData").innerHTML;
			document.querySelector("#"+tooltip.id+">.tooltipData").innerHTML = "";
			tooltipText.style.left = "calc("+(mouse.clientX+10)+"px - "+(mouse.clientX >= window.innerWidth / 2 ? tooltipText.offsetWidth + 20 : 0)+"px)";
			tooltipText.style.top = "calc("+(mouse.clientY+10)+"px - "+(mouse.clientY >= window.innerHeight / 2 ? tooltipText.offsetHeight + 20 : 0)+"px)";
			if (mouse.clientX < window.innerWidth / 2 && mouse.clientY < window.innerHeight / 2) tooltipText.style.borderRadius = "0 6px 6px 6px";
			if (mouse.clientX >= window.innerWidth / 2 && mouse.clientY < window.innerHeight / 2) tooltipText.style.borderRadius = "6px 0 6px 6px";
			if (mouse.clientX >= window.innerWidth / 2 && mouse.clientY >= window.innerHeight / 2) tooltipText.style.borderRadius = "6px 6px 0 6px";
			if (mouse.clientX < window.innerWidth / 2 && mouse.clientY >= window.innerHeight / 2) tooltipText.style.borderRadius = "6px 6px 6px 0";
		});
		tooltip.addEventListener("mousemove", function(mouse){
			let tooltipText = id(tooltip.id+"Tooltip");
			tooltipText.style.left = "calc("+(mouse.clientX+10)+"px - "+(mouse.clientX >= window.innerWidth / 2 ? tooltipText.offsetWidth + 20 : 0)+"px)";
			tooltipText.style.top = "calc("+(mouse.clientY+10)+"px - "+(mouse.clientY >= window.innerHeight / 2 ? tooltipText.offsetHeight + 20 : 0)+"px)";
			if (mouse.clientX < window.innerWidth / 2 && mouse.clientY < window.innerHeight / 2) tooltipText.style.borderRadius = "0 6px 6px 6px";
			if (mouse.clientX >= window.innerWidth / 2 && mouse.clientY < window.innerHeight / 2) tooltipText.style.borderRadius = "6px 0 6px 6px";
			if (mouse.clientX >= window.innerWidth / 2 && mouse.clientY >= window.innerHeight / 2) tooltipText.style.borderRadius = "6px 6px 0 6px";
			if (mouse.clientX < window.innerWidth / 2 && mouse.clientY >= window.innerHeight / 2) tooltipText.style.borderRadius = "6px 6px 6px 0";
		});
		tooltip.addEventListener("mouseleave", function(mouse){
			let tooltipText = id(tooltip.id+"Tooltip");
			document.querySelector("#"+tooltip.id+">.tooltipData").innerHTML = tooltipText.innerHTML;
			document.body.removeChild(tooltipText);
		});
	}
	
	load();
	
	window.requestAnimationFrame(nextFrame);
}

function simulateTime(sinceLastFrame) {
	for (let i = 0; i < 1000; i++) {
		doFrame(sinceLastFrame/1000);
	}
}

function doFrame(sinceLastFrame) {
	let alteredFrame = sinceLastFrame * game.speed * (game.upgrade.auto[7] ? getTimeMachineMult() : 1);
	game.timePlayed += sinceLastFrame;
	game.sinceLastLP += sinceLastFrame;
	game.nextSave += sinceLastFrame;
	if (game.nextSave >= game.autoSaveInterval) {
		if (game.doAutoSave) save();
		game.nextSave = 0;
	}
	let progressIncrease = alteredFrame * getBarSpeed(0);
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
							updateUpg();
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
					if (game.points[0] >= getUpgPrice(i) && game.upgrade.normal[i] < upgrade.normal.limit[i]) {
						bulkUpgrade(i, "normal", Math.pow(2,game.upgrade.auto[6]), true);
						game.auto.nextRun[i] = 0;
					}
					break;
				case 4:
				case 5:
					if (game.progress[i - 4] >= getBarLength(i - 4) && game.points[i - 4] != Infinity && getPointGain(i - 4) >= 0) {
						redeemPoints(i - 4, true);
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
	if (sinceLastFrame >= game.updateSpeed) {
		lastFrame = timeStamp;
		if (sinceLastFrame >= 10000) {
			simulateTime(sinceLastFrame);
		} else {
			doFrame(sinceLastFrame);
		}
		updateProgress();
	}
	window.requestAnimationFrame(nextFrame);
}


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
		afkLog: true
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

function toggleSideMenu(name) {
	let isLeft = id(name+"MenuOpen").classList.contains("left");
	if (!id(name+"Menu").classList.contains("sideOpen")) {
		id(name+"Menu").style.left = isLeft?"0":"calc(100% - "+id(name+"Menu").style.width+")";
		id(name+"MenuOpen").style[isLeft?"left":"right"] = id(name+"Menu").style.width;
		id(name+"Menu").classList.add("sideOpen");
	} else {
		id(name+"Menu").style.left = isLeft?"-"+id(name+"Menu").style.width:"100%";
		id(name+"MenuOpen").style[isLeft?"left":"right"] = "0";
		id(name+"Menu").classList.remove("sideOpen");
	}
}

function toggleTopMenu(name) {
	if (document.getElementsByClassName("topOpen").length == 0) {
		id(name+"Menu").style.top = "0";
		for (let menuOpen of document.getElementsByClassName("topMenuOpen")) {
			menuOpen.style.top = id(name+"Menu").style.height;
		}
		id(name+"Menu").classList.add("topOpen");
	} else if (!id(name+"Menu").classList.contains("topOpen")) {
		for (let menu of document.getElementsByClassName("topMenu")) {
			menu.style.top = "-"+menu.style.height;
			menu.classList.remove("topOpen");
		}
		for (let menuOpen of document.getElementsByClassName("topMenuOpen")) {
			menuOpen.style.top = "0";
			setTimeout(function(){
				menuOpen.style.top = id(name+"Menu").style.height;
			},500);
		}
		setTimeout(function(){
			id(name+"Menu").style.top = "0";
			id(name+"Menu").classList.add("topOpen");
		},500);
	} else {
		id(name+"Menu").style.top = "-"+id(name+"Menu").style.height;
		id(name+"MenuOpen").style.top = "0";
		id(name+"Menu").classList.remove("topOpen");
		for (let menuOpen of document.getElementsByClassName("topMenuOpen")) {
			menuOpen.style.top = "0";
		}
	}
}

function toggleStatsMenu() {
	if (!id("statsMenu").classList.contains("statsOpen")) {
		id("statsMenu").style.bottom = "0"
		id("statsMenuOpen").style.bottom = "calc("+id("statsMenu").style.height+" + 10px)";
		id("statsMenu").classList.add("statsOpen");
	} else {
		id("statsMenu").style.bottom = "calc(("+id("statsMenu").style.height+" + 10px)*-1)";
		id("statsMenuOpen").style.bottom = "0";
		id("statsMenu").classList.remove("statsOpen");
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
	if (dir == "forward" && currentScreen != getScreenLimit()) currentScreen++;
	if (dir == "backward" && currentScreen != 0) currentScreen--;
	for (let i = 0; i < document.getElementsByClassName("screen").length; i++) {
		id("screen"+i).style.transform = "translate(-"+currentScreen*100+"vw,0)";
	}
	for (let menu of document.getElementsByClassName("topMenu")) {
		menu.style.transform = "translate(-"+currentScreen*100+"vw,0)";
	}
	for (let type of upgrade.list) {
		id((type=="normal"?"m":type+"M")+"axAllButton").style.transform = "rotate(90deg) translate(20px,20px) translate(0,-"+currentScreen*100+"vw)";
	}
	id("switchScreenRight").classList[currentScreen == getScreenLimit() ? "add" : "remove"]("disabled");
	id("switchScreenLeft").classList[currentScreen == 0 ? "add" : "remove"]("disabled");
}

function getScreenLimit() {
	let maxScreen = 1;
	if (game.upgrade.normal[7]) maxScreen++;
	return maxScreen;
}

function getBarLength(n) {
	switch (n) {
		case 0:
			return 1.5e4 / Math.pow(2, game.upgrade.normal[0]) * (1 - 0.1 * Math.min(game.lifetimePoints[1],5));
			break;
		case 1:
			return Math.log10(1.79e308);
	}
}

function getBarSpeed(n) {
	switch (n) {
		case 0: {
			let upg1Boost = Math.pow(2, game.upgrade.normal[1]);
			let overflow = game.progress[0] > getBarLength(0) ? Math.pow(game.progress[0] / getBarLength(0), 5 / ((1 + 0.1 * Math.min(Math.floor(game.lifetimePoints[1] / 4),5)) * 2 * game.upgrade.normal[3] + 1)) : 1;
			let logBoost = 1 + game.points[1] * 0.01 * Math.min(Math.floor(game.lifetimePoints[1] / 10),5);
			return upg1Boost / overflow * getBoostBarMult() * logBoost;
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
			return Math.floor(game.progress[1] / getBarLength(1) * (1 + Math.min(Math.floor(game.lifetimePoints[1] / 50),4)));
	}
}

function getUpgPrice(n, type = "normal") {
	let upgPrice = upgrade[type].basePrice[n] * Math.pow(upgrade[type].priceGrowth[n], game.upgrade[type][n]);
	if (upgrade[type].type[n] == 0) {
		upgPrice *= 1 - 0.05 * Math.min(Math.floor(game.lifetimePoints[1] / 2),10);
		upgPrice /= Math.pow((game.upgrade.skill[4] * 0.5 + 0.5) * game.skill.couponCount + 1, game.skill.waitTimer == 0 && game.skill.durationTimer[3] > 0 ? (game.upgrade.skill[7] ? 3 : 2) : 1);
	}
	return game.upgrade[type][n] < upgrade[type].limit[n] ? Math.max(Math.round(upgPrice),1) : Infinity;
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
	return 1 + game.upgrade.auto.reduce((a,b) => a + b, 0) * 0.05;
}

function updateAll() {
	id("autoSaveToggleButton").innerHTML = game.doAutoSave ? "Auto Save<br>ON" : "Auto Save<br>OFF";
	document.querySelectorAll("*").forEach(function(node) {node.classList.add(game.currentTheme);});
	id("switchScreenRight").classList[currentScreen == getScreenLimit() ? "add" : "remove"]("disabled");
	id("switchScreenLeft").classList[currentScreen == 0 ? "add" : "remove"]("disabled");
	for (let i = 0; i < 6; i++) {
		id("autoToggle"+i).innerHTML = game.auto.isOn[i] ? "ON" : "OFF";
	}
	updateProgress();
	updatePoints(0);
	updatePoints(1);
	updateUpg();
	updateSkills();
	updateSineGraph();
	updateBoostBar();
	updateAuto();
	updateAchievements();
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
	id("switchScreenLeft").classList[game.lifetimeProgress[1] >= getBarLength(1)/100 ? "remove" : "add"]("hidden");
	id("switchScreenRight").classList[game.lifetimeProgress[1] >= getBarLength(1)/100 ? "remove" : "add"]("hidden");
	id("switchScreenHotkey").classList[game.lifetimeProgress[1] >= getBarLength(1)/100 ? "remove" : "add"]("hidden");
	game.progress[1] = Math.log10(game.progress[0]/getBarLength(0) + 1 == Infinity ? 1.79e308 : game.progress[0]/getBarLength(0) + 1);
	if (game.progress[1] > game.lifetimeProgress[1]) game.lifetimeProgress[1] = game.progress[1];
	id("timePlayed").innerHTML = formatTime(game.timePlayed);
	if (game.progress[0] / getBarLength(0) >= 10) giveAchievement("k");
	if (game.progress[0] / getBarLength(0) >= 1e4) giveAchievement("kk");
	if (game.progress[0] / getBarLength(0) >= 1e10) giveAchievement("kkkk");
	if (game.progress[0] / getBarLength(0) >= 1e48) giveAchievement("goingFast");
	if (game.progress[0] == Infinity) giveAchievement("somethingBreak");
}

function updatePoints(n) {
	switch(n) {
		case 0:
			if (game.points[0] == -Infinity || game.upgrade.skill[1]) giveAchievement("wrongWay");
			if (isNaN(game.points[0]) || game.points[0] == -Infinity || typeof(game.points[0]) != "number") game.points[0] = 0;
			if (isNaN(game.lifetimePoints[0]) || game.lifetimePoints[0] == -Infinity || typeof(game.lifetimePoints[0]) != "number") game.lifetimePoints[0] = Infinity;
			id("pointDisplay0").innerHTML = "You have "+format(game.points[0])+" progress point"+pluralCheck(game.points[0])+".";
			id("pointDisplay0").classList[game.lifetimePoints[0] >= 1 ? "remove" : "add"]("hidden");
			id("themeMenuOpen").classList[game.lifetimePoints[0] >= 1 ? "remove" : "add"]("hidden");
			id("saveMenuOpen").classList[game.lifetimePoints[0] >= 1 ? "remove" : "add"]("hidden");
			id("upgMenuOpen").classList[game.lifetimePoints[0] >= 1 ? "remove" : "add"]("hidden");
			id("statsMenuOpen").classList[game.lifetimePoints[0] >= 1 ? "remove" : "add"]("hidden");
			id("totalPP").innerHTML = format(game.lifetimePoints[0],0);
			id("lowestPP").innerHTML = format(game.lowestPP,0);
			if (game.points[0] >= 1) giveAchievement("justABar");
			break;
		case 1:
			id("pointDisplay1").innerHTML = "You have "+format(game.points[1])+" logress point"+pluralCheck(game.points[1])+".";
			id("pointDisplay1").classList[game.lifetimePoints[1] >= 1 ? "remove" : "add"]("hidden");
			id("logStat").classList[game.lifetimePoints[1] >= 1 ? "remove" : "add"]("hidden");
			id("logHotkey").classList[game.lifetimePoints[1] >= 1 ? "remove" : "add"]("hidden");
			id("totalLP").innerHTML = format(game.lifetimePoints[1],0);
			id("fastestLP").innerHTML = game.fastestLP == Infinity ? "Infinity" : formatTime(game.fastestLP);
			id("logBoost").classList[game.lifetimePoints[1] >= 1 ? "remove" : "add"]("hidden");
			id("logBoostPoints").innerHTML = game.lifetimePoints[1]+" logress point"+pluralCheck(game.lifetimePoints[1]);
			let logBoostLimit = [5,10,5,20,5,4];
			let logBoostReq = [1,2,4,5,10,50];
			for (let i = 0; i < 6; i++) {
				let level = Math.min(Math.floor(game.lifetimePoints[1] / logBoostReq[i]), logBoostLimit[i]);
				id("logBoostDisp"+i).classList[game.lifetimePoints[1] >= logBoostReq[i] ? "remove" : "add"]("disabledUpg");
				id("logBoostAmount"+i).innerHTML = level + "/" + logBoostLimit[i] + " | " + (level == logBoostLimit[i] ? "N/A" : logBoostReq[i] - game.lifetimePoints[1] % logBoostReq[i]);
				let currentBoost;
				switch(i) {
					case 0:
						currentBoost = "-" + level * 10 + "%";
						break;
					case 1:
						currentBoost = "-" + level * 5 + "%";
						break;
					case 2:
						currentBoost = "+" + level * 10 + "%";
						break;
					case 3:
						currentBoost = "-" + level * 6 + "s";
						break;
					case 4:
						currentBoost = "+" + level + "%/point";
						break;
					case 5:
						currentBoost = "+" + level * 100 + "%";
				}
				id("logBoostEffect"+i).innerHTML = currentBoost;
			}
			for (let i = 0; i < 4; i++) {
				id("skillCooldown"+i).innerHTML = skill.cooldown[i] / 60 / 1000 - 0.1 * Math.min(Math.floor(game.lifetimePoints[1] / 5), 20);
			}
			if (game.lifetimePoints[1] >= 5) giveAchievement("theseAreLogBoosts");
			if (game.lifetimePoints[1] >= 50) giveAchievement("runes");
			if (game.lifetimePoints[1] >= 200) giveAchievement("feelBoosted");
	}
}

function updateUpg() {
	for (let type of upgrade.list) {
		for (let i = 0; i < 8; i++) {
			let newDesc = (game.upgrade[type][i] != Infinity ? "Cost: "+format(Math.floor(getUpgPrice(i, type)))+" "+(upgrade[type].type[i]==0?"Pr":"L")+"ogress Point"+pluralCheck(getUpgPrice(i, type)) : "Maxed Out")+"<br>Currently: ";
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
							newDesc += format(1 + game.upgrade.normal[i] * 2) + "&radic;";
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
							newDesc += format(Math.pow(2,game.upgrade.auto[i]),0) + "/buy";
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
			id((type == "normal"?"u":type+"U")+"pgButton"+i).classList[game.points[upgrade[type].type[i]] >= Math.floor(getUpgPrice(i, type)) ? "remove" : "add"]("disabledUpg");
		}
		for (let i = 0; i < screenAmount; i++) {
			if (game.upgrade[type][i*4] == upgrade[type].limit[i*4] &&
			   game.upgrade[type][i*4+1] == upgrade[type].limit[i*4+1] &&
			   game.upgrade[type][i*4+2] == upgrade[type].limit[i*4+2] &&
			   game.upgrade[type][i*4+3] == upgrade[type].limit[i*4+3]) {
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
	id("skillMenuOpen").classList[game.upgrade.normal[4] > 0 ? "remove" : "add"]("hidden");
	id("skillUpgMenuOpen").classList[game.upgrade.normal[5] ? "remove" : "add"]("hidden");
	id("autoUpgMenuOpen").classList[game.upgrade.normal[6] ? "remove" : "add"]("hidden");
	id("timeMachineMult").innerHTML = format(getTimeMachineMult(),2) + "x";
	id("autoMenuOpen").classList[game.upgrade.auto.reduce((a,b) => a + b, 0) > 0 ? "remove" : "add"]("hidden");
	for (let i = 0; i < 6; i++) {
		id("auto"+i).classList[game.upgrade.auto[i] == 0 ? "add" : "remove"]("hidden");
	}
	id("auto7").classList[game.upgrade.auto[7] == 0 ? "add" : "remove"]("hidden");
	if (!game.upgrade.skill.includes(0) && !game.upgrade.auto.includes(0)) giveAchievement("stillF");
	id("switchScreenRight").classList[currentScreen == getScreenLimit() ? "add" : "remove"]("disabled");
	id("switchScreenLeft").classList[currentScreen == 0 ? "add" : "remove"]("disabled");
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
		id("skillUse"+i).innerHTML = format(game.skill.uses[i],0)
	}
	id("skillDesc0").innerHTML = `x${format(Math.pow(9, (game.upgrade.skill[0] * 0.5 + 1) * (game.skill.waitTimer == 0 && game.skill.durationTimer[3] > 0 ? (game.upgrade.skill[7] ? 3 : 2) : 1)) + 1,0)} and x${game.upgrade.skill[1] ? "" : "-"}${format(Math.pow(9, (game.upgrade.skill[0] * 0.5 + 1) * (game.skill.waitTimer == 0 && game.skill.durationTimer[3] > 0 ? (game.upgrade.skill[7] ? 3 : 2) : 1)) - 1,0)}`;
	id("skillDesc1").innerHTML = format(Math.pow(36, (0.5 * game.upgrade.skill[2] + 1) * (game.skill.waitTimer == 0 && game.skill.durationTimer[3] > 0 ? (game.upgrade.skill[7] ? 3 : 2) : 1)),0);
	id("skillDesc3").innerHTML = 120 - 10*game.upgrade.skill[6] + " second" + pluralCheck(120 - 10*game.upgrade.skill[6]);
	id("skillDesc3.1").innerHTML = game.upgrade.skill[7] ? "cube" : "square";
	id("couponClicked").innerHTML = game.skill.couponTotal;
	id("chargeFailed").innerHTML = format(game.skill.waitFailed,0);
	if (!game.skill.uses.includes(0)) giveAchievement("goodMath");
	if (game.skill.uses[0] >= 50) giveAchievement("sineNotSin");
	if (game.skill.uses[1] >= 50) giveAchievement("expExp");
	if (game.skill.uses[2] >= 50) giveAchievement("sponsoredHoney");
	if (game.skill.uses[3] >= 50) giveAchievement("madeACube");
}

function updateSineGraph() {
	let line = id("sinGraphLine");
	let sineMult = Math.sin(game.skill.durationTimer[0] / 250);
	if (game.upgrade.skill[1]) sineMult = Math.abs(sineMult);
	let percent = (1 - sineMult) / 2;
	line.style.top = percent * 100 + "%";
	line.style.backgroundColor = "rgb(" + (255*percent) + "," + (255*(1-percent)) + ",0)";
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
	id("overflowAmt").innerHTML = format(game.skill.boostOverflowAmt,0);
	if (game.skill.boostOverflowAmt >= 50) giveAchievement("expExpBoom");
}

function updateAuto() {
	for (let i = 0; i < 6; i++) {
		let percent = Math.min(game.auto.nextRun[i] / auto.baseInterval[i] * Math.pow(2,game.upgrade.auto[i]),1) * 100;
		id("autoBarValue"+i).style.width = percent + "%";
		id("autoBarLabel"+i).innerHTML = format(Math.min(percent,100),2) + "%";
	}
}

function updateAchievements() {
	for (let ach of document.getElementsByClassName("achDisp")) {
		if (game.achievements.includes(ach.id.slice(0,-3))) {
			ach.style.backgroundImage = "url(pics/ach/" + ach.id.slice(0,-3) + ".png)";
			id(ach.id+"Desc").innerHTML = "<span style='font-size:18px'>" + achData[ach.id.slice(0,-3)][0] + "</span><br>" + achData[ach.id.slice(0,-3)][1];
		} else {
			ach.style.backgroundImage = "url(pics/ach/unknownAch.png)";
			id(ach.id+"Desc").innerHTML = achData[ach.id.slice(0,-3)][2];
		}
	}
}

function redeemPoints(n, auto = false) {
	if (game.progress[n] >= getBarLength(n)) {
		if (!auto) game.afkLog = false;
		game.points[n] += getPointGain(n);
		game.lifetimePoints[n] += getPointGain(n);
		if (n == 1) {
			game.progress[0] = 0;
			game.points[0] = 0;
			for (let i = 0; i < 4; i++) {
				game.upgrade.normal[i] = 0;
			}
			if (game.sinceLastLP < game.fastestLP) game.fastestLP = game.sinceLastLP;
			if (game.sinceLastLP <= 5*60*1000) giveAchievement("logNoSlow");
			game.sinceLastLP = 0;
			if (game.afkLog) giveAchievement("afk");
			game.afkLog = true;
			updatePoints(0);
			updateUpg()
		}
		game.progress[n] = game.progress[n] % getBarLength(n);
		if (game.skill.durationTimer[1] > 0 && !game.skill.boostOverflow) game.skill.boostProgress += 500;
		if (game.skill.boostProgress > 10000) {
			game.skill.boostOverflow = true;
			game.skill.boostOverflowAmt++;
			game.skill.boostProgress = 10000;
		}
		if (game.skill.waitTimer > 0) {
			game.skill.waitTimer = 0;
			game.skill.durationTimer[3] = 0;
			game.skill.waitFailed++;
		}
		if (game.skill.waitFailed >= 25) giveAchievement("thereYet");
		if (game.points[0] < game.lowestPP) game.lowestPP = game.points[0];
		updatePoints(n);
		updateUpg();
	}
}

function buyUpgrade(n, type = "normal", auto = false) {
	if (game.points[upgrade[type].type[n]] >= getUpgPrice(n, type) && game.upgrade[type][n] < upgrade[type].limit[n]) {
		game.points[upgrade[type].type[n]] -= Math.floor(getUpgPrice(n, type));
		game.upgrade[type][n]++;
		if (!auto) game.afkLog = false;
		updateUpg();
		updatePoints(upgrade[type].type[n]);
		updateSkills();
	}
}

function bulkUpgrade(n, type = "normal", amount = 1, auto = false) {
	if (game.points[upgrade[type].type[n]] >= getUpgPrice(n, type) && game.upgrade[type][n] < upgrade[type].limit[n]) {
		let totalAmount = Math.min(Math.floor(Math.log(game.points[upgrade[type].type[n]]/getUpgPrice(n, type)*(upgrade[type].priceGrowth[n]-1)+1)/Math.log(upgrade[type].priceGrowth[n])),upgrade[type].limit[n],amount);
		if (isNaN(totalAmount)) totalAmount = Infinity;
		let totalPrice = Math.floor(getUpgPrice(n, type)*(1-Math.pow(upgrade[type].priceGrowth[n],totalAmount))/(1-upgrade[type].priceGrowth[n]));
		if (totalAmount >= 1) {
			game.points[upgrade[type].type[n]] -= totalPrice;
			game.upgrade[type][n] += totalAmount;
			if (!auto) game.afkLog = false;
			updateUpg();
			updatePoints(upgrade[type].type[n]);
			updateSkills();
		}
	}
}

function maxAll(type = "normal", auto = false) {
	for (let i = currentScreen*4; i < (currentScreen+1)*4; i++) {
		bulkUpgrade(i, type, Infinity, auto);
	}
}

function useSkill(n, auto = false) {
	if (game.skill.timer[n] <= 0 && game.upgrade.normal[4] > n) {
		game.skill.uses[n]++;
		game.skill.timer[n] = skill.cooldown[n] - 6000 * Math.min(Math.floor(game.lifetimePoints[1] / 5),20);
		game.skill.durationTimer[n] = skill.duration[n];
		if (n == 3) game.skill.waitTimer = 60*1000 - 5*1000*game.upgrade.skill[6];
		if (!auto) game.afkLog = false;
	}
}

function couponClick() {
	game.skill.couponTotal++;
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
	if (game.skill.couponTotal >= 200) giveAchievement("saveMoney")
	updateUpg();
}

function toggleAuto(n) {
	game.auto.isOn[n] = !game.auto.isOn[n];
	for (let i = 0; i < 6; i++) {
		id("autoToggle"+i).innerHTML = game.auto.isOn[i] ? "ON" : "OFF";
	}
}

const achData = {};

function newAchievement(name, ids, desc, hint) {
	let ach = document.createElement("div");
	id("achievementContainer").appendChild(ach);
	ach.id = ids + "Ach";
	ach.classList.add("achDisp", "tooltip");
	ach.style.backgroundImage = "url(pics/ach/unknownAch.png)";
	let tooltipData = document.createElement("span");
	ach.appendChild(tooltipData);
	tooltipData.classList.add("tooltipData");
	let tooltip = document.createElement("span");
	tooltipData.appendChild(tooltip)
	tooltip.id = ids + "AchDesc";
	tooltip.innerHTML = hint;
	achData[ids] = [name,desc,hint];
}

function allAchievements() {
	newAchievement("I thought it was just a progress bar!", "justABar", "Get a single progress point.", "Reading this is pointless");
	newAchievement("k", "k", "Reach 1000%.", "Keep playing");
	newAchievement("kk", "kk", "Reach 1e6%.", "Go further");
	newAchievement("kkkk- wait we skiped one", "kkkk", "Reach 1e12%.", "You'll get this eventually");
	newAchievement("Hey, this is going pretty fast", "goingFast", "Reach 1e50%.", "I don't think you'll need help with this one");
	newAchievement("Did something break?", "somethingBreak", "Reach Infinity%.", "You get this when you get a really high number-not-number");
	
	newAchievement("These are called log boosts", "theseAreLogBoosts", "Max out the first log boost.", "Progression-related achievement");
	newAchievement("What are these, runes?", "runes", "Unlock all log boosts.", "Just keep going");
	newAchievement("I feel boosted", "feelBoosted", "Max out all log boosts.", "You don't need a hint");
	
	newAchievement("I is good at maff", "goodMath", "Use all skills at least once.", "Don't miss out on a whole new mechanic");
	newAchievement("I don't sin, I sine", "sineNotSin", "Use the skill 'Sine' a total of 50 times.", "Do something a lot of times, may or may not be related to the previous achievement");
	newAchievement("Experienced Expert", "expExp", "Use the skill 'Exp' a total of 50 times.", "Do something a lot of times, may or may not be related to the previous achievement");
	newAchievement("This video is sponsored by Honey", "sponsoredHoney", "Use the skill 'Reci' a total of 50 times.", "Do something a lot of times, may or may not be related to the previous achievement");
	newAchievement("So many squares it made a cube", "madeACube", "Use the skill 'Squr' a total of 50 times.", "Do something a lot of times, may or may not be related to the previous achievement");
	
	newAchievement("Wrong way buddy", "wrongWay", "Have -Infinity progress points. Gained automatically if 'Absolute Value' is bought.", "Go the wrong way");
	newAchievement("Expert Explosioner", "expExpBoom", "Overflow a total of 50 times.", "Boom boom boom");
	newAchievement("I've gotta save those money!", "saveMoney", "Click a total of 200 coupons.", "Practice your reaction time");
	newAchievement("Are we there yet?", "thereYet", "Fail at charging 'Squr' a total of 25 times.", "Impatient");
	
	newAchievement("But my grades are still all F...", "stillF", "Buy all skill and automation upgrades in the first two screens at least once.", "One of each");
	newAchievement("Logarithmic progress doesn't feel so slow anymore!", "logNoSlow", "Redeem a logress point in 5 minutes or less.", "Be fast");
	newAchievement("afk", "afk", "Redeem a logress point without manually redeeming points, buying upgrades, or using skills.", "Idling paid off");
	newAchievement("That tickles!", "tickle", "Click this achievement.", "I'm ticklish");
	id("tickleAch").onclick = function(){giveAchievement("tickle")};
}

function giveAchievement(id) {
	if (!game.achievements.includes(id)) {
		game.achievements.push(id);
		notify("<span style='font-size:20px'>Achievement Got!</span><br>"+achData[id][0]);
		updateAchievements();
	}
}

function giveAllAchievements() {
	for (let ach of Object.keys(achData)) {
		giveAchievement(ach);
	}
}

function notify(message) {
	let note = document.createElement("button");
	note.classList.add("note");
	note.innerHTML = message;
	id("noteContainer").insertBefore(note, id("noteContainer").firstChild);
	note.onclick = function(){
		id("noteContainer").removeChild(note);
	}
}

document.addEventListener("keydown", function(input){
	let key = input.key;
	switch(key) {
		case "p":
			redeemPoints(0);
			break;
		case "m":
			maxAll(upgrade.list[game.upgrade.selected]);
			break;
		case ",":
			if (game.upgrade.selected < upgrade.list.length - 1) {
				game.upgrade.selected++;
			} else {
				game.upgrade.selected = 0;
			}
			while (id((upgrade.list[game.upgrade.selected]=="normal"?"u":upgrade.list[game.upgrade.selected]+"U")+"pgMenuOpen").classList.contains("hidden")) {
				if (game.upgrade.selected < upgrade.list.length - 1) {
					game.upgrade.selected++;
				} else {
					game.upgrade.selected = 0;
				}
			}
			id((upgrade.list[game.upgrade.selected]=="normal"?"u":upgrade.list[game.upgrade.selected]+"U")+"pgMenuOpen").style.transition = "none";
			id((upgrade.list[game.upgrade.selected]=="normal"?"u":upgrade.list[game.upgrade.selected]+"U")+"pgMenuOpen").style.boxShadow = "0px 0px 10px yellow inset";
			setTimeout(function(){
				id((upgrade.list[game.upgrade.selected]=="normal"?"u":upgrade.list[game.upgrade.selected]+"U")+"pgMenuOpen").style.transition = "";
				id((upgrade.list[game.upgrade.selected]=="normal"?"u":upgrade.list[game.upgrade.selected]+"U")+"pgMenuOpen").style.boxShadow = "none";
			},1);
			break;
		case ".":
			if (game.upgrade.selected > 0) {
				game.upgrade.selected--;
			} else {
				game.upgrade.selected = upgrade.list.length - 1;
			}
			while (id((upgrade.list[game.upgrade.selected]=="normal"?"u":upgrade.list[game.upgrade.selected]+"U")+"pgMenuOpen").classList.contains("hidden")) {
				if (game.upgrade.selected > 0) {
					game.upgrade.selected--;
				} else {
					game.upgrade.selected = upgrade.list.length - 1;
				}
			}
			id((upgrade.list[game.upgrade.selected]=="normal"?"u":upgrade.list[game.upgrade.selected]+"U")+"pgMenuOpen").style.transition = "none";
			id((upgrade.list[game.upgrade.selected]=="normal"?"u":upgrade.list[game.upgrade.selected]+"U")+"pgMenuOpen").style.boxShadow = "0px 0px 10px yellow inset";
			setTimeout(function(){
				id((upgrade.list[game.upgrade.selected]=="normal"?"u":upgrade.list[game.upgrade.selected]+"U")+"pgMenuOpen").style.transition = "";
				id((upgrade.list[game.upgrade.selected]=="normal"?"u":upgrade.list[game.upgrade.selected]+"U")+"pgMenuOpen").style.boxShadow = "none";
			},1);
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

function pluralCheck(n) {
	return n == 1 ? "" : "s";
}

function isEven(n) {
	return Math.floor(n/2) == n/2;
}

function format(n, toFixed = 0) {
	if (n == "Infinity") return Infinity;
	else if (-1e3 < n && n < 1e3) return n.toFixed(toFixed);
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
