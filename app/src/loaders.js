import { redirect } from "react-router-dom";
import { handleAuthFail } from "./util";
import { apiRoot } from "./constants.json";

export function appLoader() {
	return localStorage.getItem("token");
}

/**
 * Load all meals for given date.
 */
export async function mealsLoader({ request }) {
	const searchParams = new URLSearchParams(request.url.split("?")[1]);
	const date = searchParams.get("d");
	if (!date) {
		return redirect("/");
	}

	const token = localStorage.getItem("token");
	if (!token) {
		return redirect("/");
	}

	const meals = await fetch(`${apiRoot}/meals?date=${date}`, {
		method: "GET",
		headers: {
			Authorization: token,
		},
	}).then((res) => {
		if (handleAuthFail(res)) {
			return null;
		}
		return res.json();
	});

	if (!meals) {
		return redirect("/");
	}

	return {
		token,
		date,
		meals,
	};
}

/**
 * Load all foods.
 */
export async function foodsLoader() {
	const token = localStorage.getItem("token");
	if (!token) {
		return redirect("/");
	}
	const foods = await fetch(`${apiRoot}/foods`, {
		method: "GET",
		headers: {
			Authorization: token,
		},
	}).then((res) => {
		if (handleAuthFail(res)) {
			return null;
		}

		return res.json();
	});

	if (!foods) {
		return redirect("/");
	}

	return { token, foods };
}

/**
 * Only load token.
 */
export function statsLoader() {
	const token = localStorage.getItem("token");
	if (!token) {
		return redirect("/");
	}
	return token;
}
