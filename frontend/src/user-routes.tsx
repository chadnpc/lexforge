
// THIS FILE IS AUTOGENERATED WHEN PAGES ARE UPDATED
import { lazy } from "react";
import { RouteObject } from "react-router";


import { UserGuard } from "app";


const App = lazy(() => import("./pages/App.tsx"));
const Dashboard = lazy(() => import("./pages/Dashboard.tsx"));
const Login = lazy(() => import("./pages/Login.tsx"));
const Logout = lazy(() => import("./pages/Logout.tsx"));

export const userRoutes: RouteObject[] = [

	{ path: "/", element: <App />},
	{ path: "/dashboard", element: <UserGuard><Dashboard /></UserGuard>},
	{ path: "/login", element: <Login />},
	{ path: "/logout", element: <UserGuard><Logout /></UserGuard>},

];
