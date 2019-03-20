(function() {
	
	var elements = {};
	var checkbox_element_groups = {};
	var themes = {};

	function calculate_results(params)
	{
		var armor = 0;
		var armor_protection = 1;
		if (params["target-has-armor"]) {
			armor = params["target-armor"];
			armor_protection = params["target-armor-protection"];
		}
		var health = params["target-health"];
		var ammo_capacity = Infinity;
		var reload_time = 0.0;
		if (params["weapon-uses-ammo"]) {
			ammo_capacity = params["weapon-ammo-capacity"];
			reload_time = params["weapon-reload-time"];
		}
		var distance = params["target-distance"];
		var damage = params["weapon-damage"];
		if (params["weapon-has-damage-falloff"]) {
			var min_falloff_distance = params["weapon-min-falloff-distance"];
			var max_falloff_distance = params["weapon-max-falloff-distance"];
			var min_max_damage = params["weapon-min-max-damage"];
			if (distance > max_falloff_distance) {
				damage = min_max_damage;
			} else if (distance > min_falloff_distance) {
				damage -= Math.floor(
					(damage-min_max_damage) /
						(max_falloff_distance-min_falloff_distance) *
					(distance - min_falloff_distance)
				);
			}
		}
		health += Math.ceil(armor_protection * armor);
		var reload_count = 0;
		if (isFinite(ammo_capacity)) {
			reload_count = Math.floor(health / (damage*ammo_capacity));
		}
		var shots_to_kill = Math.ceil(health / damage);
		var seconds_per_shot = params["weapon-rate-of-fire"];
		var rate_of_fire_unit = params["weapon-rate-of-fire-unit"];
		if (rate_of_fire_unit == "rpm") {
			seconds_per_shot = 1.0 / seconds_per_shot * 60.0;
		} else if (rate_of_fire_unit == "rps") {
			seconds_per_shot = 1.0 / seconds_per_shot;
		} else if (rate_of_fire_unit == "mpr") {
			seconds_per_shot /= 1000.0;
		}
		var damage_per_second = damage * (1.0 / seconds_per_shot);
		reload_time *= reload_count;
		var shoot_time = seconds_per_shot * (shots_to_kill-reload_count-1);
		var time_to_impact = 0.0;
		if (params["weapon-is-projectile-based"]) {
			var speed = params["weapon-projectile-speed"];
			var acceleration = params["weapon-projectile-acceleration"];
			if (acceleration == 0.0) {
				time_to_impact = distance / speed;
			} else {
				time_to_impact =
					-(speed/acceleration) +
					Math.sqrt(
						Math.pow(speed, 2)/Math.pow(acceleration, 2) +
						(2*distance)/acceleration
					);
			}
		}
		var time_to_kill = time_to_impact + shoot_time + reload_time;
		return {
			"shots-to-kill": shots_to_kill,
			"time-to-impact": time_to_impact,
			"damage-on-impact": damage,
			"damage-per-second": damage_per_second,
			"time-spent-firing": shoot_time,
			"time-spent-reloading": reload_time,
			"total-time-to-kill": time_to_kill
		};
	};

	function apply_theme(name)
	{
		var t = themes[name];
		document.body.style.color = t[0];
		document.body.style.backgroundColor = t[1];
		elements["theme"].value = name;
		localStorage.setItem("theme", name);
	};

	function add_event_listener_for_select(elem, func)
	{
		elem.addEventListener("input", func);
		elem.addEventListener("change", func);
	}

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
			"theme",
			"form",
			"reset",
			"target-health",
			"weapon-damage",
			"weapon-rate-of-fire",
			"weapon-rate-of-fire-unit",
			"target-distance",
			"target-has-armor",
			"target-armor",
			"target-armor-protection",
			"weapon-is-projectile-based",
			"weapon-projectile-speed",
			"weapon-projectile-acceleration",
			"weapon-has-damage-falloff",
			"weapon-min-falloff-distance",
			"weapon-max-falloff-distance",
			"weapon-min-max-damage",
			"weapon-uses-ammo",
			"weapon-ammo-capacity",
			"weapon-reload-time",
			"shots-to-kill",
			"time-to-impact",
			"damage-on-impact",
			"damage-per-second",
			"time-spent-firing",
			"time-spent-reloading",
			"total-time-to-kill"
		].forEach(function(x) {
			elements[x] = document.getElementById(x);
		});
		themes = {
			"light": [ "rgb(28,28,28)", "rgb(227,227,227)" ],
			"dark": [ "rgb(227,227,227)", "rgb(28,28,28)" ],
			"light-blue": [ "rgb(28,28,28)", "rgb(159,193,249)" ],
			"dark-blue": [ "rgb(227,227,227)", "rgb(3,20,48)" ]
		};
		var theme_value = localStorage.getItem("theme");
		if (theme_value != null) {
			apply_theme(theme_value);
		} else {
			apply_theme(elements["theme"].value);
		}
		add_event_listener_for_select(elements["theme"], function() {
			apply_theme(elements["theme"].value);
		});
		checkbox_element_groups = {
			"target-has-armor": [
				"target-armor",
				"target-armor-protection"
			],
			"weapon-is-projectile-based": [
				"weapon-projectile-speed",
				"weapon-projectile-acceleration"
			],
			"weapon-has-damage-falloff": [
				"weapon-min-falloff-distance",
				"weapon-max-falloff-distance",
				"weapon-min-max-damage"
			],
			"weapon-uses-ammo": [
				"weapon-ammo-capacity",
				"weapon-reload-time"
			]
		};
		Object.keys(checkbox_element_groups).forEach(function(k) {
			update_disabled_for_checkbox_group(k);
			add_event_listener_for_select(elements[k], function() {
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
			var results = calculate_results({
				"target-health":
					Number(elements["target-health"].value),
				"weapon-damage":
					Number(elements["weapon-damage"].value),
				"weapon-rate-of-fire":
					Number(elements["weapon-rate-of-fire"].value),
				"weapon-rate-of-fire-unit":
					String(elements["weapon-rate-of-fire-unit"].value),
				"target-distance":
					Number(elements["target-distance"].value),
				"target-has-armor":
					Boolean(elements["target-has-armor"].checked),
				"target-armor":
					Number(elements["target-armor"].value),
				"target-armor-protection":
					Number(elements["target-armor-protection"].value),
				"weapon-is-projectile-based":
					Boolean(elements["weapon-is-projectile-based"].checked),
				"weapon-projectile-speed":
					Number(elements["weapon-projectile-speed"].value),
				"weapon-projectile-acceleration":
					Number(elements["weapon-projectile-acceleration"].value),
				"weapon-has-damage-falloff":
					Boolean(elements["weapon-has-damage-falloff"].checked),
				"weapon-min-falloff-distance":
					Number(elements["weapon-min-falloff-distance"].value),
				"weapon-max-falloff-distance":
					Number(elements["weapon-max-falloff-distance"].value),
				"weapon-min-max-damage":
					Number(elements["weapon-min-max-damage"].value),
				"weapon-uses-ammo":
					Boolean(elements["weapon-uses-ammo"].checked),
				"weapon-ammo-capacity":
					Number(elements["weapon-ammo-capacity"].value),
				"weapon-reload-time":
					Number(elements["weapon-reload-time"].value)
			});
			Object.keys(results).forEach(function(k) {
				console.log(k);
				elements[k].value = Number(results[k]).toFixed(6);
			});
		});
	};

	initialize();
})();
