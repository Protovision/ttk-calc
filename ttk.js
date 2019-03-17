(function() {

	var elements = {};
	var checkbox_element_groups = {};

	function calculate_ttk(params)
	{
		var effective_health = params["health"];
		if (params["has-armor"]) {
			effective_health += Math.ceil(params["armor"] *
				params["armor-protection"]);
		}
		var distance = params["distance"];
		var time_to_impact = 0.0;
		if (params["projectile-based"]) {
			var speed = params["speed"];
			var acceleration = params["acceleration"];
			if (acceleration == 0.0) {
				time_to_impact = distance / speed;
			} else {
				time_to_impact = -(speed/acceleration) +
					Math.sqrt(Math.pow(speed,2)/Math.pow(acceleration,2)+
					(2*distance)/acceleration);
			}
		}
		var damage_on_impact = params["damage"];
		if (params["has-falloff-damage"]) {
			var min_falloff_distance = params["falloff-begin"];
			var max_falloff_distance = params["falloff-end"];
			var min_damage = params["falloff-damage"];
			var max_damage = params["damage"];
			if (distance >= max_falloff_distance) {
				damage_on_impact = min_damage;
			} else if (distance >= min_falloff_distance) {
				damage_on_impact = Math.trunc(max_damage - 
					(max_damage-min_damage)/
					(max_falloff_distance-min_falloff_distance)*
					(distance-min_falloff_distance));
			}
		}
		var shots_to_kill = Math.ceil(effective_health / damage_on_impact);
		var reload_count = 0;
		var reload_time = 0.0;
		if (params["uses-ammo"]) {
			reload_count = Math.floor(effective_health /
				(params["ammo-count"]*damage_on_impact));
			reload_time = params["reload-time"];
		};
		var seconds_per_round = 0.0;
		if (params["rate-unit"] == "rpm") {
			seconds_per_round = 1.0 / params["rate"] * 60.0;
		} else if (params["rate-unit"] == "rps") {
			seconds_per_round = 1.0 / params["rate"];
		} else if (params["rate-unit"] == "mpr") {
			seconds_per_round = params["rate"] / 1000.0;
		} else {
			seconds_per_round = params["rate"];
		}
		var time_firing = (shots_to_kill-1-reload_count) * seconds_per_round;
		var time_reloading = reload_count * reload_time;
		var time_to_kill = time_to_impact + time_firing + time_reloading;
		return [ time_to_impact, damage_on_impact, shots_to_kill, reload_count,
			time_to_kill ];
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
			"projectile-based": [ "speed", "acceleration" ],
			"has-falloff-damage": [ "falloff-damage", "falloff-begin", 
				"falloff-end" ],
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
			var result = calculate_ttk({
				"health": Number(elements["health"].value),
				"damage": Number(elements["damage"].value),
				"rate": Number(elements["rate"].value),
				"rate-unit": String(elements["rate-unit"].value),
				"distance": Number(elements["distance"].value),
				"has-armor": Boolean(elements["has-armor"].checked),
				"armor": Number(elements["armor"].value),
				"armor-protection": Number(elements["armor-protection"].value),
				"projectile-based":
					Boolean(elements["projectile-based"].checked),
				"speed": Number(elements["speed"].value),
				"acceleration": Number(elements["acceleration"].value),
				"has-falloff-damage":
					Boolean(elements["has-falloff-damage"].checked),
				"falloff-damage": Number(elements["falloff-damage"].value),
				"falloff-begin": Number(elements["falloff-begin"].value),
				"falloff-end": Number(elements["falloff-end"].value),
				"uses-ammo": Boolean(elements["uses-ammo"].checked),
				"ammo-count": Number(elements["ammo-count"].value),
				"reload-time": Number(elements["reload-time"].value)
			});
			elements["time-to-impact"].value = Number(result[0]).toFixed(6);
			elements["damage-on-impact"].value = Number(result[1]).toFixed(6);
			elements["stk"].value = Number(result[2]).toFixed(6);
			elements["reloads-required"].value = Number(result[3]).toFixed(6);
			elements["ttk"].value = Number(result[4]).toFixed(6);
		});
	};

	initialize();
})();
