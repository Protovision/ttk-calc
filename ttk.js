(function() {
	function calculate_stk_and_ttk(health,
									armor,
									armor_protection,
									damage,
									rpm,
									ammo_count,
									reload_time,
									infinite_ammo,
									iter_cb)
	{
		var seconds_per_round = 1.0 / (rpm/60.0);
		var seconds_elapsed = 0.0;
		var rounds_fired = 0;
		var ammo_remaining = ammo_count;
		if (health > 0) {
			while (true) {
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
				++rounds_fired;
				if (!infinite_ammo) {
					--ammo_remaining;
				}
				if (iter_cb != null) {
					iter_cb(rounds_fired, seconds_elapsed, ammo_remaining, infinite_ammo, health, armor);
				}
				if (health == 0.0) {
					break;
				} else {
					if (!infinite_ammo && ammo_remaining == 0) {
						ammo_remaining = ammo_count;
						seconds_elapsed += reload_time;
					} else {
						seconds_elapsed += seconds_per_round;
					}
				}
			}
		}
		return [ rounds_fired, seconds_elapsed ];
	};
	/*var reset_button = document.getElementById("reset");*/
	var health_input = document.getElementById("health");
	var armor_input = document.getElementById("armor");
	var armor_protection_input = document.getElementById("armor-protection");
	var damage_input = document.getElementById("damage");
	var rate_input = document.getElementById("rate");
	var rate_unit_input = document.getElementById("rate-unit");
	var ammo_input = document.getElementById("ammo");
	var infinite_ammo_input = document.getElementById("infinite-ammo");
	var reload_input = document.getElementById("reload");
	var include_combat_table_input = document.getElementById("include-combat-table");
	var form = document.querySelector("body>main>form");
	var stk_output = document.getElementById("stk");
	var ttk_output = document.getElementById("ttk");
	var combat_table_output = document.getElementById("combat-table");
	function calculation_iteration_callback(shots_fired, 
											time_elapsed,
											ammo_remaining,
											infinite_ammo,
											health_remaining,
											armor_remaining)
	{
		var row = document.createElement("tr");
		var c1 = document.createElement("td");
		c1.appendChild(document.createTextNode(shots_fired));
		var c2 = document.createElement("td");
		c2.appendChild(document.createTextNode(time_elapsed.toFixed(6)));
		var c3 = document.createElement("td");
		if (infinite_ammo) {
			c3.appendChild(document.createTextNode("-"));
		} else {
			c3.appendChild(document.createTextNode(ammo_remaining));
		}
		var c4 = document.createElement("td");
		c4.appendChild(document.createTextNode(health_remaining));
		var c5 = document.createElement("td");
		c5.appendChild(document.createTextNode(armor_remaining));
		row.appendChild(c1);
		row.appendChild(c2);
		row.appendChild(c3);
		row.appendChild(c4);
		row.appendChild(c5);
		combat_table_output.appendChild(row);
	};
	/*
	reset.addEventListener("click", function() {
		health_input.value = "";
		armor_input.value = "0";
		armor_protection_input.value = "0.66";
		damage_input.value = "";
		rpm_input.value = "";
	});
	*/
	function apply_infinite_ammo_value()
	{
		if (infinite_ammo_input.checked) {
			ammo_input.disabled = reload_input.disabled = true;
			ammo_input.required = reload_input.required = false;
			ammo_input.value = reload_input.value = "";
		} else {
			ammo_input.disabled = reload_input.disabled = false;
			ammo_input.required = reload_input.required = true;
		}
	}
	apply_infinite_ammo_value();
	infinite_ammo_input.addEventListener("change", function() {
		apply_infinite_ammo_value();
	});
	form.addEventListener("submit", function(e) {
		e.preventDefault();
		while (combat_table_output.childElementCount > 0) {
			combat_table_output.removeChild(combat_table_output.lastChild);
		}
		if (include_combat_table_input.checked) {
			var first_row = document.createElement("tr");
			var c1 = document.createElement("th");
			c1.appendChild(document.createTextNode("Shots fired"));
			var c2 = document.createElement("th");
			c2.appendChild(document.createTextNode("Time elapsed"));
			var c3 = document.createElement("th");
			c3.appendChild(document.createTextNode("Ammo remaining"));
			var c4 = document.createElement("th");
			c4.appendChild(document.createTextNode("Health remaining"));
			var c5 = document.createElement("th");
			c5.appendChild(document.createTextNode("Armor remaining"));
			first_row.appendChild(c1);
			first_row.appendChild(c2);
			first_row.appendChild(c3);
			first_row.appendChild(c4);
			first_row.appendChild(c5);
			combat_table_output.appendChild(first_row);
		}
		var health = Number(health_input.value);
		var armor = Number(armor_input.value);
		var armor_protection = Number(armor_protection_input.value);
		var damage = Number(damage_input.value);
		var rate = Number(rate_input.value);
		var rate_unit = rate_unit_input.value;
		var rpm = 0.0;
		if (rate_unit == "rpm") {
			rpm = rate;
		} else if (rate_unit == "rps") {
			rpm = rate * 60.0;
		} else if (rate_unit == "spr") {
			rpm = 1.0 / rate * 60.0;
		} else if (rate_unit == "mpr") {
			rpm = 1000.0 / rate * 60.0;
		}
		var infinite_ammo = Boolean(infinite_ammo_input.checked);
		var ammo = 0;
		var reload = 0.0;
		if (!infinite_ammo) {
			ammo = Number(ammo_input.value);
			reload = Number(reload_input.value);
		}
		var include_combat_table = include_combat_table_input.checked;
		var calc_cb = null;
		if (include_combat_table) {
			calc_cb = calculation_iteration_callback;
		}
		var result = calculate_stk_and_ttk(health,
									armor,
									armor_protection,
									damage,
									rpm,
									ammo,
									reload,
									infinite_ammo,
									calc_cb);
		stk_output.value = result[0].toFixed(6);
		ttk_output.value = result[1].toFixed(6);
	});
})();
