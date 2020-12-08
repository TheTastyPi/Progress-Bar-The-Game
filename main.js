var lastFrame = 0;

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
	baseInterval: [60*1000, 60*1000, 60*1000, 60*1000, 15*1000, 60*60*1000]
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
			tooltipText.classList.add("tooltipText",game.currentTheme);
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
	
	for (let i = 0; i < 40; i++) {
		id("battleInvSpace"+i).addEventListener("click",function(mouse){
			if (mouse.ctrlKey) {
				if (game.battle.invSelected != undefined && i < 36) switchItem(game.battle.invSelected,i);
			} else if (mouse.shiftKey) {
				if (game.battle.inventory[i] != 0) useItem(i);
			} else {
				selectInvSpace(i);
			}
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
	let area = areaList[game.battle.currentArea];
	let player = game.battle.player;
	let enemy = game.battle.enemy
	if (player.hp < getPlayerMaxHP()) {
		player.hp += sinceLastFrame*getPlayerHPRegen()/1000;
	}
	if (player.hp > getPlayerMaxHP()) player.hp = getPlayerMaxHP();
	if (player.sp < getPlayerMaxSP()) {
		player.sp += sinceLastFrame*getPlayerSPRegen()/1000;
	}
	if (player.sp > getPlayerMaxSP()) player.sp = getPlayerMaxSP();
	for (let i in player.cooldown) {
		if (player.cooldown[i] > 0) {
			player.cooldown[i] -= sinceLastFrame;
			if (player.cooldown[i] < 0) player.cooldown[i] = 0;
		}
	}
	enemy.cooldown -= sinceLastFrame;
	if (enemy.cooldown <= 0) {
		enemyAttack();
	}
	if (game.battle.currentEnemy == 0) {
		game.battle.nextSpawn -= sinceLastFrame;
	}
	if (game.battle.nextSpawn <= 0) {
		game.battle.currentEnemy = area.spawnType[Math.floor(Math.random() * area.spawnType.length)];
		let currentEnemyStat = enemyList[game.battle.currentEnemy];
		game.battle.enemy.hp = currentEnemyStat.maxHP;
		game.battle.enemy.cooldown = currentEnemyStat.cooldown;
		game.battle.enemy.effLevel = [0,0,0,0,0,0,0,0];
		game.battle.enemy.effDuration = [0,0,0,0,0,0,0,0];
		game.battle.nextSpawn = area.spawnRate;
	}
	updateBattleMain();
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
		id(name+"Menu").classList.add("topOpen");
		setTimeout(function(){
			id(name+"Menu").style.top = "0";
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

function toggleBattleTab(tab) {
	if (document.getElementsByClassName("battleOpen").length == 0) {
		id("battle"+tab+"Tab").classList.add("battleOpen");
	} else if (!id("battle"+tab+"Tab").classList.contains("battleOpen")) {
		for (let tab of document.getElementsByClassName("battleTab")) {
			tab.classList.remove("battleOpen");
		}
		id("battle"+tab+"Tab").classList.add("battleOpen");
	} else {
		id("battle"+tab+"Tab").classList.remove("battleOpen");
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
	if (game.points[upgrade[type].type[n]] >= Math.floor(getUpgPrice(n, type)) && game.upgrade[type][n] < upgrade[type].limit[n]) {
		game.points[upgrade[type].type[n]] -= Math.floor(getUpgPrice(n, type));
		game.upgrade[type][n]++;
		if (!auto) game.afkLog = false;
		updateUpg();
		updatePoints(upgrade[type].type[n]);
		updateSkills();
	}
}

function bulkUpgrade(n, type = "normal", amount = 1, auto = false) {
	if (game.points[upgrade[type].type[n]] >= Math.floor(getUpgPrice(n, type)) && game.upgrade[type][n] < upgrade[type].limit[n]) {
		let totalAmount;
		let totalPrice;
		if (upgrade[type].priceGrowth[n] == 1) {
			totalAmount = Math.min(Math.floor(game.points[upgrade[type].type[n]]/getUpgPrice(n, type)),upgrade[type].limit[n],amount);
			totalPrice = totalAmount*getUpgPrice(n, type);
		} else {
			totalAmount = Math.min(Math.floor(Math.log(game.points[upgrade[type].type[n]]/getUpgPrice(n, type)*(upgrade[type].priceGrowth[n]-1)+1)/Math.log(upgrade[type].priceGrowth[n])),upgrade[type].limit[n],amount);
			totalPrice = Math.floor(getUpgPrice(n, type)*(1-Math.pow(upgrade[type].priceGrowth[n],totalAmount))/(1-upgrade[type].priceGrowth[n]));
		}
		if (isNaN(totalAmount)) totalAmount = Infinity;
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
	note.classList.add("note", game.currentTheme);
	note.innerHTML = message;
	id("noteContainer").insertBefore(note, id("noteContainer").firstChild);
	note.onclick = function(){
		id("noteContainer").removeChild(note);
	}
}

document.addEventListener("keydown", function(input){
	let key = input.code;
	switch(key) {
		case "KeyP":
			redeemPoints(0);
			break;
		case "KeyM":
			maxAll(upgrade.list[game.upgrade.selected]);
			break;
		case "Period":
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
		case "Comma":
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
		case "KeyL":
			redeemPoints(1);
			break;
		case "ArrowLeft":
			if (game.lifetimeProgress[1] >= getBarLength(1)/100) switchScreen("backward");
			break;
		case "ArrowRight":
			if (game.lifetimeProgress[1] >= getBarLength(1)/100) switchScreen("forward");
			break;
		case "Digit1":
		case "Digit2":
		case "Digit3":
		case "Digit4":
			useSkill(key[key.length-1]-1);
			break;
		case "KeyZ":
			playerAttack(0);
			break;
		case "KeyX":
			playerAttack(1);
			break;
		case "KeyC":
			playerAttack(2);
			break;
		case "KeyV":
			playerAttack(3);
			break;
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
