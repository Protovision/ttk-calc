(function() {
	function calculate_ttk(health, armor, armor_protection, damage, rpm, iter_cb) {
		var seconds_per_round = 1.0 / (rpm/60.0);
		var seconds_elapsed = 0.0;
		var rounds_fired = 0.0;
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
				if (iter_cb != null) {
					iter_cb(rounds_fired, seconds_elapsed, health, armor);
				}
				if (health == 0.0) {
					break;
				} else {
					seconds_elapsed += seconds_per_round;
				}
			}
		}
		return seconds_elapsed;
	};
	/*var reset_button = document.getElementById("reset");*/
	var health_input = document.getElementById("health");
	var armor_input = document.getElementById("armor");
	var armor_protection_input = document.getElementById("armor-protection");
	var damage_input = document.getElementById("damage");
	var rpm_input = document.getElementById("rpm");
	var include_table_input = document.getElementById("include-table");
	var form = document.getElementById("ttk-form");
	var result_element = document.getElementById("result");
	var ttk_table = document.getElementById("ttk-table");
	function ttk_iteration(shot_number, time_elapsed, health_remaining, armor_remaining) {
		var row = document.createElement("tr");
		var shot_number_data = document.createElement("td");
		shot_number_data.appendChild(document.createTextNode(shot_number));
		var time_elapsed_data = document.createElement("td");
		time_elapsed_data.appendChild(document.createTextNode(time_elapsed.toFixed(6)));
		var health_remaining_data = document.createElement("td");
		health_remaining_data.appendChild(document.createTextNode(health_remaining));
		var armor_remaining_data = document.createElement("td");
		armor_remaining_data.appendChild(document.createTextNode(armor_remaining));
		row.appendChild(shot_number_data);
		row.appendChild(time_elapsed_data);
		row.appendChild(health_remaining_data);
		row.appendChild(armor_remaining_data);
		ttk_table.appendChild(row);
	}
	/*
	reset.addEventListener("click", function() {
		health_input.value = "";
		armor_input.value = "0";
		armor_protection_input.value = "0.66";
		damage_input.value = "";
		rpm_input.value = "";
	});
	*/
	form.addEventListener("submit", function(e) {
		e.preventDefault();
		while (ttk_table.childElementCount > 0) {
			ttk_table.removeChild(ttk_table.lastChild);
		}
		if (include_table_input.checked) {
			var first_row = document.createElement("tr");
			var c1 = document.createElement("th");
			c1.appendChild(document.createTextNode("Shot number"));
			var c2 = document.createElement("th");
			c2.appendChild(document.createTextNode("Time elapsed"));
			var c3 = document.createElement("th");
			c3.appendChild(document.createTextNode("Health remaining"));
			var c4 = document.createElement("th");
			c4.appendChild(document.createTextNode("Armor remaining"));
			first_row.appendChild(c1);
			first_row.appendChild(c2);
			first_row.appendChild(c3);
			first_row.appendChild(c4);
			ttk_table.appendChild(first_row);
		}
		var health = Number(health_input.value);
		var armor = Number(armor_input.value);
		var armor_protection = Number(armor_protection_input.value);
		var damage = Number(damage_input.value);
		var rpm = Number(rpm_input.value);
		if (include_table_input.checked) {
			var ttk = calculate_ttk(health, armor, armor_protection, damage, rpm, ttk_iteration);
		} else {
			var ttk = calculate_ttk(health, armor, armor_protection, damage, rpm, null);
		}
		if (result_element.firstChild != null) {
			result_element.removeChild(result_element.firstChild);
		}
		result_element.appendChild(document.createTextNode(ttk.toFixed(6) + " seconds"));
	});
})();
