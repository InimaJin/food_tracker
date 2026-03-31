import { useState } from "react";
import { Form, useNavigate } from "react-router-dom";
import { apiRoot } from "./constants.json";

export async function signUpInAction() {}

function SignUpOrInText({ signUp, setSignUp, clearInputs }) {
	const text = signUp ? "Already have an account?" : "Don't have an account?";
	const buttonText = signUp ? "Sign in" : "Sign up";
	return (
		<span>
			{text}{" "}
			<button
				type="button"
				className="underlined-btn"
				onClick={() => {
					setSignUp(!signUp);
					clearInputs();
				}}
			>
				{buttonText}
			</button>
		</span>
	);
}

/**
 * A form for signing up/ signing in.
 * Rendered by the App component when no token is available.
 */
export default function SignUpInForm() {
	const [signUp, setSignUp] = useState(false);

	const navigate = useNavigate();

	const [username, setUsername] = useState("");
	const [password, setPassword] = useState("");
	const [confirmPassword, setConfirmPassword] = useState("");

	const [errMsg, setErrMsg] = useState("");

	return (
		<Form
			className="standard-form login-form"
			method="post"
			onChange={() => setErrMsg("")}
			onSubmit={() => {
				//Should not be possible, because submit button is disabled in this case.
				if (signUp && password !== confirmPassword) {
					setErrMsg("Passwords don't match.");
					return;
				}

				fetch(`${apiRoot}/sign-up-in`, {
					method: "POST",
					headers: {
						"Content-Type": "application/json",
					},
					body: JSON.stringify({
						username,
						password,
						signUp,
					}),
				})
					.then(async (res) => {
						if (res.ok) {
							return res.json();
						} else {
							const json = await res.json();
							setErrMsg(json.error);
						}
					})
					.then((json) => {
						if (json) {
							localStorage.setItem("token", json.token);
							navigate("/");
						}
					});
			}}
		>
			<h2>{signUp ? "Sign up" : "Sign in"}</h2>
			<div className="form-input-wrapper">
				<label htmlFor="username">Username</label>
				<input
					type="text"
					name="username"
					className="underlined-input"
					value={username}
					onChange={(e) => setUsername(e.target.value)}
				/>
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
				<button
					className="login-btn highlight-btn"
					disabled={!password || (signUp && password !== confirmPassword)}
				>
					Go!
				</button>
			</div>
			<SignUpOrInText
				signUp={signUp}
				setSignUp={setSignUp}
				clearInputs={() => {
					setUsername("");
					setPassword("");
					setConfirmPassword("");
					setErrMsg("");
				}}
			/>
			{errMsg && <span className="form-err-msg">{errMsg}</span>}
		</Form>
	);
}
