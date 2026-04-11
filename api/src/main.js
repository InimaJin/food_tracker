import express from "express";
import cors from "cors";
import postgres from "postgres";
import bcrypt from "bcrypt";
import jsonwebtoken from "jsonwebtoken";

const app = express();
app.use(cors());
app.use(express.json());

const sql = postgres({
	host: "localhost",
	port: 5432,
	database: "food_tracker",
	username: "postgres",
});

const apiRoot = "/api";
const JWT_SECRET = process.env.JWT_SECRET;

/**
 * Validates user authorization by verifying the web token in the 'Authorization' header.
 * If authenticated successfully, the user's username is appended to the request object.
 * Otherwise, an error response is sent.
 */
function auth(req, res, next) {
	const token = req.get("Authorization");

	try {
		const decoded = jsonwebtoken.verify(token, JWT_SECRET);
		req.username = decoded.username;
		next();
	} catch (e) {
		res.status(444).json({ error: "auth fail" });
	}
}

/**
 * Handles sign-up and sign-in.
 * Request body must contain: username, password.
 * Optional body parameter: signUp (bool) -  true, if a new user should be created. Otherwise, sign in using the given username/password.
 * Responds with a JWT if successfully logged in. Otherwise, responds with an error message.
 */
app.post(`${apiRoot}/sign-up-in`, async (req, res) => {
	const { signUp, username, password } = req.body;

	if (!(username && password)) {
		return res.status(400).json({ error: "Missing parameters." });
	}

	let usernameTaken = false;

	if (signUp) {
		const hash = bcrypt.hashSync(password, 10);
		await sql.begin(async (sql) => {
			await sql
				.savepoint(async (sql) => {
					await sql`
						INSERT INTO users (name, password) VALUES (${username}, ${hash})
					`;
				})
				.catch((err) => {
					usernameTaken = true;
				});
		});
	}

	if (usernameTaken) {
		return res.status(400).json({ error: "Username already taken." });
	}

	const arr = await sql`
		SELECT password AS stored_hash FROM users WHERE name=${username}
	`;
	if (arr.length === 0) {
		return res.status(400).json({ error: "No such user." });
	}

	const { stored_hash: storedHash } = arr[0];
	const passwordCorrect =
		signUp === "true" || bcrypt.compareSync(password, storedHash);
	if (!passwordCorrect) {
		return res.status(400).json({ error: "Invalid credentials." });
	}

	const token = jsonwebtoken.sign({ username }, JWT_SECRET, {
		expiresIn: "7d",
	});
	res.json({ token });
});

app.use(auth);

/**
 * Retrieve a list of all foods owned by the user.
 * Each food in the array looks like this: { food_id, name, kcal (per 100g), protein (per 100g) }.
 */
app.get(`${apiRoot}/foods`, async (req, res) => {
	const username = req.username;

	const foods = await sql`
		SELECT id AS food_id, name, kcal, protein FROM foods WHERE owner=${username}
	`;

	res.json(foods);
});

/**
 * Add a new food.
 * Request body must contain: foodName, kcal, protein.
 * The response is the newly added food: { food_id, name, kcal, protein }.
 */
app.post(`${apiRoot}/add-food`, async (req, res) => {
	const username = req.username;
	const { foodName, kcal, protein } = req.body;
	if (!(foodName && kcal && protein)) {
		return res.status(400).json({ error: "Missing parameters." });
	}

	const newFood = await sql`
		INSERT INTO foods (name, owner, kcal, protein) 
		VALUES (${foodName}, ${username}, ${kcal}, ${protein})
		RETURNING id AS food_id, name, kcal, protein;
	`;

	res.json(newFood);
});

/**
 * Update an existing food.
 * Request body must contain: foodId, kcal, protein.
 * kcal and protein are the new values for the food associated with foodId.
 * Returns the updated food, if it exists.
 */
app.post(`${apiRoot}/edit-food`, async (req, res) => {
	const username = req.username;
	const { foodId, kcal, protein } = req.body;
	if (!(foodId && kcal && protein)) {
		return res.status(400).json({ error: "Missing parameters." });
	}

	const updatedFood = (
		await sql`
		UPDATE foods SET kcal=${kcal}, protein=${protein} WHERE id=${foodId} AND owner=${username} RETURNING name, id AS food_id, owner, kcal, protein
	`
	)[0];

	res.json(updatedFood);
});

