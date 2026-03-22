import { Link, Outlet } from "react-router-dom";

/**
 * Root component. Renders a child component and the header at the bottom of tha page.
 */
export default function App() {
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
				</nav>
			</header>
		</>
	);
}
