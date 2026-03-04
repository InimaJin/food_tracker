import { useState, useRef, useEffect } from "react";
import { redirect, useLoaderData, Form, useActionData } from "react-router-dom";

/**
 * Load all meals for given user and date.
 */
export async function mealsPageLoader({ request }) {
	const searchParams = new URLSearchParams(request.url.split("?")[1]);
	const date = searchParams.get("d");
	if (!date) {
		return redirect("/");
	}

	//TODO: Login prompt at start of app for initializing user email.
	const user = localStorage.getItem("user");
	const meals = await fetch(
		`http://localhost:9999/meals?user=${user}&date=${date}`,
	).then((res) => res.json());

	return {
		user,
		date,
		meals,
	};
}

/**
 * Add new meal to database for current date.
 */
export async function mealsPageAction({ request }) {
	const urlSearchParams = new URLSearchParams(request.url.split("?")[1]);
	const date = urlSearchParams.get("d");
	if (!date) {
		return redirect("/");
	}
	const user = localStorage.getItem("user");

	const formData = await request.formData();
	const intent = formData.get("intent");
	if (intent.startsWith("edit-meal")) {
		const foodId = intent.split("-").toReversed()[0];
		const newAmount = formData.get("new-amount");
		await fetch(
			`http://localhost:9999/del-meal?user=${user}&date=${date}&foodId=${foodId}`,
		)
			.then((res) => res.json())
			.then((json) => {
				const foodName = json.name;
				return fetch(
					`http://localhost:9999/add-meal?user=${user}&date=${date}&foodName=${foodName}&amount=${newAmount}`,
				);
			});
	} else if (intent === "add-meal") {
		const foodName = formData.get("food");
		const amount = formData.get("amount");
		await fetch(
			`http://localhost:9999/add-meal?user=${user}&date=${date}&foodName=${foodName}&amount=${amount}`,
		);
	}

	return redirect(request.url);
}

/**
 * An overview of the meals consumed on a particular date.
 */
export default function MealsPage() {
	const { user, date, meals } = useLoaderData();

	meals.forEach((meal) => {
		meal.totalKcal = parseInt(((meal.kcal * meal.amount) / 100).toFixed(), 10);
		meal.totalProtein = parseInt(
			((meal.protein * meal.amount) / 100).toFixed(),
			10,
		);
	});

	//Descending by total calories per meal.
	meals.sort((m1, m2) => {
		if (m1.totalKcal > m2.totalKcal) {
			return -1;
		} else if (m1.totalKcal < m2.totalKcal) {
			return 1;
		}
		return 0;
	});

	const [editingMealId, setEditingMealId] = useState(null);

	//TODO: Extract meals list into component
	const mealsList = meals.map((meal) => {
		const { food_id, name, amount, kcal, protein, totalKcal, totalProtein } =
			meal;

		return (
			<li key={food_id}>
				<div className="meal-top">
					<h2>{name}</h2>
					<div>
						<h2>{amount}g</h2>
						<button
							onClick={() => {
								setEditingMealId(food_id);
							}}
						>
							<i className="bx bx-pencil" />
						</button>
					</div>
				</div>
				{editingMealId === food_id ? (
					<EditMealForm
						mealId={food_id}
						onFormClose={() => setEditingMealId(null)}
					/>
				) : (
					<ul className="meal-info-list">
						<li>
							<div>
								<span>{kcal}kcal/ 100g</span>
								<span>{totalKcal}kcal</span>
							</div>
						</li>
						<li>
							<div>
								<span>
									{protein !== 0 ? protein + "g protein/ 100g" : "no protein"}
								</span>
								<span>{protein !== 0 && `${totalProtein}g protein`}</span>
							</div>
						</li>
					</ul>
				)}
			</li>
		);
	});

	const dialogRef = useRef(null);
	const [allFoods, setAllFoods] = useState([]);
	const [matchingFoods, setMatchingFoods] = useState([]);
	function openAddMealDialog() {
		dialogRef.current.showModal();
		fetch(`http://localhost:9999/foods?user=${user}`)
			.then((res) => res.json())
			.then((foodsArr) => {
				setAllFoods(foodsArr);
				setMatchingFoods(foodsArr);
			});
	}

	const [totalKcal, totalProtein] = meals.reduce(
		([kcalAcc, proteinAcc], meal) => {
			return [kcalAcc + meal.totalKcal, proteinAcc + meal.totalProtein];
		},
		[0, 0],
	);

	//TODO: Button for deleting a meal
	return (
		<div className="current-window meals-window">
			<header>
				<h1>Meals for {date}</h1>
				<div>
					<span>Total kcal: {totalKcal}</span>
					<span>Total protein: {totalProtein}</span>
				</div>
			</header>
			<ul className="meals-list">{mealsList}</ul>
			<AddMealDialog
				dialogRef={dialogRef}
				allFoods={allFoods}
				{...{ matchingFoods, setMatchingFoods }}
				onSubmit={() => {
					dialogRef.current.close();
				}}
			/>
			<button className="add-meal-btn" onClick={openAddMealDialog}>
				+
			</button>
		</div>
	);
}

