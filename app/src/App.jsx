import { Link, Outlet, redirect, useLoaderData } from "react-router-dom";
import SignUpInForm from "./SignUpInForm";

export function appLoader() {
	const user = localStorage.getItem("user");
	return user;
}

/**
 * Root component. Renders a child component and the header at the bottom of tha page.
 */
export default function App() {
	const user = useLoaderData();
	if (!user) {
		return <SignUpInForm />;
	}

	return (
		<>
			<Outlet />
			<header className="app-main-header">
				<nav>
					<Link to="/">
						<i className="bx bx-calendar-alt" />
					</Link>
					<Link to="foods">
						<i className="bx bx-burger-alt" />
					</Link>
					<Link to="stats">
						<i className="bx bx-chart-line" />
					</Link>
				</nav>
			</header>
		</>
	);
}
