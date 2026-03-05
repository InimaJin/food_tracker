import { useState, useRef } from "react";
import { redirect, useLoaderData, Form } from "react-router-dom";

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

export function mealsPageAction() {}

/**
 * An overview of the meals consumed on a particular date.
 */
export default function MealsPage() {
	const { user, date, meals: mealsArr } = useLoaderData();

	const [mealsState, setMealsState] = useState(mealsArr);

	let meals = mealsState.map((meal) => {
		const totalKcal = parseInt(((meal.kcal * meal.amount) / 100).toFixed(), 10);
		const totalProtein = parseInt(
			((meal.protein * meal.amount) / 100).toFixed(),
			10,
		);
		return { ...meal, totalKcal, totalProtein };
	});

	//Descending by total calories per meal.
	meals = meals.toSorted((m1, m2) => {
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
		const {
			food_id: foodId,
			name,
			amount,
			kcal,
			protein,
			totalKcal,
			totalProtein,
		} = meal;

		return (
			<li key={foodId}>
				<div className="meal-top">
					<h2>{name}</h2>
					<div>
						<h2>{amount}g</h2>
						<button
							onClick={() => {
								setEditingMealId(editingMealId === foodId ? null : foodId);
							}}
						>
							<i className="bx bx-pencil" />
						</button>
					</div>
				</div>
				{editingMealId === foodId ? (
					<EditMealForm
						mealId={foodId}
						cancelEdit={() => setEditingMealId(null)}
						onMealEdit={(newAmount) => {
							fetch(
								`http://localhost:9999/del-meal?user=${user}&date=${date}&foodId=${foodId}`,
							)
								.then((res) => res.json())
								.then(({ name: foodName }) => {
									return fetch(
										`http://localhost:9999/add-meal?user=${user}&date=${date}&foodName=${foodName}&amount=${newAmount}`,
									);
								})
								.then((res) => res.json())
								.then((newMeal) => {
									const nextMeals = mealsState.filter(
										(meal) => meal.food_id !== newMeal.food_id,
									);
									setMealsState([...nextMeals, newMeal]);
									setEditingMealId(null);
								});
						}}
						onMealDelete={() => {
							fetch(
								`http://localhost:9999/del-meal?user=${user}&date=${date}&foodId=${foodId}`,
							).then(() => {
								const nextMeals = mealsState.filter(
									(meal) => meal.food_id !== foodId,
								);
								setMealsState(nextMeals);
								setEditingMealId(null);
							});
						}}
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
				onSubmit={({ foodName, amount }) => {
					fetch(
						`http://localhost:9999/add-meal?user=${user}&date=${date}&foodName=${foodName}&amount=${amount}`,
					)
						.then((res) => res.json())
						.then((newMeal) => {
							const nextMeals = mealsState.filter(
								(meal) => meal.food_id !== newMeal.food_id,
							);
							setMealsState([...nextMeals, newMeal]);
							dialogRef.current.close();
						});
				}}
			/>
			<button className="add-meal-btn" onClick={openAddMealDialog}>
				+
			</button>
		</div>
	);
}

function EditMealForm({ cancelEdit, onMealEdit, onMealDelete }) {
	const [newAmount, setNewAmount] = useState("");
	const [deleteMealPending, setDeleteMealPending] = useState(false);

	return (
		<Form
			method="post"
			className="edit-meal-form"
			onSubmit={() => {
				onMealEdit(newAmount);
			}}
		>
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
				<button
					className={`del-meal-btn ${deleteMealPending ? "highlight-rect-btn" : ""}`}
					type="button"
					onClick={(e) => {
						if (deleteMealPending) {
							onMealDelete();
						} else {
							setDeleteMealPending(true);
							setTimeout(() => setDeleteMealPending(false), 3000);
						}
					}}
				>
					{deleteMealPending ? (
						"Click to delete"
					) : (
						<i className="bx bx-trash" />
					)}
				</button>
				<div className="form-btn-wrapper">
					<button type="button" onClick={cancelEdit}>
						Cancel
					</button>
					<button type="submit" disabled={newAmount.trim() === ""}>
						Ok
					</button>
				</div>
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
	const [foodName, setSelectedFoodName] = useState("");
	const [amount, setAmount] = useState("");
	const [showFoodSuggestions, setShowFoodSuggestions] = useState(false);

	const canSubmit =
		allFoods.some((food) => food.name === foodName) && amount > 0;

	return (
		<dialog className="add-meal-dialog" closedby="any" ref={dialogRef}>
			<h2>Add meal</h2>
			<Form
				method="post"
				autoComplete="off"
				onSubmit={() => onSubmit({ foodName, amount })}
			>
				<div className="add-meal-input-div">
					<label htmlFor="food">Food</label>
					<input
						className="underlined-input"
						name="food"
						value={foodName}
						onFocus={() => {
							setShowFoodSuggestions(true);
						}}
						onBlur={() => {
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
										onClick={() => {
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
					<button type="button" onClick={() => dialogRef.current.close()}>
						Cancel
					</button>
					<button
						type="submit"
						disabled={!canSubmit}
						className="highlight-rect-btn"
					>
						Ok
					</button>
				</div>
			</Form>
		</dialog>
	);
}
