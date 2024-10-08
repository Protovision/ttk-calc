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
			, ["clipAmmo" , 30]
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
			/* Percentage of time spent firing */
			const percentFiringTime
			= eSecondsPerBurst / (eSecondsPerBurst + eReloadTime);
			/* Percentage of time spend reloading */
			const percentReloadingTime
			= eReloadTime / (eSecondsPerBurst + eReloadTime);
			/* Effective sustained fire rate */
			const eSustainedRate
			= eBurstRate * percentFiringTime;
			/* Effective damage */
			const eDamage
			= input . damage 
			+ input . damage 
			* (input . damageBoost - input . damageReduction);
			/* Surface area of target */
			const tArea = input . width * input . height;
			/* Radius of impact circle */
			const cRadius
			= input . distance * window . Math . tan(input . spread / 2.0);
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
			/* Burst DPS */
			const bDps
			= eAcc * eDamage * eBurstRate;
			/* Sustained DPS */
			const sDps
			= eAcc * eDamage * eSustainedRate;
			/* Effective healing per second */
			const eHps
			= input . healthRegeneration
			+ input . armorRegeneration * input . armorAbsorption;
			/* Effective health */
			const eHp 
			= input . health + input . armor * input . armorAbsorption;
			const fractionalReloadCount
			= (
				eReloadTime == 0.0 
				|| eHp / (bDps - eHps) - 1.0 / eBurstRate <= eSecondsPerBurst
				? 0.0
				: eHp 
				/ (sDps - eHps)
				* percentReloadingTime 
				/ eReloadTime
			);
			const fractionalReloadingTime 
			= fractionalReloadCount * eReloadTime;
			const reloadCount
			= (
				fractionalReloadCount == 0.0
				? 0.0
				: fractionalReloadCount
				== window . Math . trunc(fractionalReloadCount)
				? fractionalReloadCount - 1.0
				: window . Math . floor(fractionalReloadCount)
			);
			const reloadingTime = reloadCount * eReloadTime;
			const shotCount
			= window
			. Math
			. ceil(
				reloadCount == 0.0
				? eHp / (bDps - eHps) * eBurstRate
				: (
					eHp / (sDps - eHps) 
					- fractionalReloadingTime 
				) 
				* eBurstRate
			);
			const firingTime
			= (shotCount - 1.0) / eBurstRate;
			const ttk = firingTime + reloadingTime;
			return(
				[
					["Seconds to kill" , ttk]
					, ["Seconds firing" , firingTime]
					, ["Seconds reloading" , reloadingTime]
					, ["Shot count" , shotCount]
					, ["Reload count" , reloadCount]
					, ["Effective accuracy" , eAcc * 100.0 + "%"]
					, ["Sustained damage per second" , sDps / eAcc]
					, ["Burst damage per second" , bDps / eAcc]
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
			table . scrollIntoView();
		};
		const clickCalculate
		= () => {
			render(calculate(input()));
		};
		const reset
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
		const clickReset
		= () => {
			reset();
			window
			. document
			. querySelector("#TTKCparameters")
			. scrollIntoView();
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
			reset();
			window . scrollTo(0 , 0);
		};
		start();
	}
)();
