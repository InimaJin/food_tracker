import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router-dom";

import App from "./App.jsx";
import DateSelectPage from "./DateSelectPage.jsx";
import MealsPage from "./MealsPage.jsx";
import FoodsPage from "./FoodsPage.jsx";
import StatsPage from "./StatsPage.jsx";
import { appLoader, foodsLoader, mealsLoader, statsLoader } from "./loaders.js";
import {
	dateSelectAction,
	foodsPageAction,
	mealsPageAction,
	signUpInAction,
} from "./actions.js";

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
				loader: mealsLoader,
				action: mealsPageAction,
				element: <MealsPage />,
			},
			{
				path: "foods",
				loader: foodsLoader,
				action: foodsPageAction,
				element: <FoodsPage />,
			},
			{
				path: "stats",
				loader: statsLoader,
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
