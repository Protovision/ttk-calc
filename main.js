(
	() => {
		const parameters
		= [
			["playerAccuracy" , 100]
			, ["gunSpreadReduction" , 0]
			, ["damageBoost" , 0]
			, ["fireRateBoost" , 0]
			, ["reloadTimeReduction" , 0]
			, ["clipAmmoBoost" , 0]
			, ["damage" , 10]
			, ["fireRate" , 600]
			, ["fireRateUnit" , 0]
			, ["spread" , 0]
			, ["spreadUnit" , 0]
			, ["clipAmmo" , 50]
			, ["reloadTime" , 0]
			, ["distance" , 100]
			, ["width" , 0.396]
			, ["height" , 1.82]
			, ["health" , 100]
			, ["armor" , 0]
			, ["armorAbsorption" , 66]
			, ["healthRegeneration" , 0]
			, ["armorRegeneration" , 0]
			, ["damageReduction" , 0]
		];
		const calculate
		= (input) => {
			/* Effective clip ammo */
			const eClipAmmo
			= input . clipAmmo + input . clipAmmo * input . clipAmmoBoost;
			/* Effective reload time */
			const eReloadTime
			= input . reloadTime / (1.0 + input . reloadTimeReduction);
			/* Effective burst fire rate */
			const eBurstRate
			= input . fireRate + input . fireRate * input . fireRateBoost;
			/* Time spent firing before reload */
			const eSecondsPerBurst
			= 1.0 / eBurstRate * eClipAmmo;
			/* Effective sustained fire rate */
			const eSustainedRate
			= eBurstRate 
			* (eSecondsPerBurst / (eSecondsPerBurst + eReloadTime));
			/* Effective damage */
			const eDamage
			= input . damage 
			+ input . damage 
			* (input . damageBoost - input . damageReduction);
			/* Surface area of target */
			const tArea = input . width * input . height;
			/* Radius of impact circle */
			const cRadius
			= input . distance 
			* window . Math . sin(input . spread / 2.0)
			/ window . Math . cos(input . spread / 2.0);
			/* Surface area of bullet cone on impact */
			const cArea
			= (window . Math . PI * window . Math . pow(cRadius , 2.0))
			/ (1.0 + input . gunSpreadReduction);
			/* Effective gun accuracy */
			const eGunAcc
			= (
				cArea == 0.0 || tArea > cArea
				? 1.0
				: tArea / cArea
			);
			/* Effective accuracy */
			const eAcc
			= input . playerAccuracy * eGunAcc;
			/* Burst damage per second (DPS without reloads) */
			const bDps
			= eAcc * eDamage * eBurstRate;
			/* Sustained damage per second (DPS with reloads) */
			const sDps
			= eAcc * eDamage * eSustainedRate;
			/* Effective healing per second */
			const eHps
			= input . healthRegeneration
			+ input . armorRegeneration * input . armorAbsorption;
			/* Effective health */
			const eHp 
			= input . health + input . armor * input . armorAbsorption;
			const burstTtk
			= (eHp - (bDps - eHps) / eBurstRate) / (bDps - eHps)
			const sustainedTtk
			= (eHp - (sDps - eHps) / eBurstRate) / (sDps - eHps)
			console . log(burstTtk);
			console . log(sustainedTtk);
			/* Time to kill */
			const ttk
			= (
				/* Can kill without reloading */
				bDps > eHps && burstTtk <= eSecondsPerBurst
				? burstTtk
				/* Can kill with reloading */
				: sDps > eHps
				? sustainedTtk
				/* Cannot kill */
				: "Infinity"
			);
			return(
				[
					["Time to kill" , ttk + " seconds"]
					, ["Effective health" , eHp]
					, ["Effective healing per second" , eHps]
					, ["Sustained damage per second" , sDps]
					, ["Burst damage per second" , bDps]
					, ["Effective accuracy" , eAcc * 100.0 + "%"]
					, ["Effective gun accuracy" , eGunAcc * 100.0 + "%"]
					, ["Effective damage" , eDamage]
					, [
						"Effective sustained fire rate" 
						, eSustainedRate + " rounds per second"
					]
					, [
						"Effective burst fire rate" 
						, eBurstRate + " rounds per second"
					]
					, ["Effective reload time" , eReloadTime + " seconds"]
					, ["Effective clip ammo" , eClipAmmo + " rounds"]
				]
			);
		};
		const normalize
		= (userInput) => (
			Object
			. entries(userInput)
			. reduce(
				(a , x) => {
					const key = x[0];
					const value = x[1];
					a[key]
					= (
						key == "fireRate"
						? (
							userInput . fireRateUnit == "rpm"
							? value / 60.0
							: userInput . fireRateUnit == "spr"
							? 1.0 / value
							: userInput . fireRateUnit == "mpr"
							? 1000.0 / value 
							: value
						)
						: key == "fireRateUnit"
						? "rps"
						: key == "spread"
						? (
							userInput . spreadUnit == "d"
							? value * window . Math . PI / 180.0
							: userInput . spreadUnit == "mr"
							? value / 1000.0
							: value
						)
						: key == "spreadUnit"
						? "d"
						: (
							key == "playerAccuracy"
							|| key == "gunSpreadReduction"
							|| key == "damageBoost"
							|| key == "fireRateBoost"
							|| key == "reloadTimeReduction"
							|| key == "clipAmmoBoost"
							|| key == "armorAbsorption"
							|| key == "damageReduction"
						)
						? value / 100.0
						: value
					);
					return(a);
				}
				, {}
			)
		);
		const input
		= () => (
			normalize(
				parameters
				. reduce(
					(a , x) => {
						const element
						= window
						. document
						. querySelector("#TTKC" + x[0]);
						a[x[0]]
						= (
							element . tagName == "SELECT"
							? element . value
							: window . Number(element . value)
						);
						return(a);
					}
					, {}
				)
			)
		);
		const render
		= (results) => {
			const table
			= window
			. document
			. querySelector("#TTKCtable");
			while(table . lastChild){
				table . removeChild(table . lastChild);
			};
			results
			. forEach(
				(x) => {
					const row = window . document . createElement("tr");
					x
					. forEach(
						(y) => {
							const cell = window . document . createElement("td");
							cell . append(y);
							row . append(cell);
						}
					);
					table . append(row);
				}
			);
		};
		const clickCalculate
		= () => {
			render(calculate(input()));
		};
		const clickReset
		= () => {
			parameters
			. forEach(
				(x) => {
					const element
					= window
					. document
					. querySelector("#TTKC" + x[0]);
					if(element . tagName == "SELECT"){
						element . selectedIndex = x[1];
					}else{
						element . value = x[1];
					}
				}
			);
		};
		const start
		= () => {
			[
				["calculate" , clickCalculate]
				, ["reset" , clickReset]
			]
			. forEach(
				(x) => {
					window
					. document
					. querySelector("#TTKC" + x[0])
					. addEventListener(
						"click"
						, x[1]
					);
				}
			);
			clickReset();
		};
		start();
	}
)();
