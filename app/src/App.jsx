import { Link, Outlet, useLoaderData } from "react-router-dom";
import SignUpInForm from "./SignUpInForm";

export function appLoader() {
	const token = localStorage.getItem("token");
	return token;
}

/**
 * Root component. Renders a child component and the header at the bottom of tha page.
 */
export default function App() {
	const token = useLoaderData();
	if (!token) {
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
