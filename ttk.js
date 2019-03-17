(function() {

	var elements = {};
	var checkbox_element_groups = {};

	function calculate_stk_and_ttk(params, callback)
	{
		var health = params["health"];

		var distance = params["distance"];

		var damage = params["damage"];
		if (params["has-falloff-damage"]) {
			if (distance >= params["falloff-end"]) {
				damage = Math.trunc(params["falloff-damage"]);
			} else if (distance >= params["falloff-begin"]) {
				damage -=
					Math.trunc((damage - params["falloff-damage"]) /
					(params["falloff-end"] - params["falloff-begin"]) *
					(distance - params["falloff-begin"]));
			}
		}
	
		var ms_per_round = 0;
		if (params["rate-unit"] == "rpm") {
			ms_per_round = Math.trunc(1.0 / params["rate"] * 60.0 * 1000.0);
		} else if (params["rate-unit"] == "rps") {
			ms_per_round = Math.trunc(1.0 / params["rate"] * 1000.0);
		} else if (params["rate-unit"] == "spr") {
			ms_per_round = Math.trunc(params["rate"] * 1000.0);
		} else if (params["rate-unit"] == "mpr") {
			ms_per_round = Math.trunc(params["rate"]);
		}

		var armor = 0;
		var armor_protection = 1.0;
		if (params["has-armor"]) {
			armor = params["armor"];
			armor_protection = params["armor-protection"];
		}

		var projectile_queue = [];
		var projectile_based = params["projectile-based"];
		var position = 0.0;
		var speed = Infinity;
		var acceleration = 0.0;
		if (projectile_based) {
			position = params["position"];
			speed = params["speed"];
			acceleration = params["acceleration"];
		}
		var time_to_impact = Number(Number(distance / speed).toFixed(3));

		var max_ammo = 0;
		var reload_time = 0;
		var reload_count = 0;
		var uses_ammo = params["uses-ammo"];
		if (uses_ammo) {
			max_ammo = params["ammo-count"];
			reload_time = params["reload-time"];
		}
		var ammo = max_ammo;
		
		var weapon_status = "ready";
		var weapon_refire_completion_time = 0;
		var weapon_reload_completion_time = 0;
		var rounds_fired = 0;
		var rounds_hit = 0;
		var ms = 0;
		
	
		function fire_weapon()
		{
			var projectile = {
				"number": rounds_fired + 1,
				"time": ms,
				"position": position,
				"speed": speed,
				"acceleration": acceleration
			};
			projectile_queue.push(projectile);
			++rounds_fired;
			if (uses_ammo) {
				--ammo;
			}
			if (uses_ammo && ammo == 0) {
					weapon_status = "reloading";
					weapon_reload_completion_time = ms + reload_time * 1000;
					console.log(ms);
					console.log(weapon_reload_completion_time);
			} else {
				weapon_status = "refiring";
				weapon_refire_completion_time = ms + ms_per_round;
			}
		}

		function update_weapon_status()
		{
			if (weapon_status == "reloading" && ms >= weapon_reload_completion_time) {
				ammo = max_ammo;
				++reload_count;
				weapon_status = "ready";
			} else if (weapon_status == "refiring" && ms >= weapon_refire_completion_time) {
				weapon_status = "ready";
			}
		}

		function deal_damage()
		{
			++rounds_hit;
			var armor_damage = Math.ceil(damage * armor_protection);
			if (armor_damage > armor) {
				armor_damage = armor;
			}
			armor -= armor_damage;
			var health_damage = damage - armor_damage;
			if (health_damage > health) {
				health_damage = health;
			}
			health -= health_damage;
		}

		function update_projectile_queue()
		{
			if (projectile_queue.length == 0) {
				return;
			}
			projectile_queue.forEach(function(p) {
				if (isFinite(p["speed"])) {
					var delta_seconds = (ms - p["time"]) / 1000.0;
					p["position"] += delta_seconds * p["speed"];
					p["speed"] += delta_seconds * p["acceleration"];
					p["time"] = ms;
				}
			});
			while (projectile_queue.length > 0) {
				var p = projectile_queue[0];
				if (!isFinite(p["speed"]) || p["position"] >= distance) {
					deal_damage();
					projectile_queue.shift();
				} else {
					break;
				}
			}
		}

		if (health > 0) {
			while (true) {
				if (weapon_status == "ready") {
					fire_weapon();
				}
				update_projectile_queue();
				if (health == 0) {
					break;
				} else {
					ms += 1;
					update_weapon_status();
				}
			}
		}
		return [ time_to_impact, damage, rounds_hit, reload_count, ms / 1000.0 ];
	};

	function update_disabled_for_checkbox_group(k)
	{
		var checked = Boolean(elements[k].checked);
		checkbox_element_groups[k].forEach(function(e) {
			elements[e].disabled = !checked;
			elements[e].required = checked;
		});
	};

	function initialize()
	{
		[
			"form",
			"reset",
			"health",
			"damage",
			"rate",
			"rate-unit",
			"has-armor",
			"armor",
			"armor-protection",
			"projectile-based",
			"distance",
			"position",
			"speed",
			"acceleration",
			"has-falloff-damage",
			"falloff-damage",
			"falloff-begin",
			"falloff-end",
			"uses-ammo",
			"ammo-count",
			"reload-time",
			"include-simulation-log",
			"submit",
			"time-to-impact",
			"damage-on-impact",
			"stk",
			"reloads-required",
			"ttk",
			"simulation-log"
		].forEach(function(x) {
			elements[x] = document.getElementById(x);
		});
		checkbox_element_groups = {
			"has-armor": [ "armor", "armor-protection" ],
			"projectile-based": [ "position", "speed", "acceleration" ],
			"has-falloff-damage": [ "falloff-damage", "falloff-begin", "falloff-end" ],
			"uses-ammo": [ "ammo-count", "reload-time" ]
		};
		Object.keys(checkbox_element_groups).forEach(function(k) {
			update_disabled_for_checkbox_group(k);
			elements[k].addEventListener("input", function() {
				update_disabled_for_checkbox_group(k);
			});
		});
		elements["form"].addEventListener("reset", function() {
			Object.keys(checkbox_element_groups).forEach(function(k) {
				elements[k].checked = false;
				update_disabled_for_checkbox_group(k);
			});
		});
		elements["form"].addEventListener("submit", function(e) {
			e.preventDefault();
			var callback = null;
			if (elements["include-simulation-log"].checked) {
				callback = ttk_progress;
			}
			var result = calculate_stk_and_ttk({
				"health": Number(elements["health"].value),
				"damage": Number(elements["damage"].value),
				"rate": Number(elements["rate"].value),
				"rate-unit": String(elements["rate-unit"].value),
				"distance": Number(elements["distance"].value),
				"has-armor": Boolean(elements["has-armor"].checked),
				"armor": Number(elements["armor"].value),
				"armor-protection": Number(elements["armor-protection"].value),
				"projectile-based": Boolean(elements["projectile-based"].checked),
				"position": Number(elements["position"].value),
				"speed": Number(elements["speed"].value),
				"acceleration": Number(elements["acceleration"].value),
				"has-falloff-damage": Boolean(elements["has-falloff-damage"].checked),
				"falloff-damage": Number(elements["falloff-damage"].value),
				"falloff-begin": Number(elements["falloff-begin"].value),
				"falloff-end": Number(elements["falloff-end"].value),
				"uses-ammo": Boolean(elements["uses-ammo"].checked),
				"ammo-count": Number(elements["ammo-count"].value),
				"reload-time": Number(elements["reload-time"].value)
			}, callback);
			elements["time-to-impact"].value = result[0];
			elements["damage-on-impact"].value = result[1];
			elements["stk"].value = result[2];
			elements["reloads-required"].value = result[3];
			elements["ttk"].value = result[4];
		});
	};

	initialize();
})();