function EditMealForm({ mealId, onFormClose }) {
	const [newAmount, setNewAmount] = useState("");

	return (
		<Form method="post" className="edit-meal-form" onSubmit={onFormClose}>
			<label htmlFor="new-amount">New amount in grams</label>
			<input
				className="underlined-input"
				name="new-amount"
				type="number"
				min="0"
				value={newAmount}
				onChange={(e) => setNewAmount(e.target.value)}
			/>
			<div className="form-btn-wrapper">
				<button type="button" onClick={onFormClose}>
					Cancel
				</button>
				<button
					type="submit"
					disabled={newAmount.trim() === ""}
					name="intent"
					value={`edit-meal-${mealId}`}
				>
					Ok
				</button>
			</div>
		</Form>
	);
}

/**
 * A dialog with a form for adding a new meal to the currently viewed date.
 */
function AddMealDialog({
	dialogRef,
	allFoods,
	matchingFoods,
	setMatchingFoods,
	onSubmit,
}) {
	const [selectedFoodName, setSelectedFoodName] = useState("");
	const [amount, setAmount] = useState("");
	const [showFoodSuggestions, setShowFoodSuggestions] = useState(false);

	const canSubmit =
		allFoods.some((food) => food.name === selectedFoodName) && amount > 0;

	return (
		<dialog className="add-meal-dialog" closedby="any" ref={dialogRef}>
			<h2>Add meal</h2>
			<Form method="post" autoComplete="off" onSubmit={onSubmit}>
				<div className="add-meal-input-div">
					<label htmlFor="food">Food</label>
					<input
						className="underlined-input"
						name="food"
						type="text"
						value={selectedFoodName}
						onFocus={(e) => {
							setShowFoodSuggestions(true);
						}}
						onBlur={(e) => {
							//TODO: Find a more reliable solution for hiding the food suggestions upon blur while still registering click on li.
							setTimeout(() => {
								setShowFoodSuggestions(false);
							}, 100);
						}}
						onChange={(e) => {
							const input = e.target.value.toLowerCase();
							const nextMatchingFoods = allFoods.filter(({ name }) => {
								name = name.toLowerCase();
								return name.includes(input);
							});
							setSelectedFoodName(e.target.value);
							setMatchingFoods(nextMatchingFoods);
						}}
					/>
					{showFoodSuggestions && (
						<ul className="food-suggestions-list">
							{matchingFoods.map((food) => {
								return (
									<li
										key={food.id}
										onClick={(e) => {
											setSelectedFoodName(food.name);
											setShowFoodSuggestions(false);
											document.querySelector("input[name='amount']").focus();
										}}
									>
										<span className="suggestions-foodname">{food.name}</span>
										<span>{food.kcal}kcal/ 100g</span>
									</li>
								);
							})}
						</ul>
					)}
				</div>
				<div className="add-meal-input-div">
					<label htmlFor="amount">Amount in grams</label>
					<input
						className="underlined-input"
						name="amount"
						type="number"
						min="0"
						value={amount}
						onChange={(e) => {
							setAmount(e.target.value);
						}}
					/>
				</div>
				<div className="form-btn-wrapper">
					<button type="button" onClick={(e) => dialogRef.current.close()}>
						Cancel
					</button>
					<button
						type="submit"
						disabled={!canSubmit}
						name="intent"
						value="add-meal"
					>
						Ok
					</button>
				</div>
			</Form>
		</dialog>
	);
}