/**
 * Deletes a food.
 * Request body must contain: foodId.
 * Returns the deleted food, if it existed.
 */
app.post(`${apiRoot}/del-food`, async (req, res) => {
	const username = req.username;
	const { foodId } = req.body;
	if (!foodId) {
		return res.status(400).json({ error: "Missing parameters." });
	}

	const arr = await sql`
		DELETE FROM foods WHERE id=${foodId} AND owner=${username} RETURNING id AS food_id
	`;
	if (arr.length !== 0) {
		return res.json(arr[0]);
	}
	res.end();
});

/**
 * Retrieve a list of meals for a given date.
 * Request query must contain: date.
 * Optional query parameter: endDate. If specified, all meals between <date> and <endDate> inclusive are returned.
 * Response is an array of meals: [ { food_id, name, amount [g], kcal (per 100g), protein [g / 100g], date} ].
 */
app.get(`${apiRoot}/meals`, async (req, res) => {
	const username = req.username;
	const { date, endDate } = req.query;

	//TODO: Check if date/ endDate is a valid time value
	if (!date) {
		return res.status(400).json({ error: "Missing parameters." });
	}

	const meals = await sql`
		SELECT food_id, name, amount, kcal, protein, date
        FROM foods, meals WHERE owner=${username} AND id=food_id AND date BETWEEN ${date} AND ${endDate ? endDate : date};
	`;
	res.json(meals);
});

/**
 * Add a meal to the database. The food must already exist for the user.
 * Request body must contain: date, foodName, amount.
 * Optional body param: overwrite (bool) - if true and the given meal already exists,
 * the existing meal's amount is overwritten with the new amount. If false or not specified and
 * the given meal already exists, the existing meal's amount is incremented by the given amount value.
 * Response is an object for the meal if the food exists: { food_id, name, amount, kcal, protein }.
 */
app.post(`${apiRoot}/add-meal`, async (req, res) => {
	const username = req.username;
	const { date, foodName, amount, overwrite } = req.body;
	if (!(date && foodName && amount)) {
		return res.status(400).json({ error: "Missing parameters." });
	}

	const idArr = await sql`
		SELECT id FROM foods WHERE name=${foodName} AND owner=${username} 
	`;
	if (idArr.length === 0) {
		res.status(400).send("no such food");
		return;
	}
	const foodId = idArr[0].id;

	await sql.begin(async (sql) => {
		await sql
			.savepoint(
				(sql) =>
					sql`
				INSERT INTO meals (date, food_id, amount) VALUES (${date}, ${foodId}, ${amount});
			`,
			)
			.catch((err) => {
				const baseVal = overwrite ? sql(0) : sql("amount");
				//If the desired food already has a record for the given day, the above fails due to unique key violation.
				return sql`
					UPDATE meals SET amount = ${baseVal} + ${amount}
					WHERE food_id = ${foodId} AND date = ${date};
				`;
			});
	});

	const addedMeal = await sql`
		SELECT food_id, name, amount, kcal, protein
        FROM foods, meals WHERE food_id=${foodId} AND owner=${username} AND id=food_id AND date=${date};
	`;
	res.json(addedMeal[0]);
});

/**
 * Delete a meal for given day.
 * Request body must contain: date, foodId.
 * If no such meal exists, the response is empty. Otherwise, the response is
 * the food object the meal was associated with: { id, name, kcal, owner, protein }.
 */
app.post(`${apiRoot}/del-meal`, async (req, res) => {
	const username = req.username;
	const { date, foodId } = req.body;
	if (!(date && foodId)) {
		return res.status(400).json({ error: "Missing parameters." });
	}

	const delArr = await sql`
		DELETE FROM meals WHERE food_id = ${foodId} AND date = ${date}
		AND EXISTS (SELECT 1 FROM foods WHERE id = meals.food_id AND owner = ${username});
	`;

	//If a meal actually was deleted, respond with the food data.
	if (delArr.count > 0) {
		const food = (
			await sql`
			SELECT id AS food_id, name, owner, kcal, protein FROM foods 
			WHERE id=${foodId} AND owner=${username};
		`
		)[0];
		return res.json(food);
	}

	res.end();
});

const port = 58327;
app.listen(port, () => {
	console.log(`Listening on port ${port}!`);
});
