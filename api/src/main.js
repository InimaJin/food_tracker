import express from "express";
import cors from "cors";
import postgres from "postgres";

const app = express();
app.use(cors());
const sql = postgres({
	host: "localhost",
	port: 5432,
	database: "food_tracker",
	username: "postgres",
});

/**
 * Retrieve a list of meals for a given user (email) and date.
 * @returns array holding the meal entries, where each entry looks like this: { food_id, name, amount [g], kcal (per 100g), protein [g / 100g]}
 */
app.get("/meals", async (req, res) => {
	const { user, date } = req.query;

	if (!user || !date) {
		res.status(400).send("Undefined parameter!");
		return;
	}

	const meals = await sql`
		SELECT food_id, name, amount, kcal, protein
        FROM foods, meals WHERE owner=${user} AND id=food_id AND date=${date};`;
	res.json(meals);
});

/**
 * Add a meal to the database.
 */
app.get("/add-meal", async (req, res) => {
	const { date, foodId, amount } = req.query;

	const arr = await sql`
		INSERT INTO meals (date, food_id, amount) VALUES (${date}, ${foodId}, ${amount});
	`;

	res.send("Currently no verification.");
});

const port = 9999;
app.listen(port, () => {
	console.log(`Listening on port ${port}!`);
});
