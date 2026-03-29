import { useState } from "react";
import { Form } from "react-router-dom";
import { apiRoot } from "./constants.json";

export async function signUpInAction({ request }) {
	const formData = await request.formData();
	const username = formData.get("username");
	const password = formData.get("password");
	const signUp = formData.get("confirm-password") !== null;

	//TODO: Response handling and redirect.
	await fetch(
		`${apiRoot}/sign-up-in?username=${username}&password=${password}&signUp=${signUp}`,
	);
}

function SignUpOrInText({ signUp, setSignUp }) {
	const text = signUp ? "Already have an account?" : "Don't have an account?";
	const buttonText = signUp ? "Sign in" : "Sign up";
	return (
		<span>
			{text}{" "}
			<button
				type="button"
				className="underlined-btn"
				onClick={() => setSignUp(!signUp)}
			>
				{buttonText}
			</button>
		</span>
	);
}

/**
 * A form for signing up/ signing in.
 */
export default function SignUpInForm() {
	const [signUp, setSignUp] = useState(false);

	const [password, setPassword] = useState("");
	const [confirmPassword, setConfirmPassword] = useState("");

	return (
		<Form
			className="standard-form login-form"
			method="post"
			onSubmit={(e) => {
				if (signUp && password !== confirmPassword) {
					//TODO: Make this nicer and incorporate password length check.
					alert("Passwords don't match.");
					e.preventDefault();
				}
			}}
		>
			<h2>{signUp ? "Sign up" : "Sign in"}</h2>
			<div className="form-input-wrapper">
				<label htmlFor="username">Username</label>
				<input type="text" name="username" className="underlined-input" />
			</div>
			<div className="form-input-wrapper">
				<label htmlFor="password">Password</label>
				<input
					type="password"
					name="password"
					className="underlined-input"
					value={password}
					onChange={(e) => setPassword(e.target.value)}
				/>
			</div>
			{signUp && (
				<div className="form-input-wrapper">
					<label htmlFor="confirm-password">Confirm password</label>
					<input
						type="password"
						name="confirm-password"
						className="underlined-input"
						value={confirmPassword}
						onChange={(e) => setConfirmPassword(e.target.value)}
					/>
				</div>
			)}
			<div className="form-btn-wrapper">
				<button className="login-btn highlight-btn">Go!</button>
			</div>
			<SignUpOrInText signUp={signUp} setSignUp={setSignUp} />
		</Form>
	);
}
