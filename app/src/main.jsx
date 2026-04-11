import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router-dom";

import App, { appLoader } from "./App.jsx";
import DateSelectPage, { dateSelectAction } from "./DateSelectPage.jsx";
import MealsPage, { mealsPageAction, mealsPageLoader } from "./MealsPage.jsx";
import FoodsPage, { foodsPageAction, foodsPageLoader } from "./FoodsPage.jsx";
import StatsPage, { statsPageLoader } from "./StatsPage.jsx";
import { signUpInAction } from "./SignUpInForm.jsx";

const router = createBrowserRouter([
	{
		path: "/",
		loader: appLoader,
		action: signUpInAction,
		element: <App />,
		children: [
			{
				index: true,
				action: dateSelectAction,
				element: <DateSelectPage />,
			},
			{
				path: "meals",
				loader: mealsPageLoader,
				action: mealsPageAction,
				element: <MealsPage />,
			},
			{
				path: "foods",
				loader: foodsPageLoader,
				action: foodsPageAction,
				element: <FoodsPage />,
			},
			{
				path: "stats",
				loader: statsPageLoader,
				element: <StatsPage />,
			},
		],
	},
]);

createRoot(document.getElementById("root")).render(
	<StrictMode>
		<RouterProvider router={router}>
			<App />
		</RouterProvider>
	</StrictMode>,
);
