import { useEffect, useRef, useState } from "react";
import { redirect, useLoaderData, Form } from "react-router-dom";
import { apiRoot } from "./constants.json";
import { DeleteButton } from "./components/DeleteButton";

export async function foodsPageLoader() {
	const token = localStorage.getItem("token");
	if (!token) {
		return redirect("/");
	}
	const foods = await fetch(`${apiRoot}/foods`, {
		method: "GET",
		headers: {
			Authorization: token,
		},
	}).then((res) => res.json());

	return { token, foods };
}

export function foodsPageAction() {}

/**
 * A dialog for updating kcal/ protein values of a selected food.
 */
function EditFoodDialog({ ref, food, setEditFood, onSubmit, onFoodDelete }) {
	const { name, kcal, protein } = food;

	const [kcalInput, setKcalInput] = useState(kcal);
	const [proteinInput, setProteinInput] = useState(protein);
	return (
		<dialog ref={ref} closedby="any" onClose={() => setEditFood({})}>
			<Form
				className="standard-form"
				method="post"
				autoComplete="off"
				onSubmit={() => onSubmit(kcalInput, proteinInput)}
			>
				<header className="edit-food-header">
					<h2>{name}</h2>
					<DeleteButton
						onDelete={onFoodDelete}
					/>
				</header>
				<div className="form-input-wrapper">
					<label htmlFor="kcal">Kcal/ 100g</label>
					<input
						className="underlined-input"
						name="kcal"
						type="number"
						min="0"
						value={kcalInput}
						onChange={(e) => setKcalInput(e.target.value)}
					/>
				</div>
				<div className="form-input-wrapper">
					<label htmlFor="protein">protein/ 100g</label>
					<input
						className="underlined-input"
						name="protein"
						type="number"
						min="0"
						value={proteinInput}
						onChange={(e) => setProteinInput(e.target.value)}
					/>
				</div>
				<div className="form-btn-wrapper">
					<button type="button" onClick={() => ref.current.close()}>
						Cancel
					</button>
					<button
						type="submit"
						className="highlight-btn"
						disabled={kcalInput === "" || proteinInput === ""}
					>
						Ok
					</button>
				</div>
			</Form>
		</dialog>
	);
}

/**
 * Overview of a user's foods.
 */
export default function FoodsPage() {
	const { token, foods: foodsArr } = useLoaderData();
	const dialogRef = useRef(null);

	const [foodsState, setFoodsState] = useState(foodsArr);
	//TODO: Button for selecting sorting method
	const foods = foodsState.toSorted((f1, f2) => {
		return f1.name.localeCompare(f2.name);
	});
	const [editFood, setEditFood] = useState({});

	useEffect(() => {
		if (editFood.name) {
			dialogRef.current.showModal();
		}
	}, [editFood]);

	function onFoodEdit(newKcal, newProtein) {
		fetch(`${apiRoot}/edit-food`, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				Authorization: token,
			},
			body: JSON.stringify({
				foodId: editFood.food_id,
				kcal: newKcal,
				protein: newProtein,
			}),
		})
			.then((res) => res.json())
			.then((updatedFood) => {
				let nextFoods = foods.filter(
					(food) => food.food_id !== editFood.food_id,
				);
				setFoodsState([...nextFoods, updatedFood]);
				setEditFood({});
			});
	}

	const foodsList = foods.map((food) => {
		const { food_id: foodId, name, kcal, protein } = food;
		return (
			<div
				key={foodId}
				className="food-card"
				onClick={() => {
					setEditFood(editFood.name ? {} : food);
				}}
			>
				<h2>{name}</h2>
				<ul>
					<li>{kcal}kcal/ 100g</li>
					<li>{protein !== 0 ? `${protein}g protein/ 100g` : "no protein"}</li>
				</ul>
			</div>
		);
	});

	return (
		<div className="current-window scroll-window foods-window">
			<header>
				<h1>My foods</h1>
			</header>
			<div className="scroll-window-main foods-grid">{foodsList}</div>
			<EditFoodDialog
				key={editFood.food_id}
				ref={dialogRef}
				food={editFood}
				setEditFood={setEditFood}
				onSubmit={onFoodEdit}
				onFoodDelete={() => {
					fetch(`${apiRoot}/del-food`, {
						method: "POST",
						headers: {
							"Content-Type": "application/json",
							Authorization: token,
						},
						body: JSON.stringify({
							foodId: editFood.food_id
						}),
					})
					.then(res => res.json())
					.then(({food_id: deletedId}) => {
						const nextFoods = foodsState.filter(food => food.food_id !== deletedId);
						setFoodsState(nextFoods);
						setEditFood({});
					});
				}}
			/>
		</div>
	);
}
